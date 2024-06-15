import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil, PlaneGeometry, GPUCullMode, VertexAttributeName, BoxGeometry, GeometryBase, UnLitMaterial, BitmapTexture2D, CEvent, Vector2, BoundUtil, AxisObject, ComponentCollect } from '@orillusion/core'
import { ActivationState, RigidBodyComponent, CollisionFlags, ShapeTypes, RigidBodyUtil, Ammo, Physics, CollisionMask, ClothSoftBody, SliderConstraint, PhysicsMathUtil } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil'
import { GUIHelp } from "@/utils/debug/GUIHelp";


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
        if (true) {
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
                boxRBC.mass = 50
                boxes.addChild(box)
            }

            // sphere
            let sphere = model.getChildByName(`sphere_1`) as Object3D;
            sphere.scaleX = sphere.scaleY = sphere.scaleZ = SCALE;
            sphere.localPosition = model.localPosition.add(sphere.localPosition.scaleBy(SCALE), Vector3.HELP_0)

            let sphereRBC = sphere.addComponent(RigidBodyComponent);
            sphereRBC.shape = ShapeTypes.btSphereShape;
            sphereRBC.radius = 3.79 * SCALE / 2;
            sphereRBC.mass = 50;
            boxes.addChild(sphere);

            // cone
            let cone = model.getChildByName(`cone_1`) as Object3D;
            cone.scaleX = cone.scaleY = cone.scaleZ = SCALE;
            cone.localPosition = model.localPosition.add(cone.localPosition.scaleBy(SCALE), Vector3.HELP_0)
            let coneRBC = cone.addComponent(RigidBodyComponent);
            coneRBC.shape = ShapeTypes.btConvexHullShape;
            coneRBC.mass = 50;
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

        this.object3D.addChild(model)

        this.debug(model, rigidbody)

        Engine3D.inputSystem.dispatchEvent(new CEvent("MainModelInited"));
    }

    private debug(model: Object3D, rigidbody: RigidBodyComponent) {
        // let gui = GUIUtil.GUI
        GUIHelp.addFolder('mainModelComponent').open()
        GUIHelp.add(model.transform, 'enable').onChange(v => {
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
        GUIHelp.add(model, 'x', -300, 300, 0.1).onFinishChange((v) => changePos())
        GUIHelp.add(model, 'y', -300, 300, 0.1).onFinishChange((v) => changePos())
        GUIHelp.add(model, 'z', -300, 300, 0.1).onFinishChange((v) => changePos())

        const changePos = () => {
            model.getComponent(RigidBodyComponent)?.resetRigidBody();
            // 激活所有动态刚体
            RigidBodyUtil.activateAllKinematicObject()
        }
    }

}