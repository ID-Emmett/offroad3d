import { ComponentBase, Vector3, Quaternion } from '@orillusion/core';
import { Ammo, Physics, RigidBodyComponent, PhysicsMathUtil } from '..';

/**
 * 多自由度约束
 */
export class Generic6DofSpringConstraint extends ComponentBase {
    private _targetRigidbody: RigidBodyComponent;
    private _constraint: Ammo.btGeneric6DofSpringConstraint;

    public pivotSelf: Vector3 = new Vector3();
    public pivotTarget: Vector3 = new Vector3();
    public rotationSelf: Quaternion = new Quaternion();
    public rotationTarget: Quaternion = new Quaternion();

    public linearLowerLimit: Vector3 = new Vector3(); // -1e30
    public linearUpperLimit: Vector3 = new Vector3(); // 1e30
    public angularLowerLimit: Vector3 = new Vector3(); // -Math.PI
    public angularUpperLimit: Vector3 = new Vector3(); // Math.PI

    public disableCollisionsBetweenLinkedBodies: boolean = true;

    start(): void {
        const selfRb = this.object3D.getComponent(RigidBodyComponent);
        if (!selfRb) {
            console.error('Generic6DofSpringConstraint requires a rigidbody on the object');
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

        if (!canStart) {
            return;
        }

        this.createConstraint(selfRb);
    }

    private createConstraint(selfRb: RigidBodyComponent) {
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
            this._constraint = new Ammo.btGeneric6DofSpringConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, transformA, transformB, true);
            Ammo.destroy(transformA)
        } else {
            this._constraint = new Ammo.btGeneric6DofSpringConstraint(selfRb.btRigidbody, transformB, true);
        }

        this._constraint.setLinearLowerLimit(PhysicsMathUtil.toBtVector3(this.linearLowerLimit));
        this._constraint.setLinearUpperLimit(PhysicsMathUtil.toBtVector3(this.linearUpperLimit));

        this._constraint.setAngularLowerLimit(PhysicsMathUtil.toBtVector3(this.angularLowerLimit));
        this._constraint.setAngularUpperLimit(PhysicsMathUtil.toBtVector3(this.angularUpperLimit));

        Physics.world.addConstraint(this._constraint, this.disableCollisionsBetweenLinkedBodies);
    }

    public get constraint(): Ammo.btGeneric6DofSpringConstraint {
        return this._constraint;
    }

    public get targetRigidbody(): RigidBodyComponent {
        return this._targetRigidbody;
    }

    public set targetRigidbody(value: RigidBodyComponent) {
        this._targetRigidbody = value;
    }

    public destroy(force?: boolean): void {
        Physics.removeConstraint(this._constraint);
        this._constraint = null;
        super.destroy(force);
    }
}
