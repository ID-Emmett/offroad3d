import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';
import { ConstraintBase } from './ConstraintBase';

/**
 * 固定约束
 */
export class FixedConstraint extends ConstraintBase<Ammo.btFixedConstraint> {
    protected createConstraint(selfRb: RigidBodyComponent): void {
        if (!this._targetRigidbody) {
            console.error('FixedConstraint need target rigidbody');
            return;
        }

        const pivotInA = PhysicsMathUtil.toBtVector3(this.pivotSelf);
        const rotInA = PhysicsMathUtil.toBtQuaternion(this.rotationSelf);
        const frameInA = Physics.TEMP_TRANSFORM;
        frameInA.setIdentity();
        frameInA.setOrigin(pivotInA);
        frameInA.setRotation(rotInA);

        const pivotInB = PhysicsMathUtil.toBtVector3(this.pivotTarget, PhysicsMathUtil.tmpVecB);
        const rotInB = PhysicsMathUtil.toBtQuaternion(this.rotationTarget, PhysicsMathUtil.tmpQuaB);
        const frameInB = new Ammo.btTransform();
        frameInB.setIdentity();
        frameInB.setOrigin(pivotInB);
        frameInB.setRotation(rotInB);

        this._constraint = new Ammo.btFixedConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, frameInA, frameInB);
        Ammo.destroy(frameInB);
    }
}
