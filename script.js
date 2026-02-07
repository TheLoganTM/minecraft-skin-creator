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
        skin: "https://minotar.net/skin/char" // Skin de départ
    });

    // 2. CONFIGURATION DES CONTRÔLES (OrbitControls)
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    
    // Réglages de précision (Sensibilité douce et centrage)
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;

    // 3. BOUCLE D'ANIMATION
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        
        if (viewer.animation) {
            viewer.animation(viewer.playerObject, Date.now() / 1000);
        }
        
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();

    // 4. GESTION DU BOUTON ETHANE
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            const url = btn.dataset.url;
            
            // On charge le nouveau skin UHD
            // crossOrigin est nécessaire pour les images venant d'autres sites
            viewer.skinImg.crossOrigin = "anonymous";
            viewer.skinImg.src = url;
            
            // Mise à jour de l'affichage à droite
            const list = document.getElementById('layer-list');
            list.innerHTML = `<div class="layer-item"><span>✨ ${btn.dataset.name}</span></div>`;
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
