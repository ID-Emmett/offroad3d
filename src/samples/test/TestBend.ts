import { View3D, Engine3D, Scene3D, CameraUtil, HoverCameraController, AtmosphericComponent, Vector3Ex, Color, Vector3, Object3D, MeshRenderer, CylinderGeometry, LitMaterial, DirectLight, Quaternion, SphereGeometry, AxisObject, SolidColorSky, SkyRenderer } from '@orillusion/core'
import * as dat from 'dat.gui';
import { bend, interpolatePoints } from '@/utils/BendUtil'
class TestCurvature {
    view: View3D;
    scene: Scene3D;
    rootObject: Object3D;
    async run() {
        await Engine3D.init()

        let view = new View3D();
        let scene = new Scene3D();

        // let sky = scene.addComponent(AtmosphericComponent)

        // 创建一个纯色贴图
        let colorSky = new SolidColorSky(new Color(0.5, 1.0, 0.8, 1))
        // 添加 SkyRenderer 组件，然后设置 map 贴图
        let sky = scene.addComponent(SkyRenderer);
        sky.map = colorSky;

        // 同时设置单色环境光
        scene.envMap = colorSky;

        view.scene = scene;
        view.scene.envMap = sky.map;

        view.camera = CameraUtil.createCamera3DObject(scene, 'camera');
        view.camera.perspective(60, Engine3D.aspect, 0.1, 2000);
        view.camera.object3D.addComponent(HoverCameraController).setCamera(0, 0, 300);

        let light = new Object3D()
        light.rotationX = 50
        light.rotationY = 50
        let directLight = light.addComponent(DirectLight)
        directLight.lightColor = new Color(1.0, 1.0, 1.0, 1.0)
        directLight.intensity = 49
        directLight.castShadow = true
        scene.addChild(light)


        this.scene = scene
        this.view = view

        Engine3D.startRenderView(view);

        // this.createTree()
        this.createPoint()
        this.gui();
    }

    createTree() {

        let axis = new AxisObject(100, 0.5)
        this.scene.addChild(axis)

        this.rootObject = new Object3D();
        this.rootObject.name = 'root';

        let childNum = 6;

        for (let i = 0; i < childNum; i++) {
            let child = new Object3D();
            let mr = child.addComponent(MeshRenderer);
            mr.geometry = new CylinderGeometry(2, 2, 10);
            let mat = new LitMaterial()
            mat.baseColor = Color.random()
            mr.materials = [mat, mat, mat]

            child.y = i * 10 + (10 / 2)

            this.rootObject.addChild(child)
        }

        this.scene.addChild(this.rootObject)


        let topPointObj = new Object3D()
        let mr = topPointObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 50, 50);
        let mat = new LitMaterial()
        mat.baseColor = Color.random()
        mr.material = mat
        this.scene.addChild(topPointObj)
        topPointObj.localPosition = new Vector3(5, 60, 10)

        let rootPointObj = new Object3D()
        let mr2 = rootPointObj.addComponent(MeshRenderer);
        mr2.geometry = new SphereGeometry(1, 50, 50);
        let mat2 = new LitMaterial()
        mat2.baseColor = Color.random()
        mr2.material = mat
        this.scene.addChild(rootPointObj)
        rootPointObj.localPosition = new Vector3(0, 0, 0)
        rootPointObj.localQuaternion = new Quaternion(0, 0, 0, 1)



        let bendRateObj = { bendRate: 0.5 }

        const bendfun = () => {
            let rootQuat = Quaternion.HELP_0.fromEulerAngles(rootPointObj.rotationX, rootPointObj.rotationY, rootPointObj.rotationZ)
            bend(this.rootObject, rootPointObj.localPosition, rootQuat, topPointObj.localPosition, bendRateObj.bendRate)
        }

        bendfun()

        let gui = new dat.GUI();
        let f = gui.addFolder('Test');

        f.add(bendRateObj, 'bendRate', 0, 1, 0.1).onChange(() => bendfun())
        f.add(topPointObj.transform, 'x', -100, 100, 1).onChange(() => bendfun()).name('TOP X')
        f.add(topPointObj.transform, 'y', -100, 100, 1).onChange(() => bendfun()).name('TOP Y')
        f.add(topPointObj.transform, 'z', -100, 100, 1).onChange(() => bendfun()).name('TOP Z')

        f.add(rootPointObj.transform, 'x', -100, 100, 1).onChange(() => bendfun()).name('ROOT X')
        f.add(rootPointObj.transform, 'y', -100, 100, 1).onChange(() => bendfun()).name('ROOT Y')
        f.add(rootPointObj.transform, 'z', -100, 100, 1).onChange(() => bendfun()).name('ROOT Z')

        f.add(rootPointObj.transform, 'rotationX', 0, 360, 1).onChange(() => bendfun()).name('ROOT rotationX')
        f.add(rootPointObj.transform, 'rotationY', 0, 360, 1).onChange(() => bendfun()).name('ROOT rotationY')
        f.add(rootPointObj.transform, 'rotationZ', 0, 360, 1).onChange(() => bendfun()).name('ROOT rotationZ')

        f.open()
    }
    createPoint() {
        let axis = new AxisObject(100, 0.5)
        this.scene.addChild(axis)

        let topPointObj = new Object3D()
        let mr = topPointObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 50, 50);
        let mat = new LitMaterial()
        mat.baseColor = Color.hexRGBColor(6)
        mr.material = mat
        this.scene.addChild(topPointObj)
        topPointObj.localPosition = new Vector3(0, 60, 0)

        let rootPointObj = new Object3D()
        let mr2 = rootPointObj.addComponent(MeshRenderer);
        mr2.geometry = new SphereGeometry(1, 50, 50);
        let mat2 = new LitMaterial()
        mat2.baseColor = Color.hexRGBColor(Color.BURLYWOOD)
        mr2.material = mat
        this.scene.addChild(rootPointObj)
        rootPointObj.localPosition = new Vector3(0, 0, 0)
        rootPointObj.localQuaternion = new Quaternion(0, 0, 0, 1)

        let config = {
            childNum: 6,
            curvature: 0.5
        }

        let mainBox = new Object3D()
        this.scene.addChild(mainBox)
        const bendfun = () => {
            mainBox.forChild((child: Object3D) => {
                child.transform.enable = false
                child.destroy()
                child.removeSelf()
            })
            mainBox.removeAllChild()
            let points = interpolatePoints(rootPointObj.localPosition, topPointObj.localPosition, config.childNum, config.curvature);
            for (let i = 0; i < points.length; i++) {
                let newPoints = new Object3D()
                let mr = newPoints.addComponent(MeshRenderer);
                mr.geometry = new SphereGeometry(1, 50, 50);
                let mat = new LitMaterial()
                mat.baseColor = Color.random()
                mr.material = mat
                newPoints.localPosition = points[i]
                mainBox.addChild(newPoints)
            }
        }

        bendfun()

        let gui = new dat.GUI();
        let f = gui.addFolder('TestCurvature');

        f.add(config, 'childNum', 0, 20, 1).onChange(() => bendfun())
        f.add(config, 'curvature', 0, 1, 0.1).onChange(() => bendfun())

        f.add(topPointObj.transform, 'x', -100, 100, 1).onChange(() => bendfun()).name('TOP X')
        f.add(topPointObj.transform, 'y', -100, 100, 1).onChange(() => bendfun()).name('TOP Y')
        f.add(topPointObj.transform, 'z', -100, 100, 1).onChange(() => bendfun()).name('TOP Z')

        f.add(rootPointObj.transform, 'x', -100, 100, 1).onChange(() => bendfun()).name('ROOT X')
        f.add(rootPointObj.transform, 'y', -100, 100, 1).onChange(() => bendfun()).name('ROOT Y')
        f.add(rootPointObj.transform, 'z', -100, 100, 1).onChange(() => bendfun()).name('ROOT Z')

        f.open()
    }


    // debug gui
    gui() {


    }
}


new TestCurvature().run();
