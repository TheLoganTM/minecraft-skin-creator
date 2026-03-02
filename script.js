let viewer, layers = [];
let zm_Level = 0;
let zm_ViewMode = 'plongee';
const INVISIBLE_SKIN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// --- 1. MENU API ---
async function loadMenu() {
    try {
        const response = await fetch('api_assets.php');
        const data = await response.json();
        const menuContainer = document.querySelector('.menu-categories');
        if (!menuContainer) return;
        menuContainer.innerHTML = '';

        function build(items, container) {
            items.forEach(item => {
                if (item.type === 'category') {
                    const div = document.createElement('div');
                    div.className = 'category-item';
                    div.innerHTML = `
                        <button class="category-btn">${item.displayName} <span>▼</span></button>
                        <div class="category-content" style="display:none;"></div>
                    `;
                    container.appendChild(div);
                    build(item.children, div.querySelector('.category-content'));
                } else {
                    const div = document.createElement('div');
                    div.className = 'item-block';
                    div.id = `block-${item.name}`;
                    let pastilles = item.pastilles.map(p => `<img src="${p.icon}" class="pastille-btn" data-url="${p.texture}" data-target="${item.name}">`).join('');
                    const displayName = item.name.replace(/^[0-9]+_/, '');
                    div.innerHTML = `
                        <div class="item-header">
                            <button class="add-btn item-main-btn" data-url="${item.baseImg}" data-name="${item.name}">
                                <img src="${item.renduImg}" width="25" height="25">
                            </button>
                            <span class="item-label">${displayName}</span>
                        </div>
                        <div class="item-options" id="options-${item.name}" style="display:none;">
                            <div class="variations-line">${pastilles}</div>
                            <div class="item-filters">
                                <div class="filter-group"><label>Luminosité</label>
                                <input type="range" class="filter-slider" data-filter="brightness" data-target="${item.name}" min="0" max="200" value="100"></div>
                                <div class="filter-group"><label>Contraste</label>
                                <input type="range" class="filter-slider" data-filter="contrast" data-target="${item.name}" min="0" max="200" value="100"></div>
                            </div>
                        </div>
                    `;
                    container.appendChild(div);
                }
            });
        }
        build(data, menuContainer);
    } catch (e) {
        console.error("Erreur API:", e);
        const mc = document.querySelector('.menu-categories');
        if(mc) mc.innerHTML = "Erreur de chargement.";
    }
}

// --- 2. CAMERA / ZOOM / ANIMATION ---
window.applyZoom = function(direction) {
    if (!viewer) return;
    zm_Level = Math.max(0, Math.min(2, zm_Level + direction));
    updateButtonStyles(); updateCameraWithZoom();
};

window.setCameraView = function(viewType) {
    if (!viewer) return;
    zm_ViewMode = viewType; zm_Level = 0;
    updateButtonStyles(); updateCameraWithZoom();
};

function updateButtonStyles() {
    const btnIn = document.getElementById('btn-zoom-in'), btnOut = document.getElementById('btn-zoom-out');
    if(btnIn) { btnIn.disabled = (zm_Level === 0); btnIn.style.backgroundColor = btnIn.disabled ? "#333" : "#FFC800"; btnIn.style.color = btnIn.disabled ? "#666" : "#000"; btnIn.style.borderColor = btnIn.disabled ? "#444" : "#e6b400"; }
    if(btnOut) { btnOut.disabled = (zm_Level === 2); btnOut.style.backgroundColor = btnOut.disabled ? "#333" : "#FFC800"; btnOut.style.color = btnOut.disabled ? "#666" : "#000"; btnOut.style.borderColor = btnOut.disabled ? "#444" : "#e6b400"; }
}

function updateCameraWithZoom() {
    let baseY = (zm_ViewMode === 'face') ? 5 : 25;
    let targetY = (zm_ViewMode === 'face') ? -8 : -12;
    const targetPos = new THREE.Vector3(0, targetY, 0);
    const direction = new THREE.Vector3(45, baseY, 45).sub(targetPos);
    direction.multiplyScalar(Math.pow(1.15, zm_Level));
    viewer.camera.position.copy(targetPos).add(direction);
    viewer.camera.lookAt(0, targetY, 0);
}

window.setAnimation = function(type) {
    if (!viewer) return;
    viewer.animation = null;
    if (viewer.rightArm) { viewer.rightArm.rotation.x = viewer.leftArm.rotation.x = 0; viewer.rightLeg.rotation.x = viewer.leftLeg.rotation.x = 0; }
    if (type === 'walk' || type === 'run') {
        const s = type === 'walk' ? 6 : 12, a = type === 'walk' ? 0.6 : 1.0;
        viewer.animation = (v, t) => {
            if (!v.rightArm) return;
            v.rightArm.rotation.x = Math.cos(t * s) * a; v.leftArm.rotation.x = -Math.cos(t * s) * a;
            v.rightLeg.rotation.x = -Math.cos(t * s) * a; v.leftLeg.rotation.x = Math.cos(t * s) * a;
        };
    }
};

window.removeLayer = function(index) { layers.splice(index, 1); refreshProject(); };
window.moveLayer = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < layers.length) { [layers[index], layers[newIndex]] = [layers[newIndex], layers[index]]; refreshProject(); }
};

window.ouvrirGenerateur = function() {
    const app = document.getElementById('main-app');
    if (app) {
        app.style.display = 'flex';
        setTimeout(() => { if (viewer) viewer.setSize(document.getElementById("viewer-container").clientWidth, document.getElementById("viewer-container").clientHeight); }, 50);
    }
    const rideau = document.getElementById('rideau-entree');
    if (rideau) { rideau.classList.add('rideau-leve'); setTimeout(() => { rideau.style.display = 'none'; }, 1200); }
};

// --- 3. CLASSE REFLECTOR ---
class Reflector extends THREE.Mesh {
    constructor(geometry, options = {}) {
        super(geometry);
        this.type = 'Reflector';
        const scope = this;
        const color = (options.color !== undefined) ? new THREE.Color(options.color) : new THREE.Color(0x7F7F7F);
        const textureWidth = options.textureWidth || 512, textureHeight = options.textureHeight || 512;
        const clipBias = options.clipBias || 0;
        const shader = options.shader || {
            uniforms: { 'color': { value: null }, 'tDiffuse': { value: null }, 'textureMatrix': { value: null } },
            vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; void main() { vUv = textureMatrix * vec4( position, 1.0 ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
            fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; varying vec4 vUv; void main() { vec4 base = texture2DProj( tDiffuse, vUv ); gl_FragColor = vec4( mix( base.rgb, color, 0.4 ), 1.0 ); }`
        };
        const reflectorPlane = new THREE.Plane(), normal = new THREE.Vector3(), reflectorWorldPosition = new THREE.Vector3(), cameraWorldPosition = new THREE.Vector3(), rotationMatrix = new THREE.Matrix4(), lookAtPosition = new THREE.Vector3(0, 0, -1), clipPlane = new THREE.Vector4(), view = new THREE.Vector3(), target = new THREE.Vector3(), q = new THREE.Vector4(), textureMatrix = new THREE.Matrix4(), virtualCamera = new THREE.PerspectiveCamera(), renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
        const material = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(shader.uniforms), fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader });
        material.uniforms['tDiffuse'].value = renderTarget.texture; material.uniforms['color'].value = color; material.uniforms['textureMatrix'].value = textureMatrix;
        this.material = material;
        this.onBeforeRender = function (renderer, scene, camera) {
            reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld); cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld); rotationMatrix.extractRotation(scope.matrixWorld); normal.set(0, 0, 1); normal.applyMatrix4(rotationMatrix); view.subVectors(reflectorWorldPosition, cameraWorldPosition);
            if (view.dot(normal) > 0) return;
            view.reflect(normal).negate(); view.add(reflectorWorldPosition); rotationMatrix.extractRotation(camera.matrixWorld); lookAtPosition.set(0, 0, -1); lookAtPosition.applyMatrix4(rotationMatrix); lookAtPosition.add(cameraWorldPosition); target.subVectors(reflectorWorldPosition, lookAtPosition); target.reflect(normal).negate(); target.add(reflectorWorldPosition); virtualCamera.position.copy(view); virtualCamera.up.set(0, 1, 0); virtualCamera.up.applyMatrix4(rotationMatrix); virtualCamera.up.reflect(normal); virtualCamera.lookAt(target); virtualCamera.far = camera.far; virtualCamera.updateMatrixWorld(); virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
            textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0); textureMatrix.multiply(virtualCamera.projectionMatrix); textureMatrix.multiply(virtualCamera.matrixWorldInverse); textureMatrix.multiply(scope.matrixWorld); reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition); reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse); clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);
            const projectionMatrix = virtualCamera.projectionMatrix; q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]; q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]; q.z = -1.0; q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]; clipPlane.multiplyScalar(2.0 / clipPlane.dot(q)); projectionMatrix.elements[2] = clipPlane.x; projectionMatrix.elements[6] = clipPlane.y; projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias; projectionMatrix.elements[14] = clipPlane.w;
            scope.visible = false; const currentRenderTarget = renderer.getRenderTarget(); const currentXrEnabled = (renderer.xr) ? renderer.xr.enabled : false; const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
            if (renderer.xr) renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false; renderer.setRenderTarget(renderTarget); renderer.state.buffers.depth.setMask(true); if (renderer.autoClear === false) renderer.clear(); renderer.render(scene, virtualCamera);
            if (renderer.xr) renderer.xr.enabled = currentXrEnabled; renderer.shadowMap.autoUpdate = currentShadowAutoUpdate; renderer.setRenderTarget(currentRenderTarget); const viewport = camera.viewport; if (viewport) { renderer.state.viewport(viewport); } scope.visible = true;
        };
    }
}

// --- 4. INITIALISATION 3D ---
function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");
    viewer = new skinview3d.SkinViewer({ domElement: container, width: parent.clientWidth, height: parent.clientHeight, skin: INVISIBLE_SKIN, fov: 35 });
    viewer.autoRender = true; viewer.camera.position.set(45, 25, 45); viewer.camera.lookAt(0, -12, 0);

    const loadImgSafe = (src) => new Promise(res => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(img); img.src = src; });

    const createProceduralRoom = async () => {
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512; const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
        const [p1, p2, tapisImg, portesImg, blocImg, legImg, cadreImg] = await Promise.all([ loadImgSafe('rendu3d/Plank_1.png'), loadImgSafe('rendu3d/Plank_2.png'), loadImgSafe('rendu3d/tapis.png'), loadImgSafe('rendu3d/portes.png'), loadImgSafe('rendu3d/4.png'), loadImgSafe('rendu3d/5.png'), loadImgSafe('rendu3d/cadremiroir.png') ]);
        const step = 512 / 5;
        for(let x=0; x<512; x+=step) { for(let y=0; y<512; y+=step) { if (p1.width > 0 && p2.width > 0) ctx.drawImage(Math.random() < 0.7 ? p1 : p2, x, y, step, step); else { ctx.fillStyle = "#5c3a21"; ctx.fillRect(x, y, step, step); } } }
        const wallTexture = new THREE.CanvasTexture(canvas); wallTexture.magFilter = wallTexture.minFilter = THREE.NearestFilter; const materials = [];
        for (let i = 0; i < 6; i++) { const texFace = wallTexture.clone(); texFace.needsUpdate = true; if (i === 2 || i === 3) texFace.repeat.set(1, 1); else texFace.repeat.set(1, 0.6); materials.push(new THREE.MeshBasicMaterial({ map: texFace, side: THREE.BackSide, transparent: true })); }
        const roomMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 60, 100), materials); roomMesh.position.y = 2; viewer.scene.add(roomMesh);
        
        let tapisPlane, portesPlane, blocMesh;
        if (tapisImg.width > 0) { const tapisTex = new THREE.CanvasTexture(tapisImg); tapisTex.magFilter = tapisTex.minFilter = THREE.NearestFilter; tapisPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 80), new THREE.MeshBasicMaterial({ map: tapisTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide })); tapisPlane.rotation.x = -Math.PI / 2; tapisPlane.position.set(0, -27.9, 0); viewer.scene.add(tapisPlane); }
        if (portesImg.width > 0) { const portesTex = new THREE.CanvasTexture(portesImg); portesTex.magFilter = portesTex.minFilter = THREE.NearestFilter; portesPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: portesTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide })); portesPlane.position.set(10, -8, -49.8); viewer.scene.add(portesPlane); }
        if (blocImg.width > 0) {
            const mapW = 96, mapH = 96; const blocTex = new THREE.CanvasTexture(blocImg); blocTex.magFilter = THREE.NearestFilter; blocTex.minFilter = THREE.NearestFilter;
            const material = new THREE.MeshBasicMaterial({ map: blocTex }); const geometry = new THREE.BoxGeometry(20, 10, 40);
            function setFaceUV(geometry, faceIndex, x, y, w, h, rotate, flipX, flipY) { let u0 = x / mapW, u1 = (x + w) / mapW; let v0 = 1 - (y + h) / mapH, v1 = 1 - y / mapH; if (flipX) { const temp = u0; u0 = u1; u1 = temp; } if (flipY) { const temp = v0; v0 = v1; v1 = temp; } let uvs; if (rotate) uvs = [new THREE.Vector2(u1, v1), new THREE.Vector2(u1, v0), new THREE.Vector2(u0, v1), new THREE.Vector2(u0, v0)]; else uvs = [new THREE.Vector2(u0, v0), new THREE.Vector2(u1, v0), new THREE.Vector2(u0, v1), new THREE.Vector2(u1, v1)]; geometry.faceVertexUvs[0][faceIndex * 2] = [uvs[2], uvs[0], uvs[3]]; geometry.faceVertexUvs[0][faceIndex * 2 + 1] = [uvs[0], uvs[1], uvs[3]]; }
            setFaceUV(geometry, 0, 0, 16, 16, 64, true, true, true); setFaceUV(geometry, 1, 48, 16, 16, 64, true, false, false); setFaceUV(geometry, 2, 16, 16, 32, 64, false, false, false); setFaceUV(geometry, 3, 64, 16, 32, 64, false, false, false); setFaceUV(geometry, 4, 16, 80, 32, 16, false, false, true); setFaceUV(geometry, 5, 16, 0, 32, 16, false, false, true);
            blocMesh = new THREE.Mesh(geometry, material); blocMesh.position.set(-40, -18, -30); viewer.scene.add(blocMesh);
        }
        
        const mirrorGeo = new THREE.PlaneGeometry(20, 40); const mirrorMesh = new Reflector(mirrorGeo, { clipBias: 0.003, textureWidth: window.innerWidth * window.devicePixelRatio, textureHeight: window.innerHeight * window.devicePixelRatio, color: 0x777777 }); mirrorMesh.position.set(-22, -8, 12); mirrorMesh.rotation.y = Math.PI / 2; viewer.scene.add(mirrorMesh);
        if (cadreImg && cadreImg.width > 0) {
            const cadreTex = new THREE.CanvasTexture(cadreImg); cadreTex.magFilter = THREE.NearestFilter; cadreTex.minFilter = THREE.NearestFilter;
            const cadreMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), new THREE.MeshBasicMaterial({ map: cadreTex, transparent: true, side: THREE.FrontSide })); cadreMesh.position.copy(mirrorMesh.position); cadreMesh.rotation.copy(mirrorMesh.rotation); cadreMesh.translateZ(0.05); viewer.scene.add(cadreMesh);
            const vector = new THREE.Vector3();
            viewer.onRender = () => { viewer.camera.getWorldDirection(vector); const showBack = vector.z < 0; if (portesPlane) portesPlane.visible = showBack; if (blocMesh) blocMesh.visible = showBack; if (tapisPlane) tapisPlane.visible = vector.y < 0.5; const isMirrorVisible = vector.z > 0; if (mirrorMesh) mirrorMesh.visible = isMirrorVisible; cadreMesh.visible = isMirrorVisible; };
        }
    };

    createProceduralRoom();
    
    // Contrôles Souris / Tactile
    let isDragging = false; let previousMousePosition = { x: 0, y: 0 }; const canvas = viewer.renderer.domElement;
    canvas.addEventListener('mousedown', function(e) { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', function() { isDragging = false; });
    window.addEventListener('mousemove', function(e) { if (!isDragging || !viewer.playerObject || !viewer.playerObject.skin) return; const deltaMove = { x: e.clientX - previousMousePosition.x }; viewer.playerObject.skin.rotation.y += deltaMove.x * 0.01; previousMousePosition = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('touchstart', function(e) { isDragging = true; previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, {passive: false});
    window.addEventListener('touchend', function() { isDragging = false; });
    window.addEventListener('touchmove', function(e) { if (!isDragging || !viewer.playerObject || !viewer.playerObject.skin) return; const deltaMove = { x: e.touches[0].clientX - previousMousePosition.x }; viewer.playerObject.skin.rotation.y += deltaMove.x * 0.01; previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, {passive: false});

    initEventListeners();
    loadMenu();
    setTimeout(updateButtonStyles, 200);
}

// --- 5. COMPOSITION DES CALQUES ---
async function refreshProject() {
    const list = document.getElementById('layer-list'); if (!list) return; list.innerHTML = "";
    viewer.skinImg.src = layers.length === 0 ? INVISIBLE_SKIN : await composeSkins(layers);
    [...layers].reverse().forEach((layer) => {
        const realIdx = layers.indexOf(layer); const item = document.createElement('div'); item.className = 'layer-item';
        item.innerHTML = `<span>✨ ${layer.name.replace(/^[0-9]+_/, '')}</span><div class="layer-controls"><button onclick="moveLayer(${realIdx}, 1)">▲</button><button onclick="moveLayer(${realIdx}, -1)">▼</button><button onclick="removeLayer(${realIdx})" class="delete-layer">❌</button></div>`;
        list.appendChild(item);
    });
}

async function composeSkins(layersArray) {
    const promises = layersArray.map(l => new Promise((res) => { const img = new Image(); img.crossOrigin = "anonymous"; img.src = l.url; img.onload = () => res({img, filters: l.filters}); img.onerror = () => res(null); }));
    const results = (await Promise.all(promises)).filter(r => r !== null); if (results.length === 0) return INVISIBLE_SKIN;
    const canvas = document.createElement('canvas'); canvas.width = results[0].img.width; canvas.height = results[0].img.height; const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    results.forEach(res => { ctx.save(); ctx.filter = `brightness(${res.filters.brightness}%) contrast(${res.filters.contrast}%)`; ctx.drawImage(res.img, 0, 0, canvas.width, canvas.height); ctx.restore(); });
    return canvas.toDataURL("image/png");
}

function initEventListeners() {
    document.addEventListener('input', (e) => { if (e.target.classList.contains('filter-slider')) { const layer = layers.find(l => l.name === e.target.dataset.target); if (layer) { layer.filters[e.target.dataset.filter] = e.target.value; refreshProject(); } } });
    document.addEventListener('click', async (e) => {
        const catBtn = e.target.closest('.category-btn'); if (catBtn) { const content = catBtn.nextElementSibling; content.style.display = (content.style.display === "none") ? "block" : "none"; return; }
        const itemBtn = e.target.closest('.item-main-btn');
        if (itemBtn) {
            const name = itemBtn.dataset.name;
            if (!layers.find(l => l.name === name)) { layers.push({ id: Date.now(), name: name, url: itemBtn.dataset.url, filters: { brightness: 100, contrast: 100 } }); const opt = document.getElementById('options-' + name); if(opt) opt.style.display = "block"; refreshProject(); }
            else { const opt = document.getElementById('options-' + name); if(opt) opt.style.display = opt.style.display === "none" ? "block" : "none"; }
        }
        if (e.target.classList.contains('pastille-btn')) { const layer = layers.find(l => l.name === e.target.dataset.target); if (layer) { layer.url = e.target.dataset.url; refreshProject(); } }
    });
    const dlBtn = document.getElementById('download-btn'); if(dlBtn) { dlBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = 'skin.png'; link.href = viewer.skinCanvas.toDataURL(); link.click(); }); }
}

window.addEventListener('resize', () => { const p = document.getElementById("viewer-container"); if (viewer && p) viewer.setSize(p.clientWidth, p.clientHeight); });

window.onload = init;