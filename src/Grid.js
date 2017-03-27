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
    // this.grid = new Array(this.resolution).fill(new Array(this.resolution).fill([]));
    this.agents = [];
    this.markers = [];
    this.numMarkers = NUM_MARKERS;
    this.scatter2();
  }

  scatter1() {
    for (let i = 0; i < this.numMarkers; i++) {
      let x = Math.floor(Math.random() * this.resolution);
      let y = Math.floor(Math.random() * this.resolution);
      let dx = Math.random() * this.agentSize;
      let dy = Math.random() * this.agentSize;
      let px = x * this.agentSize + dx;
      let py = y * this.agentSize + dy;
      let marker = new Marker(px, py);
      this.markers.push(marker)
      // this.grid[x][y].push(marker);
    }
  }

  scatter2() {
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
    agent.gx = Math.floor(agent.pos.x / this.agentSize);
    agent.gy = Math.floor(agent.pos.z / this.agentSize);
    this.grid[agent.gx][agent.gy].push(agent);
    // console.log(this.grid[agent.gx + 1]);
  }

  assignMarkers() {
    let markers = [];
    // precomputation
    this.agents.forEach(agent => {
      agent.markers = [];
      this.grid[agent.gx][agent.gy] = [];
      agent.gx = Math.floor(agent.pos.x / this.agentSize);
      agent.gy = Math.floor(agent.pos.z / this.agentSize);
      this.grid[agent.gx][agent.gy].push(agent);
    })
    // this.agents.forEach(agent => {
    //   let { pos, size } = agent;
    //   markers.push(...this.slowQueryCells(pos));
    // });
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

  assignMarkers2() {
    let markers = [];
    // precomputation
    this.agents.forEach(agent => {
      agent.markers = [];
      this.grid[agent.gx][agent.gy] = [];
      agent.gx = Math.floor(agent.pos.x / this.agentSize);
      agent.gy = Math.floor(agent.pos.z / this.agentSize);
      this.grid[agent.gx][agent.gy].push(agent);
    });
    this.markers.forEach(marker => {
      let { v } = marker;
      let x = marker.x / this.agentSize;
      let y = marker.y / this.agentSize;
      let ix = Math.floor(x);
      let iy = Math.floor(y);
      let agents = [];
      let qx = x - ix;
      let qy = y - iy;
      agents.push(...this.cell(ix, iy));
      if (qx < 0.5 * this.agentSize) {
        agents.push(...this.cell(ix - 1, iy));
        if (qy < 0.5 * this.agentSize) {
          agents.push(...this.cell(ix, iy - 1));
          agents.push(...this.cell(ix - 1, iy - 1));
        } else {
          agents.push(...this.cell(ix, iy + 1));
          agents.push(...this.cell(ix - 1, iy + 1));
        }
      } else {
        agents.push(...this.cell(ix + 1, iy));
        if (qy < 0.5 * this.agentSize) {
          agents.push(...this.cell(ix, iy - 1));
          agents.push(...this.cell(ix + 1, iy - 1));
        } else {
          agents.push(...this.cell(ix, iy + 1));
          agents.push(...this.cell(ix + 1, iy + 1));
        }
      }
      if (agents.length === 0) {
        return;
      }

      let closestAgent = min(agents, agent => {
        return agent.pos.distanceToSquared(v);
      });
      if (closestAgent.pos.distanceToSquared(v) < this.agentSizeSq) {
        closestAgent.markers.push(marker);
        marker.takenBy = closestAgent;
      }
    });
  }

  cell(x, y) {
    if (this.grid[x]) {
      let c = this.grid[x][y];
      if (c && c.length > 0) {
        return c;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  slowQueryCells(pos) {
    return this.markers.filter(marker => {
      return marker.v.distanceToSquared(pos) < this.agentSizeSq;
    });
  }

  // Given a position and radius, return a list of all markers within that radius
  queryCells(pos) {
    let x = pos.x / this.agentSize;
    let y = pos.y / this.agentSize;
    let ix = Math.floor(x);
    let iy = Math.floor(y);
    let markers = [];
    let qx = x - ix;
    let qy = y - iy;
    let q = 0;
    if (qx > 0.5) {
      q |= 1;
      markers.concat(this.grid[ix + 1][iy]);
    } else {
      markers.concat(this.grid[ix - 1][iy]);
    }
    if (qy > 0.5) {
      q |= 2;
      markers.concat(this.grid[ix][iy + 1]);
    } else {
      markers.concat(this.grid[ix][iy - 1]);
    }
    markers.concat(this.grid[ix][iy]);
    if (q === 0) { // top left 00
      markers.concat(this.grid[ix - 1][iy - 1]);
    } else if (q === 1) { // top right 01
      markers.concat(this.grid[ix + 1][iy - 1]);
    } else if (q === 2) { // bottom left 10
      markers.concat(this.grid[ix - 1][iy + 1]);
    } else { // bottom right 11
      markers.concat(this.grid[ix + 1][iy + 1]);
    }
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
