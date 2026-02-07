let viewer;
let controls;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation du viewer
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // QUALITÉ UHD : On force le rendu net (Nearest Neighbor)
    viewer.renderer.magFilter = THREE.NearestFilter;
    viewer.renderer.minFilter = THREE.NearestFilter;

    // OrbitControls pour la rotation
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, -15, 0);

    // CRÉATION DU CONTOUR (Sécurisée contre la boucle infinie)
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    const meshesToOutline = [];
    
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") {
            meshesToOutline.push(child);
        }
    });

    meshesToOutline.forEach((mesh) => {
        const outline = mesh.clone();
        outline.material = outlineMaterial;
        // 1.025 est idéal pour un contour de ~2px sur du UHD
        outline.scale.set(1.025, 1.025, 1.025);
        outline.name = "outline_part";
        mesh.add(outline);
    });

    // Événements
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });

    document.getElementById('download-btn').onclick = downloadSkin;

    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update();
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();
}

// FUSION UHD PIXEL-PERFECT
async function composeSkins(urls) {
    const images = await Promise.all(urls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    }));

    const validImages = images.filter(img => img !== null);
    if (validImages.length === 0) return null;

    const maxWidth = Math.max(...validImages.map(img => img.width));
    const maxHeight = Math.max(...validImages.map(img => img.height));

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Désactiver le flou

    validImages.forEach(img => {
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
    });

    return canvas.toDataURL("image/png");
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";

    if (layers.length === 0) {
        viewer.loadSkin("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=");
        toggleOutline(true);
        return;
    }

    toggleOutline(false);
    const result = await composeSkins(layers.map(l => l.url));
    if (result) {
        viewer.loadSkin(result);
    }

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

async function downloadSkin() {
    if (layers.length === 0) return;
    const data = await composeSkins(layers.map(l => l.url));
    const a = document.createElement('a');
    a.href = data;
    a.download = 'skin_uhd.png';
    a.click();
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
