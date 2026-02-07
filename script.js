let viewer;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation avec un skin par défaut fonctionnel
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" 
    });

    // Animation de marche
    viewer.animation = skinview3d.WalkingAnimation;

    // Gestion des clics sur les boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            const url = btn.dataset.url;
            // On change directement la source de l'image du skin
            viewer.skinImg.src = url;
            
            // Mise à jour visuelle de la liste à droite
            const list = document.getElementById('layer-list');
            list.innerHTML = `<div class="layer-item"><span>${btn.dataset.name}</span></div>`;
        };
    });
}

// Relancer le rendu si on change la taille de la fenêtre
window.onresize = () => {
    if (viewer) {
        const parent = document.getElementById("viewer-container");
        viewer.renderer.setSize(parent.offsetWidth, parent.offsetHeight);
        viewer.camera.aspect = parent.offsetWidth / parent.offsetHeight;
        viewer.camera.updateProjectionMatrix();
    }
};

window.onload = init;
