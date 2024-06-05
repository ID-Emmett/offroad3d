import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil, PlaneGeometry, GPUCullMode, VertexAttributeName, BoxGeometry, GeometryBase, UnLitMaterial, BitmapTexture2D, CEvent } from '@orillusion/core'
import { ActivationState, RigidBodyComponent, CollisionFlags, ShapeTypes, RigidBodyUtil, Ammo, Physics, CollisionMask, HingeConstraint } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil'
import { GUIHelp } from "@/utils/debug/GUIHelp";
import { VehicleControl } from '../vehicleManage';
import { ClothSoftBody } from '@/physics/softBody/ClothSoftBody';

export class MainModelComponent extends ComponentBase {

    async start() {
        // 峡谷
        // let model = await Engine3D.res.loadGltf('models/scene/level_blockout_modify.glb')

        // 低多边形集合
        // let model = await Engine3D.res.loadGltf('models/scene/volumes_modify.glb')

        // 训练场
        let model = await Engine3D.res.loadGltf('models/scene/training_grounds_modify.glb')

        // 加载模型顶点数据
        // const response = await fetch('json/modelData/level_blockout_modify.json')
        // const data = await response.json() as { vertices: Float32Array, indices: Uint16Array };
        // const vertices = new Float32Array(data.vertices);
        // const indices = new Uint16Array(data.indices);

        // Adjust Transform
        const SCALE = 0.3
        model.scaleX = model.scaleY = model.scaleZ = SCALE
        // model.localQuaternion = new Quaternion(0.75, 0, 0, -0.75)

        // model.y = -5
        model.x = -87.5
        model.y = -23.1
        model.z = -87.2

        // split training_grounds
        {
            let boxes = new Object3D()
            boxes.name = 'training_grounds_splitObject'

            // box
            const boxNum = 21;
            for (let i = 1; i <= boxNum; i++) {
                let box = model.getChildByName(`box_${i}`) as Object3D;
                box.scaleX = box.scaleY = box.scaleZ = SCALE;
                box.localPosition = model.localPosition.add(box.localPosition.scaleBy(SCALE), Vector3.HELP_0)

                let boxRBC = box.addComponent(RigidBodyComponent);
                boxRBC.shape = ShapeTypes.btBoxShape;
                boxRBC.size = new Vector3(1.54, 1.54, 1.54).scaleBy(SCALE);
                boxRBC.mass = 10
                boxes.addChild(box)
            }

            // sphere
            let sphere = model.getChildByName(`sphere_1`) as Object3D;
            sphere.scaleX = sphere.scaleY = sphere.scaleZ = SCALE;
            sphere.localPosition = model.localPosition.add(sphere.localPosition.scaleBy(SCALE), Vector3.HELP_0)

            let sphereRBC = sphere.addComponent(RigidBodyComponent);
            sphereRBC.shape = ShapeTypes.btSphereShape;
            sphereRBC.radius = 3.79 * SCALE / 2;
            sphereRBC.mass = 20;
            boxes.addChild(sphere);

            // cone
            let cone = model.getChildByName(`cone_1`) as Object3D;
            cone.scaleX = cone.scaleY = cone.scaleZ = SCALE;
            cone.localPosition = model.localPosition.add(cone.localPosition.scaleBy(SCALE), Vector3.HELP_0)
            let coneRBC = cone.addComponent(RigidBodyComponent);
            coneRBC.shape = ShapeTypes.btConvexHullShape;
            coneRBC.mass = 10;
            boxes.addChild(cone);

            this.object3D.addChild(boxes)
        }

        let rigidbody = model.addComponent(RigidBodyComponent)
        rigidbody.shape = ShapeTypes.btBvhTriangleMeshShape
        rigidbody.userIndex = 2;
        // rigidbody.group = CollisionGroup.TERRAIN
        // rigidbody.mask = CollisionMask.DEFAULT_MASK
        // rigidbody.modelVertices = vertices
        // rigidbody.modelIndices = indices

        this.object3D.transform.scene3D.addChild(model)

        this.debug(model, rigidbody)


        // 空心复合体测试
        // let testHollow = Object3DUtil.GetSingleCube(0.1, 0.1, 0.1, 0.5, 0.2, 0.9)
        // let shapes = RigidBodyUtil.generatesHollowShapes(new Vector3(13, 1, 15), new Vector3(1, 1, 1), Vector3.ZERO, 'Y')
        // let testRBC = testHollow.addComponent(RigidBodyComponent)
        // testRBC.shape = ShapeTypes.btCompoundShape
        // testRBC.childShapes = shapes
        // this.object3D.transform.scene3D.addChild(testHollow)


        // 静态平面刚体测试
        if (false) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(1000, 1000, 1, 1)
            mr.material = new LitMaterial()
            mr.material.cullMode = GPUCullMode.none
            obj.localPosition = new Vector3(0, 0, 0)
            this.object3D.transform.scene3D.addChild(obj)

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

            this.object3D.transform.scene3D.addChild(obj)

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

            this.object3D.transform.scene3D.addChild(obj)
            let softBody = obj.addComponent(ClothSoftBody)
            softBody.fixNodeIndices = ['leftTop', 'rightTop']
            softBody.applyPosition = new Vector3(-89.8, -21.2, -110)
            softBody.applyRotation = new Vector3(0, 90, 0)

            // GUIHelp.addFolder('SoftBody wukong')
            // GUIHelp.open()
            // GUIHelp.addButton('fixClothNode leftBottom', () => softBody.applyFixedNodes(['leftBottom']))
        }

        Engine3D.inputSystem.dispatchEvent(new CEvent("MainModelInited"));
    }

    private debug(model: Object3D, rigidbody: RigidBodyComponent) {
        let gui = GUIUtil.GUI
        gui.addFolder('mainModelComponent')
        gui.add(model.transform, 'enable').onChange(v => {
            if (!rigidbody?.btRigidbody) return
            if (v) {
                rigidbody.btRigidbody.setActivationState(ActivationState.ACTIVE_TAG);
                Physics.world.addRigidBody(rigidbody.btRigidbody);
            } else {
                rigidbody.btRigidbody.setActivationState(ActivationState.DISABLE_SIMULATION);
                Physics.world.removeRigidBody(rigidbody.btRigidbody);

                // 激活所有动态刚体
                RigidBodyUtil.activateAllKinematicObject()

                console.log(Physics.rigidBodyMapping.getAllGraphicObjectMap);

            }
        })
        gui.add(model, 'x', -300, 300, 0.1).onFinishChange((v) => changePos())
        gui.add(model, 'y', -300, 300, 0.1).onFinishChange((v) => changePos())
        gui.add(model, 'z', -300, 300, 0.1).onFinishChange((v) => changePos())

        const changePos = () =>{ 
            model.getComponent(RigidBodyComponent)?.resetRigidBody();
            // 激活所有动态刚体
            RigidBodyUtil.activateAllKinematicObject()
        }
        gui.open()
    }

}