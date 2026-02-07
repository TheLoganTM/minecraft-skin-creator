let viewer;
let layers = [];

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Création du viewer avec les paramètres de TON fichier skin_viewer.js
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://i.ibb.co/s9DRkM8Y/Ethane-V2.png" // Skin initial
    });

    // Animation de marche (syntaxe spécifique à ta version)
    viewer.animation = skinview3d.WalkingAnimation;

    // Gestion des boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({
                name: btn.dataset.name,
                url: btn.dataset.url
            });
            refreshProject();
        };
    });
}

async function refreshProject() {
    if (layers.length === 0) return;

    // Fusion des calques sur un canvas 64x64
    const mergedSkin = await composeSkins(layers.map(l => l.url));
    
    // Mise à jour du skin (on change la source de l'image interne au viewer)
    viewer.skinImg.src = mergedSkin;

    // Mise à jour de la liste visuelle
    const list = document.getElementById('layer-list');
    list.innerHTML = "";
    layers.forEach((layer, idx) => {
        list.innerHTML += `
            <div class="layer-item">
                <span>${layer.name}</span>
                <button onclick="removeLayer(${idx})" style="color:red; background:none; border:none; cursor:pointer;">❌</button>
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

// Sécurité : On attend que le DOM et les scripts soient prêts
window.onload = () => {
    if (typeof skinview3d !== 'undefined') {
        init();
    } else {
        console.error("ERREUR : skin_viewer.js n'est pas chargé. Vérifie le nom du fichier !");
    }
};
