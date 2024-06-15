// ClothSoftBody.ts

import { Vector3, MeshRenderer, PlaneGeometry, ComponentBase, VertexAttributeName, Quaternion } from '@orillusion/core';
import { Ammo, Physics, PhysicsMathUtil, type CornerType } from '..';
import { AnchorManager } from './AnchorManager';

export class ClothSoftBody extends ComponentBase {
    private _btBodyInited: boolean = false;
    private _btSoftBody: Ammo.btSoftBody;
    private _appendRigidbody: Ammo.btRigidBody;
    private _segmentW: number;
    private _segmentH: number;
    private _geometry: PlaneGeometry;
    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];
    private _diff: Vector3 = new Vector3();

    private anchorManager: AnchorManager;

    /**
     * (00,01,10,11) 布料四个角的位置，默认：
     * 
     * [-halfWidth, halfHeight, 0],
     * 
     * [halfWidth, halfHeight, 0],
     * 
     * [-halfWidth, -halfHeight, 0],
     * 
     * [halfWidth, -halfHeight, 0]
     */
    public clothCorners: [Vector3, Vector3, Vector3, Vector3];
    public mass: number = 1;
    public margin: number = 0.05;
    public fixNodeIndices: CornerType[] | number[] = [];
    public anchorIndices: CornerType[] | number[] = [];
    public influence: number | number[] = 0.5;
    public disableCollision: boolean | boolean[] = false;
    /**
     * 软体的位置，无锚点时，默认原点坐标 0,0,0 。
     * 添加锚点时，设置为 Vector(1,2,3) 软体的坐标是相对刚体的 x+1, y+2, z+3，默认与刚体坐标相同
     */
    public applyPosition: Vector3;
    /**
     * 软体的旋转，无锚点时，默认欧拉旋转 0,0,0 。
     * 添加锚点时，设置为 Vector(1,2,3) 软体的旋转是相对刚体的 x+1, y+2, z+3，默认与刚体旋转相同
     */
    public applyRotation: Vector3;


    constructor() {
        super();
        this.anchorManager = new AnchorManager(this);
    }

    public get segmentW(): number {
        return this._segmentW
    }
    public get segmentH(): number {
        return this._segmentH
    }

    public get appendRigidbody(): Ammo.btRigidBody {
        return this._appendRigidbody;
    }
    public set appendRigidbody(rb: Ammo.btRigidBody) {
        this._appendRigidbody = rb;
        this._diff.set(0, 0, 0);
    }

    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftBody;
    }

    public addInitedFunction(fun: Function, thisObj: Object) {
        this._initedFunctions.push({ fun: fun, thisObj: thisObj });
    }

    public removeInitedFunction(fun: Function, thisObj: Object) {
        this._initedFunctions = this._initedFunctions.filter(item => item.fun !== fun || item.thisObj !== thisObj);
    }

    public stopSoftBodyMovement(): void {
        const nodes = this.btSoftBody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            node.get_m_v().setValue(0, 0, 0);
            node.get_m_f().setValue(0, 0, 0);
        }
    }

    init(): void {
        if (!Physics.isSoftBodyWord) {
            console.error('！！重置为软体世界，之前创建的刚体将会被销毁');
            Physics.switchWorld(true);
        }

        this.applyPosition ||= new Vector3()
        this.applyRotation ||= new Vector3()

        let geometry = this.object3D.getComponent(MeshRenderer).geometry;
        if (!(geometry instanceof PlaneGeometry)) throw new Error('The cloth softbody requires plane geometry');
        this._geometry = geometry;
        this._segmentW = this._geometry.segmentW;
        this._segmentH = this._geometry.segmentH;
    }

    async start(): Promise<void> {
        this.initSoftBody();

        for (let { fun, thisObj } of this._initedFunctions) {
            fun.call(thisObj);
        }
    }

    private initSoftBody(): void {
        if (this.btBodyInited) return;

        let clothCorner00, clothCorner01, clothCorner10, clothCorner11
        if (!this.clothCorners) {
            const halfWidth = this._geometry.width / 2;
            const halfHeight = this._geometry.height / 2;
            clothCorner00 = PhysicsMathUtil.setBtVector3(-halfWidth, halfHeight, 0, PhysicsMathUtil.tmpVecA);
            clothCorner01 = PhysicsMathUtil.setBtVector3(halfWidth, halfHeight, 0, PhysicsMathUtil.tmpVecB);
            clothCorner10 = PhysicsMathUtil.setBtVector3(-halfWidth, -halfHeight, 0, PhysicsMathUtil.tmpVecC);
            clothCorner11 = PhysicsMathUtil.setBtVector3(halfWidth, -halfHeight, 0, PhysicsMathUtil.tmpVecD);
        } else {
            clothCorner00 = PhysicsMathUtil.toBtVector3(this.clothCorners[0], PhysicsMathUtil.tmpVecA)
            clothCorner01 = PhysicsMathUtil.toBtVector3(this.clothCorners[1], PhysicsMathUtil.tmpVecB);
            clothCorner10 = PhysicsMathUtil.toBtVector3(this.clothCorners[2], PhysicsMathUtil.tmpVecC);
            clothCorner11 = PhysicsMathUtil.toBtVector3(this.clothCorners[3], PhysicsMathUtil.tmpVecD);
        }

        this._btSoftBody = new Ammo.btSoftBodyHelpers().CreatePatch(
            Physics.worldInfo,
            clothCorner00,
            clothCorner01,
            clothCorner10,
            clothCorner11,
            this.segmentW + 1,
            this.segmentH + 1,
            0,
            true
        );

        this.configureSoftBody(this.btSoftBody);

        this.btSoftBody.setTotalMass(this.mass, false);
        Ammo.castObject(this.btSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(this.margin);
        this.btSoftBody.generateBendingConstraints(2, this.btSoftBody.get_m_materials().at(0));

        // 固定节点
        if (this.fixNodeIndices.length > 0) {
            this.applyFixedNodes(this.fixNodeIndices);
        }

        // 添加锚点
        if (this.anchorIndices.length > 0) {
            if (!this.appendRigidbody) throw new Error('Needs a rigid body');
            this.anchorManager.setAnchor();
        } else {
            // 先旋转再平移，矩阵变换不满足交换律，先后顺序不能替换
            Quaternion.HELP_0.fromEulerAngles(this.applyRotation.x, this.applyRotation.y, this.applyRotation.z)
            this.btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0));
            this.btSoftBody.translate(PhysicsMathUtil.toBtVector3(this.applyPosition));
        }

        // 布料变换将由顶点控制，避免影响需要重置图形对象变换
        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;

        Physics.addSoftBody(this.btSoftBody);
        this._btBodyInited = true;
    }

    public applyFixedNodes(nodeIndices: CornerType[] | number[]): void {
        this.anchorManager.fixClothNodes(nodeIndices);
    }

    private configureSoftBody(softBody: Ammo.btSoftBody): void {
        // 设置配置参数
        let sbConfig = softBody.get_m_cfg();
        sbConfig.set_viterations(10); // 位置迭代次数
        sbConfig.set_piterations(10); // 位置求解器迭代次数
        // sbConfig.set_diterations(10); // 动力学迭代次数
        // sbConfig.set_citerations(10); // 碰撞迭代次数
        // sbConfig.set_kVCF(1.0); // 速度收敛系数
        // sbConfig.set_kDP(0.1); // 阻尼系数
        // sbConfig.set_kDG(0.0); // 阻力系数
        // sbConfig.set_kLF(0.05); // 升力系数
        // sbConfig.set_kPR(0.0); // 压力系数
        // sbConfig.set_kVC(0.0); // 体积保护系数
        // sbConfig.set_kDF(0.0); // 动力学系数
        // sbConfig.set_kMT(0.0); // 电磁系数
        // sbConfig.set_kCHR(1.0); // 刚性系数
        // sbConfig.set_kKHR(0.5); // 刚性恢复系数
        // sbConfig.set_kSHR(1.0); // 剪切刚性系数
        // sbConfig.set_kAHR(0.1); // 角度恢复系数
        // sbConfig.set_kSRHR_CL(1.0); // 拉伸刚性恢复系数
        // sbConfig.set_kSKHR_CL(0.5); // 刚性恢复系数
        // sbConfig.set_kSSHR_CL(0.1); // 剪切刚性恢复系数
        // sbConfig.set_kSR_SPLT_CL(0.5); // 拉伸分割系数
        // sbConfig.set_kSK_SPLT_CL(0.5); // 剪切分割系数
        // sbConfig.set_kSS_SPLT_CL(0.5); // 剪切分割系数
        // sbConfig.set_maxvolume(1.0); // 最大体积
        // sbConfig.set_timescale(1.0); // 时间缩放系数
        // sbConfig.set_collisions(0); // 碰撞设置

        // 获取材质并设置参数
        const material = softBody.get_m_materials().at(0);
        material.set_m_kLST(0.4); // 设置线性弹性系数
        material.set_m_kAST(0.4); // 设置角度弹性系数
        // material.set_m_kVST(0.2); // 设置体积弹性系数
        // material.set_m_flags(0); // 设置材质标志
    }



    onUpdate(): void {
        if (!this._btBodyInited) return;

        // 根据锚定的刚体的插值坐标平滑软体
        if (this.appendRigidbody) {
            this.appendRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            const nowPos = this.appendRigidbody.getWorldTransform().getOrigin();

            PhysicsMathUtil.fromBtVector3(Physics.TEMP_TRANSFORM.getOrigin(), Vector3.HELP_0);
            PhysicsMathUtil.fromBtVector3(nowPos, Vector3.HELP_1);
            Vector3.sub(Vector3.HELP_0, Vector3.HELP_1, this._diff);
        }

        const vertices = this._geometry.getAttribute(VertexAttributeName.position);
        const normals = this._geometry.getAttribute(VertexAttributeName.normal);

        const nodes = this._btSoftBody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            const pos = node.get_m_x();
            vertices.data[3 * i] = pos.x() + this._diff.x;
            vertices.data[3 * i + 1] = pos.y() + this._diff.y;
            vertices.data[3 * i + 2] = pos.z() + this._diff.z;

            const normal = node.get_m_n();
            normals.data[3 * i] = normal.x();
            normals.data[3 * i + 1] = normal.y();
            normals.data[3 * i + 2] = normal.z();
        }

        this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
        this._geometry.vertexBuffer.upload(VertexAttributeName.normal, normals);
    }

    public clearAnchors(): void {
        this.anchorManager.clearAnchors();
    }

    public destroy(force?: boolean): void {
        if (this._btBodyInited) {
            if (Physics.world instanceof Ammo.btSoftRigidDynamicsWorld) {
                Physics.world.removeSoftBody(this._btSoftBody);
                Ammo.destroy(this._btSoftBody);
            } else {
                console.warn('Rigid body world cannot destroy soft bodies.');
            }

            this._btSoftBody = null;
            this._btBodyInited = false;
            this._appendRigidbody = null;
        }
        this._initedFunctions = null;
        super.destroy(force);
    }
}
