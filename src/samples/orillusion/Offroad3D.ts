import { Engine3D, Camera3D, Color, DirectLight, AtmosphericComponent, View3D, Object3D, Scene3D, Vector3, AxisObject, SkyRenderer } from '@orillusion/core'
import { Physics } from '@orillusion/physics'
import { Stats } from "@orillusion/stats"
import { HoverCameraController } from '@/components/cameraController'
import { InteractRay } from '@/components/ammoRay/InteractRay';
import { TerrainComponent, TreesComponent, Grass, BoxGenerator } from '@/components/sceneManage';
import { VehicleComponent, VehicleType } from '@/components/vehicleManage';
import dat from 'dat.gui'

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
    cameraCtrl.setCamera(160, -15, 800)
    cameraCtrl.smooth = false
    cameraCtrl.maxDistance = 1000
    cameraCtrl.rollSmooth = 8
    scene.addChild(cameraObj)

    let light = new Object3D()
    let directLight = light.addComponent(DirectLight)
    // light.rotationX = 145
    // light.rotationY = 10
    light.rotationX = 50
    light.rotationY = 50
    directLight.lightColor = new Color(1.0, 1.0, 1.0, 1.0)
    directLight.intensity = 49
    directLight.castShadow = true
    scene.addChild(light)

    // let name = 'DirectLight';
    // let GUIHelp = new dat.GUI()
    // GUIHelp.addFolder(name);
    // GUIHelp.add(light, 'enable');
    // GUIHelp.add(light.transform, 'rotationX', 0.0, 360.0, 0.01);
    // GUIHelp.add(light.transform, 'rotationY', 0.0, 360.0, 0.01);
    // GUIHelp.add(light.transform, 'rotationZ', 0.0, 360.0, 0.01);
    // GUIHelp.addColor(light, 'lightColor');
    // GUIHelp.add(light, 'intensity', 0.0, 300.0, 0.01);
    // GUIHelp.add(light, 'indirect', 0.0, 1.0, 0.01);
    // GUIHelp.add(light, 'castShadow');
    
    let view = new View3D()
    view.scene = scene
    view.camera = mainCamera

    this.initGameComponents(scene, cameraCtrl)

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

  initGameComponents(scene: Scene3D, cameraCtrl: HoverCameraController) {

    let axis = new AxisObject(250, 0.8)
    scene.addChild(axis)

    scene.addComponent(TerrainComponent)
    scene.addComponent(TreesComponent)
    scene.addComponent(Grass)
    // scene.addComponent(BoxGenerator)

    cameraCtrl.object3D.addComponent(InteractRay)

    let vehicle = scene.addComponent(VehicleComponent);
    vehicle.vehicleType = VehicleType.Pickup;
    vehicle.addInitedFunction((vehicle: Object3D) => {
      cameraCtrl.flowTarget(vehicle, new Vector3(0, 2, 0))
    }, this)

  }

  loop() {
    // Physics.update()
    let timeStep = 1 / (Engine3D.frameRate / 2.5)
    Physics.world.stepSimulation(timeStep, 1, timeStep);
  }
}



new Sample_game().run()
