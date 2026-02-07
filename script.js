let viewer;
// Le proxy est indispensable pour que ton site puisse lire les images de ibb.co ou imgur
const PROXY = "https://corsproxy.io/?";

function init() {
    const container = document.getElementById("viewer-container");
    
    // Initialisation du rendu 3D
    viewer = new skinview3d.SkinViewer({
        canvas: document.getElementById("skin_container"),
        width: container.offsetWidth,
        height: container.offsetHeight,
        skin: "https://bsat999.github.io/skinview3d/img/steve.png" // Skin de départ
    });

    viewer.loadAnimation(skinview3d.IdleAnimation);
    viewer.controls.enableRotate = true;

    // Gestion des boutons d'ajout
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => addLayer(btn.dataset.url, btn.dataset.name);
    });

    document.getElementById('download-btn').onclick = download;
}

// CETTE FONCTION FAIT LA FUSION (Comme dans MinecraftSkinComposer)
async function updateFullSkin() {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 64;
    finalCanvas.height = 64;
    const ctx = finalCanvas.getContext('2d');

    // On récupère tous les calques dans l'ordre (du bas vers le haut)
    const layers = [...document.querySelectorAll('.layer-item')].reverse();
    
    for (const layer of layers) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = PROXY + encodeURIComponent(layer.dataset.url);

        await new Promise((resolve) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0); // On dessine le calque par-dessus les autres
                resolve();
            };
            img.onerror = resolve; // Si une image bug, on passe à la suivante
        });
    }

    // On applique l'image fusionnée au personnage 3D
    viewer.loadSkin(finalCanvas.toDataURL());
}

function addLayer(url, name) {
    const list = document.getElementById('layer-list');
    const item = document.createElement('div');
    item.className = 'layer-item';
    item.dataset.url = url;
    item.innerHTML = `
        <span>${name}</span>
        <button class="remove-btn">✕</button>
    `;

    item.querySelector('.remove-btn').onclick = () => {
        item.remove();
        updateFullSkin();
    };

    list.insertBefore(item, list.firstChild);
    updateFullSkin();
}

function download() {
    const link = document.createElement('a');
    link.download = 'mon_skin_compose.png';
    link.href = viewer.canvas.toDataURL();
    link.click();
}

window.onload = init;
window.onresize = () => {
    if (viewer) {
        const container = document.getElementById("viewer-container");
        viewer.width = container.offsetWidth;
        viewer.height = container.offsetHeight;
    }
};
