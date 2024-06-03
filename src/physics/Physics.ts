import { Vector3, Time, BoundingBox, Object3D, Quaternion, Engine3D, Scene3D } from '@orillusion/core';
import { Ammo } from '@orillusion/physics';
// import Ammo from '@orillusion/ammo';
import { RigidBodyComponent, PhysicsMathUtil, ContactProcessedUtil, ClothSoftBodyComponent, SoftBodyComponentBase } from '.';
import { RigidBodyMapping } from './RigidBodyMapping';
import { PhysicsDebugDrawer, type DebugDrawerOptions } from './PhysicsDebugDrawer';

class _Physics {
    private _world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    private _isStop: boolean = false;
    private _gravity: Vector3 = new Vector3(0, -9.8, 0);
    private isInitialized: boolean = false;
    private softBodyWorldInfo: Ammo.btSoftBodyWorldInfo | null = null;
    private physicBound: BoundingBox;

    public maxSubSteps: number = 10;
    public fixedTimeStep: number = 1 / 60;
    /**
     * 调试
     */
    public debugDrawer: PhysicsDebugDrawer

    /**
     * 刚体映射实例
     */
    public readonly rigidBodyMapping = new RigidBodyMapping();

    /**
     * 碰撞处理回调工具
     */
    public readonly contactProcessedUtil = ContactProcessedUtil;

    public TEMP_TRANSFORM: Ammo.btTransform; // Temp cache, save results from body.getWorldTransform()

    constructor() { }


    /**
     * Init Physics
     */
    public async init(options: { useSoftBody?: boolean, useCollisionCallback?: boolean, debugConfig?: DebugDrawerOptions } = {}) {
        await Ammo.bind(window)(Ammo);
        PhysicsMathUtil.init();

        this.TEMP_TRANSFORM = new Ammo.btTransform();
        this.switchWorld(options.useSoftBody);

        // 碰撞回调处理函数通过 Physics.contactProcessedUtil.registerCollisionHandlingCallback 进行注册
        if (options.useCollisionCallback) {
            let funcpointer = Ammo.addFunction(Physics.contactProcessedUtil.contactProcessedCallback)
            Physics.world.setContactProcessedCallback(funcpointer);
        }

        // 物理对象绘制能力
        if (options.debugConfig) {
            this.debugDrawer = new PhysicsDebugDrawer(this.world, options.debugConfig);
        }

        this.isInitialized = true;
        this.physicBound = new BoundingBox(new Vector3(), new Vector3(2000, 2000, 2000));
    }

    public switchWorld(useSoftBody: boolean) {
        if (this.isInitialized && useSoftBody && this.isSoftBodyWord) return;

        if (this.isInitialized) {
            this.softBodyWorldInfo && Ammo.destroy(this.softBodyWorldInfo);
            this.softBodyWorldInfo = null;
            Ammo.destroy(this.world);
        }

        const collisionConfiguration = useSoftBody
            ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration()
            : new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const broadphase = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();

        if (useSoftBody) {
            const softBodySolver = new Ammo.btDefaultSoftBodySolver();
            this._world = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
            this.softBodyWorldInfo = (this.world as Ammo.btSoftRigidDynamicsWorld).getWorldInfo();
            this.softBodyWorldInfo.set_m_broadphase(broadphase);
            this.softBodyWorldInfo.set_m_dispatcher(dispatcher);
            this.softBodyWorldInfo.set_m_gravity(PhysicsMathUtil.toBtVector3(this.gravity));
            this.softBodyWorldInfo.set_air_density(1.2);
            this.softBodyWorldInfo.set_water_density(0);
            this.softBodyWorldInfo.set_water_offset(0);
            this.softBodyWorldInfo.set_water_normal(PhysicsMathUtil.setBtVector3(0, 0, 0));
            this.softBodyWorldInfo.set_m_maxDisplacement(0.5);
        } else {
            this._world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
        }

        this.world.setGravity(PhysicsMathUtil.toBtVector3(this.gravity));
    }

    public addRigidbody(rigidBody: RigidBodyComponent) {
        this.world.addRigidBody(rigidBody.btRigidbody);
    }

    public removeRigidbody(rigidBody: RigidBodyComponent) {
        this.world.removeRigidBody(rigidBody.btRigidbody);
    }

    public addSoftBody(softBody: Ammo.btSoftBody, collisionFilterGroup: number = 1, collisionFilterMask: number = -1) {
        if (this.world instanceof Ammo.btSoftRigidDynamicsWorld) {
            this.world.addSoftBody(softBody, collisionFilterGroup, collisionFilterMask);
        } else {
            console.warn('Soft bodies cannot be added to a rigid body world.');
        }
    }

    public removeSoftBody(softBody: SoftBodyComponentBase) {
        if (this.world instanceof Ammo.btSoftRigidDynamicsWorld) {
            this.world.removeSoftBody(softBody.btSoftBody);
            Ammo.destroy(softBody.btSoftBody);
        } else {
            console.warn('rigid body world can not be destroyed Soft bodies.');
        }
    }

    public update(maxSubSteps: number = this.maxSubSteps, fixedTimeStep: number = this.fixedTimeStep) {
        if (!this.isInitialized || this.isStop) return;
        this.world.stepSimulation(Time.delta / 1000, maxSubSteps, fixedTimeStep);

        this.debugDrawer?.update();
    }

    public get world(): Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld {
        return this._world;
    }

    public get isInited(): boolean {
        return this.isInitialized;
    }

    public set isStop(value: boolean) {
        this._isStop = value;
    }

    public get isStop() {
        return this._isStop;
    }

    public set gravity(gravity: Vector3) {
        this._gravity = gravity;
        if (this.world) {
            this.world.setGravity(PhysicsMathUtil.toBtVector3(gravity));
        }
    }

    public get gravity(): Vector3 {
        return this._gravity;
    }

    public get worldInfo(): Ammo.btSoftBodyWorldInfo {
        if (!this.softBodyWorldInfo) {
            throw new Error("SoftBodyPhysics has not been initialized.");
        }
        return this.softBodyWorldInfo;
    }

    public get isSoftBodyWord() {
        return !!this.softBodyWorldInfo;
    }

    public checkBound(body: RigidBodyComponent) {
        if (body) {
            let wp = body.transform.worldPosition;
            let inside = this.physicBound.containsPoint(wp);
            if (!inside) {
                body.btRigidbody.activate(false);
                body.destroy();
            }
        }
    }

    /**
     * 同步图形变换
     */
    public syncGraphic(graphic: Object3D, tm: Ammo.btTransform): void {
        graphic.localPosition = PhysicsMathUtil.fromBtVector3(tm.getOrigin(), Vector3.HELP_0);
        graphic.localQuaternion = PhysicsMathUtil.fromBtQuaternion(tm.getRotation(), Quaternion.HELP_0);
    }
}

// Export a single instance of the Physics class
export let Physics = new _Physics();
export { Ammo };
