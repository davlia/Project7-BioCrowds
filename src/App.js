import Stats from 'stats-js'
import DAT from 'dat-gui'
const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const OBJLoader = require('three-obj-loader')(THREE);

import Grid from './Grid.js';
import Agent from './Agent.js';

import { rotateAroundWorldAxis, v3 } from './Util.js';

window.DEBUG_MODE = 1;
window.log = console.log;

export default class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.gui = new DAT.GUI();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.stats = new Stats();
    this.size = 8;
    this.grid = new Grid(this.size, 100);
  }

  run() {
    this.controls.update();
    this.stats.begin();
    this.onUpdate();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
    requestAnimationFrame(this.run.bind(this));
  }

  setup() {
    this.cameraSetup();
    this.rendererSetup();
    this.statsSetup();
    this.lightSetup();
    this.sceneSetup();
  }

  cameraSetup() {
    this.camera.position.set(50, 100, 75);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;
    this.controls.target.set(50, 0, 50);
    this.controls.rotateSpeed = 0.3;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 2.0;
  }

  rendererSetup() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x020202, 0);
  }

  statsSetup() {
    this.stats.setMode(1);
  }

  lightSetup() {
    let dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(1, 3, 2);
    dirLight.position.multiplyScalar(10);
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.3);

    this.lights = [dirLight, ambientLight];
  }

  clearScene() {
    for(let i = this.scene.children.length - 1; i >= 0; i--) {
      let obj = this.scene.children[i];
      this.scene.remove(obj);
    }
    // this.scene.background = this.background;
  }

  sceneSetup() {
    console.log("Setting up scene...");
    // this.grid.addAgent(new Agent(v3(99, 0, 99), this.size, v3(0, 0, 0)));
    // this.grid.addAgent(new Agent(v3(0, 0, 0), this.size, v3(99, 0, 99)));
    // this.grid.addAgent(new Agent(v3(0, 0, 99), this.size, v3(99, 0, 0)));
    for (let i = 0; i < 10; i++) {
      let start = v3(99, 0, Math.random() * 99);
      let end = v3(0, 0, Math.random() * 99);
      this.grid.addAgent(new Agent(start, this.size, end));
    }
    for (let i = 0; i < 10; i++) {
      let start = v3(0, 0, Math.random() * 99);
      let end = v3(99, 0, Math.random() * 99);
      this.grid.addAgent(new Agent(start, this.size, end));
    }

    this.scene.add(...this.lights);
    this.scene.add(this.grid.genMesh());
    if (this.grid.agents.length > 0) {
      this.scene.add(...this.grid.agents.map(agent => {
        return agent.genMesh();
      }));
    }
    window.x = this.grid;
  }

  loadResources() {
    console.log("Loading Resources...");
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  onLoad() {
    document.body.appendChild(this.stats.domElement);
    document.body.appendChild(this.renderer.domElement);
    this.loadResources().then(() => {
      this.clearScene();
      this.setup();
      this.run();
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onUpdate() {
    if (window.DEBUG_MODE) {
      this.scene.remove(this.grid.markerMesh);
      this.scene.add(this.grid.genMarkerMesh());
      this.grid.resetMarkers();
      this.grid.agents.map(agent => {
        this.scene.remove(agent.markerMesh);
        this.scene.add(agent.genMarkerMesh());
      })
    }
    this.grid.assignMarkers();
    this.grid.agents.forEach(agent => {
      agent.updateVelocity();
      agent.updatePosition();
    });
  }
}
