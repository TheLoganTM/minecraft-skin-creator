let viewer;
let controls;
let ghostMode = true; // État initial

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation avec un skin invisible
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // 2. Configuration des contrôles
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;
    controls.enablePan = false;

    // 3. Création du CONTOUR (Outline)
    // On crée un matériau blanc pur qui s'affiche même si le skin est transparent
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    
    // On duplique le modèle pour faire le contour
    const outlineGroup = viewer.playerObject.clone();
    outlineGroup.traverse((child) => {
        if (child.isMesh) {
            child.material = outlineMaterial;
            child.scale.multiplyScalar(1.05); // Légèrement plus grand pour dépasser
        }
    });
    viewer.scene.add(outlineGroup);

    // 4. Boucle de rendu
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        
        // Animation de marche forcée
        if (typeof skinview3d.WalkingAnimation === 'function') {
            skinview3d.WalkingAnimation(viewer.playerObject, Date.now() / 1000);
            skinview3d.WalkingAnimation(outlineGroup, Date.now() / 1000);
        }

        // Si on a sélectionné un skin, on peut cacher le contour ou le laisser
        // Ici on le laisse pour l'effet stylisé
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();

    // 5. Gestion des clics
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            ghostMode = false;
            viewer.skinImg.crossOrigin = "anonymous";
            viewer.skinImg.src = btn.dataset.url;
            
            // Optionnel : on peut réduire le contour une fois le skin chargé
            // outlineGroup.visible = false; 

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
