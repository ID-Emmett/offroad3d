import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil, PlaneGeometry, GPUCullMode, VertexAttributeName, BoxGeometry, GeometryBase, UnLitMaterial, BitmapTexture2D, CEvent, Vector2, BoundUtil, AxisObject, ComponentCollect } from '@orillusion/core'
import { ActivationState, RigidBodyComponent, CollisionFlags, ShapeTypes, RigidBodyUtil, Ammo, Physics, CollisionMask, ClothSoftBody, SliderConstraint, PhysicsMathUtil, ConeTwistConstraint } from "@/physics";
import { HingeConstraint } from "@/physics/constraint/HingeConstraint";
import { GUIUtil } from '@/utils/GUIUtil'
import { GUIHelp } from "@/utils/debug/GUIHelp";
import { VehicleControl } from '../vehicleManage';
import { RotatingPlatform } from '../facilities';
import { SliderMotorController } from '@/components/constraintControllers/SliderMotorController';

export class TestComponent extends ComponentBase {

    async start() {

        // 空心复合体测试
        // let testHollow = Object3DUtil.GetSingleCube(0.1, 0.1, 0.1, 0.5, 0.2, 0.9)
        // let shapes = RigidBodyUtil.generatesHollowShapes(new Vector3(13, 1, 15), new Vector3(1, 1, 1), Vector3.ZERO, 'Y')
        // let testRBC = testHollow.addComponent(RigidBodyComponent)
        // testRBC.shape = ShapeTypes.btCompoundShape
        // testRBC.childShapes = shapes
        // this.object3D.addChild(testHollow)


        // 静态平面刚体测试
        if (false) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(1000, 1000, 1, 1)
            mr.material = new LitMaterial()
            mr.material.cullMode = GPUCullMode.none
            obj.localPosition = new Vector3(0, 0, 0)
            this.object3D.addChild(obj)

            let rigidBody = obj.addComponent(RigidBodyComponent)
            rigidBody.shape = ShapeTypes.btStaticPlaneShape
            // rigidBody.group = CollisionGroup.TERRAIN
            // rigidBody.mask = CollisionMask.DEFAULT_MASK
        }

        // 柱子测试软体锚点
        let boxObj = Object3DUtil.GetSingleCube(1, 5, 1, 0.8, 0.4, 0.3)
        boxObj.localPosition = new Vector3(-94, -23, -80)
        let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent)
        boxObjRbComponent.shape = ShapeTypes.btBoxShape
        boxObjRbComponent.mass = 10
        this.object3D.addChild(boxObj)

        // 软体布料测试1 旗帜
        if (true) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(5, 3.3, 10, 10)

            let texture = await Engine3D.res.loadTexture('textures/flag.jpg');
            // let normalMapTexture = await Engine3D.res.loadTexture('textures/sandstone_cracks/sandstone_cracks_diff_1k.jpg');
            // let mat = new LitMaterial();
            let mat = new UnLitMaterial();
            mat.baseMap = texture;
            // mat.normalMap = normalMapTexture;
            mat.cullMode = GPUCullMode.none
            // mat.metallic = 0.2;
            // mat.roughness = 0.8;

            mr.material = mat;

            this.object3D.addChild(obj)

            // 布料软体
            let softBody = obj.addComponent(ClothSoftBody)
            softBody.mass = 0.9;
            // softBody.appendRigidbody = boxObjRbComponent.btRigidbody;
            // softBody.anchorIndices = ['leftTop', 'leftBottom'];
            softBody.fixNodeIndices = ['leftTop', 'rightTop']
            softBody.applyPosition = new Vector3(-49.7, -20, -89.5)

            // 布料左边与刚体相连
            let anchorX = (5 / 2 + 1 / 2) // x偏移 布料平面宽度的一半 + 刚体的宽度的一半
            // 布料的顶部与刚体对其
            let anchorY = (5 - 3.3) / 2 // (刚体高 - 布料平面高) / 2
            // 布料对其矩形刚体的左角
            let anchorZ = 1 / 2 // 刚体深度 / 2
            // softBody.applyPosition = new Vector3(anchorX, anchorY, anchorZ)

            // GUIHelp.addFolder('SoftBody flag')
            // GUIHelp.open()
            // GUIHelp.addButton('stop SoftBody Movement', () => softBody.stopSoftBodyMovement())
            // GUIHelp.addButton('Destroy AnchorConstraint', () => softBody.clearAnchors())
        }
        // 软体布料测试2  悟空
        if (true) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(5 * 0.6, 5.3 * 0.6, 10, 10)

            let texture = new BitmapTexture2D()
            await texture.load('https://cdn.orillusion.com/gltfs/cube/material_02.png')
            let mat = new UnLitMaterial()
            mat.baseMap = texture;
            mat.cullMode = GPUCullMode.none
            mr.material = mat;

            this.object3D.addChild(obj)
            let softBody = obj.addComponent(ClothSoftBody)
            softBody.fixNodeIndices = ['leftTop', 'rightTop']
            softBody.applyPosition = new Vector3(-89.8, -21.2, -110)
            softBody.applyRotation = new Vector3(0, 90, 0)

            // GUIHelp.addFolder('SoftBody wukong')
            // GUIHelp.open()
            // GUIHelp.addButton('fixClothNode leftBottom', () => softBody.applyFixedNodes(['leftBottom']))
        }

        // 旋转平台测试
        if (false) {
            {
                let boxObj = Object3DUtil.GetSingleCube(5, 1, 1, Math.random(), Math.random(), Math.random());
                boxObj.localPosition = new Vector3(-84, -22.4, -84);
                // boxObj.rotationY = 0;
                // boxObj.rotationZ = 45;
                // boxObj.rotationX = 45;

                // 刚体组件
                let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
                boxObjRbComponent.shape = ShapeTypes.btBoxShape;
                boxObjRbComponent.mass = 100;
                boxObjRbComponent.damping = new Vector2(0.2, 0.2);
                boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

                // 旋转组件
                let rotationgPlatform = boxObj.addComponent(RotatingPlatform);
                rotationgPlatform.rotationSpeed = 1;
                rotationgPlatform.rotationAxis = 'Y';
                // rotationgPlatform.enable = false;
                this.object3D.addChild(boxObj);
            }

            {
                let boxObj = Object3DUtil.GetSingleCube(8, 1, 1, Math.random(), Math.random(), Math.random());
                boxObj.localPosition = new Vector3(-80, -18.8, -78);
                // 刚体组件
                let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
                boxObjRbComponent.shape = ShapeTypes.btBoxShape;
                boxObjRbComponent.mass = 100;
                boxObjRbComponent.damping = new Vector2(0.2, 0.2);
                boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

                // 旋转组件
                let rotationgPlatform = boxObj.addComponent(RotatingPlatform);
                rotationgPlatform.rotationSpeed = 1;
                rotationgPlatform.rotationAxis = 'Z';
                // rotationgPlatform.enable = false;
                this.object3D.addChild(boxObj);
            }
            {
                let boxObj = Object3DUtil.GetSingleCube(8, 1, 1, Math.random(), Math.random(), Math.random());
                boxObj.localPosition = new Vector3(-90, -22.1, -88);
                // 刚体组件
                let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
                boxObjRbComponent.shape = ShapeTypes.btBoxShape;
                boxObjRbComponent.mass = 100;
                boxObjRbComponent.damping = new Vector2(0.2, 0.2);
                boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

                // 旋转组件
                let rotationgPlatform = boxObj.addComponent(RotatingPlatform);
                rotationgPlatform.rotationSpeed = 1;
                rotationgPlatform.rotationAxis = 'X';
                // rotationgPlatform.enable = false;
                this.object3D.addChild(boxObj);
            }
        }
        // 滑动约束测试1
        if (false) {
            let boxObj = Object3DUtil.GetSingleCube(4, 0.1, 4, Math.random(), Math.random(), Math.random());
            boxObj.localPosition = new Vector3(-108, -21, -77);
            boxObj.rotationX = 0;
            boxObj.rotationY = 40;
            // boxObj.rotationZ = 40;

            // 轴
            // let axis = new AxisObject(2,0.01);
            // boxObj.addChild(axis);

            // 固定轴
            // let axis2 = new AxisObject(20,0.03);
            // axis2.x = boxObj.x
            // axis2.y = boxObj.y - 5
            // axis2.z = boxObj.z
            // this.object3D.addChild(axis2);

            this.object3D.addChild(boxObj);

            // 刚体组件
            let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
            boxObjRbComponent.shape = ShapeTypes.btBoxShape;
            boxObjRbComponent.mass = 100;
            boxObjRbComponent.damping = new Vector2(0.2, 0.2);
            boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;
            // boxObjRbComponent.gravity = new Vector3(0, 0, 0)
            let angularVelocity = new Vector3(1, 1, 1)
            // 刚体角度马达
            boxObjRbComponent.onLateUpdate = () => {
                // boxObjRbComponent.btRigidbody.getAngularVelocity().setValue(1,1,1)
                boxObjRbComponent.btRigidbody.setAngularVelocity(PhysicsMathUtil.toBtVector3(angularVelocity))
            }; // Add a delayed update function.

            // setTimeout(() => {
            //     ComponentCollect.unBindLateUpdate(boxObj.transform.view3D, boxObjRbComponent);
            // }, 3000);


            // 滑动约束组件
            let sliderConstraint = boxObj.addComponent(SliderConstraint);

            sliderConstraint.pivotSelf = new Vector3(0, 0, 0); // 设置自身的枢轴点
            // sliderConstraint.rotationSelf = new Quaternion(0,0,0,1); // 设置自身的旋转
            sliderConstraint.rotationSelf = new Quaternion().fromEulerAngles(0, 90, 90); // 设置自身的旋转

            sliderConstraint.lowerLinLimit = -2; // 设置线性滑动的下限
            sliderConstraint.upperLinLimit = 8;  // 设置线性滑动的上限

            // sliderConstraint.angularLowerLimit = -Math.PI / 4; // 设置旋转的下限
            // sliderConstraint.angularUpperLimit = Math.PI / 4;  // 设置旋转的上限

            // 禁用链接刚体之间的碰撞
            sliderConstraint.disableCollisionsBetweenLinkedBodies = true;

            // 设置目标刚体
            // sliderConstraint.targetRigidbody = null; // 仅一个刚体时，设置为 null

            // // 设置电机参数
            // sliderConstraint.enableLinearMotor = false;
            // sliderConstraint.targetLinearMotorVelocity = 122.3; // 线性电机目标速度 122.3
            // sliderConstraint.maxLinearMotorForce = 31.7; // 线性电机最大力 31.7
            // sliderConstraint.pauseDuration = 1000; // 到达终点时的停留时间
            // // sliderConstraint.breakingImpulseThreshold = 5000; // 断裂冲量阈值

            // sliderConstraint.drawTrackAtInit(true, Color.COLOR_GREEN)
            // // setTimeout(() => {
            // //     sliderConstraint.drawTrackAtInit(false)
            // // }, 3000);
            // GUIHelp.addFolder('SliderConstraint').open()
            // GUIHelp.add(sliderConstraint, 'enable')
            // GUIHelp.add(sliderConstraint, 'enableLinearMotor').onChange(v => sliderConstraint.onEnable())
            // GUIHelp.add(sliderConstraint, 'targetLinearMotorVelocity', -1, 200, 0.1).onChange(v => sliderConstraint.constraint?.setTargetLinMotorVelocity(v))
            // GUIHelp.add(sliderConstraint, 'maxLinearMotorForce', -1, 200, 0.1).onChange(v => sliderConstraint.constraint?.setMaxLinMotorForce(v))
            // GUIHelp.add(sliderConstraint, 'pauseDuration', 0, 10000, 1000)
            // GUIHelp.add(angularVelocity, 'x', -10, 10, 0.1).name('angularX')
            // GUIHelp.add(angularVelocity, 'y', -10, 10, 0.1).name('angularY')
            // GUIHelp.add(angularVelocity, 'z', -10, 10, 0.1).name('angularZ')
            // GUIHelp.addButton('clearLine', () => sliderConstraint.drawTrackAtInit(false))
            // GUIHelp.addButton('free', () => {
            //     RigidBodyUtil.activateAllKinematicObject()
            //     Physics.world.setGravity(PhysicsMathUtil.setBtVector3(0, 0.1, 0))
            // })
            // GUIHelp.addButton('down', () => {
            //     RigidBodyUtil.activateAllKinematicObject()
            //     Physics.world.setGravity(PhysicsMathUtil.setBtVector3(0, -9.8, 0))
            // })

        }
        // 滑动约束测试2
        if (false) {
            // box对象
            let boxObj = Object3DUtil.GetSingleCube(4, 1, 1, Math.random(), Math.random(), Math.random());
            boxObj.localPosition = new Vector3(-99, -21, -83);
            boxObj.rotationX = 0;
            this.object3D.addChild(boxObj);

            // 目标对象
            let targetObj = Object3DUtil.GetSingleCube(8, 1, 1, Math.random(), Math.random(), Math.random());
            targetObj.localPosition = new Vector3(-100, -21, -85);
            this.object3D.addChild(targetObj);

            // box刚体组件
            let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
            boxObjRbComponent.shape = ShapeTypes.btBoxShape;
            boxObjRbComponent.mass = 100;
            boxObjRbComponent.damping = new Vector2(0.2, 0.2);
            boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

            // target刚体组件
            let targetObjRbComponent = targetObj.addComponent(RigidBodyComponent);
            targetObjRbComponent.shape = ShapeTypes.btBoxShape;
            targetObjRbComponent.mass = 200;
            targetObjRbComponent.damping = new Vector2(0.2, 0.2);
            targetObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

            // 滑动约束组件
            let sliderConstraint = boxObj.addComponent(SliderConstraint);

            sliderConstraint.pivotSelf = new Vector3(0, 0, 0); // 设置自身的枢轴点
            // sliderConstraint.rotationSelf = new Quaternion(0,0,0,1); // 设置自身的旋转
            sliderConstraint.rotationSelf = new Quaternion().fromEulerAngles(0, 90, 90); // 设置自身的旋转

            sliderConstraint.lowerLinLimit = -5; // 设置线性滑动的下限
            sliderConstraint.upperLinLimit = 5;  // 设置线性滑动的上限

            // sliderConstraint.angularLowerLimit = -Math.PI / 4; // 设置旋转的下限
            // sliderConstraint.angularUpperLimit = Math.PI / 4;  // 设置旋转的上限

            // 禁用链接刚体之间的碰撞
            sliderConstraint.disableCollisionsBetweenLinkedBodies = true;

            // 设置目标刚体
            sliderConstraint.targetRigidbody = targetObjRbComponent;

            // // 设置电机参数
            // sliderConstraint.enableLinearMotor = false;
            // sliderConstraint.targetLinearMotorVelocity = 1; // 线性电机目标速度 122.3
            // sliderConstraint.maxLinearMotorForce = 0.1; // 线性电机最大力 31.7
            // sliderConstraint.pauseDuration = 1000; // 到达终点时的停留时间
            // // sliderConstraint.breakingImpulseThreshold = 5000; // 断裂冲量阈值

            // sliderConstraint.drawTrackAtInit(true, Color.COLOR_GREEN)

            // GUIHelp.addFolder('SliderConstraint2').open()
            // GUIHelp.add(sliderConstraint, 'enable')
            // GUIHelp.add(sliderConstraint, 'enableLinearMotor').onChange(v => sliderConstraint.onEnable())
            // GUIHelp.add(sliderConstraint, 'targetLinearMotorVelocity', -1, 200, 0.1).onChange(v => sliderConstraint.constraint?.setTargetLinMotorVelocity(v))
            // GUIHelp.add(sliderConstraint, 'maxLinearMotorForce', -1, 200, 0.1).onChange(v => sliderConstraint.constraint?.setMaxLinMotorForce(v))
            // GUIHelp.add(sliderConstraint, 'pauseDuration', 0, 10000, 1000)

            // GUIHelp.addButton('clearLine', () => sliderConstraint.drawTrackAtInit(false))
            // GUIHelp.addButton('free', () => {
            //     RigidBodyUtil.activateAllKinematicObject()
            //     Physics.world.setGravity(PhysicsMathUtil.setBtVector3(0, 0.1, 0))
            // })
            // GUIHelp.addButton('down', () => {
            //     RigidBodyUtil.activateAllKinematicObject()
            //     Physics.world.setGravity(PhysicsMathUtil.setBtVector3(0, -9.8, 0))
            // })

        }
        // 滑动约束测试3 两个刚体 组合组件
        if (true) {
            // box对象
            let boxObj = Object3DUtil.GetSingleCube(4, 1, 1, Math.random(), Math.random(), Math.random());
            boxObj.localPosition = new Vector3(-99, -21, -83);
            boxObj.rotationX = 0;
            this.object3D.addChild(boxObj);

            // 目标对象
            let targetObj = Object3DUtil.GetSingleCube(8, 1, 1, Math.random(), Math.random(), Math.random());
            targetObj.localPosition = new Vector3(-100, -21, -85);
            this.object3D.addChild(targetObj);

            // box刚体组件
            let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
            boxObjRbComponent.shape = ShapeTypes.btBoxShape;
            boxObjRbComponent.mass = 200;
            boxObjRbComponent.damping = new Vector2(0.2, 0.2);
            boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

            // target刚体组件
            let targetObjRbComponent = targetObj.addComponent(RigidBodyComponent);
            targetObjRbComponent.shape = ShapeTypes.btBoxShape;
            targetObjRbComponent.mass = 200;
            targetObjRbComponent.damping = new Vector2(0.2, 0.2);
            targetObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

            // 滑动约束组件
            let sliderConstraint = boxObj.addComponent(SliderConstraint);

            sliderConstraint.waitConstraint().then((constraint) => {
                console.log(constraint.getBreakingImpulseThreshold());
            })

            // sliderConstraint.breakingImpulseThreshold = 0;
            sliderConstraint.pivotSelf = new Vector3(0, 0, 0); // 设置自身的枢轴点
            sliderConstraint.rotationSelf.fromEulerAngles(0, 90, 90); // 设置自身的旋转

            sliderConstraint.lowerLinLimit = -5; // 设置线性滑动的下限
            sliderConstraint.upperLinLimit = 5;  // 设置线性滑动的上限

            // sliderConstraint.angularLowerLimit = -Math.PI / 4; // 设置旋转的下限
            // sliderConstraint.angularUpperLimit = Math.PI / 4;  // 设置旋转的上限

            // 禁用链接刚体之间的碰撞
            sliderConstraint.disableCollisionsBetweenLinkedBodies = true;

            // 设置目标刚体
            sliderConstraint.targetRigidbody = targetObjRbComponent;

            let constraint = await sliderConstraint.waitConstraint()
            constraint.setMaxLinMotorForce(1)
            constraint.setPoweredLinMotor(true)
            constraint.setTargetLinMotorVelocity(0.2)

            // setTimeout(async() => {
            //     console.log('测试约束重置');
            //     let v = await sliderConstraint.resetConstraint()
            //     v.setMaxLinMotorForce(10)
            //     v.setPoweredLinMotor(true)
            //     v.setTargetLinMotorVelocity(10)
            // }, 6000);

        }
        // 滑动约束测试4 一个刚体 滑动约束马达
        if (true) {
            // box对象
            let boxObj = Object3DUtil.GetSingleCube(4, 1, 1, Math.random(), Math.random(), Math.random());
            boxObj.localPosition = new Vector3(-99, -22.3, -83);
            boxObj.rotationY = 45;
            this.object3D.addChild(boxObj);

            // box刚体组件
            let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
            boxObjRbComponent.shape = ShapeTypes.btBoxShape;
            boxObjRbComponent.mass = 200;
            boxObjRbComponent.damping = new Vector2(0.2, 0.2);
            boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;

            // 滑动约束组件
            let sliderConstraint = boxObj.addComponent(SliderConstraint);
            sliderConstraint.pivotSelf.set(0, 0, 0); // 设置自身的枢轴点
            // sliderConstraint.rotationSelf.fromEulerAngles(0, 90, 90); // 设置自身的旋转
            sliderConstraint.lowerLinLimit = -5; // 设置线性滑动的下限
            sliderConstraint.upperLinLimit = 10;  // 设置线性滑动的上限

            // 滑动马达控制组件
            let sliderMotorController = boxObj.addComponent(SliderMotorController)
            sliderMotorController.constraintComponent = sliderConstraint;
            sliderMotorController.pauseDuration = 1000;
            sliderMotorController.enableLinearMotor = true;
            sliderMotorController.maxLinearMotorForce = 1;
            sliderMotorController.targetLinearMotorVelocity = 18;
            sliderMotorController.enableAngularMotor = true;
            sliderMotorController.targetAngularMotorVelocity.set(1, 2, 3);

            sliderMotorController.setMotorLimit(-3, 8)
            sliderMotorController.drawTrackAtInit(true, Color.COLOR_RED)

            GUIHelp.addFolder('sliderMotorController').open()
            GUIHelp.addButton('fracture', () => sliderConstraint.constraint.setBreakingImpulseThreshold(0))

            GUIHelp.add(sliderMotorController, 'enable')
            GUIHelp.add(sliderMotorController, 'enableLinearMotor').onChange(v => sliderMotorController.onEnable())
            GUIHelp.add(sliderMotorController, 'targetLinearMotorVelocity', -1, 200, 0.1).onChange(v => sliderMotorController.constraint?.setTargetLinMotorVelocity(v))
            GUIHelp.add(sliderMotorController, 'maxLinearMotorForce', -1, 200, 0.1).onChange(v => sliderMotorController.constraint?.setMaxLinMotorForce(v))
            GUIHelp.add(sliderMotorController, 'pauseDuration', 0, 10000, 1000)
            GUIHelp.add(sliderMotorController, 'enableAngularMotor')
            GUIHelp.add(sliderMotorController.targetAngularMotorVelocity, 'x', -10, 100, 0.1).name('angularX')
            GUIHelp.add(sliderMotorController.targetAngularMotorVelocity, 'y', -10, 100, 0.1).name('angularY')
            GUIHelp.add(sliderMotorController.targetAngularMotorVelocity, 'z', -10, 100, 0.1).name('angularZ')


        }
        // 组合组件约束测试： 铰链约束、 锥形扭转约束
        if (false) {
            // box对象
            let boxObj = Object3DUtil.GetSingleCube(4, 4, 4, Math.random(), Math.random(), Math.random());
            boxObj.localPosition = new Vector3(-99, -15, -80);
            boxObj.rotationX = 80;
            this.object3D.addChild(boxObj);

            // box刚体组件
            let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
            boxObjRbComponent.shape = ShapeTypes.btBoxShape;
            boxObjRbComponent.mass = 100;
            boxObjRbComponent.damping = new Vector2(0.2, 0.2);
            boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;
            boxObjRbComponent.addInitedFunction(() => {
                console.log('start');
                // let frameA_single = new Ammo.btTransform();
                // frameA_single.setIdentity()
                // frameA_single.setRotation(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(10,50,10)))
                // let constraint = new Ammo.btHingeConstraint(boxObjRbComponent.btRigidbody, frameA_single, true);
                // Physics.world.addConstraint(constraint, true);
                // constraint.enableAngularMotor(true, 2, 2);

            }, this)

            // let hinge = boxObj.addComponent(HingeConstraint)
            let coneTwistConstraint = boxObj.addComponent(ConeTwistConstraint)



        }
    }

}