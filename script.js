let viewer;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation du viewer (Version stable)
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // Configuration de la vue
    viewer.camera.position.set(0, -10, 60);
    viewer.animation = new skinview3d.WalkingAnimation();

    // Gestion de l'ajout des personnages
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            const layer = { id: Date.now(), name: btn.dataset.name, url: btn.dataset.url };
            layers.push(layer);
            refreshProject();
        };
    });
}

async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = layers.length === 0 ? "<p style='color:#666;text-align:center;'>Aucun calque</p>" : "";

    if (layers.length === 0) {
        viewer.loadSkin("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=");
        return;
    }

    // Fusion des images (on reste sur du 64x64 pour la stabilité)
    const mergedSkin = await composeSkins(layers.map(l => l.url));
    viewer.loadSkin(mergedSkin);

    // Mise à jour de la liste à droite
    [...layers].reverse().forEach((layer) => {
        const idx = layers.indexOf(layer);
        list.innerHTML += `
            <div class="layer-item">
                <span>${layer.name}</span>
                <button onclick="removeLayer(${idx})" style="background:none;border:none;color:red;cursor:pointer;">❌</button>
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
