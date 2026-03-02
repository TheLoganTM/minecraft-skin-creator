(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
        typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
            (factory((global.skinview3d = {}), global.THREE));
}(this, (function (exports, THREE) { 'use strict';

    function __extends(d, b) {
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        d.prototype.constructor = d;
    }

    function toSkinVertices(x1, y1, x2, y2) {
        return [
            new THREE.Vector2(x1 / 64, 1.0 - y2 / 64),
            new THREE.Vector2(x2 / 64, 1.0 - y2 / 64),
            new THREE.Vector2(x2 / 64, 1.0 - y1 / 64),
            new THREE.Vector2(x1 / 64, 1.0 - y1 / 64)
        ];
    }

    function setVertices(box, top, bottom, left, front, right, back) {
        box.faceVertexUvs[0] = [];
        box.faceVertexUvs[0][0] = [right[3], right[0], right[2]]; box.faceVertexUvs[0][1] = [right[0], right[1], right[2]];
        box.faceVertexUvs[0][2] = [left[3], left[0], left[2]]; box.faceVertexUvs[0][3] = [left[0], left[1], left[2]];
        box.faceVertexUvs[0][4] = [top[3], top[0], top[2]]; box.faceVertexUvs[0][5] = [top[0], top[1], top[2]];
        box.faceVertexUvs[0][6] = [bottom[0], bottom[3], bottom[1]]; box.faceVertexUvs[0][7] = [bottom[3], bottom[2], bottom[1]];
        box.faceVertexUvs[0][8] = [front[3], front[0], front[2]]; box.faceVertexUvs[0][9] = [front[0], front[1], front[2]];
        box.faceVertexUvs[0][10] = [back[3], back[0], back[2]]; box.faceVertexUvs[0][11] = [back[0], back[1], back[2]];
    }

    var esp = 0.002;

    var SkinViewer = function(options) {
        var _this = this;
        this.domElement = options.domElement;
        this.skinImg = new Image();
        this.skinCanvas = document.createElement("canvas");
        this.skinTexture = new THREE.Texture(this.skinCanvas);
        this.skinTexture.magFilter = this.skinTexture.minFilter = THREE.NearestFilter;

        var mat1 = new THREE.MeshBasicMaterial({ map: this.skinTexture, side: THREE.FrontSide });
        var mat2 = new THREE.MeshBasicMaterial({ map: this.skinTexture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(options.fov || 40, options.width / options.height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        this.renderer.setSize(options.width, options.height);
        this.domElement.appendChild(this.renderer.domElement);

        this.playerGroup = new THREE.Group();
        
        // --- Construction des parties avec PIVOTS pour l'animation ---
        var createPart = function(w, h, d, uv1, uv2, isLimb) {
            var group = new THREE.Group();
            var b1 = new THREE.BoxGeometry(w - esp, h - esp, d - esp);
            setVertices(b1, uv1[0], uv1[1], uv1[2], uv1[3], uv1[4], uv1[5]);
            var b2 = new THREE.BoxGeometry(w + 0.5, h + 0.5, d + 0.5);
            setVertices(b2, uv2[0], uv2[1], uv2[2], uv2[3], uv2[4], uv2[5]);
            
            var m1 = new THREE.Mesh(b1, mat1);
            var m2 = new THREE.Mesh(b2, mat2);
            
            if (isLimb) {
                var pivot = new THREE.Group();
                pivot.add(m1, m2);
                pivot.position.y = -h/2;
                group.add(pivot);
            } else {
                group.add(m1, m2);
            }
            return group;
        };

        // Head
        this.head = createPart(8, 8, 8, 
            [toSkinVertices(8,0,16,8), toSkinVertices(16,0,24,8), toSkinVertices(0,8,8,16), toSkinVertices(8,8,16,16), toSkinVertices(16,8,24,16), toSkinVertices(24,8,32,16)],
            [toSkinVertices(40,0,48,8), toSkinVertices(48,0,56,8), toSkinVertices(32,8,40,16), toSkinVertices(40,8,48,16), toSkinVertices(48,8,56,16), toSkinVertices(56,8,64,16)], false);
        
        // Body
        this.body = createPart(8, 12, 4,
            [toSkinVertices(20,16,28,20), toSkinVertices(28,16,36,20), toSkinVertices(16,20,20,32), toSkinVertices(20,20,28,32), toSkinVertices(28,20,32,32), toSkinVertices(32,20,40,32)],
            [toSkinVertices(20,32,28,36), toSkinVertices(28,32,36,36), toSkinVertices(16,36,20,48), toSkinVertices(20,36,28,48), toSkinVertices(28,36,32,48), toSkinVertices(32,36,40,48)], false);
        this.body.position.y = -10;

        // Limbs (Arms & Legs)
        this.rightArm = createPart(4, 12, 4, [toSkinVertices(44,16,48,20), toSkinVertices(48,16,52,20), toSkinVertices(40,20,44,32), toSkinVertices(44,20,48,32), toSkinVertices(48,20,52,32), toSkinVertices(52,20,56,32)], [toSkinVertices(44,32,48,36), toSkinVertices(48,32,52,36), toSkinVertices(40,36,44,48), toSkinVertices(44,36,48,48), toSkinVertices(48,36,52,48), toSkinVertices(52,36,56,48)], true);
        this.rightArm.position.set(-6, -4, 0);

        this.leftArm = createPart(4, 12, 4, [toSkinVertices(36,48,40,52), toSkinVertices(40,48,44,52), toSkinVertices(32,52,36,64), toSkinVertices(36,52,40,64), toSkinVertices(40,52,44,64), toSkinVertices(44,52,48,64)], [toSkinVertices(52,48,56,52), toSkinVertices(56,48,60,52), toSkinVertices(48,52,52,64), toSkinVertices(52,52,56,64), toSkinVertices(56,52,60,64), toSkinVertices(60,52,64,64)], true);
        this.leftArm.position.set(6, -4, 0);

        this.rightLeg = createPart(4, 12, 4, [toSkinVertices(4,16,8,20), toSkinVertices(8,16,12,20), toSkinVertices(0,20,4,32), toSkinVertices(4,20,8,32), toSkinVertices(8,20,12,32), toSkinVertices(12,20,16,32)], [toSkinVertices(4,32,8,36), toSkinVertices(8,32,12,36), toSkinVertices(0,36,4,48), toSkinVertices(4,36,8,48), toSkinVertices(8,36,12,48), toSkinVertices(12,36,16,48)], true);
        this.rightLeg.position.set(-2, -16, 0);

        this.leftLeg = createPart(4, 12, 4, [toSkinVertices(20,48,24,52), toSkinVertices(24,48,28,52), toSkinVertices(16,52,20,64), toSkinVertices(20,52,24,64), toSkinVertices(24,52,28,64), toSkinVertices(28,52,32,64)], [toSkinVertices(4,48,8,52), toSkinVertices(8,48,12,52), toSkinVertices(0,52,4,64), toSkinVertices(4,52,8,64), toSkinVertices(8,52,12,64), toSkinVertices(12,52,16,64)], true);
        this.leftLeg.position.set(2, -16, 0);

        this.playerGroup.add(this.head, this.body, this.rightArm, this.leftArm, this.rightLeg, this.leftLeg);
        this.scene.add(this.playerGroup);
        this.playerObject = { skin: this.playerGroup };

        this.skinImg.crossOrigin = "anonymous";
        this.skinImg.onload = function () {
            _this.skinCanvas.width = _this.skinImg.width; _this.skinCanvas.height = _this.skinImg.height;
            _this.skinCanvas.getContext("2d").drawImage(_this.skinImg, 0, 0);
            _this.skinTexture.needsUpdate = true;
        };
        if (options.skin) this.skinImg.src = options.skin;

        this.animation = null;
        var anim = function() {
            requestAnimationFrame(anim);
            if (_this.animation) _this.animation(_this, Date.now() / 1000);
            _this.renderer.render(_this.scene, _this.camera);
        };
        anim();
    };
    SkinViewer.prototype.setSize = function (w, h) { this.camera.aspect = w/h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w,h); };
    exports.SkinViewer = SkinViewer;
})));