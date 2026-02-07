let viewer;
let controls;
let layers = [];

// Image transparente de base pour éviter d'afficher "Steve" au début
const INVISIBLE_SKIN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    if (!container || !parent) return;

    // 1. Initialisation du moteur avec le skin invisible
    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.offsetWidth,
        height: parent.offsetHeight,
        skin: INVISIBLE_SKIN
    });

    // 2. Chargement du fond d'écran (Image de la lueur)
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous'); 
    loader.load('https://i.ibb.co/nNWLS5d2/unnamed.jpg', (texture) => {
        texture.minFilter = THREE.LinearFilter;
        viewer.scene.background = texture;
    }, undefined, () => {
        viewer.scene.background = new THREE.Color(0x1a1a1a);
    });

    // 3. Caméra et Animation
    viewer.camera.position.set(0, -12, 80);
    viewer.animation = skinview3d.WalkingAnimation;

    // 4. Contrôles Orbit
    controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
    controls.rotateSpeed = 0.15;
    controls.zoomSpeed = 0.5;
    controls.enableDamping = true;
    controls.target.set(0, -12, 0); 
    controls.update();

    // 5. Mise en place du contour et des boutons
    setupOutline();
    setupButtons();

    window.addEventListener('resize', onWindowResize);
}

// Gère le contour blanc autour du personnage
function setupOutline() {
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    viewer.playerObject.traverse((child) => {
        if (child.isMesh && child.name !== "outline_part") {
            const outlineMesh = child.clone();
            outlineMesh.material = outlineMaterial;
            outlineMesh.scale.set(1.05, 1.05, 1.05);
            outlineMesh.name = "outline_part";
            child.add(outlineMesh);
        }
    });
    toggleOutline(true); // Actif au démarrage
}

function setupButtons() {
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            layers.push({ id: Date.now(), name: btn.dataset.name, url: btn.dataset.url });
            refreshProject();
        };
    });

    const dlBtn = document.getElementById('download-btn');
    if (dlBtn) {
        dlBtn.onclick = () => {
            if (layers.length === 0) return alert("Le skin est vide !");
            const link =
