import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';
import { ConstraintBase } from './ConstraintBase';

/**
 * 滑动关节约束
 */
export class SliderConstraint extends ConstraintBase<Ammo.btSliderConstraint> {
    public lowerLinLimit: number = -1e30;
    public upperLinLimit: number = 1e30;
    public lowerAngLimit: number = -Math.PI;
    public upperAngLimit: number = Math.PI;
    /**
     * 默认值：true
     */
    public useLinearReferenceFrame: boolean = true;
    protected createConstraint(selfRb: RigidBodyComponent): void {
        const pivotInA = PhysicsMathUtil.toBtVector3(this.pivotSelf);
        const rotInA = PhysicsMathUtil.toBtQuaternion(this.rotationSelf);

        const frameInA = Physics.TEMP_TRANSFORM;
        frameInA.setIdentity();
        frameInA.setOrigin(pivotInA);
        frameInA.setRotation(rotInA);

        if (this._targetRigidbody) {
            const pivotInB = PhysicsMathUtil.toBtVector3(this.pivotTarget, PhysicsMathUtil.tmpVecB);
            const rotInB = PhysicsMathUtil.toBtQuaternion(this.rotationTarget, PhysicsMathUtil.tmpQuaB);
            const frameInB = new Ammo.btTransform();
            frameInB.setIdentity();
            frameInB.setOrigin(pivotInB);
            frameInB.setRotation(rotInB);
            this._constraint = new Ammo.btSliderConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, frameInA, frameInB, this.useLinearReferenceFrame);
            Ammo.destroy(frameInB);
        } else {
            this._constraint = new Ammo.btSliderConstraint(selfRb.btRigidbody, frameInA, this.useLinearReferenceFrame);
        }

        this._constraint.setLowerLinLimit(this.lowerLinLimit);
        this._constraint.setUpperLinLimit(this.upperLinLimit);

        this._constraint.setLowerAngLimit(this.lowerAngLimit);
        this._constraint.setUpperAngLimit(this.upperAngLimit);
    }
}
