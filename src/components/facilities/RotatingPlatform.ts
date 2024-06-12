import { ComponentBase, Vector3, Quaternion, Time } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '@/physics';
import { GUIHelp } from '@/utils/debug/GUIHelp';

/**
 * 旋转平台，使刚体绕全局坐标系中某一轴进行旋转
 */
export class RotatingPlatform extends ComponentBase {
    private _rigidBody: Ammo.btRigidBody;
    private _hinge: Ammo.btHingeConstraint;
    /**
     * 每秒旋转的速度
     */
    public rotationSpeed: number = 1;
    /**
     * 最大马达脉冲
     */
    public maxMotorImpulse: number = 10;
    /**
     * 旋转轴，默认Y轴
     */
    public rotationAxis: 'X' | 'Y' | 'Z' = 'Y';

    start(): void {
        const selfRb = this.object3D.getComponent(RigidBodyComponent);
        if (!selfRb) {
            console.error('RotatingPlatform requires a rigidbody on the object');
            return;
        }

        let canStart = true;
        if (!selfRb.btBodyInited) {
            selfRb.addInitedFunction(this.start, this);
            canStart = false;
        }

        if (!canStart) return;

        this._rigidBody = selfRb.btRigidbody;

        this.createConstraint();
        this.debug()
    }

    private createConstraint() {

        // 旋转框架
        const frameInA = Physics.TEMP_TRANSFORM;
        frameInA.setIdentity();

        // 将对象的初始旋转应用到frameInA
        // frameInA.setRotation(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(this.object3D.rotationX, this.object3D.rotationY, this.object3D.rotationZ)));
        
        // 设置frameInA的Basis，使其只允许绕某轴旋转
        // 以Y轴旋转为例，Math.PI / 2是绕Z轴旋转90度，使局部X轴对齐到世界Y轴
        switch (this.rotationAxis) {
            case 'X':
                frameInA.getBasis().setEulerZYX(0, Math.PI / 2, 0);
                break;
            case 'Y':
                frameInA.getBasis().setEulerZYX(Math.PI / 2, 0, 0);
                break;
            case 'Z':
                frameInA.getBasis().setEulerZYX(0, 0, 0);
                break;
            default:
                console.error('Invalid rotation axis');
                return;

        }

        // 创建铰链约束
        this._hinge = new Ammo.btHingeConstraint(this._rigidBody, frameInA, true);

        // this._hinge.setAngularOnly(true); // 允许平移
        // this._hinge.setMaxMotorImpulse(10); // 设置电机的最大冲量
        // this._hinge.setMotorTarget(90, Time.delte / 1000); // 控制电机使约束旋转到指定的角度

        // 启用电机
        this.enable && this.onEnable()

        Physics.world.addConstraint(this._hinge, true);

    }

    private debug() {
        GUIHelp.addFolder('RotatingPlatform' + this.rotationAxis);
        GUIHelp.open();
        GUIHelp.add(this, 'enable');
        GUIHelp.add(this, 'rotationSpeed', -50, 50, 1).onChange(v => this.enable && this.onEnable());
        GUIHelp.add(this, 'maxMotorImpulse', 0, 100, 1).onChange(v => this._hinge && this._hinge.setMaxMotorImpulse(v));
    }

    public onDisable() {
        // 关闭电机
        this._hinge && this._hinge.enableMotor(false);

    }

    public onEnable() {
        // 启用电机并设置旋转速度和最大马达脉冲
        this._hinge && this._hinge.enableAngularMotor(true, this.rotationSpeed, this.maxMotorImpulse);
    }

    public destroy(force?: boolean): void {
        if (this._hinge) {
            Physics.world.removeConstraint(this._hinge);
            Ammo.destroy(this._hinge);
            this._hinge = null;
        }
        this._rigidBody = null;

        super.destroy(force);
    }
}
