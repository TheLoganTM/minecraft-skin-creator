let viewer;
const PROXY = "https://corsproxy.io/?";

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Sécurité : vérification du chargement de la lib
    if (typeof skinview3d === 'undefined') {
        console.error("Le fichier skin_viewer.js n'est pas détecté !");
        return;
    }

    // Initialisation
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://bsat999.github.io/skinview3d/img/steve.png"
    });

    // On lance une animation pour donner de la vie
    viewer.animation = skinview3d.WalkingAnimation;

    // Écoute des boutons de la colonne de gauche
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => addLayer(btn.dataset.url, btn.dataset.name);
    });
    
    document.getElementById('download-btn').onclick = download;
}

async function composeSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; 
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const layers = [...document.querySelectorAll('.layer-item')].reverse();
    ctx.clearRect(0, 0, 64, 64);

    for (const layer of layers) {
        if (!layer.dataset.url) continue;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = PROXY + encodeURIComponent(layer.dataset.url);
        
        await new Promise(res => {
            img.onload = () => { ctx.drawImage(img, 0, 0); res(); };
            img.onerror = res;
        });
    }
    
    // On met à jour l'image du skin dans le viewer 3D
    const dataUrl = canvas.toDataURL();
    viewer.skinImg.src = dataUrl;
}

function addLayer(url, name) {
    const list = document.getElementById('layer-list');
    
    // Création du calque dans la colonne de droite
    const div = document.createElement('div');
    div.className = 'layer-item';
    div.dataset.url = url;
    div.dataset.name = name;
    div.innerHTML = `
        <span>${name}</span>
        <button class="remove-btn">✕</button>
    `;

    div.querySelector('.remove-btn').onclick = () => {
        div.remove();
        composeSkin();
    };

    list.insertBefore(div, list.firstChild);
    
    // On relance la fusion des images
    composeSkin();
}

function download() {
    const link = document.createElement('a');
    link.download = 'mon_skin_zelda.png';
    // On télécharge le résultat de la fusion (le canvas 2D) ou le rendu 3D
    link.href = viewer.renderer.domElement.toDataURL("image/png");
    link.click();
}

window.onload = init;

// Redimensionnement automatique si on change la taille de la fenêtre
window.onresize = () => {
    if (viewer) {
        const parent = document.getElementById("viewer-container");
        viewer.width = parent.offsetWidth;
        viewer.height = parent.offsetHeight;
    }
};
