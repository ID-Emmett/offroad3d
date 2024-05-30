import { ComponentBase, GeometryBase, Quaternion, Time, Vector3, VertexAttributeName } from '@orillusion/core';
import { ActivationState, Ammo, Physics, PhysicsMathUtil } from '.';

export abstract class SoftBodyComponentBase extends ComponentBase {
    public mass: number = 1;

    protected _btBodyInited: boolean = false;
    protected _btSoftBody: Ammo.btSoftBody;
    protected abstract _geometry: GeometryBase;
    protected abstract initSoftBody(): void;

    private _connectedRigidBody: Ammo.btRigidBody;
    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];
    private diff: Vector3 = new Vector3()

    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftBody;
    }

    /**
     * 连接的刚体
     */
    public get connectedRigidBody(): Ammo.btRigidBody {
        return this._connectedRigidBody;
    }
    public set connectedRigidBody(rb: Ammo.btRigidBody) {
        this._connectedRigidBody = rb;
        this.diff.set(0, 0, 0)
    }

    init() {
        if (!Physics.isSoftBodyWord) {
            console.error('！！重置为软体世界，之前创建的刚体将会被销毁')
            Physics.switchWorld(true);
        }
    }

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

    private _softBodyTranslate: Vector3 = new Vector3();
    private _softBodyRotate: Vector3 = new Vector3();

    /**
     * 更新软体变换，默认累加变换，basedOnOrigin 为 true 时基于原点变换
     * 物理模拟时可能会更新软体变换 导致记录的位移和旋转不准确，最佳实践为创建软体后立即同步设置
     */
    public updateTransform(position: Vector3, rotation: Vector3, basedOnOrigin: boolean = false) {
        if (basedOnOrigin) {
            // 先回到原点，再应用新的变换
            const negatePos = this._softBodyTranslate.negate();
            const negateRot = this._softBodyRotate.negate();
            this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(negatePos));
            this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(negateRot.x, negateRot.y, negateRot.z)));
            this._softBodyTranslate.copy(position);
            this._softBodyRotate.copy(rotation);
        } else {
            Vector3.add(this._softBodyTranslate, position, this._softBodyTranslate);
            Vector3.add(this._softBodyRotate, rotation, this._softBodyRotate);
        }

        /* 先旋转再平移，矩阵变换不满足交换律，先后顺序不能替换，注意 rotate 与 translate 是相对定位 */
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
            node.get_m_v().setValue(0, 0, 0);
            node.get_m_f().setValue(0, 0, 0);
        }
    }

    // 当软体锚定在刚体上时，根据刚体的实际物理坐标与插值坐标计算差值，
    // 将差值应用在软体的每个节点，以保证在刚体运动时软体能够保持平滑。
    // 这一做法是物理引擎与图形引擎的更新频率不一致的情况下的妥协方案。
    // 当物理引擎固定步长为 1/60 (60HZ) 图形引擎渲染帧率为 170 (170HZ) 时，物理世界的所有物体变换都是以60hz更新，
    // 通常情况下图形引擎每帧可以通过 getMotionState().getWorldTransform(tm) 来获取刚体在当前时间的插值变换，
    // 这个插值作用于同步图形对象变换，实际刚体位置可能并未更新。
    // 为了避免软体锚定在刚体上时可能的更新延迟，采用同步刚体插值的方式来更新软体节点。
    onUpdate(): void {
        if (!this._btBodyInited) return

        if (this.connectedRigidBody) {
            this.connectedRigidBody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            const nowPos = this.connectedRigidBody.getWorldTransform().getOrigin();

            PhysicsMathUtil.fromBtVector3(Physics.TEMP_TRANSFORM.getOrigin(), Vector3.HELP_0);
            PhysicsMathUtil.fromBtVector3(nowPos, Vector3.HELP_1);
            Vector3.sub(Vector3.HELP_0, Vector3.HELP_1, this.diff); // 插值位置 - 实际物理位置 得到差值 diff
        }

        const vertices = this._geometry.getAttribute(VertexAttributeName.position);
        const normals = this._geometry.getAttribute(VertexAttributeName.normal);

        const nodes = this._btSoftBody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            const pos = node.get_m_x();
            vertices.data[3 * i] = pos.x() + this.diff.x;
            vertices.data[3 * i + 1] = pos.y() + this.diff.y;
            vertices.data[3 * i + 2] = pos.z() + this.diff.z;

            const normal = node.get_m_n();
            normals.data[3 * i] = normal.x();
            normals.data[3 * i + 1] = normal.y();
            normals.data[3 * i + 2] = normal.z();
        }

        this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
        this._geometry.vertexBuffer.upload(VertexAttributeName.normal, normals);

    }

    public destroy(force?: boolean): void {
        if (this._btBodyInited) {
            Physics.removeSoftBody(this);
            this._btSoftBody = null;
            this._btBodyInited = false;
            this._connectedRigidBody = null
        }
        this._initedFunctions = null;

        super.destroy(force);
    }
}
