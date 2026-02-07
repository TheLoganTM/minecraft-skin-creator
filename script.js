let viewer;
let controls;

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

    // Configuration des contrôles
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.enableDamping = true; // Ajoute de l'inertie pour un mouvement fluide
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;

    // On remplace la boucle d'animation par défaut pour inclure les contrôles
    function animate() {
        requestAnimationFrame(animate);
        
        // Mise à jour indispensable pour la souris
        controls.update(); 
        
        // Animation de marche (si elle existe)
        if (viewer.animation) {
            viewer.animation(viewer.playerObject, Date.now() / 1000);
        }
        
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    
    animate();

    // Boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            viewer.skinImg.src = btn.dataset.url;
            document.getElementById('layer-list').innerHTML = `<span>${btn.dataset.name}</span>`;
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
