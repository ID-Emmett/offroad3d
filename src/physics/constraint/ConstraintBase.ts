import { ComponentBase, Vector3, Quaternion } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';

/**
 * 基础约束类
 */
export class ConstraintBase<T extends Ammo.btTypedConstraint> extends ComponentBase {
    protected _targetRigidbody: RigidBodyComponent;
    protected _constraint: T;
    private _initResolve!: () => void;
    private _initializationPromise: Promise<void> = new Promise<void>(r => this._initResolve = r);

    public pivotSelf: Vector3 = new Vector3();
    public pivotTarget: Vector3 = new Vector3();
    public rotationSelf: Quaternion = new Quaternion();
    public rotationTarget: Quaternion = new Quaternion();
    public disableCollisionsBetweenLinkedBodies: boolean = true;

    /**
     * 断裂脉冲阈值，值越大，越不易断裂。
     */
    public breakingImpulseThreshold: number = null;


    async start() {
        const selfRb = this.object3D.getComponent(RigidBodyComponent);
        if (!selfRb) {
            throw new Error(`${this.constructor.name} requires a rigidbody on the object`);
        }

        // 等待刚体初始化完成
        if (!selfRb.btBodyInited) {
            await new Promise<void>((resolve) => selfRb.addInitedFunction(resolve, this));
        }

        // 等待目标刚体初始化完成
        if (this._targetRigidbody && !this._targetRigidbody.btBodyInited) {
            await new Promise<void>((resolve) => this._targetRigidbody.addInitedFunction(resolve, this));
        }

        // 创建约束
        this.createConstraint(selfRb);

        if (this._constraint) {
            this.breakingImpulseThreshold && this._constraint.setBreakingImpulseThreshold(this.breakingImpulseThreshold)
            Physics.world.addConstraint(this._constraint, this.disableCollisionsBetweenLinkedBodies);
            this._initResolve();
        }
    }

    /**
     * 子类实现具体的约束创建逻辑
     * @param selfRb - 自身的刚体组件
     */
    protected createConstraint(selfRb: RigidBodyComponent) { }

    /**
     * 获取约束实例
     */
    public get constraint(): T {
        if (!this._constraint) {
            throw new Error('Constraint has not been initialized. Please use waitConstraint() to get the constraint instance asynchronously.');
        }
        return this._constraint;
    }

    /**
     * 异步获取完成初始化的约束实例
     */
    public async waitConstraint(): Promise<T> {
        await this._initializationPromise;
        return this._constraint!;
    }

    /**
     * 重置约束，销毁当前约束实例后重新创建并返回新的约束实例
     */
    public async resetConstraint(): Promise<T> {
        if (this._constraint) {
            Physics.removeConstraint(this._constraint)
            this._constraint = null;

            await this.start();
            return this._constraint!;
        }
        console.warn('No constraint to reset.');
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

    public destroy(force?: boolean): void {
        Physics.removeConstraint(this._constraint)
        this._constraint = null;
        this._targetRigidbody = null;
        super.destroy(force);
    }
}
