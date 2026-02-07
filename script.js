let viewer;
let controls;
let layers = []; // Stocke les calques {id, name, url}

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation avec skin invisible
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // 2. Configuration des contrôles
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;

    // 3. CRÉATION SÉCURISÉE DU CONTOUR (Outline)
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    
    // On identifie d'abord les vrais membres du corps pour éviter la boucle infinie
    const realBodyParts = [];
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") {
            realBodyParts.push(child);
        }
    });

    // On attache le contour uniquement à ces parties
    realBodyParts.forEach((part) => {
        const outlineMesh = part.clone();
        outlineMesh.material = outlineMaterial;
        outlineMesh.scale.multiplyScalar(1.07);
        outlineMesh.name = "outline_part"; 
        part.add(outlineMesh);
    });

    // 4. Boucle de rendu
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        if (typeof skinview3d.WalkingAnimation === 'function') {
            skinview3d.WalkingAnimation(viewer.playerObject, Date.now() / 1000);
        }
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();

    // 5. Ajout de calque
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            const layer = { id: Date.now(), name: btn.dataset.name, url: btn.dataset.url };
            layers.push(layer); // Ajoute à la fin (sera au-dessus)
            refreshProject();
        };
    });
}

// FUSION DES IMAGES PNG (Ordre respecté)
async function composeSkins(urls) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const promises = urls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve(img);
        });
    });

    const images = await Promise.all(promises);
    images.forEach(img => ctx.drawImage(img, 0, 0));
    return canvas.toDataURL();
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";

    if (layers.length === 0) {
        viewer.skinImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=";
        toggleOutline(true);
        return;
    }

    toggleOutline(false);
    const mergedSkin = await composeSkins(layers.map(l => l.url));
    viewer.skinImg.src = mergedSkin;

    // Affichage des calques (Inverse pour que le "dessus" soit en haut de liste)
    [...layers].reverse().forEach((layer) => {
        const idx = layers.indexOf(layer);
        list.innerHTML += `
            <div class="layer-item">
                <span>${layer.name}</span>
                <div class="layer-controls">
                    <button onclick="moveLayer(${idx}, 1)">↑</button>
                    <button onclick="moveLayer(${idx}, -1)">↓</button>
                    <button class="delete-layer" onclick="removeLayer(${idx})">❌</button>
                </div>
            </div>
        `;
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
