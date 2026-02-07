let viewer;
let controls;
let layers = [];

// Fonction pour créer une image transparente de 64x64 instantanément
function createEmptySkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    return canvas.toDataURL();
}

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    if (!container || !parent) return;

    // 1. Initialisation avec un skin vide généré proprement
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: createEmptySkin()
    });

    // 2. Chargement du fond d'écran
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous'); 
    loader.load('https://i.ibb.co/nNWLS5d2/unnamed.jpg', (texture) => {
        // Empêche le redimensionnement flou (Power of Two) de Three.js
        texture.minFilter = THREE.LinearFilter;
        viewer.scene.background = texture;
    }, undefined, () => {
        viewer.scene.background = new THREE.Color(0x1a1a1a);
    });

    // 3. Caméra (reculée à 80) et Animation
    viewer.camera.position.set(0, -12, 80);
    viewer.animation = skinview3d.WalkingAnimation;

    // 4. Contrôles Orbit
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15;
    controls.zoomSpeed = 0.5;
    controls.enableDamping = true;
    controls.target.set(0, -12, 0); 
    controls.update();

    setupOutline();
    setupButtons();

    window.addEventListener('resize', onWindowResize);
}

// --- SYSTÈME DE CONTOURS ---
function setupOutline() {
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") {
            const outlineMesh = child.clone();
            outlineMesh.material = outlineMaterial;
            outlineMesh.scale.set(1.05, 1.05, 1.05);
            outlineMesh.name = "outline_part";
            child.add(outlineMesh);
        }
    });
}

// --- GESTION DES BOUTONS ---
function setupButtons() {
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });

    const dlBtn = document.getElementById('download-btn');
    if (dlBtn) {
        dlBtn.onclick = () => {
            if (layers.length === 0) return alert("Le skin est vide !");
            const link = document.createElement('a');
            link.download = 'minecraft-skin-custom.png';
            link.href = viewer.skinImg.src;
            link.click();
        };
    }
}

// --- FUSION DES CALQUES ---
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
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    images.forEach(img => ctx.drawImage(img, 0, 0, 64, 64));
    return canvas.toDataURL("image/png");
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";
    
    if (layers.length === 0) {
        viewer.skinImg.src = createEmptySkin();
        toggleOutline(true);
        return;
    }

    toggleOutline(false);
    const mergedSkin = await composeSkins(layers.map(l => l.url));
    viewer.skinImg.src = mergedSkin;

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

// --- UTILITAIRES ---
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
