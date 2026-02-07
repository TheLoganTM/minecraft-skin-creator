let viewer;
let controls;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation du personnage avec un skin par défaut
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "https://minotar.net/skin/char" 
    });

    // 2. CONFIGURATION DES CONTRÔLES (OrbitControls)
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    
    // --- CORRECTION SENSIBILITÉ ---
    // On baisse drastiquement la vitesse (0.15 est très lent et précis)
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    
    // --- CORRECTION CENTRAGE ---
    // On force la caméra à regarder le torse (Y = -15) et non les pieds (Y = 0)
    controls.target.set(0, -15, 0); 
    
    // --- FLUIDITÉ ET SÉCURITÉ ---
    controls.enableDamping = true;   // Ajoute un effet de glissement fluide
    controls.dampingFactor = 0.05;   // Intensité du glissement
    controls.enablePan = false;      // Empêche de décaler le perso avec le clic droit
    
    // 3. BOUCLE D'ANIMATION (Indispensable pour OrbitControls)
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        
        // On met à jour la position de la caméra selon la souris
        controls.update(); 
        
        // On anime les jambes (marche)
        if (viewer.animation) {
            viewer.animation(viewer.playerObject, Date.now() / 1000);
        }
        
        // On dessine l'image finale
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    
    renderLoop();

    // 4. GESTION DES BOUTONS DE LA COLONNE DE GAUCHE
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            // On change l'image du skin
            viewer.skinImg.src = btn.dataset.url;
            
            // Mise à jour de la liste des calques à droite
            const list = document.getElementById('layer-list');
            list.innerHTML = `<div class="layer-item"><span>${btn.dataset.name}</span></div>`;
        };
    });
}

// Redimensionnement si on change la taille du navigateur
window.onresize = () => {
    if (viewer) {
        const parent = document.getElementById("viewer-container");
        viewer.renderer.setSize(parent.offsetWidth, parent.offsetHeight);
        viewer.camera.aspect = parent.offsetWidth / parent.offsetHeight;
        viewer.camera.updateProjectionMatrix();
    }
};

window.onload = init;
