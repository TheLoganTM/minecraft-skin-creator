let viewer;
let controls;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation du moteur
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // 2. AJOUT DU FOND (IMAGE)
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous"; // Pour éviter les soucis de droits d'image
    loader.load('https://i.ibb.co/nNWLS5d2/unnamed.jpg', (texture) => {
        viewer.scene.background = texture;
    });

    // 3. Caméra reculée (Z=80) et centrée sur le buste (Y=-12)
    viewer.camera.position.set(0, -12, 80);

    // 4. Animation de marche
    viewer.animation = skinview3d.WalkingAnimation;

    // 5. Contrôles Orbit
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15;
    controls.zoomSpeed = 0.5;
    controls.enableDamping = true;
    controls.target.set(0, -12, 0); 
    controls.update();

    // 6. Système de Contour (Outline)
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

    // 7. Événements Boutons (Ajout calques)
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });

    // 8. Téléchargement
    document.getElementById('download-btn').onclick = () => {
        if (layers.length === 0) return alert("Ajoute des éléments !");
        const link = document.createElement('a');
        link.download = 'skin_minecraft.png';
        link.href = viewer.skinImg.src;
        link.click();
    };

    // 9. Gestion du Redimensionnement
    window.addEventListener('resize', () => {
        const newWidth = parent.offsetWidth;
        const newHeight = parent.offsetHeight;
        viewer.width = newWidth;
        viewer.height = newHeight;
        viewer.renderer.setSize(newWidth, newHeight);
        viewer.camera.aspect = newWidth / newHeight;
        viewer.camera.updateProjectionMatrix();
    });
}

// --- MOTEUR DE FUSION ---
async function composeSkins(urls) {
    const
