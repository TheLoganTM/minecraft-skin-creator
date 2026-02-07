let viewer;
let controls;
let layers = [];

// Un pixel transparent unique pour servir de base invisible
const INVISIBLE_SKIN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: INVISIBLE_SKIN
    });

    // Fond d'écran
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous'); 
    loader.load('https://i.ibb.co/nNWLS5d2/unnamed.jpg', (texture) => {
        texture.minFilter = THREE.LinearFilter;
        viewer.scene.background = texture;
    });

    viewer.camera.position.set(0, -12, 80);
    viewer.animation = skinview3d.WalkingAnimation;

    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, -12, 0); 
    controls.update();

    setupOutline();
    setupButtons();

    window.addEventListener('resize', onWindowResize);
}

function setupOutline() {
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") {
            const outlineMesh = child.clone();
            outlineMesh.material = outlineMaterial;
            outlineMesh.scale.set(1.03, 1.03, 1.03);
            outlineMesh.name = "outline_part";
            child.add(outlineMesh);
        }
    });
    // Au départ, pas de calques, donc outline visible
    toggleOutline(true);
}

function setupButtons() {
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });

    document.getElementById('download-btn').onclick = () => {
        if (layers.length === 0) return alert("Le skin est vide !");
        const link = document.createElement('a');
        link.download = 'skin_minecraft_uhd.png';
        link.href = viewer.skinImg.src;
        link.click();
    };
}

// FUSION UHD : Le canvas prend la taille de la plus grande image
async function composeSkins(urls) {
    const promises = urls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    });

    const images = (await Promise.all(promises)).filter(img => img !== null);
    if (images.length === 0) return INVISIBLE_SKIN;

    // Détection de la résolution la plus haute (UHD)
    const maxWidth = Math.max(...images.map(img => img.width));
    const maxHeight = Math.max(...images.map(img => img.height));

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth; 
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    images.forEach(img => {
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
    });

    return canvas.toDataURL("image/png");
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";
    
    if (layers.length === 0) {
        viewer.skinImg.src = INVISIBLE_SKIN;
        toggleOutline(true); // Remet le contour blanc
    } else {
        toggleOutline(false); // Cache le contour blanc
        const mergedSkin = await composeSkins(layers.map(l => l.url));
        viewer.skinImg.src = mergedSkin;
    }

    [...layers].reverse().forEach((layer) => {
        const idx = layers.indexOf(layer);
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.innerHTML = `<span>✨ ${layer.name}</span><div class="layer-controls">` +
            `<button onclick="moveLayer(${idx}, 1)">↑</button>` +
            `<button onclick="moveLayer(${idx}, -1)">↓</button>` +
            `<button class="delete-layer" onclick="removeLayer(${idx})">❌</button></div>`;
        list.appendChild(item);
    });
}

function moveLayer(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < layers.length) {
        const element = layers.splice(index, 1)[0];
        layers.splice(newIndex, 0, element);
        refreshProject();
    }
}

function removeLayer(index) {
    layers.splice(index, 1);
    refreshProject();
}

function toggleOutline(visible) {
    viewer.playerObject.traverse((child) => {
        if (child.name === "outline_part") child.visible = visible;
    });
}

function onWindowResize() {
    const parent = document.getElementById("viewer-container");
    viewer.width = parent.offsetWidth;
    viewer.height = parent.offsetHeight;
    viewer.renderer.setSize(parent.offsetWidth, parent.offsetHeight);
    viewer.camera.aspect = parent.offsetWidth / parent.offsetHeight;
    viewer.camera.updateProjectionMatrix();
}

window.onload = init;
