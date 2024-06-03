// AnchorManager.ts

import { Vector3, Quaternion } from '@orillusion/core';
import { Ammo, Physics, PhysicsMathUtil, type CornerType } from '..';
import { ClothSoftBody } from './ClothSoftBody';

export class AnchorManager {
    private component: ClothSoftBody;

    constructor(component: ClothSoftBody) {
        this.component = component;
    }

    public setAnchor() {
        const anchorIndices = typeof this.component.anchorIndices[0] === 'number'
            ? this.component.anchorIndices as number[]
            : this.getCornerIndices(this.component.anchorIndices as CornerType[]);

        const nodesSize = this.component.btSoftBody.get_m_nodes().size();
        anchorIndices.forEach(nodeIndex => {
            if (nodeIndex < 0 || nodeIndex >= nodesSize) {
                console.error(`Invalid node index ${nodeIndex} for soft body`);
                return;
            }
        });

        let tm = this.component.appendRigidbody.getWorldTransform()
        PhysicsMathUtil.fromBtVector3(tm.getOrigin(), Vector3.HELP_0);
        Vector3.HELP_0.add(this.component.applyPosition, Vector3.HELP_1);

        // 基于刚体的旋转
        PhysicsMathUtil.fromBtQuaternion(tm.getRotation(), Quaternion.HELP_0)
        Quaternion.HELP_1.fromEulerAngles(this.component.applyRotation.x, this.component.applyRotation.y, this.component.applyRotation.z);
        Quaternion.HELP_1.multiply(Quaternion.HELP_0, Quaternion.HELP_1);

        this.component.btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_1));
        this.component.btSoftBody.translate(PhysicsMathUtil.toBtVector3(Vector3.HELP_1));

        anchorIndices.forEach((nodeIndex, idx) => {
            const influence = Array.isArray(this.component.influence) ? (this.component.influence[idx] ?? 0.5) : this.component.influence;
            const disableCollision = Array.isArray(this.component.disableCollision) ? (this.component.disableCollision[idx] ?? false) : this.component.disableCollision;
            this.component.btSoftBody.appendAnchor(nodeIndex, this.component.appendRigidbody, disableCollision, influence);
        });
    }

    /**
     * 计算索引
     * @param x 水平位置（列号）
     * @param y 垂直位置（行号）
     * @returns 节点索引
     */
    public getVertexIndex(x: number, y: number): number {
        return y * (this.component.segmentW + 1) + x;
    }

    /**
     * 将 CornerType 数组转换成节点索引数组。
     * @param cornerList 需要转换的 CornerType 数组。
     * @returns 节点索引数组
     */
    public getCornerIndices(cornerList: CornerType[]): number[] {
        return cornerList.map(corner => {
            switch (corner) {
                case 'left':
                    return this.getVertexIndex(0, Math.floor(this.component.segmentH / 2));
                case 'right':
                    return this.getVertexIndex(this.component.segmentW, Math.floor(this.component.segmentH / 2));
                case 'top':
                    return this.getVertexIndex(Math.floor(this.component.segmentW / 2), 0);
                case 'bottom':
                    return this.getVertexIndex(Math.floor(this.component.segmentW / 2), this.component.segmentH);
                case 'center':
                    return this.getVertexIndex(Math.floor(this.component.segmentW / 2), Math.floor(this.component.segmentH / 2));
                case 'leftTop':
                    return 0;
                case 'rightTop':
                    return this.component.segmentW;
                case 'leftBottom':
                    return this.getVertexIndex(0, this.component.segmentH);
                case 'rightBottom':
                    return this.getVertexIndex(this.component.segmentW, this.component.segmentH);
                default:
                    throw new Error('Invalid corner');
            }
        });
    }

    /**
     * 固定软体节点。可以传入 CornerType 数组或节点索引数组。
     * @param fixNodeIndices 表示需要固定的节点索引或 CornerType 数组。
     */
    public fixClothNodes(fixNodeIndices: CornerType[] | number[]) {
        // 确定索引数组
        const indexArray: number[] = typeof fixNodeIndices[0] === 'number'
            ? fixNodeIndices as number[]
            : this.getCornerIndices(fixNodeIndices as CornerType[]);

        const nodes = this.component.btSoftBody.get_m_nodes();
        indexArray.forEach(i => {
            if (i >= 0 && i < nodes.size()) {
                nodes.at(i).get_m_v().setValue(0, 0, 0);
                nodes.at(i).get_m_f().setValue(0, 0, 0);
                nodes.at(i).set_m_im(0);
            } else {
                console.warn(`Index ${i} is out of bounds for nodes array.`);
            }
        });
    }


    /**
     * 清除所有锚点
     */
    public clearAnchors() {
        console.log('destroy anchor');
        const anchors = this.component.btSoftBody.get_m_anchors();
        anchors.clear();
        this.component.btSoftBody.set_m_anchors(anchors);
        this.component.appendRigidbody = null;
    }
}
