let viewer, layers = []; 

let targetRotation = 0; 

const INVISIBLE_SKIN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";



// --- 1. FONCTIONS GLOBALES ---

// FONCTION : GESTION DE LA CAMÉRA
window.setCameraView = function(viewType) {
    if (!viewer) return;

    if (viewType === 'plongee') {
        // Vue actuelle (Vue d'oiseau)
        viewer.camera.position.set(45, 25, 45);
        viewer.camera.lookAt(0, -12, 0);
    } else if (viewType === 'face') {
        // Vue de face 
        viewer.camera.position.set(45, 5, 45);
        viewer.camera.lookAt(0, -8, 0); // On regarde un peu plus haut (le torse)
    }
};

window.setAnimation = function(type) {
    if (!viewer) return;
    
    // On coupe l'animation précédente
    viewer.animation = null; 
    
    // RESET : On remet les membres droits 
    if (viewer.rightArm && viewer.leftArm && viewer.rightLeg && viewer.leftLeg) {
        viewer.rightArm.rotation.x = 0;
        viewer.leftArm.rotation.x = 0;
        viewer.rightLeg.rotation.x = 0;
        viewer.leftLeg.rotation.x = 0;
    }

    if (type === 'walk' || type === 'run') {
        const s = type === 'walk' ? 6 : 12; 
        const a = type === 'walk' ? 0.6 : 1.0;
        
        viewer.animation = (v, t) => {
            // SÉCURITÉ : Si le viewer n'a pas fini de charger les membres, on ne fait rien
            if (!v.rightArm) return;

            v.rightArm.rotation.x = Math.cos(t * s) * a; 
            v.leftArm.rotation.x = -Math.cos(t * s) * a;
            v.rightLeg.rotation.x = -Math.cos(t * s) * a; 
            v.leftLeg.rotation.x = Math.cos(t * s) * a;
        };
    }
};

window.removeLayer = function(index) {
    layers.splice(index, 1);
    refreshProject();
};

window.moveLayer = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < layers.length) { 
        [layers[index], layers[newIndex]] = [layers[newIndex], layers[index]]; 
        refreshProject(); 
    }
};

// --- 2. INITIALISATION ---

function init() {
    const container = document.getElementById("skin_container");
    const parent = document.getElementById("viewer-container");

    viewer = new skinview3d.SkinViewer({
        domElement: container,
        width: parent.clientWidth,
        height: parent.clientHeight,
        skin: INVISIBLE_SKIN,
        fov: 35 // FOV serré pour l'effet isométrique
    });

    viewer.autoRender = true; 

    // --- CAMÉRA FIXE PAR DÉFAUT (PLONGÉE) ---
    viewer.camera.position.set(45, 25, 45); 
    viewer.camera.lookAt(0, -12, 0);

    const loadImgSafe = (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn("⚠️ Texture manquante : " + src);
                resolve(img); 
            };
            img.src = src;
        });
    };

    const createProceduralRoom = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const [p1, p2, tapisImg, portesImg, blocImg, legImg, cadreImg] = await Promise.all([
            loadImgSafe('rendu3d/Plank_1.png'),
            loadImgSafe('rendu3d/Plank_2.png'),
            loadImgSafe('rendu3d/tapis.png'),
            loadImgSafe('rendu3d/portes.png'),
            loadImgSafe('rendu3d/4.png'),
            loadImgSafe('rendu3d/5.png'),
			loadImgSafe('rendu3d/cadremiroir.png'),
        ]);

        // 1. MURS
        const step = 512 / 5;
        for(let x=0; x<512; x+=step) {
            for(let y=0; y<512; y+=step) {
                if (p1.width > 0 && p2.width > 0) {
                    const img = Math.random() < 0.7 ? p1 : p2;
                    ctx.drawImage(img, x, y, step, step);
                } else {
                    ctx.fillStyle = "#5c3a21"; ctx.fillRect(x, y, step, step);
                }
            }
        }
        
        const wallTexture = new THREE.CanvasTexture(canvas);
        wallTexture.magFilter = wallTexture.minFilter = THREE.NearestFilter;
        const materials = [];
        for (let i = 0; i < 6; i++) {
            const texFace = wallTexture.clone();
            texFace.needsUpdate = true;
            if (i === 2 || i === 3) { texFace.repeat.set(1, 1); } else { texFace.repeat.set(1, 0.6); }
            materials.push(new THREE.MeshBasicMaterial({ map: texFace, side: THREE.BackSide, transparent: true }));
        }

        const roomMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 60, 100), materials);
        roomMesh.position.y = 2; 
        viewer.scene.add(roomMesh);

        // 2. TAPIS
        let tapisPlane;
        if (tapisImg.width > 0) {
            const tapisTex = new THREE.CanvasTexture(tapisImg);
            tapisTex.magFilter = tapisTex.minFilter = THREE.NearestFilter;
            tapisPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(100, 80), 
                new THREE.MeshBasicMaterial({ map: tapisTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide })
            );
            tapisPlane.rotation.x = -Math.PI / 2;
            tapisPlane.position.set(0, -27.9, 0); 
            viewer.scene.add(tapisPlane);
        }

        // 3. PORTES
        let portesPlane;
        if (portesImg.width > 0) {
            const portesTex = new THREE.CanvasTexture(portesImg);
            portesTex.magFilter = portesTex.minFilter = THREE.NearestFilter;
            portesPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(40, 40), 
                new THREE.MeshBasicMaterial({ map: portesTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide })
            );
            portesPlane.position.set(10, -8, -49.8);
            viewer.scene.add(portesPlane);
        }

        // 4. LE BLOC FLOTTANT (LIT)
        let blocMesh;
        if (blocImg.width > 0) {
            const mapW = 96; const mapH = 96;
            const blocTex = new THREE.CanvasTexture(blocImg);
            blocTex.magFilter = THREE.NearestFilter; blocTex.minFilter = THREE.NearestFilter;
            const material = new THREE.MeshBasicMaterial({ map: blocTex });
            const geometry = new THREE.BoxGeometry(20, 10, 40);

            function setFaceUV(geometry, faceIndex, x, y, w, h, rotate, flipX, flipY) {
                let u0 = x / mapW; let u1 = (x + w) / mapW;
                let v0 = 1 - (y + h) / mapH; let v1 = 1 - y / mapH;       
                if (flipX) { const temp = u0; u0 = u1; u1 = temp; }
                if (flipY) { const temp = v0; v0 = v1; v1 = temp; }
                let uvs;
                if (rotate) {
                    uvs = [new THREE.Vector2(u1, v1), new THREE.Vector2(u1, v0), new THREE.Vector2(u0, v1), new THREE.Vector2(u0, v0)];
                } else {
                    uvs = [new THREE.Vector2(u0, v0), new THREE.Vector2(u1, v0), new THREE.Vector2(u0, v1), new THREE.Vector2(u1, v1)];
                }
                geometry.faceVertexUvs[0][faceIndex * 2] = [uvs[2], uvs[0], uvs[3]];
                geometry.faceVertexUvs[0][faceIndex * 2 + 1] = [uvs[0], uvs[1], uvs[3]];
            }

            setFaceUV(geometry, 0, 0, 16, 16, 64, true, true, true);
            setFaceUV(geometry, 1, 48, 16, 16, 64, true, false, false);
            setFaceUV(geometry, 2, 16, 16, 32, 64, false, false, false);
            setFaceUV(geometry, 3, 64, 16, 32, 64, false, false, false);
            setFaceUV(geometry, 4, 16, 80, 32, 16, false, false, true);
            setFaceUV(geometry, 5, 16, 0, 32, 16, false, false, true);

            blocMesh = new THREE.Mesh(geometry, material);
            blocMesh.position.set(-40, -18, -30); 
            viewer.scene.add(blocMesh);
        }

        // MIROIR (DÉPLACÉ SUR LA GAUCHE)
        const mirrorGeo = new THREE.PlaneGeometry(20, 40);
        const mirrorMesh = new Reflector(mirrorGeo, { 
            clipBias: 0.003, 
            textureWidth: window.innerWidth * window.devicePixelRatio, 
            textureHeight: window.innerHeight * window.devicePixelRatio, 
            color: 0x777777 
        });
        // Position : Mur de GAUCHE (X négatif), écarté du mur et décalé
        mirrorMesh.position.set(-22, -8, 12); 

// 2. Orientation 
mirrorMesh.rotation.y = Math.PI / 2;


viewer.scene.add(mirrorMesh);

// --- AJOUT DU CADRE (Doit être ICI, à l'intérieur de la fonction MIRROIR) ---
        if (cadreImg && cadreImg.width > 0) {
            const cadreTex = new THREE.CanvasTexture(cadreImg);
            cadreTex.magFilter = THREE.NearestFilter;
            cadreTex.minFilter = THREE.NearestFilter;
            
            const cadreGeo = new THREE.PlaneGeometry(20, 40);
            const cadreMat = new THREE.MeshBasicMaterial({ 
                map: cadreTex, 
                transparent: true, 
                side: THREE.FrontSide 
            });
            
            const cadreMesh = new THREE.Mesh(cadreGeo, cadreMat);
            
            // On copie exactement les propriétés du miroir
            cadreMesh.position.copy(mirrorMesh.position);
            cadreMesh.rotation.copy(mirrorMesh.rotation);
            
            // On le décale de 0.05 vers l'avant (Z local) pour éviter le clignotement
            cadreMesh.translateZ(0.05); 
            
            viewer.scene.add(cadreMesh);

            // Gestion de l'occultation pour le cadre aussi
            viewer.onRender = () => {
                viewer.camera.getWorldDirection(vector);
                const showBack = vector.z < 0;
                if (portesPlane) portesPlane.visible = showBack;
                if (blocMesh) blocMesh.visible = showBack;
                if (tapisPlane) tapisPlane.visible = vector.y < 0.5;
                
                // Le miroir et le cadre s'affichent/disparaissent ensemble (DANS LE CAS D'UN MOUVEMENT DE CAMERA ET PAS DU PERSONNAGE)
                const isMirrorVisible = vector.z > 0;
                if (mirrorMesh) mirrorMesh.visible = isMirrorVisible;
                cadreMesh.visible = isMirrorVisible;
            };
        }

        // 6. LES PIEDS DU LIT
        if (legImg.width > 0 && blocMesh) {
            const legTex = new THREE.CanvasTexture(legImg);
            legTex.magFilter = THREE.NearestFilter;
            legTex.minFilter = THREE.NearestFilter;
            const legMaterial = new THREE.MeshBasicMaterial({ map: legTex });
            const legGeo = new THREE.BoxGeometry(2, 5, 2); 
            const mapW = legImg.width; const mapH = legImg.height; const s = mapW / 4; 

            function setLegUV(geometry, faceIndex, x, y, w, h) {
                let u0 = x / mapW; let u1 = (x + w) / mapW;
                let v0 = 1 - (y + h) / mapH; let v1 = 1 - y / mapH;
                let uvs = [new THREE.Vector2(u0, v0), new THREE.Vector2(u1, v0), new THREE.Vector2(u0, v1), new THREE.Vector2(u1, v1)];
                geometry.faceVertexUvs[0][faceIndex * 2] = [uvs[2], uvs[0], uvs[3]];
                geometry.faceVertexUvs[0][faceIndex * 2 + 1] = [uvs[0], uvs[1], uvs[3]];
            }

            setLegUV(legGeo, 0, 2*s, 1*s, s, 2*s); 
            setLegUV(legGeo, 1, 0,   1*s, s, 2*s); 
            setLegUV(legGeo, 2, 1*s, 0,   s, s);   
            setLegUV(legGeo, 3, 1*s, 3*s, s, s);   
            setLegUV(legGeo, 4, 1*s, 1*s, s, 2*s); 
            setLegUV(legGeo, 5, 3*s, 1*s, s, 2*s); 

            const legY = -25.5; 
            const legFL = new THREE.Mesh(legGeo, legMaterial); legFL.position.set(-49, legY, -11); viewer.scene.add(legFL);
            const legFR = new THREE.Mesh(legGeo, legMaterial); legFR.position.set(-31, legY, -11); viewer.scene.add(legFR);
            const legBL = new THREE.Mesh(legGeo, legMaterial); legBL.position.set(-49, legY, -49); viewer.scene.add(legBL);
            const legBR = new THREE.Mesh(legGeo, legMaterial); legBR.position.set(-31, legY, -49); viewer.scene.add(legBR);
        }

        // --- OCCULTATION & GESTION DE LA ROTATION ---
        const vector = new THREE.Vector3();
        
        // On injecte le code qui force la rotation ici
        viewer.onRender = () => {
            viewer.camera.getWorldDirection(vector);
            
            const showBack = vector.z < 0;
            if (portesPlane) portesPlane.visible = showBack;
            if (blocMesh) blocMesh.visible = showBack;
            if (tapisPlane) tapisPlane.visible = vector.y < 0.5;
            if (mirrorMesh) mirrorMesh.visible = vector.z > 0;
        };
    };

    createProceduralRoom();

    // =================================================================
    // GESTION DE LA SOURIS SUR LE PERSONNAGE (ROTATION)
    // =================================================================
    
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const canvas = viewer.renderer.domElement;

    // Quand on appuie
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Quand on relâche
    window.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Quand on bouge la souris
    window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        if (!viewer.playerObject || !viewer.playerObject.skin) return;

        // Calcul du mouvement
        const deltaMove = { x: e.clientX - previousMousePosition.x };

        // Rotation du personnage
        viewer.playerObject.skin.rotation.y += deltaMove.x * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Support Tactile (Mobile)
    canvas.addEventListener('touchstart', function(e) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: false});

    window.addEventListener('touchend', function() {
        isDragging = false;
    });

    window.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        if (!viewer.playerObject || !viewer.playerObject.skin) return;

        const deltaMove = { x: e.touches[0].clientX - previousMousePosition.x };
        viewer.playerObject.skin.rotation.y += deltaMove.x * 0.01;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: false});

    initEventListeners();
}

// --- 3. GESTION CALQUES ---

async function refreshProject() {
    const list = document.getElementById('layer-list'); 
    if (!list) return;
    list.innerHTML = ""; 
    viewer.skinImg.src = layers.length === 0 ? INVISIBLE_SKIN : await composeSkins(layers);
    
    [...layers].reverse().forEach((layer) => {
        const realIdx = layers.indexOf(layer);
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.innerHTML = `<span>✨ ${layer.name}</span><div class="layer-controls"><button onclick="moveLayer(${realIdx}, 1)">▲</button><button onclick="moveLayer(${realIdx}, -1)">▼</button><button onclick="removeLayer(${realIdx})" class="delete-layer">❌</button></div>`;
        list.appendChild(item);
    });
}

async function composeSkins(layersArray) {
    const promises = layersArray.map(l => new Promise((res) => {
        const img = new Image(); img.crossOrigin = "anonymous"; img.src = l.url;
        img.onload = () => res({img, filters: l.filters}); img.onerror = () => res(null);
    }));
    const results = (await Promise.all(promises)).filter(r => r !== null);
    if (results.length === 0) return INVISIBLE_SKIN;
    const canvas = document.createElement('canvas');
    canvas.width = results[0].img.width; canvas.height = results[0].img.height;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    results.forEach(res => {
        ctx.save(); ctx.filter = `brightness(${res.filters.brightness}%) contrast(${res.filters.contrast}%)`;
        ctx.drawImage(res.img, 0, 0, canvas.width, canvas.height); ctx.restore();
    });
    return canvas.toDataURL("image/png");
}

function initEventListeners() {
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('filter-slider')) {
            const layer = layers.find(l => l.name === e.target.dataset.target);
            if (layer) { layer.filters[e.target.dataset.filter] = e.target.value; refreshProject(); }
        }
    });
    document.addEventListener('click', async (e) => {
        const catBtn = e.target.closest('.category-btn');
        if (catBtn) { const content = catBtn.nextElementSibling; content.style.display = (content.style.display === "none") ? "block" : "none"; return; }
        const itemBtn = e.target.closest('.item-main-btn');
        if (itemBtn) {
            const name = itemBtn.dataset.name;
            if (!layers.find(l => l.name === name)) {
                layers.push({ id: Date.now(), name: name, url: itemBtn.dataset.url, filters: { brightness: 100, contrast: 100 } });
                const opt = document.getElementById('options-' + name); if(opt) opt.style.display = "block"; refreshProject();
            } else { const opt = document.getElementById('options-' + name); if(opt) opt.style.display = opt.style.display === "none" ? "block" : "none"; }
        }
        if (e.target.classList.contains('pastille-btn')) {
            const layer = layers.find(l => l.name === e.target.dataset.target);
            if (layer) { layer.url = e.target.dataset.url; refreshProject(); }
        }
    });
    const dlBtn = document.getElementById('download-btn');
    if(dlBtn) {
        dlBtn.addEventListener('click', () => {
            const link = document.createElement('a'); link.download = 'skin.png'; link.href = viewer.skinCanvas.toDataURL(); link.click();
        });
    }
}

window.addEventListener('resize', () => {
    const p = document.getElementById("viewer-container"); if (viewer && p) viewer.setSize(p.clientWidth, p.clientHeight);
});

window.onload = init;

// --- 4. CLASSE REFLECTOR ---

class Reflector extends THREE.Mesh {
    constructor(geometry, options = {}) {
        super(geometry);
        this.type = 'Reflector';
        const scope = this;
        const color = (options.color !== undefined) ? new THREE.Color(options.color) : new THREE.Color(0x7F7F7F);
        const textureWidth = options.textureWidth || 512;
        const textureHeight = options.textureHeight || 512;
        const clipBias = options.clipBias || 0;
        const shader = options.shader || {
            uniforms: {
                'color': { value: null },
                'tDiffuse': { value: null },
                'textureMatrix': { value: null }
            },
            vertexShader: `
                uniform mat4 textureMatrix;
                varying vec4 vUv;
                void main() {
                    vUv = textureMatrix * vec4( position, 1.0 );
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }`,
            fragmentShader: `
                uniform vec3 color;
                uniform sampler2D tDiffuse;
                varying vec4 vUv;
                void main() {
                    vec4 base = texture2DProj( tDiffuse, vUv );
                    gl_FragColor = vec4( mix( base.rgb, color, 0.4 ), 1.0 );
                }`
        };
        const reflectorPlane = new THREE.Plane();
        const normal = new THREE.Vector3();
        const reflectorWorldPosition = new THREE.Vector3();
        const cameraWorldPosition = new THREE.Vector3();
        const rotationMatrix = new THREE.Matrix4();
        const lookAtPosition = new THREE.Vector3(0, 0, -1);
        const clipPlane = new THREE.Vector4();
        const view = new THREE.Vector3();
        const target = new THREE.Vector3();
        const q = new THREE.Vector4();
        const textureMatrix = new THREE.Matrix4();
        const virtualCamera = new THREE.PerspectiveCamera();
        const renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
        const material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(shader.uniforms),
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader
        });
        material.uniforms['tDiffuse'].value = renderTarget.texture;
        material.uniforms['color'].value = color;
        material.uniforms['textureMatrix'].value = textureMatrix;
        this.material = material;
        
        this.onBeforeRender = function (renderer, scene, camera) {
            reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
            cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
            rotationMatrix.extractRotation(scope.matrixWorld);
            normal.set(0, 0, 1);
            normal.applyMatrix4(rotationMatrix);
            view.subVectors(reflectorWorldPosition, cameraWorldPosition);
            if (view.dot(normal) > 0) return;
            view.reflect(normal).negate();
            view.add(reflectorWorldPosition);
            rotationMatrix.extractRotation(camera.matrixWorld);
            lookAtPosition.set(0, 0, -1);
            lookAtPosition.applyMatrix4(rotationMatrix);
            lookAtPosition.add(cameraWorldPosition);
            target.subVectors(reflectorWorldPosition, lookAtPosition);
            target.reflect(normal).negate();
            target.add(reflectorWorldPosition);
            virtualCamera.position.copy(view);
            virtualCamera.up.set(0, 1, 0);
            virtualCamera.up.applyMatrix4(rotationMatrix);
            virtualCamera.up.reflect(normal);
            virtualCamera.lookAt(target);
            virtualCamera.far = camera.far;
            virtualCamera.updateMatrixWorld();
            virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
            textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
            textureMatrix.multiply(virtualCamera.projectionMatrix);
            textureMatrix.multiply(virtualCamera.matrixWorldInverse);
            textureMatrix.multiply(scope.matrixWorld);
            reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
            reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);
            clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);
            const projectionMatrix = virtualCamera.projectionMatrix;
            q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
            q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
            q.z = -1.0;
            q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
            clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
            projectionMatrix.elements[2] = clipPlane.x;
            projectionMatrix.elements[6] = clipPlane.y;
            projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
            projectionMatrix.elements[14] = clipPlane.w;
            scope.visible = false;
            
            const currentRenderTarget = renderer.getRenderTarget();
            const currentXrEnabled = (renderer.xr) ? renderer.xr.enabled : false;
            const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
            
            if (renderer.xr) renderer.xr.enabled = false;
            renderer.shadowMap.autoUpdate = false;
            
            renderer.setRenderTarget(renderTarget);
            renderer.state.buffers.depth.setMask(true);
            if (renderer.autoClear === false) renderer.clear();
            renderer.render(scene, virtualCamera);
            
            if (renderer.xr) renderer.xr.enabled = currentXrEnabled;
            renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
            renderer.setRenderTarget(currentRenderTarget);
            
            const viewport = camera.viewport;
            if (viewport) { renderer.state.viewport(viewport); }
            scope.visible = true;
        };
    }
}

// --- BLOC DE ZOOM ---

let zm_Level = 0; 
let zm_ViewMode = 'plongee'; 

window.applyZoom = function(direction) {
    if (!viewer) return;

    let newLevel = zm_Level + direction;
    if (newLevel < 0) newLevel = 0;
    if (newLevel > 2) newLevel = 2;

    zm_Level = newLevel;
    
    updateButtonStyles(); 
    updateCameraWithZoom();
};

window.setCameraView = function(viewType) {
    if (!viewer) return;
    zm_ViewMode = viewType;
    zm_Level = 0; 
    
    updateButtonStyles(); 
    updateCameraWithZoom();
};

function updateButtonStyles() {
    const btnIn = document.getElementById('btn-zoom-in');
    const btnOut = document.getElementById('btn-zoom-out');
    const jauneMiroir = "#FFC800"; 

    if(btnIn) {
        btnIn.disabled = (zm_Level === 0);
        btnIn.style.backgroundColor = btnIn.disabled ? "#333" : jauneMiroir;
        btnIn.style.color = btnIn.disabled ? "#666" : "#000";
        btnIn.style.borderColor = btnIn.disabled ? "#444" : "#e6b400";
    }
    if(btnOut) {
        btnOut.disabled = (zm_Level === 2);
        btnOut.style.backgroundColor = btnOut.disabled ? "#333" : jauneMiroir;
        btnOut.style.color = btnOut.disabled ? "#666" : "#000";
        btnOut.style.borderColor = btnOut.disabled ? "#444" : "#e6b400";
    }
}

function updateCameraWithZoom() {
    let baseX = 45, baseY = 25, baseZ = 45;
    let targetY = -12;

    if (zm_ViewMode === 'face') {
        baseY = 5;
        targetY = -8;
    }

    const startPos = new THREE.Vector3(baseX, baseY, baseZ);
    const targetPos = new THREE.Vector3(0, targetY, 0);
    const direction = new THREE.Vector3().copy(startPos).sub(targetPos);
    
    const scale = Math.pow(1.15, zm_Level);
    direction.multiplyScalar(scale);

    const finalPos = new THREE.Vector3().copy(targetPos).add(direction);

    viewer.camera.position.copy(finalPos);
    viewer.camera.lookAt(0, targetY, 0);
}

// Lancement initial
setTimeout(updateButtonStyles, 200);

// --- SYSTÈME AUDIO ---
const ambianceMusic = new Audio('rendu3d/soundgenerator.mp3');
ambianceMusic.loop = true;
ambianceMusic.volume = 0.5;


// On écoute le moindre geste sur la fenêtre
window.addEventListener('click', forceAudioPlay);
window.addEventListener('mousemove', forceAudioPlay); // Même un simple mouvement de souris peut débloquer
window.addEventListener('touchstart', forceAudioPlay);

// Fonctions de contrôle manuel (pour tes boutons)
function toggleMusic() {
    const btnPlay = document.getElementById('btn-play');
    if (ambianceMusic.paused) {
        ambianceMusic.play();
        btnPlay.innerText = "♫⏸";
    } else {
        ambianceMusic.pause();
        btnPlay.innerText = "♫▶";
    }
}

function updateVolume(val) {
    ambianceMusic.volume = val;
}

// --- RIDEAUX ---
function ouvrirGenerateur() {
    // 1. Lancer la musique au clic (autorisé par le navigateur)
    if (typeof ambianceMusic !== 'undefined') {
        ambianceMusic.play();
        // On met à jour l'icône du petit bouton son en bas à droite
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) btnPlay.innerText = "♫⏸";
    }
    
    // 2. Afficher l'application (main-app)
    const app = document.getElementById('main-app');
    if (app) {
        app.style.display = 'flex';
        
        // On force le moteur 3D à recalculer sa taille car le container est enfin visible
        setTimeout(() => {
            if (viewer) {
                const container = document.getElementById("viewer-container");
                viewer.setSize(container.clientWidth, container.clientHeight);
            }
        }, 50); 
    }
    
    // 3. Lever le rideau
    const rideau = document.getElementById('rideau-entree');
    if (rideau) {
        rideau.classList.add('rideau-leve');
        setTimeout(() => {
            rideau.style.display = 'none';
        }, 1200);
    }
}

// --- FONCTION TAILLE ---