let viewer;
let controls;

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    // 1. Initialisation avec skin invisible
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII="
    });

    // 2. Configuration des contrôles (OrbitControls)
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;

    // 3. CRÉATION DU CONTOUR UNIQUE (Attaché au personnage)
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    
    // On parcourt chaque partie du corps pour lui ajouter son propre contour
    viewer.playerObject.traverse((child) => {
        if (child.isMesh) {
            const outlineMesh = child.clone();
            outlineMesh.material = outlineMaterial;
            outlineMesh.scale.multiplyScalar(1.07); // Épaisseur du contour
            outlineMesh.name = "outline_part";    // Nom pour le retrouver facilement
            child.add(outlineMesh);                // On l'attache au membre (Parent-Enfant)
        }
    });

    // 4. BOUCLE DE RENDU
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        
        const time = Date.now() / 1000;
        // L'animation ne s'applique qu'au personnage, le contour suit tout seul
        if (typeof skinview3d.WalkingAnimation === 'function') {
            skinview3d.WalkingAnimation(viewer.playerObject, time);
        }

        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();

    // 5. GESTION DES BOUTONS
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            viewer.skinImg.crossOrigin = "anonymous";
            viewer.skinImg.src = btn.dataset.url;
            
            toggleOutline(false); // Cache le contour quand on sélectionne
            updateLayerList(btn.dataset.name);
        };
    });
}

// Fonction pour afficher/cacher le contour
function toggleOutline(visible) {
    viewer.playerObject.traverse((child) => {
        if (child.name === "outline_part") {
            child.visible = visible;
        }
    });
}

// Mise à jour de la liste des calques avec bouton supprimer
function updateLayerList(name) {
    const list = document.getElementById('layer-list');
    list.innerHTML = `
        <div class="layer-item">
            <span>✨ ${name}</span>
            <button class="delete-layer" onclick="removeLayer()">❌</button>
        </div>
    `;
}

// Suppression du calque et retour au mode "Fantôme"
function removeLayer() {
    const list = document.getElementById('layer-list');
    list.innerHTML = ""; 
    
    // Retour au skin invisible
    viewer.skinImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=";
    
    toggleOutline(true); // Réaffiche le contour blanc
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
