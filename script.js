let viewer;
let controls;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation avec le moteur UHD (NearestFilter forcé)
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // Configuration des contrôles
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15;
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0);
    controls.enableDamping = true;

    // --- SYSTÈME DE CONTOUR FIXE ---
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    const bodyParts = [];
    
    // On cible le skin.skin qui contient les membres dans ton vieux code
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") bodyParts.push(child);
    });

    bodyParts.forEach((part) => {
        const outlineMesh = part.clone();
        outlineMesh.material = outlineMaterial;
        // Scale 1.01 pour un contour de ~2px constant
        outlineMesh.scale.set(1.01, 1.01, 1.01);
        outlineMesh.name = "outline_part";
        part.add(outlineMesh);
    });

    // Boutons d'ajout de calques
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });
}

// --- MOTEUR DE FUSION UHD ADAPTATIF ---
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

    // Détection de la résolution maximale (Logique du vieux code)
    const maxWidth = Math.max(...images.map(img => img.width));
    const maxHeight = Math.max(...images.map(img => img.height));

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    
    // Désactivation du lissage pour le Pixel Perfect
    ctx.imageSmoothingEnabled = false;

    images.forEach(img => {
        // On dessine chaque calque à la taille maximale détectée
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
    });

    return canvas.toDataURL("image/png");
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";

    if (layers.length === 0) {
        // Skin fantôme par défaut
        viewer.skinImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=";
        toggleOutline(true);
        return;
    }

    toggleOutline(false);
    const mergedSkin = await composeSkins(layers.map(l => l.url));
    
    // Mise à jour de la texture (UHD compatible)
    viewer.skinImg.src = mergedSkin;

    // Mise à jour de l'interface des calques
    [...layers].reverse().forEach((layer) => {
        const idx = layers.indexOf(layer);
        list.innerHTML += `
            <div class="layer-item">
                <span>✨ ${layer.name}</span>
                <div class="layer-controls">
                    <button onclick="moveLayer(${idx}, 1)">↑</button>
                    <button onclick="moveLayer(${idx}, -1)">↓</button>
                    <button class="delete-layer" onclick="removeLayer(${idx})">❌</button>
                </div>
            </div>`;
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

window.onload = init;
