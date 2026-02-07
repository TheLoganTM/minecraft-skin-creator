let viewer;
const PROXY = "https://corsproxy.io/?";

function init() {
    const container = document.getElementById("viewer-container");
    
    // Initialisation version stable
    viewer = new skinview3d.SkinViewer({
        canvas: document.getElementById("skin_container"),
        width: container.offsetWidth,
        height: container.offsetHeight,
        skin: "https://bsat999.github.io/skinview3d/img/steve.png"
    });

    // Animation et contrôles
    viewer.loadAnimation(skinview3d.IdleAnimation);
    viewer.controls.enableRotate = true;

    // Boutons de la bibliothèque
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
    viewer.loadSkin(canvas.toDataURL());
}

function addLayer(url, name) {
    const list = document.getElementById('layer-list');
    const div = document.createElement('div');
    div.className = 'layer-item';
    div.dataset.url = url;
    div.innerHTML = `
        <span>${name}</span>
        <div class="layer-controls">
            <button class="up">▲</button>
            <button class="down">▼</button>
            <button class="remove">✕</button>
        </div>
    `;

    div.querySelector('.remove').onclick = () => { div.remove(); composeSkin(); };
    div.querySelector('.up').onclick = () => { if(div.previousElementSibling) div.parentNode.insertBefore(div, div.previousElementSibling); composeSkin(); };
    div.querySelector('.down').onclick = () => { if(div.nextElementSibling) div.parentNode.insertBefore(div.nextElementSibling, div); composeSkin(); };

    list.insertBefore(div, list.firstChild);
    composeSkin();
}

function download() {
    const link = document.createElement('a');
    link.download = 'skin_final.png';
    link.href = viewer.canvas.toDataURL(); // Changement ici : viewer.canvas
    link.click();
}

window.onload = init;
window.onresize = () => {
    if(viewer) {
        const container = document.getElementById("viewer-container");
        viewer.width = container.offsetWidth;
        viewer.height = container.offsetHeight;
    }
};
