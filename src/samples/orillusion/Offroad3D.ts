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
		GUIHelp.addButton('reset',()=>location.reload())

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

		let vehicle = scene.addComponent(VehicleComponent);
		vehicle.vehicleType = VehicleType.Pickup;
		vehicle.addInitedFunction((vehicle: Object3D) => {
			cameraCtrl.flowTarget(vehicle, new Vector3(0, 2, 0));
		}, this);

	}

	loop() {
		// Physics.update()
		let timeStep = 1 / (Engine3D.frameRate / 2.5);
		Physics.world.stepSimulation(timeStep, 1, timeStep);
	}
}



new Sample_game().run()
