let viewer;
let controls;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" 
    });

    // 2. Configuration OrbitControls
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;

    // 3. BOUCLE DE RENDU FORCÉE
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        
        // Mise à jour de la caméra
        controls.update(); 
        
        // --- ACTION : ON FORCE LA MARCHE ICI ---
        // On appelle directement WalkingAnimation sur le playerObject
        if (typeof skinview3d.WalkingAnimation === 'function') {
            skinview3d.WalkingAnimation(viewer.playerObject, Date.now() / 1000);
        }
        
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    
    renderLoop();

    // 4. Gestion du bouton Ethane
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            viewer.skinImg.crossOrigin = "anonymous";
            viewer.skinImg.src = btn.dataset.url;
            
            // Mise à jour de l'UI
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
