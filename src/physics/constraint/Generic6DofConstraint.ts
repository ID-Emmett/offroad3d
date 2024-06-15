import { Vector3 } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';
import { ConstraintBase } from './ConstraintBase';

/**
 * 通用六自由度约束
 */
export class Generic6DofConstraint extends ConstraintBase<Ammo.btGeneric6DofConstraint> {
    public linearLowerLimit: Vector3 = new Vector3(-1e30, -1e30, -1e30);
    public linearUpperLimit: Vector3 = new Vector3(1e30, 1e30, 1e30);
    public angularLowerLimit: Vector3 = new Vector3(-Math.PI, -Math.PI, -Math.PI);
    public angularUpperLimit: Vector3 = new Vector3(Math.PI, Math.PI, Math.PI);
    public useLinearFrameReferenceFrame: boolean = true;

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

            this._constraint = new Ammo.btGeneric6DofConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, frameInA, frameInB, this.useLinearFrameReferenceFrame);
            Ammo.destroy(frameInB);
        } else {
            this._constraint = new Ammo.btGeneric6DofConstraint(selfRb.btRigidbody, frameInA, this.useLinearFrameReferenceFrame);
        }

        this._constraint.setLinearLowerLimit(PhysicsMathUtil.toBtVector3(this.linearLowerLimit));
        this._constraint.setLinearUpperLimit(PhysicsMathUtil.toBtVector3(this.linearUpperLimit));
        this._constraint.setAngularLowerLimit(PhysicsMathUtil.toBtVector3(this.angularLowerLimit));
        this._constraint.setAngularUpperLimit(PhysicsMathUtil.toBtVector3(this.angularUpperLimit));
    }
}
