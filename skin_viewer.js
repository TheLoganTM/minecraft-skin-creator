/**
 * skinview3d (https://github.com/bs-community/skinview3d)
 * MIT License
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
        typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
            (factory((global.skinview3d = {}), global.THREE));
}(this, (function (exports, THREE) { 'use strict';

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function toFaceVertices(x1, y1, x2, y2, w, h) {
        return [
            new THREE.Vector2(x1 / w, 1.0 - y2 / h),
            new THREE.Vector2(x2 / w, 1.0 - y2 / h),
            new THREE.Vector2(x2 / w, 1.0 - y1 / h),
            new THREE.Vector2(x1 / w, 1.0 - y1 / h)
        ];
    }
    function toSkinVertices(x1, y1, x2, y2) { return toFaceVertices(x1, y1, x2, y2, 64.0, 64.0); }
    function toCapeVertices(x1, y1, x2, y2) { return toFaceVertices(x1, y1, x2, y2, 64.0, 32.0); }

    function setVertices(box, top, bottom, left, front, right, back) {
        box.faceVertexUvs[0] = [];
        box.faceVertexUvs[0][0] = [right[3], right[0], right[2]];
        box.faceVertexUvs[0][1] = [right[0], right[1], right[2]];
        box.faceVertexUvs[0][2] = [left[3], left[0], left[2]];
        box.faceVertexUvs[0][3] = [left[0], left[1], left[2]];
        box.faceVertexUvs[0][4] = [top[3], top[0], top[2]];
        box.faceVertexUvs[0][5] = [top[0], top[1], top[2]];
        box.faceVertexUvs[0][6] = [bottom[0], bottom[3], bottom[1]];
        box.faceVertexUvs[0][7] = [bottom[3], bottom[2], bottom[1]];
        box.faceVertexUvs[0][8] = [front[3], front[0], front[2]];
        box.faceVertexUvs[0][9] = [front[0], front[1], front[2]];
        box.faceVertexUvs[0][10] = [back[3], back[0], back[2]];
        box.faceVertexUvs[0][11] = [back[0], back[1], back[2]];
    }

    var esp = 0.002;
    var BodyPart = (function (_super) {
        __extends(BodyPart, _super);
        function BodyPart(innerLayer, outerLayer) {
            var _this = _super.call(this) || this;
            _this.innerLayer = innerLayer;
            _this.outerLayer = outerLayer;
            return _this;
        }
        return BodyPart;
    }(THREE.Group));

    var SkinObject = (function (_super) {
        __extends(SkinObject, _super);
        function SkinObject(layer1Material, layer2Material) {
            var _this = _super.call(this) || this;
            _this.modelListeners = [];
            _this._slim = false;
            var headBox = new THREE.BoxGeometry(8, 8, 8, 0, 0, 0);
            setVertices(headBox, toSkinVertices(8, 0, 16, 8), toSkinVertices(16, 0, 24, 8), toSkinVertices(0, 8, 8, 16), toSkinVertices(8, 8, 16, 16), toSkinVertices(16, 8, 24, 16), toSkinVertices(24, 8, 32, 16));
            var headMesh = new THREE.Mesh(headBox, layer1Material);
            var head2Box = new THREE.BoxGeometry(9, 9, 9, 0, 0, 0);
            setVertices(head2Box, toSkinVertices(40, 0, 48, 8), toSkinVertices(48, 0, 56, 8), toSkinVertices(32, 8, 40, 16), toSkinVertices(40, 8, 48, 16), toSkinVertices(48, 8, 56, 16), toSkinVertices(56, 8, 64, 16));
            var head2Mesh = new THREE.Mesh(head2Box, layer2Material);
            _this.head = new BodyPart(headMesh, head2Mesh);
            _this.head.add(headMesh, head2Mesh);
            _this.add(_this.head);

            var bodyBox = new THREE.BoxGeometry(8, 12, 4, 0, 0, 0);
            setVertices(bodyBox, toSkinVertices(20, 16, 28, 20), toSkinVertices(28, 16, 36, 20), toSkinVertices(16, 20, 20, 32), toSkinVertices(20, 20, 28, 32), toSkinVertices(28, 20, 32, 32), toSkinVertices(32, 20, 40, 32));
            var bodyMesh = new THREE.Mesh(bodyBox, layer1Material);
            var body2Box = new THREE.BoxGeometry(9, 13.5, 4.5, 0, 0, 0);
            setVertices(body2Box, toSkinVertices(20, 32, 28, 36), toSkinVertices(28, 32, 36, 36), toSkinVertices(16, 36, 20, 48), toSkinVertices(20, 36, 28, 48), toSkinVertices(28, 36, 32, 48), toSkinVertices(32, 36, 40, 48));
            var body2Mesh = new THREE.Mesh(body2Box, layer2Material);
            _this.body = new BodyPart(bodyMesh, body2Mesh);
            _this.body.add(bodyMesh, body2Mesh);
            _this.body.position.y = -10;
            _this.add(_this.body);

            // Right Arm
            var rightArmBox = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0);
            var rightArmMesh = new THREE.Mesh(rightArmBox, layer1Material);
            _this.modelListeners.push(function () {
                rightArmMesh.scale.x = (_this.slim ? 3 : 4) - esp;
                rightArmMesh.scale.y = 12 - esp;
                rightArmMesh.scale.z = 4 - esp;
                if (_this.slim) { setVertices(rightArmBox, toSkinVertices(44, 16, 47, 20), toSkinVertices(47, 16, 50, 20), toSkinVertices(40, 20, 44, 32), toSkinVertices(44, 20, 47, 32), toSkinVertices(47, 20, 51, 32), toSkinVertices(51, 20, 54, 32)); }
                else { setVertices(rightArmBox, toSkinVertices(44, 16, 48, 20), toSkinVertices(48, 16, 52, 20), toSkinVertices(40, 20, 44, 32), toSkinVertices(44, 20, 48, 32), toSkinVertices(48, 20, 52, 32), toSkinVertices(52, 20, 56, 32)); }
                rightArmBox.uvsNeedUpdate = true;
            });

            var rightArm2Box = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0);
            var rightArm2Mesh = new THREE.Mesh(rightArm2Box, layer2Material);
            _this.modelListeners.push(function () {
                rightArm2Mesh.scale.x = (_this.slim ? 3.375 : 4.5) - esp;
                rightArm2Mesh.scale.y = 13.5 - esp;
                rightArm2Mesh.scale.z = 4.5 - esp;
                if (_this.slim) { setVertices(rightArm2Box, toSkinVertices(44, 32, 47, 36), toSkinVertices(47, 32, 50, 36), toSkinVertices(40, 36, 44, 48), toSkinVertices(44, 36, 47, 48), toSkinVertices(47, 36, 51, 48), toSkinVertices(51, 36, 54, 48)); }
                else { setVertices(rightArm2Box, toSkinVertices(44, 32, 48, 36), toSkinVertices(48, 32, 52, 36), toSkinVertices(40, 36, 44, 48), toSkinVertices(44, 36, 48, 48), toSkinVertices(48, 36, 52, 48), toSkinVertices(52, 36, 56, 48)); }
                rightArm2Box.uvsNeedUpdate = true;
            });
            var rightArmPivot = new THREE.Group();
            rightArmPivot.add(rightArmMesh, rightArm2Mesh);
            rightArmPivot.position.y = -6;
            _this.rightArm = new BodyPart(rightArmMesh, rightArm2Mesh);
            _this.rightArm.add(rightArmPivot);
            _this.rightArm.position.y = -4;
            _this.modelListeners.push(function () { _this.rightArm.position.x = _this.slim ? -5.5 : -6; });
            _this.add(_this.rightArm);

            // Left Arm
            var leftArmBox = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0);
            var leftArmMesh = new THREE.Mesh(leftArmBox, layer1Material);
            _this.modelListeners.push(function () {
                leftArmMesh.scale.x = (_this.slim ? 3 : 4) - esp;
                leftArmMesh.scale.y = 12 - esp;
                leftArmMesh.scale.z = 4 - esp;
                if (_this.slim) { setVertices(leftArmBox, toSkinVertices(36, 48, 39, 52), toSkinVertices(39, 48, 42, 52), toSkinVertices(32, 52, 36, 64), toSkinVertices(36, 52, 39, 64), toSkinVertices(39, 52, 43, 64), toSkinVertices(43, 52, 46, 64)); }
                else { setVertices(leftArmBox, toSkinVertices(36, 48, 40, 52), toSkinVertices(40, 48, 44, 52), toSkinVertices(32, 52, 36, 64), toSkinVertices(36, 52, 40, 64), toSkinVertices(40, 52, 44, 64), toSkinVertices(44, 52, 48, 64)); }
                leftArmBox.uvsNeedUpdate = true;
            });

            var leftArm2Box = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0);
            var leftArm2Mesh = new THREE.Mesh(leftArm2Box, layer2Material);
            _this.modelListeners.push(function () {
                leftArm2Mesh.scale.x = (_this.slim ? 3.375 : 4.5) - esp;
                leftArm2Mesh.scale.y = 13.5 - esp;
                leftArm2Mesh.scale.z = 4.5 - esp;
                if (_this.slim) { setVertices(leftArm2Box, toSkinVertices(52, 48, 55, 52), toSkinVertices(55, 48, 58, 52), toSkinVertices(48, 52, 52, 64), toSkinVertices(52, 52, 55, 64), toSkinVertices(55, 52, 59, 64), toSkinVertices(59, 52, 62, 64)); }
                else { setVertices(leftArm2Box, toSkinVertices(52, 48, 56, 52), toSkinVertices(56, 48, 60, 52), toSkinVertices(48, 52, 52, 64), toSkinVertices(52, 52, 56, 64), toSkinVertices(56, 52, 60, 64), toSkinVertices(60, 52, 64, 64)); }
                leftArm2Box.uvsNeedUpdate = true;
            });
            var leftArmPivot = new THREE.Group();
            leftArmPivot.add(leftArmMesh, leftArm2Mesh);
            leftArmPivot.position.y = -6;
            _this.leftArm = new BodyPart(leftArmMesh, leftArm2Mesh);
            _this.leftArm.add(leftArmPivot);
            _this.leftArm.position.y = -4;
            _this.modelListeners.push(function () { _this.leftArm.position.x = _this.slim ? 5.5 : 6; });
            _this.add(_this.leftArm);

            // Legs
            var rightLegBox = new THREE.BoxGeometry(4 - esp, 12 - esp, 4 - esp, 0, 0, 0);
            setVertices(rightLegBox, toSkinVertices(4, 16, 8, 20), toSkinVertices(8, 16, 12, 20), toSkinVertices(0, 20, 4, 32), toSkinVertices(4, 20, 8, 32), toSkinVertices(8, 20, 12, 32), toSkinVertices(12, 20, 16, 32));
            var rightLegMesh = new THREE.Mesh(rightLegBox, layer1Material);
            _this.rightLeg = new BodyPart(rightLegMesh, new THREE.Group());
            var rightLegPivot = new THREE.Group();
            rightLegPivot.add(rightLegMesh);
            rightLegPivot.position.y = -6;
            _this.rightLeg.add(rightLegPivot);
            _this.rightLeg.position.y = -16; _this.rightLeg.position.x = -2;
            _this.add(_this.rightLeg);

            var leftLegBox = new THREE.BoxGeometry(4 - esp, 12 - esp, 4 - esp, 0, 0, 0);
            setVertices(leftLegBox, toSkinVertices(20, 48, 24, 52), toSkinVertices(24, 48, 28, 52), toSkinVertices(16, 52, 20, 64), toSkinVertices(20, 52, 24, 64), toSkinVertices(24, 52, 28, 64), toSkinVertices(28, 52, 32, 64));
            var leftLegMesh = new THREE.Mesh(leftLegBox, layer1Material);
            _this.leftLeg = new BodyPart(leftLegMesh, new THREE.Group());
            var leftLegPivot = new THREE.Group();
            leftLegPivot.add(leftLegMesh);
            leftLegPivot.position.y = -6;
            _this.leftLeg.add(leftLegPivot);
            _this.leftLeg.position.y = -16; _this.leftLeg.position.x = 2;
            _this.add(_this.leftLeg);

            _this.slim = false;
            return _this;
        }
        Object.defineProperty(SkinObject.prototype, "slim", {
            get: function () { return this._slim; },
            set: function (v) { this._slim = v; this.modelListeners.forEach(function (l) { l(); }); },
            enumerable: true, configurable: true
        });
        return SkinObject;
    }(THREE.Group));

    var PlayerObject = (function (_super) {
        __extends(PlayerObject, _super);
        function PlayerObject(l1, l2) {
            var _this = _super.call(this) || this;
            _this.skin = new SkinObject(l1, l2);
            _this.add(_this.skin);
            return _this;
        }
        return PlayerObject;
    }(THREE.Group));

    var WalkingAnimation = function (player, time) {
        var skin = player.skin; time *= 8;
        skin.leftLeg.rotation.x = Math.sin(time) * 0.5;
        skin.rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.5;
        skin.leftArm.rotation.x = Math.sin(time + Math.PI) * 0.5;
        skin.rightArm.rotation.x = Math.sin(time) * 0.5;
    };

    var SkinViewer = (function () {
        function SkinViewer(options) {
            var _this = this;
            this.domElement = options.domElement;
            this.skinImg = new Image();
            this.skinCanvas = document.createElement("canvas");
            this.skinTexture = new THREE.Texture(this.skinCanvas);
            this.skinTexture.magFilter = THREE.NearestFilter;
            this.skinTexture.minFilter = THREE.NearestFilter;

            this.layer1Material = new THREE.MeshBasicMaterial({ map: this.skinTexture, side: THREE.FrontSide });
            this.layer2Material = new THREE.MeshBasicMaterial({ map: this.skinTexture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(40, options.width / options.height, 0.1, 1000);
            this.camera.position.y = -12; this.camera.position.z = 60;

            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
            this.renderer.setSize(options.width, options.height);
            this.domElement.appendChild(this.renderer.domElement);

            this.playerObject = new PlayerObject(this.layer1Material, this.layer2Material);
            this.scene.add(this.playerObject);

            this.skinImg.crossOrigin = "anonymous";
            this.skinImg.onload = function () {
                _this.skinCanvas.width = _this.skinImg.width;
                _this.skinCanvas.height = _this.skinImg.height;
                _this.skinCanvas.getContext("2d").drawImage(_this.skinImg, 0, 0);
                _this.skinTexture.needsUpdate = true;
            };
            if (options.skin) this.skinImg.src = options.skin;

            var animate = function () {
                requestAnimationFrame(animate);
                if (_this.animation) _this.animation(_this.playerObject, Date.now() / 1000);
                _this.renderer.render(_this.scene, _this.camera);
            };
            animate();
        }
        return SkinViewer;
    }());

    exports.SkinViewer = SkinViewer;
    exports.WalkingAnimation = WalkingAnimation;

})));
