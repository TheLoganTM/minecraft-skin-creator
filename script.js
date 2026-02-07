let viewer;
let controls;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation du personnage
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" 
    });

    // 2. Configuration des contrôles de souris (OrbitControls)
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    
    // --- RÉGLAGES SENSIBILITÉ ---
    controls.rotateSpeed = 0.5; // On divise la vitesse par 2 (défaut est 1.0)
    controls.zoomSpeed = 0.8;   // Zoom un peu plus doux
    controls.enableDamping = true; // Ajoute une petite inertie fluide
    controls.dampingFactor = 0.1;
    
    // --- RÉGLAGES CENTRAGE ---
    // On force la caméra à regarder le milieu du corps du personnage
    // Le personnage fait environ 30 unités de haut, donc on vise le milieu (y = -15)
    controls.target.set(0, -15, 0); 
    
    controls.enablePan = false; // Empêche de décaler le perso hors de l'écran avec le clic droit

    // 3. Boucle d'animation
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        
        if (viewer.animation) {
            viewer.animation(viewer.playerObject, Date.now() / 1000);
        }
        
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    
    renderLoop();

    // 4. Gestion des boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            viewer.skinImg.src = btn.dataset.url;
            document.getElementById('layer-list').innerHTML = `<div class="layer-item"><span>${btn.dataset.name}</span></div>`;
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
