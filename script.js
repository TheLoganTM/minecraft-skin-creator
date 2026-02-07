let viewer;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // Initialisation du viewer
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" 
    });

    // ACTIVATION DU DÉPLACEMENT (SOURIS)
    const controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.enablePan = false; // Empêche de décentrer le perso
    controls.enableZoom = true; // Permet de zoomer

    // Animation de marche
    viewer.animation = skinview3d.WalkingAnimation;

    // Gestion des boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            viewer.skinImg.src = btn.dataset.url;
            const list = document.getElementById('layer-list');
            list.innerHTML = `<div class="layer-item"><span>${btn.dataset.name}</span></div>`;
        };
    });
}

window.onresize = () => {
    if (viewer) {
        const parent = document.getElementById("viewer-container");
        viewer.renderer.setSize(parent.offsetWidth, parent.offsetHeight);
        viewer.camera.aspect = parent.offsetWidth / parent.offsetHeight;
        viewer.camera.updateProjectionMatrix();
    }
};

window.onload = init;
