import { View3D, PlaneGeometry, Engine3D, Scene3D, CameraUtil, HoverCameraController, Object3D, DirectLight, KelvinUtil, MeshRenderer, LitMaterial, VertexAttributeName, Time, Vector3, SkyRenderer } from '@orillusion/core'
import * as dat from 'dat.gui';

class Sample_FlagVertexAnimation {
  private flagGeometry: PlaneGeometry
  async run() {
    Engine3D.frameRate = 60
    await Engine3D.init({ beforeRender: () => this.update() })

    let view = new View3D();
    let scene = new Scene3D();

    let sky = scene.getOrAddComponent(SkyRenderer);
    sky.map = await Engine3D.res.loadTextureCubeStd('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/StandardCubeMap-2.png');

    view.scene = scene;
    view.scene.envMap = sky.map;

    view.camera = CameraUtil.createCamera3DObject(scene, 'camera');
    view.camera.perspective(60, Engine3D.aspect, 0.1, 2000);
    view.camera.object3D.addComponent(HoverCameraController).setCamera(10, -50, 300);

    Engine3D.startRenderView(view);

    await this.createScene(scene);
  }

  private async createScene(scene: Scene3D) {

    // add lights
    let lightObj3D = new Object3D();
    lightObj3D.localRotation = new Vector3(21, 108, 10)
    let directLight = lightObj3D.addComponent(DirectLight);
    directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
    directLight.castShadow = false;
    directLight.intensity = 10;
    scene.addChild(lightObj3D);

    // create flag material
    let texture = await Engine3D.res.loadTexture('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/american_flag.png');
    // let texture = await Engine3D.res.loadTexture('/samples/animation/Flag_baseColor.png');
    let normalMapTexture = await Engine3D.res.loadTexture('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/sandstone_cracks_nor_gl_1k.png');
    let mat = new LitMaterial();
    mat.cullMode = 'none';
    mat.baseMap = texture;
    mat.normalMap = normalMapTexture;
    mat.metallic = 10;
    mat.roughness = 2;

    // create flag
    this.flagGeometry = new PlaneGeometry(300, 200, 19, 19); // flag ratio 3*2
    let flag = new Object3D();
    let mr = flag.addComponent(MeshRenderer);
    mr.geometry = this.flagGeometry;
    mr.material = mat;
    scene.addChild(flag);

    // debug gui
    let gui = new dat.GUI();
    let f = gui.addFolder('FlagAnimation');
    f.add(mat, 'metallic', -10, 10, 0.1);
    f.add(mat, 'roughness', -10, 10, 0.1);
    f.open();
  }

  private update() {
    if (this.flagGeometry) {
      let posAttrData = this.flagGeometry.getAttribute(VertexAttributeName.position);
      for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
        posAttrData.data[i * 3 + 1] = this.wave(i);
      }
      this.flagGeometry.vertexBuffer.upload(VertexAttributeName.position, posAttrData);
      this.flagGeometry.computeNormals();
    }
  }

  readonly height = 20; // segmentW + 1
  readonly width = 20; // segmentH + 1

  private wave(i: number) {
    let x = Math.floor(i / this.width);
    let z = i % this.height;
    let windNoise = this.noise(x + Time.time * 0.006, z + Time.time * 0.01);
    return Math.sin((z + Time.time * 0.01) / 2) * 6 * Math.cos((x + Time.time * 0.01) / 4 + windNoise);
  }

  protected noise(x: number, z: number) {
    return (Math.sin(x * 1.2) + Math.sin(z * 0.8)) * 0.5;
  }

}


new Sample_FlagVertexAnimation().run();
