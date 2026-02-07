let viewer;
let controls;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // Forcer le rendu net pour l'UHD (évite le flou)
    viewer.renderer.getContext().imageSmoothingEnabled = false;

    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;

    // --- CRÉATION DU CONTOUR FIN (Méthode sécurisée) ---
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    
    const bodyParts = [];
    viewer.playerObject.traverse((child) => {
        // Sécurité : on ne liste que les vrais membres du perso
        if (child.isMesh && child.name !== "outline_part") {
            bodyParts.push(child);
        }
    });

    bodyParts.forEach((part) => {
        const outlineMesh = part.clone();
        outlineMesh.material = outlineMaterial;
        // 1.02 au lieu de 1.07 pour un contour très fin (environ 2px)
        outlineMesh.scale.multiplyScalar(1.02); 
        outlineMesh.name = "outline_part"; 
        part.add(outlineMesh);
    });

    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        if (typeof skinview3d.WalkingAnimation === 'function') {
            skinview3d.WalkingAnimation(viewer.playerObject, Date.now() / 1000);
        }
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });
}

// FUSION UHD : On utilise un canvas plus grand (64x64) pour garder la précision
async function composeSkins(urls) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; 
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Désactiver l'anti-aliasing pour garder les pixels nets
    ctx.imageSmoothingEnabled = false;

    const promises = urls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve(img);
        });
    });

    const images = await Promise.all(promises);
    images.forEach(img => ctx.drawImage(img, 0, 0, 64, 64));
    return canvas.toDataURL("image/png");
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
