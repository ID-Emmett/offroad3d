import { ComponentBase, GeometryBase, Quaternion, Vector3, VertexAttributeName } from '@orillusion/core';
import { ActivationState, Ammo, Physics, PhysicsMathUtil } from '.';

/**
 * SoftBody Component
 * 用于创建和管理软体物体，例如布料、柔性物体等。
 * @group Components
 */
export abstract class SoftBodyComponentBase extends ComponentBase {
    protected _btSoftBody: Ammo.btSoftBody;
    protected _btBodyInited: boolean = false;

    public mass: number = 1;

    protected abstract _geometry: GeometryBase;

    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];

    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    init() {
        if (!Physics.isSoftBodyWord) {
            console.error('！！重置为软体世界，之前创建的刚体将会被销毁')
            Physics.switchWorld(true);
        }
    }

    protected abstract initSoftBody(): void;

    async start(): Promise<void> {
        this.initSoftBody();

        const position = this.transform.localPosition;
        const rotation = this.transform.localRotation;
        this.updateTransform(position, rotation)
        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;

        for (let i = 0; i < this._initedFunctions.length; i++) {
            let fun = this._initedFunctions[i];
            fun.fun.call(fun.thisObj);
        }
    }

    private _softBodyTranslate: Vector3 = new Vector3()
    private _softBodyRotate: Vector3 = new Vector3()

    /**
     * 更新软体变换，默认累加变换，basedOnOrigin 为 true 时基于原点变换
     * 物理模拟时可能会更新软体变换 导致记录的位移和旋转不准确，最佳实践为创建软体后立即同步设置
     */
    public updateTransform(position: Vector3, rotation: Vector3, basedOnOrigin: boolean = false) {

        if (basedOnOrigin) {
            // 先回到原点，再应用新的变换
            const negatePos = this._softBodyTranslate.negate()
            const negateRot = this._softBodyRotate.negate()
            this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(negatePos));
            this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(negateRot.x, negateRot.y, negateRot.z)));
            this._softBodyTranslate.copy(position)
            this._softBodyRotate.copy(rotation)

        } else {
            Vector3.add(this._softBodyTranslate, position, this._softBodyTranslate)
            Vector3.add(this._softBodyRotate, rotation, this._softBodyRotate)
        }

        /* 先旋转再平移，矩阵变换不满足交换律，先后顺序不能改，rotate 与 translate 是相对定位 */
        this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(rotation.x, rotation.y, rotation.z)));
        this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(position));
    }

    /**
     * Add init callback
     * @param fun callback function
     * @param thisObj this
     */
    public addInitedFunction(fun: Function, thisObj: Object) {
        this._initedFunctions.push({ fun: fun, thisObj: thisObj });
    }

    /**
     * Remove init callback
     * @param fun callback function
     * @param thisObj this
     */
    public removeInitedFunction(fun: Function, thisObj: Object) {
        for (let i = 0; i < this._initedFunctions.length; i++) {
            let item = this._initedFunctions[i];
            if (item.fun === fun && item.thisObj === thisObj) {
                this._initedFunctions.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 停止软体运动
     */
    public stopSoftBodyMovement(): void {
        const nodes = this._btSoftBody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            node.get_m_v().setValue(0, 0, 0); // 设置速度为零
            node.get_m_f().setValue(0, 0, 0); // 设置力为零
            // node.get_m_q().setValue(0, 0, 0); // 重置节点的位置变化
        }
    }

    onUpdate(): void {
        if (this._btBodyInited) {
            // 更新软体物体的位置
            const nodes = this._btSoftBody.get_m_nodes();
            const vertices = this._geometry.getAttribute(VertexAttributeName.position);
            const normals = this._geometry.getAttribute(VertexAttributeName.normal);
            // console.log(normals.data.length);

            // console.log(vertices.data.length);
            // console.log(nodes.size());

            for (let i = 0; i < nodes.size(); i++) {
                const node = nodes.at(i);
                const pos = node.get_m_x();

                vertices.data[3 * i] = pos.x();
                vertices.data[3 * i + 1] = pos.y();
                vertices.data[3 * i + 2] = pos.z();

                const normal = node.get_m_n();
                normals.data[3 * i] = normal.x();
                normals.data[3 * i + 1] = normal.y();
                normals.data[3 * i + 2] = normal.z();
            }
            this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
            this._geometry.vertexBuffer.upload(VertexAttributeName.normal, normals);
        }
    }

    public destroy(force?: boolean): void {
        if (this._btBodyInited) {
            Physics.removeSoftBody(this._btSoftBody)
            this._btSoftBody = null
            this._btBodyInited = false;
        }
        this._initedFunctions = null;

        super.destroy(force);
    }

    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftBody;
    }
}