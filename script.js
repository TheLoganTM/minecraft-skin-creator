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

    var BodyPart = (function (_super) {
        __extends(BodyPart, _super);
        function BodyPart(inner, outer) {
            var _this = _super.call(this) || this;
            _this.innerLayer = inner;
            _this.outerLayer = outer;
            return _this;
        }
        return BodyPart;
    }(THREE.Group));

    var SkinObject = (function (_super) {
        __extends(SkinObject, _super);
        function SkinObject(l1, l2) {
            var _this = _super.call(this) || this;
            var headBox = new THREE.BoxGeometry(8, 8, 8);
            setVertices(headBox, toSkinVertices(8, 0, 16, 8), toSkinVertices(16, 0, 24, 8), toSkinVertices(0, 8, 8, 16), toSkinVertices(8, 8, 16, 16), toSkinVertices(16, 8, 24, 16), toSkinVertices(24, 8, 32, 16));
            _this.head = new BodyPart(new THREE.Mesh(headBox, l1), new THREE.Group());
            _this.head.add(_this.head.innerLayer);
            _this.add(_this.head);

            var bodyBox = new THREE.BoxGeometry(8, 12, 4);
            setVertices(bodyBox, toSkinVertices(20, 16, 28, 20), toSkinVertices(28, 16, 36, 20), toSkinVertices(16, 20, 20, 32), toSkinVertices(20, 20, 28, 32), toSkinVertices(28, 20, 32, 32), toSkinVertices(32, 20, 40, 32));
            _this.body = new BodyPart(new THREE.Mesh(bodyBox, l1), new THREE.Group());
            _this.body.add(_this.body.innerLayer);
            _this.body.position.y = -10;
            _this.add(_this.body);

            var legBox = new THREE.BoxGeometry(4, 12, 4);
            setVertices(legBox, toSkinVertices(4, 16, 8, 20), toSkinVertices(8, 16, 12, 20), toSkinVertices(0, 20, 4, 32), toSkinVertices(4, 20, 8, 32), toSkinVertices(8, 20, 12, 32), toSkinVertices(12, 20, 16, 32));
            _this.rightLeg = new BodyPart(new THREE.Mesh(legBox, l1), new THREE.Group());
            _this.rightLeg.add(_this.rightLeg.innerLayer);
            _this.rightLeg.position.y = -22; _this.rightLeg.position.x = -2;
            _this.add(_this.rightLeg);

            _this.leftLeg = new BodyPart(new THREE.Mesh(legBox, l1), new THREE.Group());
            _this.leftLeg.add(_this.leftLeg.innerLayer);
            _this.leftLeg.position.y = -22; _this.leftLeg.position.x = 2;
            _this.add(_this.leftLeg);

            return _this;
        }
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
        var t = time * 8;
        player.skin.rightLeg.rotation.x = Math.cos(t) * 0.5;
        player.skin.leftLeg.rotation.x = Math.cos(t + Math.PI) * 0.5;
    };

    var SkinViewer = (function () {
        function SkinViewer(opt) {
            var _this = this;
            this.domElement = opt.domElement;
            this.skinImg = new Image();
            this.skinCanvas = document.createElement("canvas");
            this.skinTexture = new THREE.Texture(this.skinCanvas);
            this.skinTexture.magFilter = THREE.NearestFilter;
            this.skinTexture.minFilter = THREE.NearestFilter;

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, opt.width / opt.height, 0.1, 1000);
            this.camera.position.z = 60; this.camera.position.y = -10;

            this.renderer = new THREE.WebGLRenderer({ alpha: true });
            this.renderer.setSize(opt.width, opt.height);
            this.domElement.appendChild(this.renderer.domElement);

            var mat = new THREE.MeshBasicMaterial({ map: this.skinTexture });
            this.playerObject = new PlayerObject(mat, mat);
            this.scene.add(this.playerObject);

            this.skinImg.crossOrigin = "anonymous";
            this.skinImg.onload = function () {
                _this.skinCanvas.width = 64; _this.skinCanvas.height = 64;
                _this.skinCanvas.getContext("2d").drawImage(_this.skinImg, 0, 0);
                _this.skinTexture.needsUpdate = true;
            };
            if (opt.skin) this.skinImg.src = opt.skin;

            var draw = function () {
                requestAnimationFrame(draw);
                if (_this.animation) _this.animation(_this.playerObject, Date.now() / 1000);
                _this.renderer.render(_this.scene, _this.camera);
            };
            draw();
        }
        return SkinViewer;
    }());

    exports.SkinViewer = SkinViewer;
    exports.WalkingAnimation = WalkingAnimation;
})));
