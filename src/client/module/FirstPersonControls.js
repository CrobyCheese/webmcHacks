// Generated by CoffeeScript 2.5.1
var FirstPersonControls;

import * as THREE from './build/three.module.js';

FirstPersonControls = class FirstPersonControls {
  constructor(options) {
    this.kc = {
      87: "forward",
      65: "right",
      83: "back",
      68: "left",
      32: "jump",
      16: "sneak",
      82: "sprint"
    };
    this.keys = {};
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.socket = options.socket;
    this.gameState = "menu";
    this.listen();
  }

  updatePosition(e) {
    if (this.gameState === "game") {
      this.camera.rotation.x -= THREE.MathUtils.degToRad(e.movementY / 10);
      this.camera.rotation.y -= THREE.MathUtils.degToRad(e.movementX / 10);
      if (THREE.MathUtils.radToDeg(this.camera.rotation.x) < -90) {
        this.camera.rotation.x = THREE.MathUtils.degToRad(-90);
      }
      if (THREE.MathUtils.radToDeg(this.camera.rotation.x) > 90) {
        this.camera.rotation.x = THREE.MathUtils.degToRad(90);
      }
      this.socket.emit("rotate", [this.camera.rotation.y, this.camera.rotation.x]);
    }
  }

  listen() {
    var _this, lockChangeAlert;
    _this = this;
    $(window).keydown(function(z) {
      _this.keys[z.keyCode] = true;
      //If click escape
      if (z.keyCode === 27) {
        if (_this.gameState === "menu") {
          _this.canvas.requestPointerLock();
        } else {
          document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
          document.exitPointerLock();
        }
      }
      if (_this.kc[z.keyCode] !== void 0) {
        _this.socket.emit("move", _this.kc[z.keyCode], true);
      }
    });
    $(document).keyup(function(z) {
      if (_this.kc[z.keyCode] !== void 0) {
        _this.socket.emit("move", _this.kc[z.keyCode], false);
      }
      delete _this.keys[z.keyCode];
    });
    $(".gameOn").click(function() {
      _this.canvas.requestPointerLock();
    });
    lockChangeAlert = function() {
      if (document.pointerLockElement === _this.canvas || document.mozPointerLockElement === _this.canvas) {
        _this.gameState = "game";
        $(".gameMenu").css("display", "none");
      } else {
        _this.gameState = "menu";
        $(".gameMenu").css("display", "block");
      }
    };
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    document.addEventListener("mousemove", function(e) {
      return _this.updatePosition(e);
    }, false);
    return this;
  }

};

export {
  FirstPersonControls
};
