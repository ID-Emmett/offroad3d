import { Vector3, MeshRenderer, GeometryBase, PlaneGeometry, Quaternion, ComponentBase, VertexAttributeName } from '@orillusion/core';
import { ActivationState, Ammo, Physics, PhysicsMathUtil, SoftBodyComponentBase, type CornerType } from '..';

export class ClothSoftBody extends ComponentBase {
    private _btBodyInited: boolean;

    private _btSoftBody: Ammo.btSoftBody;
    private _appendRigidbody: Ammo.btRigidBody;

    private _segmentW: number;
    private _segmentH: number;

    public mass: number = 1;
    public margin: number = 0.02
    public fixNodeIndices: CornerType[] | number[]

    private _geometry: PlaneGeometry;

    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];

    private diff: Vector3 = new Vector3()

    public get segmentW(): number {
        return this._segmentW
    }
    public get segmentH(): number {
        return this._segmentH
    }


    /**
     * 锚点索引数组
     */
    public anchorIndices: CornerType[] | number[] = [];

    /**
     * 影响力系数，表示锚点对软体节点的影响程度。其值通常在 0 到 1 之间，默认 0.5
     */
    public influence: number | number[] = 0.5;

    /**
     * 是否禁用锚定点和刚体之间的碰撞, 默认 false 会产生碰撞
     */
    public disableCollision: boolean | boolean[] = false;

    /**
     * 软体同步至刚体的相对位置，默认位于刚体原点
     * 设置为 Vector(1,2,3) 时软体的坐标是相对刚体的 x+1, y+2, z+3
     */
    public relativePosition: Vector3

    /**
     * 软体与世界坐标的绝对旋转
     */
    public absoluteRotation: Vector3

    /**
     * 锚定的刚体
     */
    public get appendRigidbody(): Ammo.btRigidBody {
        return this._appendRigidbody;
    }
    public set appendRigidbody(rb: Ammo.btRigidBody) {
        this._appendRigidbody = rb;
        this.diff.set(0, 0, 0)
    }

    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftBody;
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

    init(): void {
        if (!Physics.isSoftBodyWord) {
            console.error('！！重置为软体世界，之前创建的刚体将会被销毁')
            Physics.switchWorld(true);
        }

        this._geometry = this.object3D.getComponent(MeshRenderer).geometry as PlaneGeometry;
        if (!(this._geometry instanceof PlaneGeometry)) throw new Error('The cloth softbody requires plane geometry')
        this._segmentW = this._geometry.segmentW;
        this._segmentH = this._geometry.segmentH;
    }

    async start(): Promise<void> {
        this.initSoftBody();

        for (let i = 0; i < this._initedFunctions.length; i++) {
            let fun = this._initedFunctions[i];
            fun.fun.call(fun.thisObj);
        }
    }

    private initSoftBody(): void {
        if (this._btBodyInited) return;

        const softBodyHelpers = new Ammo.btSoftBodyHelpers();
        const softBodyWorldInfo = Physics.worldInfo;

        const halfWidth = this._geometry.width / 2;
        const halfHeight = this._geometry.height / 2;

        const clothCorner00 = PhysicsMathUtil.setBtVector3(-halfWidth, halfHeight, 0, PhysicsMathUtil.tmpVecA);
        const clothCorner01 = PhysicsMathUtil.setBtVector3(halfWidth, halfHeight, 0, PhysicsMathUtil.tmpVecB);
        const clothCorner10 = PhysicsMathUtil.setBtVector3(-halfWidth, -halfHeight, 0, PhysicsMathUtil.tmpVecC);
        const clothCorner11 = PhysicsMathUtil.setBtVector3(halfWidth, -halfHeight, 0, PhysicsMathUtil.tmpVecD);
        this._btSoftBody = softBodyHelpers.CreatePatch(
            softBodyWorldInfo,
            clothCorner00,
            clothCorner01,
            clothCorner10,
            clothCorner11,
            this.segmentW + 1,
            this.segmentH + 1,
            0,
            true
        );
        let sbConfig = this._btSoftBody.get_m_cfg();
        sbConfig.set_viterations(10); // Position iterations
        sbConfig.set_piterations(10); // Position solver iterations
        // sbConfig.set_diterations(10); // Dynamic solver iterations
        // sbConfig.set_citerations(10); // Constraint solver iterations
        this._btSoftBody.setActivationState(4);

        sbConfig.set_kDF(0.2); // Dynamic friction
        sbConfig.set_kDP(0.01); // Damping coefficient
        sbConfig.set_kLF(0.15); // Lift factor
        sbConfig.set_kDG(0.01); // Drag coefficient 

        // material.set_m_kVST(0.4); // 设置体积弹性系数
        this._btSoftBody.get_m_materials().at(0).set_m_kLST(0.4);
        this._btSoftBody.get_m_materials().at(0).set_m_kAST(0.4);

        this._btSoftBody.setTotalMass(this.mass, false);
        Ammo.castObject(this._btSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(this.margin * 3);

        this._btSoftBody.generateBendingConstraints(2, this._btSoftBody.get_m_materials().at(0)); // 柔体的弯曲约束 distance 有效参数为1，2，3

        if (this.fixNodeIndices?.length) {
            if (typeof this.fixNodeIndices[0] === 'number') {
                this.fixClothNode(this.fixNodeIndices as number[])
            } else {
                let indexes = this.getCornerIndices(this.fixNodeIndices as CornerType[])
                this.fixClothNode(indexes)
            }
        }

        if (this.anchorIndices.length > 0) {
            if (!this.appendRigidbody) throw new Error('Needs a rigid body');
            this.setAnchor()

        }

        Physics.addSoftBody(this._btSoftBody);
        this._btBodyInited = true;
    }

    /**
     * 计算索引
     * @param x 水平位置（列号）
     * @param y 垂直位置（行号）
     * @returns index
     */
    public getVertexIndex(x: number, y: number): number {
        return y * (this.segmentW + 1) + x;
    }

    /**
     * 获取指定位置的索引
     */
    public getCornerIndices(cornerList: CornerType[]): number[] {
        return cornerList.map(corner => {
            switch (corner) {
                case 'left':
                    return this.getVertexIndex(0, Math.floor(this.segmentH / 2));
                case 'right':
                    return this.getVertexIndex(this.segmentW, Math.floor(this.segmentH / 2));
                case 'top':
                    return this.getVertexIndex(Math.floor(this.segmentW / 2), 0);
                case 'bottom':
                    return this.getVertexIndex(Math.floor(this.segmentW / 2), this.segmentH);
                case 'center':
                    return this.getVertexIndex(Math.floor(this.segmentW / 2), Math.floor(this.segmentH / 2));
                case 'leftTop':
                    return 0;
                case 'rightTop':
                    return this.segmentW;
                case 'leftBottom':
                    return this.getVertexIndex(0, this.segmentH);
                case 'rightBottom':
                    return this.getVertexIndex(this.segmentW, this.segmentH);
                default:
                    throw new Error('Invalid corner');
            }
        })
    }


    private setAnchor() {
        // 获取节点索引
        let anchorIndices = typeof this.anchorIndices[0] === 'number'
            ? this.anchorIndices as number[]
            : this.getCornerIndices(this.anchorIndices as CornerType[])

        // 检查节点索引的有效性
        let nodesSize = this.btSoftBody.get_m_nodes().size()
        for (let nodeIndex of anchorIndices) {
            if (nodeIndex < 0 || nodeIndex >= nodesSize) {
                console.error(`Invalid node index ${nodeIndex} for soft body`);
                return;
            }
        }

        // 应用变换，控制软体的位置和旋转，以便在刚体的具体位置添加锚点
        this.relativePosition ||= new Vector3()
        this.absoluteRotation ||= new Vector3()
        PhysicsMathUtil.fromBtVector3(this.appendRigidbody.getWorldTransform().getOrigin(), Vector3.HELP_0);
        Vector3.HELP_0.add(this.relativePosition, Vector3.HELP_1);
        // this.updateTransform(Vector3.HELP_1, this.absoluteRotation)
        Quaternion.HELP_0.fromEulerAngles(this.absoluteRotation.x, this.absoluteRotation.y, this.absoluteRotation.z)
        this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0));
        this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(Vector3.HELP_1));


        // 设置锚点
        anchorIndices.forEach((nodeIndex, idx) => {
            let influence = this.influence instanceof Array ? (this.influence[idx] ?? 0.5) : this.influence
            let disableCollision = this.disableCollision instanceof Array ? (this.disableCollision[idx] ?? false) : this.disableCollision
            this.btSoftBody.appendAnchor(nodeIndex, this.appendRigidbody, disableCollision, influence);
        });
    }

    /**
     * 固定布料节点
     */
    public fixClothNode(index: Array<number>) {
        const nodes = this._btSoftBody.get_m_nodes();

        index.forEach(i => {
            if (i >= 0 && i < nodes.size()) {
                nodes.at(i).get_m_v().setValue(0, 0, 0); // 设置速度为零
                nodes.at(i).get_m_f().setValue(0, 0, 0); // 设置力为零
                nodes.at(i).set_m_im(0);
            } else {
                console.warn(`Index ${i} is out of bounds for nodes array.`);
            }
        });
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

        if (this.appendRigidbody) {
            this.appendRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            const nowPos = this.appendRigidbody.getWorldTransform().getOrigin();

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

    /**
     * clear anchors
     */
    public clearAnchor() {
        console.log('destroy anchor');
        let anchors = this._btSoftBody.get_m_anchors();
        anchors.clear();
        this._btSoftBody.set_m_anchors(anchors);
        this._appendRigidbody = null
    }

    public destroy(force?: boolean): void {

        if (this._btBodyInited) {
            if (Physics.world instanceof Ammo.btSoftRigidDynamicsWorld) {
                Physics.world.removeSoftBody(this._btSoftBody);
                Ammo.destroy(this._btSoftBody);
            } else {
                console.warn('rigid body world can not be destroyed Soft bodies.');
            }

            this._btSoftBody = null;
            this._btBodyInited = false;
            this._appendRigidbody = null
        }
        this._initedFunctions = null;

        super.destroy(force);
    }
}
