import { Engine3D, Scene3D, Camera3D, View3D, Object3D, Color, DirectLight, AtmosphericComponent, SkyRenderer, Vector3, AxisObject } from '@orillusion/core'
import { Physics } from '@orillusion/physics'
import { Stats } from "@orillusion/stats"
import { HoverCameraController } from '@/components/cameraController'
import { InteractRay } from '@/components/ammoRay/InteractRay';
import { TerrainComponent, TreesComponent, Grass, BoxGenerator } from '@/components/sceneManage';
import { VehicleComponent, VehicleType } from '@/components/vehicleManage';
import { FrameTaskQueue } from '@/components/systems/FrameTaskQueue';
import { PostProcessingSetup } from '@/effects/Postprocessing';

import { GUIHelp } from "@/utils/debug/GUIHelp";
import { GUIUtil } from '@/utils/GUIUtil'

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


        Engine3D.frameRate = 60

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
        let skyTexture = await Engine3D.res.loadLDRTextureCube('sky/kloppenheim_07_puresky-min.jpg');
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
        cameraCtrl.setCamera(160, -15, 10)
        cameraCtrl.smooth = false
        cameraCtrl.maxDistance = 1000
        cameraCtrl.rollSmooth = 8
        scene.addChild(cameraObj)

        let light = new Object3D()
        // light.rotationX = 145
        // light.rotationY = 10
        light.rotationX = 50
        light.rotationY = 50
        let directLight = light.addComponent(DirectLight)
        directLight.lightColor = new Color(1.0, 1.0, 1.0, 1.0)
        directLight.intensity = 49
        directLight.castShadow = true
        scene.addChild(light)

        let view = new View3D()
        view.scene = scene
        view.camera = mainCamera


        GUIHelp.init();
        GUIHelp.addButton('Reload', () => location.reload())
        GUIHelp.add({ 'Tips': 'Look at the console' }, 'Tips');
        this.initGameComponents(scene, cameraCtrl)


        // start render
        Engine3D.startRenderView(view)

        scene.addComponent(PostProcessingSetup);

        GUIUtil.renderDebug(false);

        GUIUtil.renderDirLight(directLight, false);

        GUIUtil.renderShadowSetting(false);

    }

    initGameComponents(scene: Scene3D, cameraCtrl: HoverCameraController) {

        let axis = new AxisObject(250, 0.8);
        scene.addChild(axis);

        scene.addComponent(FrameTaskQueue);

        scene.addComponent(TerrainComponent);

        scene.addComponent(TreesComponent);

        scene.addComponent(Grass);

        // scene.addComponent(BoxGenerator)

        cameraCtrl.object3D.addComponent(InteractRay);


        const onTerrainReady = () => {
            let vehicle = scene.addComponent(VehicleComponent);
            vehicle.vehicleType = VehicleType.Pickup;
            vehicle.addInitedFunction((vehicle: Object3D) => {
                cameraCtrl.flowTarget(vehicle, new Vector3(0, 2, 0));
            }, this);
        }

        Engine3D.inputSystem.addEventListener("TerrainInited", onTerrainReady, this);

        if (import.meta.env.PROD) {
            this.printing()
        }
    }


    private printing() {
        console.log(`%c半颗牙齿晒太阳 `, "color: #43bb88;font-size: 40px;font-weight: bold;margin:10px")
        console.log(`%c🔗GitHub: https://github.com/ID-Emmett/offroad3d`, "color:#409eff;font-weight:bolder;font-size:15px;margin:10px 0;")
        console.log(
            "%c📚使用手册 Manual\n" +

            "%c🖱️双击: %c隐藏光标,全屏控制\n" +
            "%c🖱️右键: %c释放鼠标光标或生成盒子\n" +
            "%c🖱️左键: %c按住车辆或树木，可以移动拖放\n\n" +

            "%c⌨️WASD: %c载具移动\n" +
            "%c⌨️K: %coff/on 相机避障系统\n" +
            "%c⌨️O: %coff/on 相机自动回正模式\n" +
            "%c⌨️L: %coff/on 相机固定跟随模式\n" +
            "%c⌨️M: %coff/on 相机固定位置\n" +
            "%c⌨️H: %coff/on 显示或隐藏调试器\n" +
            "%c⌨️B: %c长按 相机拍摄目标前方\n" +
            "%c⌨️P: %c重置车辆方向与高度，xz位置不变\n" +
            "%c⌨️U: %c开启170FPS或60FPS，如果渲染帧率不匹配会直接影响到物理步进模拟速率\n" +
            "%c⌨️7: %c+fov 视野缩放\n" +
            "%c⌨️8: %c-fov 视野缩放\n",

            "color: #ed4014;margin:10px 0 15px 0;font-size:20px;font-weight: bold;",

            "color: #19be6b;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2d8cf0;font-weight: bold;font-size:14px", // 鼠标左键双击视图
            "color: #19be6b;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2d8cf0;font-weight: bold;font-size:14px", // 鼠标右键
            "color: #19be6b;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2d8cf0;font-size:14px", // 鼠标左键

            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-weight: bold;font-size:15px;", // WASD
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // K
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // O
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // L
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // M
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // H
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // B
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // P
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #ed4014;font-weight: bold;font-size:15px;", // U
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;", // 7
            "color: #e96900;font-size:15px;margin-bottom:5px;font-weight: bold;", "color: #2b85e4;font-size:15px;"  // 8
        );

    }


    loop() {
        // Physics.update()
        let timeStep = 1 / (Engine3D.frameRate / 2.5);
        Physics.world.stepSimulation(timeStep, 1, timeStep);
    }
}



new Sample_game().run()
