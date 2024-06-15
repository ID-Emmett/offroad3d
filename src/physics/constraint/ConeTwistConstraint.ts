import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';
import { ConstraintBase } from './ConstraintBase';

/**
 * 锥形扭转约束
 */
export class ConeTwistConstraint extends ConstraintBase<Ammo.btConeTwistConstraint> {
    public twistSpan: number = 1e30;
    public swingSpan1: number = 1e30;
    public swingSpan2: number = 1e30;

    protected createConstraint(selfRb: RigidBodyComponent) {
        const frameInA = PhysicsMathUtil.toBtVector3(this.pivotSelf);
        const rotInA = PhysicsMathUtil.toBtQuaternion(this.rotationSelf);

        const transformA = Physics.TEMP_TRANSFORM;
        transformA.setIdentity();
        transformA.setOrigin(frameInA);
        transformA.setRotation(rotInA);

        if (this._targetRigidbody) {
            const frameInB = PhysicsMathUtil.toBtVector3(this.pivotTarget, PhysicsMathUtil.tmpVecB);
            const rotInB = PhysicsMathUtil.toBtQuaternion(this.rotationTarget, PhysicsMathUtil.tmpQuaB);
            const transformB = new Ammo.btTransform();
            transformB.setIdentity();
            transformB.setOrigin(frameInB);
            transformB.setRotation(rotInB);

            this._constraint = new Ammo.btConeTwistConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, transformA, transformB);
            Ammo.destroy(transformB);
        } else {
            this._constraint = new Ammo.btConeTwistConstraint(selfRb.btRigidbody, transformA);
        }

        this._constraint.setLimit(0, this.twistSpan);
        this._constraint.setLimit(1, this.swingSpan1);
        this._constraint.setLimit(2, this.swingSpan2);
    }
}
