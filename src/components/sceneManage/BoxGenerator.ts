import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, BoxGeometry, CylinderGeometry, BoundUtil } from '@orillusion/core'
import { AmmoRigidBody, ShapeTypes } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil'

enum GeometryShape {
    'Box',
    'Sphere',
    'Cylinder',
}
export class BoxGenerator extends ComponentBase {

    private _lastTime: number = performance.now() // save last time

    public container: Object3D
    public positionY: number = 100
    public posRange: number = 200
    public offsetX: number = 0
    public offsetZ: number = 0
    public interval: number = 3000
    public size: number = 5
    public mass: number = 1
    public geometryShape: GeometryShape = GeometryShape.Sphere

    async start() {

        this.container = new Object3D()
        this.object3D.addChild(this.container)

        this.debug()
    }
    // a simple loop update
    public onUpdate(): void {
        // get current time
        let now: number = performance.now()
        // add a box every 300ms
        if (now - this._lastTime > this.interval) {
            // add a box
            this._addBox()
            // remove the first box after 100 boxes
            if (this.container.entityChildren.length > 100) {
                // this.container.removeChildByIndex(0)
                this.container.getChildByIndex(0).destroy()
            }
            // save current time
            this._lastTime = now
        }
    }

    // add a box
    private _addBox(): void {
        const obj = new Object3D()
        let mr = obj.addComponent(MeshRenderer)

        if (this.geometryShape === GeometryShape.Sphere) {
            mr.geometry = new SphereGeometry(this.size, 32, 32)
        } else if (this.geometryShape === GeometryShape.Box) {
            mr.geometry = new BoxGeometry(this.size, this.size, this.size)
        } else {
            mr.geometry = new CylinderGeometry(this.size, this.size, this.size, 32, 32)
        }

        let mat = new LitMaterial()
        mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
        if (this.geometryShape === GeometryShape.Cylinder) {
            mr.materials = [mat, mat, mat];
        } else {
            mr.material = mat;
        }

        obj.x = Math.random() * this.posRange - this.posRange / 2 + this.offsetX
        obj.y = this.positionY
        obj.z = Math.random() * this.posRange - this.posRange / 2 + this.offsetZ

        // 由于采用包围盒数据构建碰撞体，为了确保包围盒尺寸的准确性，初始化时应禁用旋转
        // obj.localRotation = new Vector3(Math.random() * 360, Math.random() * 360, Math.random() * 360)

        // add a rigidbody
        let rigidbody = obj.addComponent(AmmoRigidBody)
        rigidbody.mass = this.mass
        rigidbody.shape = this.geometryShape === GeometryShape.Sphere
            ? ShapeTypes.btSphereShape : this.geometryShape === GeometryShape.Box
                ? ShapeTypes.btBoxShape : ShapeTypes.btCylinderShape

        this.container.addChild(obj)
    }

    private debug() {
        let gui = GUIUtil.GUI
        gui.addFolder('boxGenerator')
        gui.add(this, 'enable');
        gui.add(this, 'interval', 100, 10000, 1);
        gui.add(this, 'positionY', -300, 300, 1);
        gui.add(this, 'posRange', 10, 1000, 1);
        gui.add(this, 'offsetX', -500, 500, 1);
        gui.add(this, 'offsetZ', -500, 500, 1);
        gui.add(this, 'size', 0.1, 10, 0.1);
        gui.add(this, 'mass', 0, 2000, 1);

        const GeometryShapeObject = Object.keys(GeometryShape)
            .filter(key => isNaN(Number(key))) // 过滤出非数值键
            .reduce((obj, key) => {
                obj[key] = GeometryShape[key as keyof typeof GeometryShape];
                return obj;
            }, {} as Record<string, GeometryShape>);
        gui.add({ geometryShape: this.geometryShape }, 'geometryShape', GeometryShapeObject).onChange(v => {
            this.geometryShape = +v
        })

        gui.addButton('numChildren', () => console.log(`boxGenerator numChildren: ${this.container.numChildren}`))
        gui.addButton('deleteChildren', () => {
            console.log(this.container.entityChildren.length);
            this.container.entityChildren.forEach(entity => entity.destroy())
        })
    }
}