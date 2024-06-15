import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil, PlaneGeometry, GPUCullMode, VertexAttributeName, BoxGeometry, GeometryBase, UnLitMaterial, BitmapTexture2D, Time, Vector2 } from '@orillusion/core';
import { ActivationState, RigidBodyComponent, ShapeTypes, RigidBodyUtil, Ammo, Physics, PhysicsMathUtil, Generic6DofSpringConstraint } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil';

enum ElevatorState {
    MovingUp,
    MovingDown,
    Pausing
}

/**
 * 升降平台
 */
export class Elevator extends ComponentBase {
    private rigidBody: Ammo.btRigidBody;
    public mass: number = 10000;
    public speed: number = 1;
    public upperLimit: number = -12.7;
    public lowerLimit: number = -22.98;
    public pauseDuration: number = 2;

    private pauseTimer: number = 0;
    private state: ElevatorState = ElevatorState.MovingUp;

    private boxObj: Object3D
    async start() {
        this.createPlatform();
        this.debug()
    }

    private createPlatform() {
        let boxObj = Object3DUtil.GetSingleCube(3, 0.1, 3, Math.random(), Math.random(), Math.random());
        boxObj.localPosition = new Vector3(-53.9, -22.98, -69)
        boxObj.rotationY = 30
        let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
        boxObjRbComponent.shape = ShapeTypes.btBoxShape;
        boxObjRbComponent.mass = this.mass;
        boxObjRbComponent.damping = new Vector2(0.99, 0.99);
        boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;
        boxObjRbComponent.size = new Vector3(3, 0.1, 3)
        boxObjRbComponent.addInitedFunction(() => {
            this.rigidBody = boxObjRbComponent.btRigidbody;
            this.rigidBody.setGravity(PhysicsMathUtil.setBtVector3(0, 0, 0));
        }, this);

        this.object3D.addChild(boxObj);
        this.boxObj = boxObj

        let constraint = boxObj.addComponent(Generic6DofSpringConstraint)
        // constraint.linearLowerLimit.set(0, -1e30, 0)
        // constraint.linearUpperLimit.set(0, 1e30, 0)
        // constraint.angularLowerLimit.set(0, 0, 0)
        // constraint.angularUpperLimit.set(0, 0, 0)
        constraint.waitConstraint().then(v=>{
           v.setLinearLowerLimit(PhysicsMathUtil.setBtVector3(0, -1e30, 0))
           v.setLinearUpperLimit(PhysicsMathUtil.setBtVector3(0, 1e30, 0))
           v.setAngularLowerLimit(PhysicsMathUtil.zeroBtVector3());
           v.setAngularUpperLimit(PhysicsMathUtil.zeroBtVector3());
        })
        // constraint.constraint.setLinearLowerLimit(PhysicsMathUtil.setBtVector3(0,-1e30,0))
        // constraint.constraint.setLinearUpperLimit(PhysicsMathUtil.setBtVector3(0,1e30,0))
        // constraint.constraint.setAngularLowerLimit(PhysicsMathUtil.setBtVector3(0, 0, 0));
        // constraint.constraint.setAngularUpperLimit(PhysicsMathUtil.setBtVector3(0, 0, 0));
    }

    private debug() {
        let gui = GUIUtil.GUI;
        gui.addFolder('elevator');
        // gui.open();
        gui.add(this, 'enable').onChange((v) => {
            this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, 0, 0));
            this.rigidBody.setMassProps(v ? this.mass : 0, PhysicsMathUtil.setBtVector3(0, 0, 0))
        })
        gui.add(this, 'speed', 0.1, 5, 0.1)
        gui.add(this, 'upperLimit', -30, 30, 0.1)
        gui.add(this, 'lowerLimit', -30, 30, 0.1)
        gui.add(this, 'pauseDuration', 0, 10, 1)
        gui.addButton('reverse', () => {
            if (this.state === ElevatorState.MovingUp) {
                this.state = ElevatorState.MovingDown
            } else if (this.state === ElevatorState.MovingDown) {
                this.state = ElevatorState.MovingUp
            }
        })
    }

    public onUpdate(): void {

        const currentPosition = this.boxObj.y;

        switch (this.state) {
            case ElevatorState.MovingUp:
                if (currentPosition >= this.upperLimit) {
                    this.pauseTimer = 0;
                    this.state = ElevatorState.Pausing;
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, 0, 0));
                } else {
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, this.speed, 0));
                }
                break;
            case ElevatorState.MovingDown:
                if (currentPosition <= this.lowerLimit) {
                    this.pauseTimer = 0;
                    this.state = ElevatorState.Pausing;
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, 0, 0));
                } else {
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, -this.speed, 0));
                }
                break;
            case ElevatorState.Pausing:
                this.pauseTimer += Time.delta / 1000;

                if (this.pauseTimer >= this.pauseDuration) {
                    if (currentPosition >= this.upperLimit) {
                        this.state = ElevatorState.MovingDown;
                        this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, -this.speed, 0));
                    } else if (currentPosition <= this.lowerLimit) {
                        this.state = ElevatorState.MovingUp;
                        this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, this.speed, 0));
                    }
                }
                break;
        }
    }
}