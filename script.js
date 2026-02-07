let viewer;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation avec un skin de secours qui fonctionne toujours
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" 
    });

    viewer.animation = skinview3d.WalkingAnimation;

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            const url = btn.dataset.url;
            // Charger directement le skin dans le viewer
            viewer.skinImg.src = url;
            addLayerToList(btn.dataset.name);
        };
    });
}

function addLayerToList(name) {
    const list = document.getElementById('layer-list');
    const div = document.createElement('div');
    div.className = 'layer-item';
    div.innerHTML = `<span>${name}</span>`;
    list.insertBefore(div, list.firstChild);
}

window.onload = init;
