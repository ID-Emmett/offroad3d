import { View3D, Engine3D, Scene3D, CameraUtil, HoverCameraController, AtmosphericComponent, Vector3Ex, Color, Vector3 } from '@orillusion/core'
import * as dat from 'dat.gui';

class TestLineCount {
    view: View3D
    lineCount: number = 10000;
    async run() {
        await Engine3D.init()

        let view = new View3D();
        let scene = new Scene3D();

        let sky = scene.addComponent(AtmosphericComponent)

        view.scene = scene;
        view.scene.envMap = sky.map;

        view.camera = CameraUtil.createCamera3DObject(scene, 'camera');
        view.camera.perspective(60, Engine3D.aspect, 0.1, 2000);
        view.camera.object3D.addComponent(HoverCameraController).setCamera(40, -20, 300);
        this.view = view

        Engine3D.startRenderView(view);

        this.drawLines()
        this.gui();
    }

    drawLines() {
        this.view.graphic3D.ClearAll()
        for (let i = 0; i < this.lineCount; i++) {
            let p0 = Vector3Ex.getRandomV3(10, 100, 20, 50)
            let p1 = Vector3Ex.getRandomV3(10, 100, 20, 50)
            this.view.graphic3D.drawLines(`${p0.index}_${p1.index}`, [p0, p1], Color.random())
        }
        // let lines: Vector3[] = []
        // for (let i = 0; i < this.lineCount; i++) {
        //     let p0 = Vector3Ex.getRandomV3(10, 100, 20, 50)
        //     let p1 = Vector3Ex.getRandomV3(10, 100, 20, 50)
        //     lines.push(p0, p1)
        // }
        // this.view.graphic3D.drawLines(`uniformRendering`, lines)

    }

    // debug gui
    gui() {
        let gui = new dat.GUI();
        let f = gui.addFolder('TestLineCount');
        f.add(this, 'lineCount', 1000, 100000, 1000).onFinishChange(e => this.drawLines())
        f.add({ tips: 'Exceeding 32,000 lines may cause engine crash.' }, 'tips')
        f.open();
    }
}


new TestLineCount().run();
