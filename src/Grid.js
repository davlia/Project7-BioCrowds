import Agent from './Agent.js'
import { rotateWorldSpace, translateWorldSpace, min, v3 } from './Util.js';
const THREE = require('three');

const NUM_MARKERS = 10000;

class Marker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.takenBy = undefined;
    this.v = v3(x, 0, y);
  }
}

export default class Grid {
  constructor(agentSize, gridSize) {
    this.agentSize = agentSize;
    this.agentSizeSq = agentSize * agentSize;
    this.gridSize = gridSize;
    this.resolution = gridSize / agentSize;
    this.resolutionSq = this.resolution * this.resolution;
    // resolution has to be an integer :\
    this.grid = new Array(this.resolution);
    for (let i = 0; i < this.resolution; i++) {
      this.grid[i] = new Array(this.resolution);
      for (let j = 0; j < this.resolution; j++) {
        this.grid[i][j] = [];
      }
    }
    this.agents = [];
    this.markers = [];
    this.numMarkers = NUM_MARKERS;
    this.scatter();
  }

  scatter() {
    let markersPerCell = Math.floor(this.numMarkers / this.resolutionSq);
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        for (let k = 0; k < markersPerCell; k++) {
          let px = i * this.agentSize + Math.random() * this.agentSize;
          let py = j * this.agentSize + Math.random() * this.agentSize;
          let marker = new Marker(px, py);
          this.markers.push(marker)
        }
      }
    }
  }

  addAgent(agent) {
    this.agents.push(agent);
  }

  assignMarkers() {
    let markers = [];
    // precomputation
    this.agents.forEach(agent => {
      agent.markers = [];
    })
    this.markers.forEach(marker => {
      let { v } = marker;
      let closestAgent = min(this.agents, agent => {
        return agent.pos.distanceToSquared(v);
      });
      if (closestAgent.pos.distanceToSquared(v) < this.agentSizeSq) {
        closestAgent.markers.push(marker);
        marker.takenBy = closestAgent;
      }
    })
  }

  genMesh() {
    let geo = new THREE.PlaneGeometry(this.gridSize, this.gridSize, this.resolution);
    let mat = new THREE.MeshLambertMaterial({side: THREE.DoubleSide});
    let mesh = new THREE.Mesh(geo, mat);
    rotateWorldSpace(mesh, v3(90, 0, 0))
    translateWorldSpace(mesh, v3(50, 0, 50));
    return mesh;
  }

  genMarkerMesh() {
    let geo = new THREE.Geometry();
    let mat = new THREE.PointsMaterial({ color: 'black', size: 0.75});
    let mesh = new THREE.Points(geo, mat);
    this.markerMesh = mesh;
    this.markers.forEach(marker => {
      if (!marker.takenBy) {
        geo.vertices.push(marker.v);
      }
    });
    return mesh;
  }

  resetMarkers() {
    this.markers.forEach(marker => {
      marker.takenBy = undefined;
    });
  }
}
