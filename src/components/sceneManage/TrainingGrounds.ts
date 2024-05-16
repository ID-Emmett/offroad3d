import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D } from '@orillusion/core'
import { AmmoRigidBody, ShapeTypes } from "@/physics";

export class TrainingGrounds extends ComponentBase {

    async start() {
        let model = await Engine3D.res.loadGltf('models/venue/training_grounds3.glb')
        // model.scaleX = model.scaleY = model.scaleZ = 100
        // model.localScale = new Vector3(100,100,100)
        let rigidbody = model.addComponent(AmmoRigidBody)
        rigidbody.shape = ShapeTypes.btBvhTriangleMeshShape
        this.object3D.transform.scene3D.addChild(model)
    }

    public onUpdate(): void {

    }
}