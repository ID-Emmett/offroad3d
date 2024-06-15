import { Engine3D, Scene3D, Camera3D, View3D, Object3D, Color, DirectLight, AtmosphericComponent, SkyRenderer, Vector3, AxisObject, Time, clamp, Matrix4 } from '@orillusion/core'
import { Stats } from "@orillusion/stats"
import { CustomCameraController } from '@/components/cameraController'
import { InteractRay } from '@/components/ammoRay/InteractRay';
import { TerrainComponent, TreesComponent, Grass, BoxGenerator, MainModelComponent, TestComponent } from '@/components/sceneManage';
import { VehicleComponent, VehicleType } from '@/components/vehicleManage';
import { FrameTaskQueue } from '@/components/systems/FrameTaskQueue';
import { PostProcessingSetup } from '@/effects/Postprocessing';

import { GUIHelp } from "@/utils/debug/GUIHelp";
import { GUIUtil } from '@/utils/GUIUtil'

import { Physics } from '@/physics';
import { Elevator, SlidingPlatform } from '@/components/facilities'
/**
 * @export
 * @class 
 */
class Offroad3D {

    async run() {
        Engine3D.setting.shadow.shadowSize = 1024 * 4;
        Engine3D.setting.shadow.csmMargin = 0.1 // 设置不同级别阴影的过渡范围，在0-1区间调节
        Engine3D.setting.shadow.csmScatteringExp = 0.9 // 微调各个级别阴影的范围，以满足不同的场景需求
        Engine3D.setting.shadow.csmAreaScale = 0.2 // 微调阴影能够覆盖的最大范围，在0.0-1区间调节
        Engine3D.setting.shadow.updateFrameRate = 1 // 阴影更新
        // Engine3D.setting.shadow.type = 'PCF'; // PCF HARD SOFT

        // debug GUI
        GUIHelp.init();
        GUIHelp.addButton('Reload', () => location.reload());
        GUIHelp.add({ 'Tips': 'Look at the console' }, 'Tips');
        GUIHelp.add(Engine3D, 'frameRate', 10, 170, 10).listen();

        // Init physics engine
        await Physics.init({
            useSoftBody: true, // 使用软体
            useCollisionCallback: true, // 使用碰撞回调
            debugConfig: { // 物理调试配置
                enable: true,
                viewIndex: 0,
                updateFreq: 1,
                debugDrawMode: 4096,
                maxLineCount: 25000
            },
        })

        // Init Engine3D
        await Engine3D.init({
            // canvasConfig: { devicePixelRatio: 2 },
            renderLoop: () => Physics.update()
        })

        let scene = new Scene3D();
        scene.addComponent(Stats);

        let skyTexture = await Engine3D.res.loadLDRTextureCube('textures/sky/kloppenheim_07_puresky-min.jpg');
        let sky = scene.addComponent(SkyRenderer);
        sky.map = skyTexture;
        // sky.exposure = 0.6
        scene.envMap = skyTexture;

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        mainCamera.perspective(55, Engine3D.aspect, 0.2, 2000.0);
        mainCamera.enableCSM = true;

        let cameraCtrl = mainCamera.object3D.addComponent(CustomCameraController);
        cameraCtrl.setCamera(160, -15, 10, new Vector3(-96, -22, -96));
        cameraCtrl.smooth = false;
        cameraCtrl.dragSmooth = 10; // 50
        cameraCtrl.maxDistance = 1000;
        cameraCtrl.rollSmooth = 8;
        scene.addChild(cameraObj);

        let light = new Object3D();
        light.rotationX = 50;
        light.rotationY = 50;
        let directLight = light.addComponent(DirectLight);
        directLight.lightColor = new Color(1.0, 1.0, 1.0, 1.0);
        directLight.intensity = 49;
        directLight.castShadow = true;
        scene.addChild(light);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        this.initGameComponents(scene, cameraCtrl);

        // start render
        Engine3D.startRenderView(view);

        scene.addComponent(PostProcessingSetup);

        GUIUtil.renderDebug(false);

        GUIUtil.renderDirLight(directLight, false);

        GUIUtil.renderShadowSetting(false);

    }

    initGameComponents(scene: Scene3D, cameraCtrl: CustomCameraController) {

        // 坐标轴
        let axis = new AxisObject(125, 0.8);
        scene.addChild(axis);
        axis.transform.enable = false;
        GUIHelp.addFolder('Axis')
        GUIHelp.add(axis.transform, 'enable');

        scene.addComponent(FrameTaskQueue);

        // 场景模型
        scene.addComponent(MainModelComponent);



        // 载具
        const onTerrainReady = () => {
            
            scene.addComponent(TestComponent); // 测试组件

            let vehicle = scene.addComponent(VehicleComponent);
            vehicle.vehicleType = VehicleType.LargePickup;
            vehicle.position = new Vector3(-96, -22, -96)
            vehicle.addInitedFunction((vehicle: Object3D) => {
                cameraCtrl.slowTracking(vehicle, 2000, new Vector3(0, 0.5, 0));

            }, this);
        }
        Engine3D.inputSystem.addEventListener("MainModelInited", onTerrainReady, this);


        // 地形
        // scene.addComponent(TerrainComponent);

        // 植被
        // scene.addComponent(TreesComponent);

        // 草
        // scene.addComponent(Grass).enable = false; // gui control

        // 盒子生成器
        scene.addComponent(BoxGenerator).enable = false; // gui control

        // 交互射线
        cameraCtrl.object3D.addComponent(InteractRay);

        // 移动设施
        scene.addComponent(Elevator);
        // scene.addComponent(SlidingPlatform);

        if (import.meta.env.PROD) {
            this.printing();
        }
    }


    private printing() {
        console.log(`%c半颗牙齿晒太阳 `, "color: #43bb88;font-size: 40px;font-weight: bold;margin:10px")
        console.log(`%c🔗GitHub: https://github.com/ID-Emmett/offroad3d`, "color:#409eff;font-weight:bolder;font-size:15px;margin:10px 0;")
        console.log(
            "%c📚使用手册 Manual\n" +

            "%c🖱️双击: %c隐藏光标,全屏控制\n" +
            "%c🖱️右键: %c释放鼠标光标或生成盒子\n" +
            "%c🖱️左键: %c按住树木进行移动拖放\n\n" +

            "%c⌨️WASD: %c载具移动\n" +
            "%c⌨️K: %coff/on 相机避障系统\n" +
            "%c⌨️O: %coff/on 相机自动回正模式\n" +
            "%c⌨️L: %coff/on 相机固定跟随模式\n" +
            "%c⌨️M: %coff/on 相机固定位置\n" +
            "%c⌨️H: %coff/on 显示或隐藏调试器\n" +
            "%c⌨️B: %c长按 相机拍摄目标前方\n" +
            "%c⌨️P: %c重置车辆方向与高度，xz位置不变\n" +
            "%c⌨️U: %coff/on 锁定60hz\n" +
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
}



new Offroad3D().run();
