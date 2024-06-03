import { ComponentBase, Quaternion, Vector3 } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, ClothSoftBodyComponent, PhysicsMathUtil, type CornerType } from '..';

export class AnchorConstraint extends ComponentBase {
    private _targetRigidbody: RigidBodyComponent;
    private _selfSoftBody: ClothSoftBodyComponent;
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
    public disableCollision: boolean = false;

    /**
     * 软体同步至刚体的相对位置，默认位于刚体原点
     * 设置为 Vector(1,2,3) 时软体的坐标是相对刚体的 x+1, y+2, z+3
     */
    public relativePosition: Vector3

    /**
     * 软体与世界坐标的绝对旋转
     */
    public absoluteRotation: Vector3

    start(): void {
        // 获取当前对象的软体组件
        let selfSbCom = this.selfSoftBody = this.object3D.getComponent(ClothSoftBodyComponent);
        if (!selfSbCom?.btSoftBody) {
            console.error('Needs a soft body');
            return;
        }

        if (!this.targetRigidbody) {
            console.error('Needs a rigid body');
            return
        }

        if (this.anchorIndices.length === 0) {
            console.error(`Invalid anchor indices`);
            return;
        }

        // 确保已经初始化
        if (!selfSbCom.btBodyInited) {
            selfSbCom.addInitedFunction(this.start, this);
            return;
        }

        if (!this.targetRigidbody.btBodyInited) {
            this.targetRigidbody.addInitedFunction(this.start, this);
            return;
        }

        // 获取节点索引
        let anchorIndices = typeof this.anchorIndices[0] === 'number'
            ? this.anchorIndices as number[]
            : selfSbCom.getCornerIndices(this.anchorIndices as CornerType[])

        // 检查节点索引的有效性
        let nodesSize = selfSbCom.btSoftBody.get_m_nodes().size()
        for (let nodeIndex of anchorIndices) {
            if (nodeIndex < 0 || nodeIndex >= nodesSize) {
                console.error(`Invalid node index ${nodeIndex} for soft body`);
                return;
            }
        }

        // 应用变换，控制软体的位置和旋转，以便在刚体的具体位置添加锚点
        this.relativePosition ||= new Vector3()
        this.absoluteRotation ||= new Vector3()
        let targetPosition = this.targetRigidbody.transform.localPosition;
        targetPosition.add(this.relativePosition, Vector3.HELP_0);
        selfSbCom.updateTransform(Vector3.HELP_0, this.absoluteRotation, true)

        // 通知软体组件已应用描点，更新顶点时需要依赖刚体的插值坐标
        selfSbCom.appendRigidbody = this.targetRigidbody.btRigidbody

        // 遍历节点索引并添加锚点
        // for (let nodeIndex of anchorIndices) {
        //     selfSbCom.btSoftBody.appendAnchor(nodeIndex, this.targetRigidbody.btRigidbody, this.disableCollision, this.influence);
        // }
        anchorIndices.forEach((nodeIndex, idx) => {
            let influence = this.influence instanceof Array ? (this.influence[idx] ?? 0.5) : this.influence
            // let disableCollision = this.disableCollision instanceof Array ? (this.disableCollision[idx] ?? false) : this.disableCollision
            selfSbCom.btSoftBody.appendAnchor(nodeIndex, this.targetRigidbody.btRigidbody, this.disableCollision, influence);
        });
    }

    /**
     * 目标刚体组件
     */
    public get targetRigidbody(): RigidBodyComponent {
        return this._targetRigidbody;
    }

    public set targetRigidbody(value: RigidBodyComponent) {
        this._targetRigidbody = value;
    }

    /**
     * 自身软体组件
     */
    public get selfSoftBody(): ClothSoftBodyComponent {
        return this._selfSoftBody;
    }

    public set selfSoftBody(value: ClothSoftBodyComponent) {
        this._selfSoftBody = value;
    }

    /**
     * 移除锚点
     */
    public destroy(force?: boolean): void {
        console.log('destroy anchor');

        let anchors = this.selfSoftBody.btSoftBody.get_m_anchors();
        anchors.clear();
        this.selfSoftBody.btSoftBody.set_m_anchors(anchors);
        this.selfSoftBody.appendRigidbody = null

        this._selfSoftBody = null;
        this._targetRigidbody = null;
        this.influence = null
        this.anchorIndices.length = 0;
        super.destroy(force);
    }
}
