import { ComponentBase, Vector3, Quaternion, Time, Color } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';

/**
 * 滑动关节约束
 */
export class SliderConstraint extends ComponentBase {
    private _targetRigidbody: RigidBodyComponent;
    private _constraint: Ammo.btSliderConstraint;
    private _pauseStartTime: number = 0;

    public pivotSelf: Vector3 = new Vector3();
    public pivotTarget: Vector3 = new Vector3();

    public rotationSelf: Quaternion = new Quaternion(); // 默认X轴方向
    public rotationTarget: Quaternion = new Quaternion();

    public linearLowerLimit: number = -1e30; // 默认值 -1e30
    public linearUpperLimit: number = 1e30;  // 默认值 1e30
    public angularLowerLimit: number = -Math.PI; // 默认值 -Math.PI
    public angularUpperLimit: number = Math.PI;  // 默认值 Math.PI

    public disableCollisionsBetweenLinkedBodies: boolean = true;
    public breakingImpulseThreshold: number;

    // 电机参数
    public enableLinearMotor: boolean = false;
    public targetLinearMotorVelocity: number = 0;
    public maxLinearMotorForce: number = 0;
    /**
     * 到达终点时的停留时间
     */
    public pauseDuration: number = 0;

    start(): void {
        const selfRb = this.object3D.getComponent(RigidBodyComponent);

        if (!selfRb) {
            console.error('SliderConstraint requires a rigidbody on the object');
            return;
        }

        let canStart = true;
        if (!selfRb.btBodyInited) {
            selfRb.addInitedFunction(this.start, this);
            canStart = false;
        }

        if (this._targetRigidbody && !this._targetRigidbody.btBodyInited) {
            this._targetRigidbody.addInitedFunction(this.start, this);
            canStart = false;
        }

        if (!canStart) return;

        this.createConstraint(selfRb);
    }

    private createConstraint(selfRb: RigidBodyComponent): void {
        const frameInB = PhysicsMathUtil.toBtVector3(this.pivotSelf);
        const rotInB = PhysicsMathUtil.toBtQuaternion(this.rotationSelf);

        const transformB = Physics.TEMP_TRANSFORM;
        transformB.setIdentity();
        transformB.setOrigin(frameInB);
        transformB.setRotation(rotInB);

        if (this._targetRigidbody) {
            const rotInA = PhysicsMathUtil.toBtQuaternion(this.rotationTarget, PhysicsMathUtil.tmpQuaB);
            const frameInA = PhysicsMathUtil.toBtVector3(this.pivotTarget, PhysicsMathUtil.tmpVecB);
            const transformA = new Ammo.btTransform();
            transformA.setIdentity();
            transformA.setOrigin(frameInA);
            transformA.setRotation(rotInA);
            this._constraint = new Ammo.btSliderConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, transformA, transformB, true);
            Ammo.destroy(transformA);
        } else {
            this._constraint = new Ammo.btSliderConstraint(selfRb.btRigidbody, transformB, true);
        }

        this._constraint.setLowerLinLimit(this.linearLowerLimit);
        this._constraint.setUpperLinLimit(this.linearUpperLimit);

        this._constraint.setLowerAngLimit(this.angularLowerLimit);
        this._constraint.setUpperAngLimit(this.angularUpperLimit);

        this.breakingImpulseThreshold && this._constraint.setBreakingImpulseThreshold(this.breakingImpulseThreshold);

        this.enableLinearMotor && this.enable && this.onEnable(); // 设置线性电机
        Physics.world.addConstraint(this._constraint, this.disableCollisionsBetweenLinkedBodies);
    }

    public get constraint(): Ammo.btSliderConstraint {
        return this._constraint;
    }

    public get targetRigidbody(): RigidBodyComponent {
        return this._targetRigidbody;
    }

    public set targetRigidbody(value: RigidBodyComponent) {
        this._targetRigidbody = value;
    }

    /**
     * 关闭电机
     */
    public onDisable() {
        this._constraint?.setPoweredLinMotor(false);
    }

    /**
     * 启动电机
     */
    public onEnable() {
        if (this.enableLinearMotor && this._constraint) {
            this._constraint.setPoweredLinMotor(true);
            this._constraint.setTargetLinMotorVelocity(this.targetLinearMotorVelocity);
            this._constraint.setMaxLinMotorForce(this.maxLinearMotorForce);
        }
    }

    /**
     * 更新电机往反滑动
     */
    public onUpdate(): void {
        if (!this.enable || !this.enableLinearMotor) return;

        const currentPos = this._constraint.getLinearPos();

        const isAtLowerLimit = currentPos <= this.linearLowerLimit + 0.0001;
        const isAtUpperLimit = currentPos >= this.linearUpperLimit - 0.0001;

        if (isAtLowerLimit || isAtUpperLimit) {
            if (this._pauseStartTime === 0) {
                this._pauseStartTime = Time.time;
            } else if (Time.time - this._pauseStartTime >= this.pauseDuration) {
                const absVelocity = Math.abs(this.targetLinearMotorVelocity);
                const newVelocity = isAtLowerLimit ? absVelocity : -absVelocity;
                this._constraint.setTargetLinMotorVelocity(newVelocity);
                this._pauseStartTime = 0;
            }
        } else {
            this._pauseStartTime = 0; // 如果不在暂停状态，重置暂停时间
        }
    }

    /**
     * 在初始化时绘制轨道参考线
     *
     * @param value 是否绘制参考线
     * @param color 参考线的颜色
     */
    public drawTrackAtInit(value: boolean, color?: Color) {

        const lineName = `SliderTrack_${this.object3D.instanceID}`

        if (!value) {
            this.transform.view3D.graphic3D.Clear(lineName);
            return
        }
        if (this._constraint) {
            console.warn('Only slide rails are allowed to be drawn at initialization time');
            return;
        };

        // 获取刚体自身的旋转四元数
        Quaternion.HELP_0.fromEulerAngles(this.object3D.rotationX, this.object3D.rotationY, this.object3D.rotationZ);

        // 计算最终的轨道方向旋转，顺序不能更改
        Quaternion.HELP_0.multiply(Quaternion.HELP_0, this.rotationSelf);

        // 初始点
        const initialPoint = this.object3D.localPosition.add(this.pivotSelf, Vector3.HELP_0);

        // 使用四元数转换前方向向量
        let direction = Quaternion.HELP_0.transformVector(Vector3.X_AXIS, Vector3.HELP_1).normalize();

        // 计算点在该方向上一定距离的位置
        const forwardPoint = direction.scaleToRef(this.linearUpperLimit , Vector3.HELP_2).add(initialPoint, Vector3.HELP_2);
        const backwardPoint = direction.scaleToRef(this.linearLowerLimit , Vector3.HELP_3).add(initialPoint, Vector3.HELP_3);

        this.transform.view3D.graphic3D.drawLines(lineName, [forwardPoint, backwardPoint], color);
    }

    public destroy(force?: boolean): void {
        Physics.removeConstraint(this._constraint);
        this._constraint = null;
        this._targetRigidbody = null;
        super.destroy(force);
    }
}
