import { Vector3, MeshRenderer, GeometryBase, PlaneGeometry, Quaternion } from '@orillusion/core';
import { Ammo, Physics, PhysicsMathUtil, SoftBodyComponentBase } from '..';

export class ClothSoftBodyComponent extends SoftBodyComponentBase {
    public clothWidth: number;
    public clothHeight: number;
    public segmentsWidth: number;
    public segmentsHeight: number;

    protected _geometry: PlaneGeometry;

    protected initSoftBody(): void {
        if (this._softBodyInited) return;
        
        const softBodyHelpers = new Ammo.btSoftBodyHelpers();
        const softBodyWorldInfo = Physics.worldInfo;

        this._geometry = this.object3D.getComponent(MeshRenderer).geometry as PlaneGeometry;
        if (!(this._geometry instanceof PlaneGeometry)) throw new Error('The cloth softbody requires plane geometry')

        this.clothWidth ||= this._geometry.width;
        this.clothHeight ||= this._geometry.height;
        this.segmentsWidth ||= this._geometry.segmentW;
        this.segmentsHeight ||= this._geometry.segmentH;

        const halfWidth = this.clothWidth / 2;
        const halfHeight = this.clothHeight / 2;

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
            this.segmentsWidth + 1,
            this.segmentsHeight + 1,
            0,
            true
        );

        /* 先旋转再平移，矩阵变换不满足交换律，先后顺序不能改 */
        const position = this.transform.localPosition;
        const rotation = this.transform.localRotation;
        this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(rotation.x, rotation.y, rotation.z)));
        this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(position));
        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;


        let sbConfig = this._btSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        this._btSoftBody.setActivationState(4);

        // this._btSoftBody.get_m_materials().at(0).set_m_kLST(0.4);
        // this._btSoftBody.get_m_materials().at(0).set_m_kAST(0.4);

        this._btSoftBody.setTotalMass(this.mass, false);
        (Ammo as any).castObject(this._btSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.05 * 3);

        this.fixClothTopEdge();
        this._btSoftBody.generateBendingConstraints(2, this._btSoftBody.get_m_materials().at(0));
        // this.fixClothEnds();

        Physics.addSoftBody(this._btSoftBody);
        this._softBodyInited = true;
    }

    private fixClothTopEdge(): void {
        const nodes = this._btSoftBody.get_m_nodes();
        // 固定顶部两点
        nodes.at(0).set_m_im(0) // 右上角
        nodes.at(this.segmentsWidth).set_m_im(0)
        // nodes.at(this.segmentsWidth / 2).set_m_im(0)

        // 右下角
        // nodes.at(this.segmentsHeight * (this.segmentsWidth + 1)).set_m_im(0);

        // 固定全部顶部
        // for (let i = 0; i <= this.segmentsWidth; i++) {
        //     const node = nodes.at(i);
        //     node.set_m_im(0);
        // }
    }

    private fixClothEnds(): void {
        const nodes = this._btSoftBody.get_m_nodes();
        const firstNodeIndex = 0;
        const lastNodeIndex = nodes.size() - 1;

        this._btSoftBody.appendAnchor(firstNodeIndex, null, true, 1.0);
        this._btSoftBody.appendAnchor(lastNodeIndex, null, true, 1.0);
    }
}
