import { Engine3D, Scene3D, Camera3D, View3D, Object3D, Color, DirectLight, AtmosphericComponent, SkyRenderer, Vector3, AxisObject, Time, clamp, HoverCameraController, MeshRenderer, BoxGeometry, LitMaterial, Object3DUtil, Quaternion } from '@orillusion/core'
import { Stats } from "@orillusion/stats"
// import { HoverCameraController } from '@/components/cameraController'

import { GUIHelp } from "@/utils/debug/GUIHelp";
import { GUIUtil } from '@/utils/GUIUtil'

import Ammo from "@orillusion/ammo"

/**
 * TestAmmo
 * @export
 * @class 
 */
class TestAmmo {
    private physicsWorld: Ammo.btSoftRigidDynamicsWorld
    private transformAux1: Ammo.btTransform
    private boxs: Object3D

    async run() {
        Engine3D.setting.shadow.shadowSize = 1024 * 4;
        Engine3D.setting.shadow.csmMargin = 0.1 // 设置不同级别阴影的过渡范围，在0-1区间调节
        Engine3D.setting.shadow.csmScatteringExp = 0.9 // 微调各个级别阴影的范围，以满足不同的场景需求
        Engine3D.setting.shadow.csmAreaScale = 0.2 // 微调阴影能够覆盖的最大范围，在0.0-1区间调节
        Engine3D.setting.shadow.updateFrameRate = 1 // 阴影更新
        // Init physics engine
        await Ammo.bind(window)(Ammo);
        this.initPhysics()

        // Init Engine3D
        await Engine3D.init({
            // renderLoop: () => this.loop()
            // beforeRender: () => this.loop()
            lateRender: () => this.loop()
        })

        let scene = new Scene3D()
        scene.addComponent(Stats)

        /* 全景天空盒默认 */
        let sky = scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.54  // 太阳垂直位置，可以调节环境光亮度
        sky.exposure = 1.5; //调整环境光曝光度, 默认值1
        sky.roughness = 0.5; // 设置天空盒背景模糊强度, 范围[0, 1], 默认值0

        let cameraObj = new Object3D()
        let mainCamera = cameraObj.addComponent(Camera3D)
        mainCamera.perspective(60, Engine3D.aspect, 0.2, 2000.0)
        mainCamera.enableCSM = true;

        let cameraCtrl = mainCamera.object3D.addComponent(HoverCameraController)
        cameraCtrl.setCamera(160, -15, 10)
        scene.addChild(cameraObj)

        let light = new Object3D()
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
        GUIHelp.add(Engine3D, 'frameRate', 10, 170, 10)
        GUIHelp.open()
        this.initGameComponents(scene)

        // start render
        Engine3D.startRenderView(view)


        GUIUtil.renderDebug(false);

        GUIUtil.renderDirLight(directLight, false);

        GUIUtil.renderShadowSetting(false);

        this.boxs = new Object3D()
        scene.addChild(this.boxs)

        this.createFloor(scene)

    }
    initPhysics() {

        // Physics configuration
        const gravityConstant = -9.8;
        const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const broadphase = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
        const softBodySolver = new Ammo.btDefaultSoftBodySolver();
        this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
        this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

        this.transformAux1 = new Ammo.btTransform();

    }

    createFloor(scene: Scene3D) {
        let floor = Object3DUtil.GetSingleCube(100, 1, 100, 0.5, 0.2, 0.8)
        this.createRigidBody(floor, 0, 100 / 2, 1 / 2, 100 / 2)
        scene.addChild(floor)
    }

    createRigidBody(graphic: Object3D, mass: number, sizeX: number, sizeY: number, sizeZ: number) {

        let shape = new Ammo.btBoxShape(new Ammo.btVector3(sizeX, sizeY, sizeZ));
        shape.setMargin(0.05)
        const transform = this.transformAux1;
        transform.setIdentity();

        // position
        const origin = new Ammo.btVector3(graphic.x, graphic.y, graphic.z);
        transform.setOrigin(origin);

        // rotation
        let q = Quaternion.HELP_0.fromEulerAngles(graphic.rotationX, graphic.rotationY, graphic.rotationZ)
        let rotQuat = new Ammo.btQuaternion(q.x, q.y, q.z, q.w)

        transform.setRotation(rotQuat);

        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const rigidBody = new Ammo.btRigidBody(rbInfo);

        this.physicsWorld.addRigidBody(rigidBody)

        graphic.data = { rigidBody }
    }


    addBox(): void {
        const obj = new Object3D()
        let mr = obj.addComponent(MeshRenderer)

        let mass = 1
        let size = 0.6
        mr.geometry = new BoxGeometry(size, size, size)

        let mat = new LitMaterial()
        mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
        mr.material = mat;

        const posRange = 50
        obj.x = Math.random() * posRange - posRange / 2
        obj.y = 60
        obj.z = Math.random() * posRange - posRange / 2

        this.createRigidBody(obj, mass, size / 2, size / 2, size / 2)

        this.boxs.addChild(obj)
    }

    initGameComponents(scene: Scene3D) {

        let axis = new AxisObject(250, 0.8);
        scene.addChild(axis);
        axis.transform.enable = false;

        GUIHelp.addFolder('Axis')
        GUIHelp.add(axis.transform, 'enable');



        // setInterval(()=>{            
        //     this.updatePhysics(0)
        // },1000/60)

        // this.animate()

    }

    private _lastTime: number = performance.now() // save last time

    loop() {

        this.updatePhysics(Time.delta)

        // this.boxs.forChild((obj: Object3D) => {
        //     const ms = obj.data.rigidBody?.getMotionState();
        //     if (ms) {
        //         // console.log('update');
        //         ms.getWorldTransform(this.transformAux1);
        //         const p = this.transformAux1.getOrigin();
        //         const q = this.transformAux1.getRotation();
        //         obj.x = p.x()
        //         obj.y = p.y()
        //         obj.z = p.z()
        //         Quaternion.HELP_0.set(q.x(), q.y(), q.z(), q.w())
        //         obj.localQuaternion = Quaternion.HELP_0;

        //     }
        // })

        let now: number = performance.now()
        if (now - this._lastTime > 300) {
            this.addBox()
            if (this.boxs.numChildren > 100) {
                console.log('delete');

                let item = this.boxs.getChildByIndex(0);
                this.physicsWorld.removeRigidBody(item.data.rigidBody);
                Ammo.destroy(item.data.rigidBody.getCollisionShape());
                Ammo.destroy(item.data.rigidBody.getMotionState());
                Ammo.destroy(item.data.rigidBody);
                item.data.rigidBody = null;
                item.destroy();
            }
            this._lastTime = now
        }

    }


    private lastTime: number = 0
    updatePhysics(deltaTime: number) {
        const time = performance.now();

        if (this.lastTime > 0) {
            const delta = (time - this.lastTime) / 1000;
            // console.log(delta);

            this.physicsWorld.stepSimulation(Time.delta / 1000, 10)


            this.boxs.forChild((obj: Object3D) => {
                const ms = obj.data.rigidBody?.getMotionState();
                if (ms) {
                    // console.log('update');
                    ms.getWorldTransform(this.transformAux1);
                    const p = this.transformAux1.getOrigin();
                    const q = this.transformAux1.getRotation();
                    obj.x = p.x()
                    obj.y = p.y()
                    obj.z = p.z()
                    Quaternion.HELP_0.set(q.x(), q.y(), q.z(), q.w())
                    obj.localQuaternion = Quaternion.HELP_0;

                }
            })
        }


        this.lastTime = time;

    }

    animate() {
        return
        requestAnimationFrame((t) => this.render(t));
    }
    // private lastTime: number = performance.now();

    private ind = 0
    render(currentTime: number) {

        this.physicsWorld.stepSimulation(Time.delta / 1000, 10)


        this.boxs.entityChildren.forEach(entity => {


            let obj = entity as Object3D;

            const ms = obj.data.rigidBody?.getMotionState();
            if (ms) {
                // console.log('update');
                ms.getWorldTransform(this.transformAux1);
                const p = this.transformAux1.getOrigin();
                const q = this.transformAux1.getRotation();
                obj.x = p.x()
                obj.y = p.y()
                obj.z = p.z()
                Quaternion.HELP_0.set(q.x(), q.y(), q.z(), q.w())
                obj.localQuaternion = Quaternion.HELP_0;

            }
        })

        let now: number = performance.now()
        if (now - this._lastTime > 300) {
            this.addBox()
            if (this.boxs.numChildren > 100) {
                console.log('delete');

                let item = this.boxs.getChildByIndex(0)
                this.physicsWorld.removeRigidBody(item.data.rigidBody);
                Ammo.destroy(item.data.rigidBody.getCollisionShape());
                Ammo.destroy(item.data.rigidBody.getMotionState());
                Ammo.destroy(item.data.rigidBody);
                item.destroy()
            }
            this._lastTime = now
        }

        this.animate();

    }
}



new TestAmmo().run()
