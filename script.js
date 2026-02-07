let viewer;
let controls;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation du viewer 3D
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" // Skin de base au chargement
    });

    // 2. CONFIGURATION DES CONTRÔLES (OrbitControls)
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    
    // Réglages pour une sensibilité parfaite et un bon centrage
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); // Vise le torse pour centrer Link/Ethane
    controls.enableDamping = true; // Rotation fluide
    controls.dampingFactor = 0.05;
    controls.enablePan = false;    // Empêche de perdre le perso sur les côtés

    // 3. BOUCLE DE RENDU (Pour que la souris et l'animation tournent en continu)
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        
        // Mise à jour de la caméra selon ta souris
        controls.update(); 
        
        // On joue l'animation si elle est active
        if (viewer.animation) {
            viewer.animation(viewer.playerObject, Date.now() / 1000);
        }
        
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    
    renderLoop();

    // 4. GESTION DES BOUTONS (Ethane UHD & Steve)
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            // Sécurité pour le chargement des images externes
            viewer.skinImg.crossOrigin = "anonymous";
            viewer.skinImg.src = btn.dataset.url;
            
            // --- ACTIVATION DE LA MARCHE ---
            // On réattribue l'animation pour être sûr qu'elle démarre avec le nouveau skin
            viewer.animation = skinview3d.WalkingAnimation; 
            
            // Mise à jour du texte à droite
            const list = document.getElementById('layer-list');
            list.innerHTML = `<div class="layer-item"><span>✨ ${btn.dataset.name}</span></div>`;
        };
    });
}

// Gère le redimensionnement de la fenêtre
window.onresize = () => {
    if (viewer) {
        const parent = document.getElementById("viewer-container");
        viewer.renderer.setSize(parent.offsetWidth, parent.offsetHeight);
        viewer.camera.aspect = parent.offsetWidth / parent.offsetHeight;
        viewer.camera.updateProjectionMatrix();
    }
};

window.onload = init;
