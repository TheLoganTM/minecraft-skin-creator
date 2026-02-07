let viewer;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // Configuration caméra
    viewer.camera.position.z = 60;
    viewer.camera.position.y = -10;

    // FIX DU "MAXIMUM CALL STACK" : On crée les contours une seule fois proprement
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    
    // On collecte les membres d'abord pour éviter de boucler sur les nouveaux clones
    const meshesToOutline = [];
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline") {
            meshesToOutline.push(child);
        }
    });

    meshesToOutline.forEach((mesh) => {
        const outlineMesh = mesh.clone();
        outlineMesh.material = outlineMaterial;
        outlineMesh.scale.multiplyScalar(1.05);
        outlineMesh.name = "outline"; // Nom spécifique pour ne pas le re-cloner
        mesh.add(outlineMesh);
    });

    // Animation de marche
    viewer.animation = new skinview3d.WalkingAnimation();

    // Gestion des clics boutons
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
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = layers.length === 0 ? "<p style='color:#666'>Aucun calque</p>" : "";

    if (layers.length === 0) {
        viewer.loadSkin("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=");
        return;
    }

    // Fusion des skins
    const mergedData = await composeSkins(layers.map(l => l.url));
    viewer.loadSkin(mergedData);

    // Mise à jour de la liste visuelle
    [...layers].reverse().forEach((layer, index) => {
        const realIdx = layers.indexOf(layer);
        list.innerHTML += `
            <div class="layer-item">
                <span>${layer.name}</span>
                <div class="layer-controls">
                    <button onclick="removeLayer(${realIdx})">❌</button>
                </div>
            </div>`;
    });
}

function composeSkins(urls) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        let loaded = 0;

        urls.forEach(url => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, 64, 64);
                loaded++;
                if (loaded === urls.length) resolve(canvas.toDataURL());
            };
        });
    });
}

function removeLayer(index) {
    layers.splice(index, 1);
    refreshProject();
}

window.onload = init;
