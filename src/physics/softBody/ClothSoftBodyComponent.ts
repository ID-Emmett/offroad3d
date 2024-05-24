import { Vector3, MeshRenderer, GeometryBase, PlaneGeometry, Quaternion } from '@orillusion/core';
import { ActivationState, Ammo, Physics, PhysicsMathUtil, SoftBodyComponentBase, type CornerType } from '..';

export class ClothSoftBodyComponent extends SoftBodyComponentBase {
    private segmentW: number;
    private segmentH: number;

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
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        this._btSoftBody.setActivationState(4);

        // this._btSoftBody.get_m_materials().at(0).set_m_kLST(0.4);
        // this._btSoftBody.get_m_materials().at(0).set_m_kAST(0.4);

        this._btSoftBody.setTotalMass(this.mass, false);
        Ammo.castObject(this._btSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.05 * 3);

        this._btSoftBody.generateBendingConstraints(2, this._btSoftBody.get_m_materials().at(0));

        if (this.fixNodeIndices?.length) {
            if (typeof this.fixNodeIndices[0] === 'number') {
                this.fixClothNode(this.fixNodeIndices as number[])
            }else{
                let indexes = this.getCornerIndices(this.fixNodeIndices as CornerType[])
                this.fixClothNode(indexes)
            }
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
        return cornerList.map(corner =>{
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
