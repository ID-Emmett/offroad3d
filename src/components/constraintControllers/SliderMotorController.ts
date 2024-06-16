import { ComponentBase, Vector3, Quaternion, Time, Color } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil, SliderConstraint } from '@/physics';

/**
 * 滑动约束马达控制器
 */
export class SliderMotorController extends ComponentBase {
    private _constraintComponent: SliderConstraint
    private _constraint: Ammo.btSliderConstraint;
    private _rigidbody: Ammo.btRigidBody;
    private _angularVelocity: Ammo.btVector3; // 缓存角速度引用

    private _pauseStartTime: number = 0;
    private _lowerLinLimit: number = 0;
    private _upperLinLimit: number = 0;

    /**
     * 到达终点时的停留时间
     */
    public pauseDuration: number = 0;
    /**
     * 启用线性马达
     */
    public enableLinearMotor: boolean = true;
    /**
     * 线性马达速率
     */
    public targetLinearMotorVelocity: number = 0;
    /**
     * 最大线性马达力
     */
    public maxLinearMotorForce: number = 0;

    /**
     * 启用角度马达
     */
    public enableAngularMotor: boolean = true;
    /**
     * 角度马达速率
     */
    public targetAngularMotorVelocity: Vector3 = new Vector3(0, 0, 0);

    async start() {

        if (!this.constraintComponent) throw new Error('A constraint component is required');

        this._lowerLinLimit ||= this.constraintComponent.lowerLinLimit;
        this._upperLinLimit ||= this.constraintComponent.upperLinLimit;

        // 等待目标刚体初始化完成
        this._constraint = await this.constraintComponent.waitConstraint()
        this._rigidbody = this.object3D.getComponent(RigidBodyComponent).btRigidbody;
        // if (!this._rigidbody) throw new Error('Need rigid body')
        this._angularVelocity = this._rigidbody.getAngularVelocity()

        this.enableLinearMotor && this.enable && this.onEnable(); // 设置线性电机
    }


    public get constraint() {
        return this._constraint;
    }

    /**
     * 设置电机滑动限制，默认为滑动组件的 lowerLinLimit、 upperLinLimit.
     * 
     * 确保设置的限制在约束的范围内
     */
    public setMotorLimit(lowerLinLimit: number, upperLinLimit: number) {
        this._lowerLinLimit = lowerLinLimit;
        this._upperLinLimit = upperLinLimit;
    }

    /**
     * 约束组件
     */
    public get constraintComponent() {
        return this._constraintComponent
    }
    public set constraintComponent(component: SliderConstraint) {
        this._constraintComponent = component
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
     * 更新电机滑动与旋转
     */
    public onUpdate(): void {
        // if (!this.enable || !this._constraint) return;
        if (!this.enable) return;
        if (!this._constraint) return

        if (this.enableLinearMotor) {
            const currentPos = this._constraint.getLinearPos();

            const isAtLowerLimit = currentPos <= this._lowerLinLimit + 0.0001;
            const isAtUpperLimit = currentPos >= this._upperLinLimit - 0.0001;

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

        // 角度控制
        if (this.enableAngularMotor) {
            // this._rigidbody.setAngularVelocity(PhysicsMathUtil.toBtVector3(this.targetAngularMotorVelocity))
            this._angularVelocity.setValue(this.targetAngularMotorVelocity.x, this.targetAngularMotorVelocity.y, this.targetAngularMotorVelocity.z)
            // PhysicsMathUtil.toBtVector3(this.targetAngularMotorVelocity, this._angularVelocity)
        }
    }

    /**
     * 在初始化时绘制轨道参考线，仅单个刚体约束有效
     *
     * @param value 是否绘制参考线
     * @param color 参考线的颜色
     * @param targets 接收轨道数据的四个向量，顺序为：初始点，前方点，后方点，方向
     */
    public drawTrackAtInit(value: boolean, color?: Color, targets?: [Vector3, Vector3, Vector3, Vector3]) {

        const lineName = `SliderTrack_${this.object3D.instanceID}`;

        if (!value) this.transform.view3D.graphic3D.Clear(lineName);

        if (!value && !targets || this._constraintComponent.targetRigidbody) return;

        if (this._constraint) {
            console.warn('Only slide rails are allowed to be drawn at initialization time');
            return;
        };

        // 获取刚体自身的旋转四元数
        Quaternion.HELP_0.fromEulerAngles(this.object3D.rotationX, this.object3D.rotationY, this.object3D.rotationZ);

        // 计算最终的轨道方向旋转，顺序不能更改
        Quaternion.HELP_0.multiply(Quaternion.HELP_0, this._constraintComponent.rotationSelf);

        // 初始点
        const initialPoint = this.object3D.localPosition.add(this._constraintComponent.pivotSelf, Vector3.HELP_0);

        // 使用四元数转换前方向向量
        const direction = Quaternion.HELP_0.transformVector(Vector3.X_AXIS, Vector3.HELP_1).normalize();

        // 计算点在该方向上一定距离的位置
        const forwardPoint = direction.scaleToRef(this._constraintComponent.upperLinLimit, Vector3.HELP_2).add(initialPoint, Vector3.HELP_2);
        const backwardPoint = direction.scaleToRef(this._constraintComponent.lowerLinLimit, Vector3.HELP_3).add(initialPoint, Vector3.HELP_3);

        this.transform.view3D.graphic3D.drawLines(lineName, [forwardPoint, backwardPoint], color);

        if (targets) {
            targets[0]?.copyFrom(initialPoint);
            targets[1]?.copyFrom(forwardPoint);
            targets[2]?.copyFrom(backwardPoint);
            targets[3]?.copyFrom(direction);
        }
    }

    public destroy(force?: boolean): void {
        this._constraintComponent = null;
        this._constraint = null;
        this._angularVelocity = null;
        this._rigidbody = null;
        super.destroy(force);
    }
}
