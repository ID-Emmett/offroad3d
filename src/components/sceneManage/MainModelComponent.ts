import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil } from '@orillusion/core'
import { ActivationState, AmmoRigidBody, CollisionFlags, ShapeTypes, RigidBodyUtil, rigidBodyMapping } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil'
import { Ammo, Physics } from '@orillusion/physics';


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
        // model.scaleX = model.scaleY = model.scaleZ = 15
        // model.localQuaternion = new Quaternion(0.75, 0, 0, -0.75)

        model.y = -33

        let rigidbody = model.addComponent(AmmoRigidBody)
        rigidbody.shape = ShapeTypes.btBvhTriangleMeshShape
        // rigidbody.modelVertices = vertices
        // rigidbody.modelIndices = indices

        this.object3D.transform.scene3D.addChild(model)

        this.debug(model, rigidbody)


        let testHollow = Object3DUtil.GetSingleCube(0.1, 0.1, 0.1, 0.5, 0.2, 0.9)
        let shapes = RigidBodyUtil.generatesHollowShapes(new Vector3(13, 2, 15), new Vector3(1, 2, 1), Vector3.ZERO, 'Y')
        let testRBC = testHollow.addComponent(AmmoRigidBody)
        testRBC.shape = ShapeTypes.btCompoundShape
        testRBC.childShapes = shapes
        this.object3D.transform.scene3D.addChild(testHollow)
    }

    private debug(model: Object3D, rigidbody: AmmoRigidBody) {
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
            }
        })
    }

    public onUpdate(): void {

    }
}