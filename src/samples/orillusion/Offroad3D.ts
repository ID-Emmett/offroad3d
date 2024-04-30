import { Engine3D, BoxColliderShape, BoxGeometry, Camera3D, ColliderComponent, Color, ComponentBase, DirectLight, AtmosphericComponent, View3D, LitMaterial, MeshRenderer, Object3D, Scene3D, Vector3, SphereGeometry, AxisObject, SkyRenderer } from '@orillusion/core'
import { Physics } from '@orillusion/physics'
import { Stats } from "@orillusion/stats"
import { HoverCameraController } from '@/components/cameraController'
import { InteractRay } from '@/components/ammoRay/InteractRay';
import { TerrainComponent, TreesComponent } from '@/components/sceneManage';
import { VehicleComponent, VehicleType } from '@/components/vehicleManage';
import { AmmoRigidBody, ShapeTypes } from "@/physics";

// import { SimpleDebugDrawer } from '@/physics/DebugDrawer'

/**
 * 什么游戏
 * @export
 * @class 
 */
class Sample_game {

  async run() {
    Engine3D.setting.shadow.shadowSize = 1024 * 4;
    Engine3D.setting.shadow.csmMargin = 0.1 // 设置不同级别阴影的过渡范围，在0-1区间调节
    Engine3D.setting.shadow.csmScatteringExp = 0.9 // 微调各个级别阴影的范围，以满足不同的场景需求
    Engine3D.setting.shadow.csmAreaScale = 0.2 // 微调阴影能够覆盖的最大范围，在0.0-1区间调节
    Engine3D.setting.shadow.updateFrameRate = 1 // 阴影更新

    // Engine3D.setting.shadow.type = 'PCF'; // 默认 PCF HARD SOFT

    Engine3D.frameRate = 170

    // Init physics engine
    await Physics.init()

    // Init Engine3D
    await Engine3D.init({
      canvasConfig: { devicePixelRatio: 1 },
      renderLoop: () => this.loop()
    })

    let scene = new Scene3D()
    scene.addComponent(Stats)

    /* 大气天空盒 */
    // let sky = view.scene.addComponent(AtmosphericComponent)
    // sky.sunY = 0.65

    /* 全景天空盒默认 */
    // let sky = scene3D.getOrAddComponent(SkyRenderer)
    // sky.map = await Engine3D.res.loadHDRTextureCube('https://cdn.orillusion.com//hdri/sunset.hdr')
    // scene3D.envMap = sky.map

    /* 全景天空盒2 */
    let skyTexture = await Engine3D.res.loadLDRTextureCube('src/assets/images/sky/kloppenheim_07_puresky.jpg');
    let sky = scene.addComponent(SkyRenderer);
    sky.map = skyTexture;
    // sky.exposure = 0.6
    scene.envMap = skyTexture;


    let cameraObj = new Object3D()
    let mainCamera = cameraObj.addComponent(Camera3D)
    // mainCamera.object3D.transform.localScale = new Vector3(0.5,0.1,0.5)
    // mainCamera.lookAt(new Vector3(0, 0, 10), new Vector3(0, 0, 0))
    mainCamera.perspective(45, Engine3D.aspect, 0.1, 2000.0)
    mainCamera.enableCSM = true;
    let cameraCtrl = mainCamera.object3D.addComponent(HoverCameraController)

    // cameraCtrl.distance = 50 // 500
    cameraCtrl.smooth = false
    // cameraCtrl.dragSmooth = 0.8
    // cameraCtrl.wheelSmooth = 0.8
    cameraCtrl.maxDistance = 1000
    cameraCtrl.roll = 160
    cameraCtrl.pitch = -15

    cameraCtrl.rollSmooth = 8
    // cameraCtrl.smooth = false
    // cameraCtrl.dragSmooth = 18

    scene.addChild(cameraObj)

    let light = new Object3D()
    let component = light.addComponent(DirectLight)
    light.rotationX = 145
    light.rotationY = 10
    component.lightColor = new Color(1.0, 1.0, 1.0, 1.0)
    component.intensity = 60
    component.castShadow = true
    scene.addChild(light)

    // scene3D.addComponent(BoxGenerator)

    let axis = new AxisObject(250, 0.8)
    scene.addChild(axis)

    let view = new View3D()
    view.scene = scene
    view.camera = mainCamera

    this.initGameComponents(scene, cameraObj, cameraCtrl)

    // start render
    Engine3D.startRenderView(view)

    // !----------------------------------------------------------


    // !----------------------------------------------------------

    // scene.addComponent(CreateGrass)
    // scene.addComponent(Create_SceneModels)


    // let post = scene.addComponent(PostProcessingComponent)
    // let fog = post.addPost(GlobalFog)
    // fog.start = 200
    // fog.end = 0
    // fog.fogHeightScale = 0.116
    // fog.density = 0.094
    // fog.ins = 0.1041
    // fog.skyFactor = 0.35
    // fog.overrideSkyFactor = 0.7

    // fog.fogColor = new Color(136 / 255, 215 / 255, 236 / 255, 1)
    // fog.fogHeightScale = 0.1
    // fog.falloff = 0.626
    // fog.scatteringExponent = 8
    // fog.dirHeightLine = 6.5

  }

  initGameComponents(scene: Scene3D, cameraObj: Object3D, cameraCtrl: HoverCameraController) {
    scene.addComponent(TerrainComponent)
    scene.addComponent(TreesComponent)

    cameraObj.addComponent(InteractRay)

    let carComponent = scene.addComponent(VehicleComponent);
    carComponent.vehicleType = VehicleType.Pickup;
    carComponent.addInitedFunction((vehicle: Object3D) => {
      cameraCtrl.flowTarget(vehicle, new Vector3(0, 2, 0))
    }, this)

    // setTimeout(() => {
    //   console.log('定时器5s');

    //   carComponent.position = cameraCtrl.target.clone();
    //   carComponent.vehicleType = VehicleType.FireTruck;

    //   // setTimeout(() => {
    //   //   console.log('定时器 2  5s');

    //   //   carComponent.position = cameraCtrl.target.clone();
    //   //   carComponent.vehicleType = VehicleType.Truck;

    //   // }, 5000);
    // }, 5000);
  }

  loop() {
    // Physics.update()
    let timeStep = 1 / (Engine3D.frameRate / 2.5)
    Physics.world.stepSimulation(timeStep, 1, timeStep);
  }
}

class BoxGenerator extends ComponentBase {
  // save last time
  private _lastTime: number = performance.now()

  // a simple loop update
  public onUpdate(): void {
    // get current time
    let now: number = performance.now()
    // add a box every 300ms
    if (now - this._lastTime > 3000) {
      // add a box
      this._addBox()
      // remove the first box after 500 boxes
      // if (this.object3D.entityChildren.length > 50) this.object3D.removeChildByIndex(4)
      // save current time
      this._lastTime = now
    }
  }

  // add a box
  private _addBox(): void {
    const obj = new Object3D()
    let mr = obj.addComponent(MeshRenderer)
    // mr.geometry = new BoxGeometry(5, 5, 5)
    mr.geometry = new SphereGeometry(5, 16, 16)
    let mat = new LitMaterial()
    mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
    mr.material = mat;
    obj.localPosition = new Vector3(Math.random() * 700 - 350, 250, Math.random() * 700 - 350)
    obj.localRotation = new Vector3(Math.random() * 360, Math.random() * 360, Math.random() * 360)
    // add a rigidbody with mass 10
    let rigidbody = obj.addComponent(AmmoRigidBody)
    rigidbody.mass = 1
    rigidbody.shape = ShapeTypes.btSphereShape
    rigidbody.radius = 5


    this.object3D.addChild(obj)
  }
}

new Sample_game().run()
