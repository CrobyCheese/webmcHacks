// Generated by CoffeeScript 2.5.1
var World;

import * as THREE from './../build/three.module.js';

import {
  CellTerrain
} from './CellTerrain.js';

import {
  AnimatedTextureAtlas
} from './AnimatedTextureAtlas.js';

World = class World {
  constructor(options) {
    var _this;
    _this = this;
    this.cellMesh = {};
    this.cellNeedsUpdate = {};
    this.models = {};
    this.cellSize = options.cellSize;
    this.camera = options.camera;
    this.scene = options.scene;
    this.toxelSize = options.toxelSize;
    this.al = options.al;
    this.cellTerrain = new CellTerrain({
      cellSize: this.cellSize
    });
    this.ATA = new AnimatedTextureAtlas({
      al: this.al
    });
    this.material = this.ATA.material;
    this.neighbours = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
    this.chunkWorker = new Worker("/module/World/ChunkWorker.js", {
      type: 'module'
    });
    this.chunkWorker.onmessage = function(message) {
      return _this.updateCell(message.data);
    };
    this.chunkWorker.postMessage({
      type: 'init',
      data: {
        models: {
          anvil: {...this.al.get("anvil").children[0].geometry.attributes}
        },
        blocks: this.al.get("blocks"),
        blocksMapping: this.al.get("blocksMapping"),
        toxelSize: this.toxelSize,
        cellSize: this.cellSize
      }
    });
    this.sectionsWorker = new Worker("/module/World/SectionsWorker.js", {
      type: 'module'
    });
    this.sectionsWorker.onmessage = function(data) {
      var i, l, len1, result, results;
      result = data.data.result;
      results = [];
      for (l = 0, len1 = result.length; l < len1; l++) {
        i = result[l];
        if (i !== null) {
          results.push(_this.setCell(i.x, i.y, i.z, i.data));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
  }

  setCell(cellX, cellY, cellZ, buffer) {
    var l, len1, nei, neiCellId, ref, results;
    this._setCell(cellX, cellY, cellZ, buffer);
    this.cellTerrain.cells[this.cellTerrain.vec3(cellX, cellY, cellZ)] = buffer;
    this.cellNeedsUpdate[this.cellTerrain.vec3(cellX, cellY, cellZ)] = true;
    ref = this.neighbours;
    results = [];
    for (l = 0, len1 = ref.length; l < len1; l++) {
      nei = ref[l];
      neiCellId = this.cellTerrain.vec3(cellX + nei[0], cellY + nei[1], cellZ + nei[2]);
      results.push(this.cellNeedsUpdate[neiCellId] = true);
    }
    return results;
  }

  setBlock(voxelX, voxelY, voxelZ, value) {
    var cellId, l, len1, nei, neiCellId, ref;
    voxelX = parseInt(voxelX);
    voxelY = parseInt(voxelY);
    voxelZ = parseInt(voxelZ);
    if ((this.cellTerrain.getVoxel(voxelX, voxelY, voxelZ)) !== value) {
      this._setVoxel(voxelX, voxelY, voxelZ, value);
      this.cellTerrain.setVoxel(voxelX, voxelY, voxelZ, value);
      cellId = this.cellTerrain.vec3(...this.cellTerrain.computeCellForVoxel(voxelX, voxelY, voxelZ));
      this.cellNeedsUpdate[cellId] = true;
      ref = this.neighbours;
      for (l = 0, len1 = ref.length; l < len1; l++) {
        nei = ref[l];
        neiCellId = this.cellTerrain.vec3(...this.cellTerrain.computeCellForVoxel(voxelX + nei[0], voxelY + nei[1], voxelZ + nei[2]));
        this.cellNeedsUpdate[neiCellId] = true;
      }
    }
  }

  getBlock(voxelX, voxelY, voxelZ) {
    return this.cellTerrain.getVoxel(voxelX, voxelY, voxelZ);
  }

  updateCellsAroundPlayer(pos, radius) {
    var cell, i, j, k, l, pcell, ref, ref1, ref2, results, v;
    ref = this.cellMesh;
    for (k in ref) {
      v = ref[k];
      v.visible = false;
    }
    cell = this.cellTerrain.computeCellForVoxel(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
    results = [];
    for (i = l = ref1 = -radius, ref2 = radius; (ref1 <= ref2 ? l <= ref2 : l >= ref2); i = ref1 <= ref2 ? ++l : --l) {
      results.push((function() {
        var m, ref3, ref4, results1;
        results1 = [];
        for (j = m = ref3 = -radius, ref4 = radius; (ref3 <= ref4 ? m <= ref4 : m >= ref4); j = ref3 <= ref4 ? ++m : --m) {
          results1.push((function() {
            var n, ref5, ref6, results2;
            results2 = [];
            for (k = n = ref5 = -radius, ref6 = radius; (ref5 <= ref6 ? n <= ref6 : n >= ref6); k = ref5 <= ref6 ? ++n : --n) {
              pcell = [cell[0] + i, cell[1] + j, cell[2] + k];
              if (this.cellMesh[this.cellTerrain.vec3(...pcell)]) {
                this.cellMesh[this.cellTerrain.vec3(...pcell)].visible = true;
              }
              if (this.cellNeedsUpdate[this.cellTerrain.vec3(...pcell)]) {
                this._genCellGeo(...pcell);
                results2.push(delete this.cellNeedsUpdate[this.cellTerrain.vec3(...pcell)]);
              } else {
                results2.push(void 0);
              }
            }
            return results2;
          }).call(this));
        }
        return results1;
      }).call(this));
    }
    return results;
  }

  updateCell(data) {
    var cell, cellId, geometry, mesh;
    cellId = this.cellTerrain.vec3(...data.info);
    cell = data.cell;
    mesh = this.cellMesh[cellId];
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cell.positions), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(cell.normals), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(cell.uvs), 2));
    if (mesh === void 0) {
      this.cellMesh[cellId] = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.cellMesh[cellId]);
    } else {
      this.cellMesh[cellId].geometry = geometry;
    }
  }

  intersectsRay(start, end) {
    var dx, dy, dz, ix, iy, iz, len, lenSq, stepX, stepY, stepZ, steppedIndex, t, txDelta, txMax, tyDelta, tyMax, tzDelta, tzMax, voxel, xDist, yDist, zDist;
    start.x += 0.5;
    start.y += 0.5;
    start.z += 0.5;
    end.x += 0.5;
    end.y += 0.5;
    end.z += 0.5;
    dx = end.x - start.x;
    dy = end.y - start.y;
    dz = end.z - start.z;
    lenSq = dx * dx + dy * dy + dz * dz;
    len = Math.sqrt(lenSq);
    dx /= len;
    dy /= len;
    dz /= len;
    t = 0.0;
    ix = Math.floor(start.x);
    iy = Math.floor(start.y);
    iz = Math.floor(start.z);
    stepX = dx > 0 ? 1 : -1;
    stepY = dy > 0 ? 1 : -1;
    stepZ = dz > 0 ? 1 : -1;
    txDelta = Math.abs(1 / dx);
    tyDelta = Math.abs(1 / dy);
    tzDelta = Math.abs(1 / dz);
    xDist = stepX > 0 ? ix + 1 - start.x : start.x - ix;
    yDist = stepY > 0 ? iy + 1 - start.y : start.y - iy;
    zDist = stepZ > 0 ? iz + 1 - start.z : start.z - iz;
    txMax = txDelta < 2e308 ? txDelta * xDist : 2e308;
    tyMax = tyDelta < 2e308 ? tyDelta * yDist : 2e308;
    tzMax = tzDelta < 2e308 ? tzDelta * zDist : 2e308;
    steppedIndex = -1;
    while (t <= len) {
      voxel = this.getBlock(ix, iy, iz);
      if (voxel) {
        return {
          position: [start.x + t * dx, start.y + t * dy, start.z + t * dz],
          normal: [steppedIndex === 0 ? -stepX : 0, steppedIndex === 1 ? -stepY : 0, steppedIndex === 2 ? -stepZ : 0],
          voxel
        };
      }
      if (txMax < tyMax) {
        if (txMax < tzMax) {
          ix += stepX;
          t = txMax;
          txMax += txDelta;
          steppedIndex = 0;
        } else {
          iz += stepZ;
          t = tzMax;
          tzMax += tzDelta;
          steppedIndex = 2;
        }
      } else {
        if (tyMax < tzMax) {
          iy += stepY;
          t = tyMax;
          tyMax += tyDelta;
          steppedIndex = 1;
        } else {
          iz += stepZ;
          t = tzMax;
          tzMax += tzDelta;
          steppedIndex = 2;
        }
      }
    }
    return null;
  }

  getRayBlock() {
    var end, intersection, posBreak, posPlace, start;
    start = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld);
    end = new THREE.Vector3().set(0, 0, 1).unproject(this.camera);
    intersection = this.intersectsRay(start, end);
    if (intersection) {
      posPlace = intersection.position.map(function(v, ndx) {
        return v + intersection.normal[ndx] * 0.5;
      });
      posBreak = intersection.position.map(function(v, ndx) {
        return v + intersection.normal[ndx] * -0.5;
      });
      return {posPlace, posBreak};
    } else {
      return false;
    }
  }

  _setCell(cellX, cellY, cellZ, buffer) {
    return this.chunkWorker.postMessage({
      type: "setCell",
      data: [cellX, cellY, cellZ, buffer]
    });
  }

  _setVoxel(voxelX, voxelY, voxelZ, value) {
    return this.chunkWorker.postMessage({
      type: "setVoxel",
      data: [voxelX, voxelY, voxelZ, value]
    });
  }

  _genCellGeo(cellX, cellY, cellZ) {
    cellX = parseInt(cellX);
    cellY = parseInt(cellY);
    cellZ = parseInt(cellZ);
    return this.chunkWorker.postMessage({
      type: "genCellGeo",
      data: [cellX, cellY, cellZ]
    });
  }

  _computeSections(sections, x, z) {
    return this.sectionsWorker.postMessage({
      type: "computeSections",
      data: {sections, x, z}
    });
  }

};

export {
  World
};
