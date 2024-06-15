import { Ammo, RigidBodyComponent, PhysicsMathUtil } from '..';
import { ConstraintBase } from './ConstraintBase';

/**
 * 点到点约束
 */
export class PointToPointConstraint extends ConstraintBase<Ammo.btPoint2PointConstraint> {
    protected createConstraint(selfRb: RigidBodyComponent) {
        const pivotInA = PhysicsMathUtil.toBtVector3(this.pivotSelf);

        if (this._targetRigidbody) {
            const pivotInB = PhysicsMathUtil.toBtVector3(this.pivotTarget, PhysicsMathUtil.tmpVecB);
            this._constraint = new Ammo.btPoint2PointConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, pivotInA, pivotInB);
        } else {
            this._constraint = new Ammo.btPoint2PointConstraint(selfRb.btRigidbody, pivotInA);
        }

    }
}
