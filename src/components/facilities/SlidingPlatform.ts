import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil, PlaneGeometry, GPUCullMode, VertexAttributeName, BoxGeometry, GeometryBase, UnLitMaterial, BitmapTexture2D, Time, Vector2 } from '@orillusion/core';
import { ActivationState, RigidBodyComponent, ShapeTypes, RigidBodyUtil, Ammo, Physics, PhysicsMathUtil, Generic6DofSpringConstraint } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil';

enum PlatformState {
    MovingLeft,
    MovingRight,
    Pausing
}

export class SlidingPlatform extends ComponentBase {
    private rigidBody: Ammo.btRigidBody;
    public mass: number = 10000;
    public speed: number = 1;
    public leftLimit: number = -61;
    public rightLimit: number = -77;
    public pauseDuration: number = 2;

    private pauseTimer: number = 0;
    private state: PlatformState = PlatformState.MovingLeft;

    private boxObj: Object3D
    async start() {
        this.createPlatform();
        // this.debug()
    }

    private createPlatform() {
        let boxObj = Object3DUtil.GetSingleCube(5, 0.05, 5, Math.random(), Math.random(), Math.random());
        boxObj.localPosition = new Vector3(-71, -22.98, -92)
        let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent);
        boxObjRbComponent.shape = ShapeTypes.btBoxShape;
        boxObjRbComponent.mass = this.mass;
        boxObjRbComponent.damping = new Vector2(0.99, 0.99);
        boxObjRbComponent.activationState = ActivationState.DISABLE_DEACTIVATION;
        boxObjRbComponent.friction = 1000
        boxObjRbComponent.addInitedFunction(() => {
            this.rigidBody = boxObjRbComponent.btRigidbody;
            this.rigidBody.setGravity(PhysicsMathUtil.setBtVector3(0, 0, 0));
        }, this);

        this.object3D.addChild(boxObj);
        this.boxObj = boxObj

        let constraint = boxObj.addComponent(Generic6DofSpringConstraint)
        constraint.linearLowerLimit.set(-1e30, 0, 0)
        constraint.linearUpperLimit.set(1e30, 0, 0)
        constraint.angularLowerLimit.set(0, 0, 0)
        constraint.angularUpperLimit.set(0, 0, 0)
    }

    private debug() {
        let gui = GUIUtil.GUI;
        gui.addFolder('SlidingPlatform');
        gui.add(this, 'enable').onChange((v) => {
            this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, 0, 0));
            this.rigidBody.setMassProps(v ? this.mass : 0, PhysicsMathUtil.setBtVector3(0, 0, 0))
        })
        gui.add(this, 'speed', 0.1, 5, 0.1)
        gui.open();
        gui.add(this, 'leftLimit', -30, 30, 0.1)
        gui.add(this, 'rightLimit', -30, 30, 0.1)
        gui.add(this, 'pauseDuration', 0, 10, 1)
        gui.addButton('reverse', () => {
            if (this.state === PlatformState.MovingLeft) {
                this.state = PlatformState.MovingRight
            } else if (this.state === PlatformState.MovingRight) {
                this.state = PlatformState.MovingLeft
            }
        })

        gui.add(this.boxObj, 'x', -100, 100, 0.1).onFinishChange((v) => changePos('x', v))
        gui.add(this.boxObj, 'y', -100, 100, 0.1).onFinishChange((v) => changePos('y', v))
        gui.add(this.boxObj, 'z', -100, 100, 0.1).onFinishChange((v) => changePos('z', v))
        gui.open();

        const changePos = (axis: 'x' | 'y' | 'z', val: number) => {
            let pos = this.boxObj.localPosition.clone()
            pos[axis] = val
            this.boxObj.getComponent(RigidBodyComponent)?.resetRigidBody(pos)
        }
    }

    public onUpdate(): void {

        const currentPosition = this.boxObj.x;

        switch (this.state) {
            case PlatformState.MovingLeft:
                if (currentPosition >= this.leftLimit) {
                    this.pauseTimer = 0;
                    this.state = PlatformState.Pausing;
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, 0, 0));
                } else {
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(this.speed, 0, 0));
                }
                break;
            case PlatformState.MovingRight:
                if (currentPosition <= this.rightLimit) {
                    this.pauseTimer = 0;
                    this.state = PlatformState.Pausing;
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(0, 0, 0));
                } else {
                    this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(-this.speed, 0, 0));
                }
                break;
            case PlatformState.Pausing:
                this.pauseTimer += Time.delta / 1000;

                if (this.pauseTimer >= this.pauseDuration) {
                    if (currentPosition >= this.leftLimit) {
                        this.state = PlatformState.MovingRight;
                        this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(-this.speed, 0, 0));
                    } else if (currentPosition <= this.rightLimit) {
                        this.state = PlatformState.MovingLeft;
                        this.rigidBody.setLinearVelocity(PhysicsMathUtil.setBtVector3(this.speed, 0, 0));
                    }
                }
                break;
        }
    }
}