import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry } from '@orillusion/core'
import { AmmoRigidBody, ShapeTypes } from "@/physics";

export class BoxGenerator extends ComponentBase {

    public hieght: number = 100
    // save last time
    private _lastTime: number = performance.now()

    // a simple loop update
    public onUpdate(): void {
        // get current time
        let now: number = performance.now()
        // add a box every 300ms
        if (now - this._lastTime > 3000) {
            // add a box
            this._addBox()
            // remove the first box after 500 boxes
            // if (this.object3D.entityChildren.length > 50) this.object3D.removeChildByIndex(4)
            // save current time
            this._lastTime = now
        }
    }

    // add a box
    private _addBox(): void {
        const obj = new Object3D()
        let mr = obj.addComponent(MeshRenderer)
        // mr.geometry = new BoxGeometry(5, 5, 5)
        mr.geometry = new SphereGeometry(5, 16, 16)
        let mat = new LitMaterial()
        mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
        mr.material = mat;
        // obj.localPosition = new Vector3(Math.random() * 1000 - 500, this.hieght, Math.random() * 1000 - 500)
        obj.localPosition = new Vector3(Math.random() * 200 - 100, this.hieght, Math.random() * 200 - 100)
        obj.localRotation = new Vector3(Math.random() * 360, Math.random() * 360, Math.random() * 360)
        // add a rigidbody with mass 10
        let rigidbody = obj.addComponent(AmmoRigidBody)
        rigidbody.mass = 1
        rigidbody.shape = ShapeTypes.btSphereShape
        rigidbody.radius = 5

        this.object3D.addChild(obj)
    }
}