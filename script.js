let viewer;
let controls;
let outlineGroup; // On le déclare en dehors pour y accéder partout

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

    // 2. Configuration des contrôles
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15; 
    controls.zoomSpeed = 0.5;
    controls.target.set(0, -15, 0); 
    controls.enableDamping = true;
    controls.enablePan = false;

    // 3. Création du CONTOUR ANIMÉ
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    outlineGroup = viewer.playerObject.clone();
    
    outlineGroup.traverse((child) => {
        if (child.isMesh) {
            child.material = outlineMaterial;
            child.scale.multiplyScalar(1.05); 
        }
    });
    viewer.scene.add(outlineGroup);

    // 4. Boucle de rendu
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        controls.update(); 
        
        // Animation synchronisée des deux modèles
        const time = Date.now() / 1000;
        if (typeof skinview3d.WalkingAnimation === 'function') {
            skinview3d.WalkingAnimation(viewer.playerObject, time);
            skinview3d.WalkingAnimation(outlineGroup, time);
        }

        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    renderLoop();

    // 5. Gestion des clics
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            viewer.skinImg.crossOrigin = "anonymous";
            viewer.skinImg.src = btn.dataset.url;
            
            // Masquer le contour quand un skin est chargé
            outlineGroup.visible = false;

            updateLayerList(btn.dataset.name);
        };
    });
}

// Fonction pour mettre à jour et gérer la suppression
function updateLayerList(name) {
    const list = document.getElementById('layer-list');
    list.innerHTML = `
        <div class="layer-item" id="active-layer">
            <span>✨ ${name}</span>
            <button class="delete-layer" onclick="removeLayer()">❌</button>
        </div>
    `;
}

// Fonction pour supprimer le calque et remettre le contour
function removeLayer() {
    const list = document.getElementById('layer-list');
    list.innerHTML = ""; // Vide la liste
    
    // Remettre le skin invisible
    viewer.skinImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREh0XAXC7pAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAhSURBVHja7cEBDAAAAMAgP9NHBFfBAAAAAAAAAAAAAMBuDqAAAByvS98AAAAASUVORK5CYII=";
    
    // Réafficher le contour blanc animé
    outlineGroup.visible = true;
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
