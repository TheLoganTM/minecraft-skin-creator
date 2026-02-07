let viewer;
const PROXY = "https://corsproxy.io/?";

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation basée sur ton fichier skin_viewer.js
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://bsat999.github.io/skinview3d/img/steve.png"
    });

    // Activer l'animation de marche par défaut
    viewer.animation = skinview3d.WalkingAnimation;

    // Configuration des boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => addLayer(btn.dataset.url, btn.dataset.name);
    });
    
    document.getElementById('download-btn').onclick = download;
}

async function composeSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const layers = [...document.querySelectorAll('.layer-item')].reverse();
    ctx.clearRect(0, 0, 64, 64);

    for (const layer of layers) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = PROXY + encodeURIComponent(layer.dataset.url);
        
        await new Promise(res => {
            img.onload = () => { ctx.drawImage(img, 0, 0); res(); };
            img.onerror = res;
        });
    }
    // Mise à jour de la texture 3D
    viewer.skinImg.src = canvas.toDataURL();
}

function addLayer(url, name) {
    const list = document.getElementById('layer-list');
    const div = document.createElement('div');
    div.className = 'layer-item';
    div.dataset.url = url;
    div.innerHTML = `<span>${name}</span><button class="remove-btn">✕</button>`;

    div.querySelector('.remove-btn').onclick = () => { div.remove(); composeSkin(); };
    list.insertBefore(div, list.firstChild);
    composeSkin();
}

function download() {
    const link = document.createElement('a');
    link.download = 'mon_skin.png';
    // Accès au canvas interne créé par skin_viewer.js
    link.href = viewer.renderer.domElement.toDataURL();
    link.click();
}

window.onload = init;
