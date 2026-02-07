let viewer;
let controls;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation du moteur skinview3d
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // 2. Chargement du fond avec sécurité CORS
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous'); 
    loader.load(
        'https://i.ibb.co/nNWLS5d2/unnamed.jpg', 
        (texture) => {
            viewer.scene.background = texture;
        },
        undefined,
        (err) => {
            console.warn("Fond non chargé, utilisation du fallback.");
            viewer.scene.background = new THREE.Color(0x1a1a1a);
        }
    );

    // 3. Caméra reculée (80) et centrée sur le buste (-12)
    viewer.camera.position.set(0, -12, 80);
    viewer.animation = skinview3d.WalkingAnimation;

    // 4. Contrôles Orbit
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15;
    controls.zoomSpeed = 0.5;
    controls.enableDamping = true;
    controls.target.set(0, -12, 0); 
    controls.update();

    // 5. Initialisation des fonctions secondaires
    setupOutline();
    setupButtons();

    // 6. Gestion du redimensionnement
    window.addEventListener('resize', onWindowResize);
}

function setupOutline() {
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    const bodyParts = [];
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") bodyParts.push(child);
    });

    bodyParts.forEach((part) => {
        const outlineMesh = part.clone();
        outlineMesh.material = outlineMaterial;
        outlineMesh.scale.set(1.02, 1.02, 1.02);
        outlineMesh.name = "outline_part";
        part.add(outlineMesh);
    });
}

function setupButtons() {
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });

    document.getElementById('download-btn').onclick = () => {
        if (layers.length === 0) return alert("Ajoute des éléments !");
        const link = document.createElement('a');
        link.download = 'skin_minecraft_custom.png';
        link.href = viewer.skinImg.src;
        link.click();
    };
}

function onWindowResize() {
    const parent = document.getElementById("viewer-container");
    if (!parent || !viewer) return;
    viewer.width = parent.offsetWidth;
    viewer.height = parent.offsetHeight;
    viewer.renderer.setSize(parent.offsetWidth, parent.offsetHeight);
    viewer.camera.aspect = parent.offsetWidth / parent.offsetHeight;
    viewer.camera.updateProjectionMatrix();
}

async function composeSkins(urls) {
    const promises = urls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve(img);
        });
    });
    const images = await Promise.all(promises);
    const maxWidth = Math.max(...images.map(img => img.width));
    const maxHeight = Math.max(...images.map(img => img.height));
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth; 
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    images.forEach(img => ctx.drawImage(img, 0, 0, maxWidth, maxHeight));
    return canvas.toDataURL("image/png");
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";
    
    if (layers.length === 0) {
        viewer.skinImg.src = "data:image
