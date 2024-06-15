import { Vector3 } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';
import { ConstraintBase } from './ConstraintBase';

/**
 * 铰链约束
 */
export class HingeConstraint extends ConstraintBase<Ammo.btHingeConstraint> {
    public axisSelf: Vector3 = new Vector3(0, 1, 0);
    public axisTarget: Vector3 = new Vector3(0, 1, 0);
    /**
     * 默认：true
     */
    public useReferenceFrameA: boolean = true;
    /**
     * 默认：false
     */
    public useTwoBodiesTransformOverload: boolean = false;

    protected createConstraint(selfRb: RigidBodyComponent) {
        const constraintType = !this._targetRigidbody ?
            'SINGLE_BODY_TRANSFORM' : this.useTwoBodiesTransformOverload ?
                'TWO_BODIES_TRANSFORM' : 'TWO_BODIES_PIVOT';

        const pivotInA = PhysicsMathUtil.toBtVector3(this.pivotSelf, PhysicsMathUtil.tmpVecA);
        const pivotInB = PhysicsMathUtil.toBtVector3(this.pivotTarget, PhysicsMathUtil.tmpVecB);

        switch (constraintType) {
            case 'SINGLE_BODY_TRANSFORM':
                const frameA_single = Physics.TEMP_TRANSFORM;
                frameA_single.setIdentity();
                frameA_single.setOrigin(pivotInA);
                frameA_single.setRotation(PhysicsMathUtil.toBtQuaternion(this.rotationSelf));

                this._constraint = new Ammo.btHingeConstraint(selfRb.btRigidbody, frameA_single, this.useReferenceFrameA);
                break;
            case 'TWO_BODIES_TRANSFORM':
                const frameA = Physics.TEMP_TRANSFORM;
                frameA.setIdentity();
                frameA.setOrigin(pivotInA);
                frameA.setRotation(PhysicsMathUtil.toBtQuaternion(this.rotationSelf));

                const frameB = new Ammo.btTransform();
                frameB.setIdentity();
                frameB.setOrigin(pivotInB);
                frameB.setRotation(PhysicsMathUtil.toBtQuaternion(this.rotationTarget, PhysicsMathUtil.tmpQuaB));

                this._constraint = new Ammo.btHingeConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, frameA, frameB, this.useReferenceFrameA);
                Ammo.destroy(frameB);
                break;
            case 'TWO_BODIES_PIVOT':
                const axisSelf = PhysicsMathUtil.toBtVector3(this.axisSelf, PhysicsMathUtil.tmpVecC);
                const axisTarget = PhysicsMathUtil.toBtVector3(this.axisTarget, PhysicsMathUtil.tmpVecD);

                this._constraint = new Ammo.btHingeConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, pivotInA, pivotInB, axisSelf, axisTarget);
                break;
            default:
                console.error('Invalid constraint type');
                return;
        }
    }
}
