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

    // 2. Centrage de la caméra sur le buste (Y = -12)
    viewer.camera.position.set(0, -12, 40);

    // 3. Activation de l'animation de marche
    viewer.animation = skinview3d.WalkingAnimation;

    // 4. Configuration des contrôles Orbit (r104)
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15;
    controls.zoomSpeed = 0.5;
    controls.enableDamping = true;
    
    // On force le pivot de la caméra au centre du corps
    controls.target.set(0, -12, 0); 
    controls.update();

    // 5. Système de Contour (Outline) au chargement
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

    // 6. Gestion des boutons d'ajout de calques
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ 
                id: Date.now(), 
                name: btn.dataset.name, 
                url: btn.dataset.url 
            });
            refreshProject();
        };
    });

    // 7. Logique du bouton Télécharger
    document.getElementById('download-btn').onclick = () => {
        if (layers.length === 0) return alert("Le skin est vide !");
        const link = document.createElement('a');
        link.download = 'minecraft-skin-custom.png';
        link.href = viewer.skinImg.src;
        link.click();
    };

    // 8. Ajustement automatique si on redimensionne la fenêtre
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

// Moteur de Fusion UHD (Pixel Perfect)
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
    ctx.imageSmoothingEnabled = false; // Désactive le flou

    images.forEach(img => {
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
    });

    return canvas.toDataURL("image/png");
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";

    // Si aucun calque, on remet le skin vide avec contour blanc
    if (layers.length === 0) {
        viewer.skinImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=";
        toggleOutline(true);
        return;
    }

    // Si calques présents, on fusionne et on cache le contour blanc
    toggleOutline(false);
    const mergedSkin = await composeSkins(layers.map(l => l.url));
    viewer.skinImg.src = mergedSkin;

    // Mise à jour de l'interface visuelle des calques
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

// Lancement au chargement de la page
window.onload = init;
