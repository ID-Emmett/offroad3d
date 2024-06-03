import { Vector3, MeshRenderer, GeometryBase, PlaneGeometry, Quaternion } from '@orillusion/core';
import { ActivationState, Ammo, Physics, PhysicsMathUtil, SoftBodyComponentBase, type CornerType } from '..';

export class ClothSoftBodyComponent extends SoftBodyComponentBase {
    private segmentW: number;
    private segmentH: number;
    public margin: number = 0.02
    public fixNodeIndices: CornerType[] | number[]
    protected _geometry: PlaneGeometry;

    init(): void {
        this._geometry = this.object3D.getComponent(MeshRenderer).geometry as PlaneGeometry;
        if (!(this._geometry instanceof PlaneGeometry)) throw new Error('The cloth softbody requires plane geometry')
        this.segmentW = this._geometry.segmentW;
        this.segmentH = this._geometry.segmentH;
    }

    protected initSoftBody(): void {
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


        /* 
                set_viterations(value)
                作用：设置位置迭代次数。增加迭代次数可以提高柔体模拟的准确性，但会增加计算成本。
                示例：softBody.get_m_cfg().set_viterations(10);

                set_piterations(value)
                作用：设置位置求解器迭代次数（Position Solver Iterations）。控制柔体在位置求解过程中的迭代次数。
                示例：softBody.get_m_cfg().set_piterations(10);

                set_diterations(value)
                作用：设置动态求解器迭代次数（Dynamic Solver Iterations）。控制柔体在动态求解过程中的迭代次数。
                示例：softBody.get_m_cfg().set_diterations(10);

                set_citerations(value)
                作用：设置约束迭代次数（Constraint Solver Iterations）。控制柔体在处理约束时的迭代次数。
                示例：softBody.get_m_cfg().set_citerations(10);

                set_kVCF(value)
                作用：设置体积保持系数（Volume Conservation Factor）。控制柔体在模拟过程中保持体积的能力。
                示例：softBody.get_m_cfg().set_kVCF(1.0);

                set_kDP(value)
                作用：设置阻尼系数（Damping Coefficient）。控制柔体的阻尼效果。
                示例：softBody.get_m_cfg().set_kDP(0.01);

                set_kDG(value)
                作用：设置拖拽系数（Drag Coefficient）。控制柔体的空气阻力效果。
                示例：softBody.get_m_cfg().set_kDG(0.01);

                set_kLF(value)
                作用：设置升力系数（Lift Coefficient）。控制柔体的升力效果。
                示例：softBody.get_m_cfg().set_kLF(0.05);

                set_kPR(value)
                作用：设置压力系数（Pressure Coefficient）。控制柔体的内部压力。
                示例：softBody.get_m_cfg().set_kPR(1.0);
         */
        // sbConfig.set_kVCF(1.0); // Volume conservation factor
        // sbConfig.set_kDP(0.01); // Damping coefficient
        // sbConfig.set_kDG(0.01); // Drag coefficient
        // sbConfig.set_kLF(0.05); // Lift coefficient


        // try {
        //     sbConfig.set_kPR(0.01); // Pressure coefficient
        // } catch (e) {
        //     console.error("Error setting kPR: ", e);
        // }

        // sbConfig.set_kVC(20); // Volume conservation

        sbConfig.set_kDF(0.2); // Dynamic friction
        sbConfig.set_kDP(0.01); // Damping coefficient
        sbConfig.set_kLF(0.15); // Lift factor
        sbConfig.set_kDG(0.01); // Drag coefficient 

        // sbConfig.set_kPR(1); // Pressure coefficient 报错
        // sbConfig.set_kVCF(0.5); // Volume conversation factor

        /*
            set_kVCF(value) - 体积保持因子(Volume Conservation Factor)
            作用：控制柔体的体积保持。
            示例：softBody.get_m_cfg().set_kVCF(1.0);

            set_kDP(value) - 阻尼系数(Damping Coefficient)
            作用：控制柔体的阻尼。
            示例：softBody.get_m_cfg().set_kDP(0.01);

            set_kDG(value) - 拖动系数(Drag Coefficient)
            作用：控制柔体的空气阻力。
            示例：softBody.get_m_cfg().set_kDG(0.01);

            set_kLF(value) - 升力系数(Lift Coefficient)
            作用：控制柔体的升力。
            示例：softBody.get_m_cfg().set_kLF(0.05);

            set_kPR(value) - 压力系数(Pressure Coefficient)
            作用：控制柔体的内部压力。
            示例：softBody.get_m_cfg().set_kPR(1.0);

            set_kVC(value) - 体积刚度系数(Volume Stiffness Coefficient)
            作用：控制柔体的体积刚度。
            示例：softBody.get_m_cfg().set_kVC(20);
         */



        // 获取材质并设置参数
        // const material = this._btSoftBody.get_m_materials().at(0);
        // material.set_m_kLST(0.4); // 设置线性弹性系数
        // material.set_m_kAST(1); // 设置角度弹性系数

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
     * 以水平分段为 10 举例
     * 左上角：x = 0，y = 0，-> 0 * (10 + 1) + 0 = 0。
     * 右上角：x = 10，y = 0，-> 0 * (10 + 1) + 10 = 10。
     * 左下角：x = 0，y = 10，-> 10 * (10 + 1) + 0 = 110。
     * 右下角：x = 10，y = 10，-> 10 * (10 + 1) + 10 = 120。
     * 中心点：x = 5，y = 5，-> 5 * (10 + 1) + 5 = 55。
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
}
