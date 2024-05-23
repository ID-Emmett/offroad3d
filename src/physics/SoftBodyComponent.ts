import { Vector3, ComponentBase, MeshRenderer, VertexAttributeName, GeometryBase, Quaternion } from '@orillusion/core';
import { Ammo, Physics, PhysicsMathUtil, ActivationState } from '.';

/**
 * SoftBody Component
 * 用于创建和管理软体物体，例如布料、柔性物体等。
 * @group Components
 */
export class SoftBodyComponent extends ComponentBase {
    private _btSoftBody: Ammo.btSoftBody;
    private _softBodyInited: boolean = false;

    public mass: number = 1;
    public clothWidth: number = 10;
    public clothHeight: number = 10;
    public segmentsWidth: number = 10;
    public segmentsHeight: number = 10;

    private _clothGeometry: GeometryBase;

    async init(): Promise<void> {

        Physics.isSoftBodyWord || Physics.switchWorld(true)
        // 初始化软体物体
        this.initSoftBody();
    }

    private initSoftBody(): void {
        if (this._softBodyInited) return;

        const softBodyHelpers = new Ammo.btSoftBodyHelpers();
        const softBodyWorldInfo = Physics.worldInfo;

        this._clothGeometry = this.object3D.getComponent(MeshRenderer).geometry;
        const clothWidth = this.clothWidth;
        const clothHeight = this.clothHeight;

        const halfWidth = clothWidth / 2;
        const halfHeight = clothHeight / 2;

        const segmentsWidth = this.segmentsWidth;
        const segmentsHeight = this.segmentsHeight;

        // 获取图形对象的世界变换矩阵
        const position = this.transform.localPosition;
        const rotation = this.transform.localRotation;

        // 创建布料软体
        // this._btSoftBody = softBodyHelpers.CreatePatch(
        //     softBodyWorldInfo,
        //     new Ammo.btVector3(-halfWidth, halfHeight, 0),
        //     new Ammo.btVector3(halfWidth, halfHeight, 0),
        //     new Ammo.btVector3(-halfWidth, -halfHeight, 0),
        //     new Ammo.btVector3(halfWidth, -halfHeight, 0),
        // new Ammo.btVector3(-halfWidth, halfHeight - position.y, 0 - position.z),
        // new Ammo.btVector3(halfWidth, halfHeight - position.y, 0 - position.z),
        // new Ammo.btVector3(-halfWidth, -halfHeight - position.y, 0 - position.z),
        // new Ammo.btVector3(halfWidth, -halfHeight - position.y, 0 - position.z),

        // new Ammo.btVector3(position.x, position.y + clothHeight, position.z),
        // new Ammo.btVector3(position.x, position.y + clothHeight, position.z - clothWidth),
        // new Ammo.btVector3(position.x, position.y, position.z),
        // new Ammo.btVector3(position.x, position.y, position.z - clothWidth),

        // 计算世界坐标
        // new Ammo.btVector3(position.x - halfWidth, position.y + halfHeight, position.z),
        // new Ammo.btVector3(position.x + halfWidth, position.y + halfHeight, position.z),
        // new Ammo.btVector3(position.x - halfWidth, position.y - halfHeight, position.z),
        // new Ammo.btVector3(position.x + halfWidth, position.y - halfHeight, position.z),
        //     segmentsWidth + 1,
        //     segmentsHeight + 1,
        //     0,
        //     true
        // );



        // 创建布料软体
        // const clothCorner00 = new Ammo.btVector3(position.x, position.y + halfHeight, position.z + halfWidth);
        // const clothCorner01 = new Ammo.btVector3(position.x, position.y + halfHeight, position.z - halfWidth);
        // const clothCorner10 = new Ammo.btVector3(position.x, position.y - halfHeight, position.z + halfWidth);
        // const clothCorner11 = new Ammo.btVector3(position.x, position.y - halfHeight, position.z - halfWidth);
        // 创建布料软体
        const clothCorner00 = new Ammo.btVector3(-halfWidth, halfHeight, 0)
        const clothCorner01 = new Ammo.btVector3(halfWidth, halfHeight, 0)
        const clothCorner10 = new Ammo.btVector3(-halfWidth, -halfHeight, 0)
        const clothCorner11 = new Ammo.btVector3(halfWidth, -halfHeight, 0)


        this._btSoftBody = softBodyHelpers.CreatePatch(
            softBodyWorldInfo,
            clothCorner00,
            clothCorner01,
            clothCorner10,
            clothCorner11,
            segmentsWidth + 1,
            segmentsHeight + 1,
            0,
            true
        );

        let sbConfig = this._btSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        // Ammo.castObject(this._btSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.05 * 3);
        this._btSoftBody.setActivationState(ActivationState.ACTIVE_TAG);

        this._btSoftBody.get_m_materials().at(0).set_m_kLST(0.4);
        this._btSoftBody.get_m_materials().at(0).set_m_kAST(0.4);
        this._btSoftBody.setTotalMass(this.mass, false);

        // 固定布料的顶部边缘
        this.fixClothTopEdge();

        /// 生成弯曲约束
        this._btSoftBody.generateBendingConstraints(2, this._btSoftBody.get_m_materials().at(0));


        // 设置布料软体的位置和旋转
        // const btTransform = Physics.TEMP_TRANSFORM;
        // btTransform.setIdentity();
        // btTransform.setOrigin(PhysicsMathUtil.toBtVector3(position));
        // Quaternion.HELP_0.fromEulerAngles(rotation.x, rotation.y, rotation.z)
        // btTransform.setRotation(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0));
        // this._btSoftBody.transform(btTransform);

        /* 先旋转再平移，矩阵变换不满足交换律，先后顺序不能改 */
        Quaternion.HELP_0.fromEulerAngles(this.transform.rotationX, this.transform.rotationY, this.transform.rotationZ)
        this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0));
        this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(this.transform.localPosition));
        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;

        // 设置布料软体的位置和旋转
        // const btTransform = new Ammo.btTransform();
        // btTransform.setIdentity();
        // btTransform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        // // btTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
        // const btQuaternion = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        // btTransform.setRotation(btQuaternion);
        // this._btSoftBody.transform(btTransform);

        (Physics.world as Ammo.btSoftRigidDynamicsWorld).addSoftBody(this._btSoftBody, 1, -1);
        this._softBodyInited = true;
    }

    private fixClothTopEdge(): void {
        const nodes = this._btSoftBody.get_m_nodes();
        nodes.at(0).set_m_im(0)
        nodes.at(this.segmentsWidth).set_m_im(0)
        // nodes.at(this.segmentsWidth / 2).set_m_im(0)

        // this._btSoftBody.appendAnchor(0, null, true, 1.0);
        // this._btSoftBody.appendAnchor(nodes.size() - 1, null, true, 1.0);

        // for (let i = 0; i <= this.segmentsWidth; i++) {
        //     const node = nodes.at(i);
        //     node.set_m_im(0); // set inverse mass to zero to make it static
        // }
    }

    onUpdate(): void {
        if (this._softBodyInited) {
            // 更新软体物体的位置
            const nodes = this._btSoftBody.get_m_nodes();
            const vertices = this._clothGeometry.getAttribute(VertexAttributeName.position);
            const normals = this._clothGeometry.getAttribute(VertexAttributeName.normal);
            // for (let i = 0; i < nodes.size(); i++) {
            for (let i = 0; i < vertices.data.length / 3; i++) {
                const node = nodes.at(i);
                const pos = node.get_m_x();
                // vertices.data[3 * i] = pos.x() - this.object3D.x;
                // vertices.data[3 * i + 1] = pos.y() - this.object3D.y;
                // vertices.data[3 * i + 2] = pos.z() - this.object3D.z;
                vertices.data[3 * i] = pos.x();
                vertices.data[3 * i + 1] = pos.y();
                vertices.data[3 * i + 2] = pos.z();

                const normal = node.get_m_n();
                normals.data[3 * i] = normal.x();
                normals.data[3 * i + 1] = normal.y();
                normals.data[3 * i + 2] = normal.z();
            }
            this._clothGeometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
            this._clothGeometry.vertexBuffer.upload(VertexAttributeName.normal, normals);
            // this._clothGeometry.computeNormals();
        }
    }

    public destroy(force?: boolean): void {
        if (this._softBodyInited) {
            (Physics.world as Ammo.btSoftRigidDynamicsWorld).removeSoftBody(this._btSoftBody);
            Ammo.destroy(this._btSoftBody);
            this._softBodyInited = false;
        }
        super.destroy(force);
    }

    /**
     * 返回内部 Ammo.btSoftBody
     */
    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftBody;
    }
}
