import { Vector3, BoxColliderShape, CapsuleColliderShape, ColliderComponent, ComponentBase, MeshColliderShape, Quaternion, SphereColliderShape, Vector2, Object3D } from '@orillusion/core'
import { CollisionFlags, ActivationState, ShapeTypes, RigidBodyUtil, CollisionGroup, CollisionMask, type ChildShapes, PhysicsMathUtil, Ammo, Physics } from '.'

/**
 * Rigidbody Component
 * 扩展，支持更多碰撞体类型，优化更新管理等
 * @group Components
 */
export class RigidBodyComponent extends ComponentBase {
    private _mass: number = 0;
    private _velocity: Vector3 = new Vector3();
    private _angularVelocity: Vector3 = new Vector3();
    private _force: Vector3 = new Vector3();
    private _useGravity: boolean = true;
    private _isKinematic: boolean = false;
    private _isStatic: boolean = false;
    private _isTrigger: boolean = false;
    private _btRigidbody: Ammo.btRigidBody;
    private _btBodyInited: boolean = false;
    private _friction: number; // 0.6
    private _rollingFriction: number; // 0.1
    private _restitution: number // 0.8

    private _damping: Vector2 = null; // new Vector2(0.1, 0.1)
    private _activationState: ActivationState;
    private _collisionFlags: CollisionFlags;

    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];

    // -----------------ADD----------------
    /**
     * 碰撞体形状
     */
    public shape: ShapeTypes;
    /**
     * 碰撞体大小，需要完整尺寸，箱形设置有效。
     */
    public size: Vector3;
    /**
     * 碰撞体完整高度，圆柱体与胶囊体形设置有效，胶囊形状时表示圆柱部分高度。
     */
    public height: number;
    /**
     * 碰撞体半径，球形，圆柱形，胶囊形设置有效。
     */
    public radius: number;
    /**
     * 静态平面的法线向量，用于定义平面的方向。
     */
    public planeNormal: Vector3;
    /**
     * 静态平面的常数项，用于定义平面的位置。它表示从原点到平面的距离。
     */
    public planeConstant: number;
    /**
     * 复合型碰撞体
     */
    public childShapes: ChildShapes[];
    /**
     * 刚体碰撞组
     */
    public group: CollisionGroup;
    /**
     * 刚体碰撞掩码
     */
    public mask: CollisionMask;
    /**
     * 用户索引，仅数字类型，可以作为刚体标识
     */
    public userIndex: number
    /**
     * 模型顶点数据（凸包与三角网格形状可用），默认通过图形引擎获取模型对象的网格顶点数据
     */
    public modelVertices: Float32Array;
    /**
     * 模型索引数据（三角网格形状可用），默认通过图形引擎获取模型对象的网格索引数据
     */
    public modelIndices: Uint16Array;
    /**
     * 测试使用，仅为创建碰撞体时提供顶点与索引数据
     */
    public lowObject: Object3D;

    public _gravity: Vector3;
    // -----------------END----------------

    /**
     * 激活状态
     */
    public get activationState() {
        return this._activationState;
    }

    public set activationState(value: number) {
        this._activationState = value;
        if (this._btRigidbody) this._btRigidbody.setActivationState(value);
    }

    /**
     * 碰撞标志
     */
    public get collisionFlags() {
        return this._collisionFlags;
    }

    public set collisionFlags(value: number) {
        this._collisionFlags = value;
        if (this._btRigidbody) this._btRigidbody.setCollisionFlags(value);
    }

    /**
     * 刚体阻尼 x:线性阻尼，y:角阻尼
     */
    public get damping() {
        return this._damping;
    }

    public set damping(value: Vector2) {
        this._damping = value;
        if (this._btRigidbody) this._btRigidbody.setDamping(value.x, value.y);
    }

    /**
     * 重力
     */
    public get gravity() {
        return this._gravity
    }
    public set gravity(value: Vector3) {
        this._gravity = value
        if (this._btRigidbody) this._btRigidbody.setGravity(PhysicsMathUtil.toBtVector3(value));
    }
    /**
     * Get friction value
     */
    public get friction() {
        return this._friction;
    }
    /**
     * Set friction value
     */
    public set friction(value: number) {
        this._friction = value;
        if (this._btRigidbody) this._btRigidbody.setFriction(value);
    }
    /**
     * Get rolling friction value
     */
    public get rollingFriction(): number {
        return this._rollingFriction;
    }
    /**
     * Set rolling friction value
     */
    public set rollingFriction(value: number) {
        this._rollingFriction = value;
        if (this._btRigidbody) this._btRigidbody.setRollingFriction(value);
    }
    /**
     * Get restitution value
     */
    public get restitution(): number {
        return this._restitution;
    }
    /**
     * Set restitution value
     */
    public set restitution(value: number) {
        this._restitution = value;
        if (this._btRigidbody) this._btRigidbody.setRestitution(value);
    }
    /**
     * Check if rigidbody inited
     */
    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    init(): void {

    }

    public start(): void {

        this.initRigidbody();
    }

    private initRigidbody(): void {
        // if (Number.isNaN(this.transform.worldPosition.x) || Number.isNaN(this.transform.worldPosition.y) || Number.isNaN(this.transform.worldPosition.z)) {
        //     console.warn('位置错误');
        //     console.log(this.transform.worldPosition);
        // }

        this.addRigidBodyComponent();

        for (let i = 0; i < this._initedFunctions.length; i++) {
            let fun = this._initedFunctions[i];
            fun.fun.call(fun.thisObj);
        }
        this._btBodyInited = true;
    }

    private addRigidBodyComponent(): void {
        switch (this.shape) {
            case ShapeTypes.btStaticPlaneShape: // 平面
                this._btRigidbody = RigidBodyUtil.staticPlaneShapeRigidBody(this.object3D, this.mass, this.planeNormal, this.planeConstant);

                break;
            case ShapeTypes.btBoxShape: // 箱形
                this._btRigidbody = RigidBodyUtil.boxShapeRigidBody(this.object3D, this.mass, this.size);

                break;
            case ShapeTypes.btSphereShape: // 球形
                this._btRigidbody = RigidBodyUtil.sphereShapeRigidBody(this.object3D, this.mass, this.radius);

                break;
            case ShapeTypes.btCapsuleShape: // 胶囊形
                this._btRigidbody = RigidBodyUtil.capsuleShapeRigidBody(this.object3D, this.mass, this.radius, this.height);

                break;
            case ShapeTypes.btCylinderShape: // 圆柱形
                this._btRigidbody = RigidBodyUtil.cylinderShapeRigidBody(this.object3D, this.mass, this.radius, this.height);

                break;
            case ShapeTypes.btConeShape: // 圆锥形
                this._btRigidbody = RigidBodyUtil.coneShapeRigidBody(this.object3D, this.mass, this.radius, this.height);

                break;
            case ShapeTypes.btHeightfieldTerrainShape: // 高度场
                this._btRigidbody = RigidBodyUtil.heightfieldTerrainShapeRigidBody(this.object3D, this.mass);

                break;
            case ShapeTypes.btConvexHullShape: // 凸包形
                this._btRigidbody = RigidBodyUtil.convexHullShapeRigidBody(this.object3D, this.mass, this.modelVertices, this.lowObject);

                break;
            case ShapeTypes.btBvhTriangleMeshShape: // 三角网格
                this._btRigidbody = RigidBodyUtil.bvhTriangleMeshShapeRigidBody(this.object3D, this.mass, this.modelVertices, this.modelIndices, this.lowObject);

                break;
            case ShapeTypes.btCompoundShape: // 复合形
                this._btRigidbody = RigidBodyUtil.compoundShapeRigidBody(this.object3D, this.mass, this.childShapes);

                break;
            default:
                // 使用原始碰撞体组件构建刚体
                let shape = this.originShape()
                this._btRigidbody = RigidBodyUtil.createRigidBody(shape, this.mass, this.object3D)
        }

        this.restitution && this._btRigidbody.setRestitution(this.restitution);
        this.friction && this._btRigidbody.setFriction(this.friction);
        this.rollingFriction && this._btRigidbody.setRollingFriction(this.rollingFriction);
        this.userIndex && this._btRigidbody.setUserIndex(this.userIndex);
        this.damping && this._btRigidbody.setDamping(this.damping.x, this.damping.y);
        this.activationState && this._btRigidbody.setActivationState(this.activationState);
        this.collisionFlags && this._btRigidbody.setCollisionFlags(this.collisionFlags);
        this.gravity && this._btRigidbody.setGravity(PhysicsMathUtil.toBtVector3(this.gravity));

        if (this.mass <= 0) {
            this._btRigidbody.setCollisionFlags(this._btRigidbody.getCollisionFlags() | CollisionFlags.STATIC_OBJECT);
        }

        // if (this.group && this.mask) {    
        if (typeof this.group !== 'undefined' && this.group !== null &&
            typeof this.mask !== 'undefined' && this.mask !== null) {
            Physics.world.addRigidBody(this._btRigidbody, this.group, this.mask);
        } else {
            Physics.world.addRigidBody(this._btRigidbody);
        }
    }

    private originShape(): Ammo.btCollisionShape {

        // 保留原组件功能
        if (this.object3D.hasComponent(ColliderComponent)) {
            console.warn("启用碰撞组件形状");

            let collider = this.object3D.getComponent(ColliderComponent);
            let colliderShape = collider.shape;

            let shape: Ammo.btCollisionShape;

            if (colliderShape instanceof BoxColliderShape) {
                shape = new Ammo.btBoxShape(PhysicsMathUtil.toBtVector3(colliderShape.halfSize));
            } else if (colliderShape instanceof CapsuleColliderShape) {
                shape = new Ammo.btCapsuleShape(colliderShape.radius, colliderShape.height);
            } else if (colliderShape instanceof MeshColliderShape) {
                // let  triangleMeshShape = new Ammo.btTriangleMeshShape();
            } else if (colliderShape instanceof SphereColliderShape) {
                shape = new Ammo.btSphereShape(colliderShape.radius);
            }

            return shape

        } else {

            throw new Error("Unsupported shape type");
        }
    }

    /**
     * Add init callback
     * @param fun callback function
     * @param thisObj this
     */
    public addInitedFunction(fun: Function, thisObj: Object) {
        this._initedFunctions.push({ fun: fun, thisObj: thisObj });
    }

    /**
     * Remove init callback
     * @param fun callback function
     * @param thisObj this
     */
    public removeInitedFunction(fun: Function, thisObj: Object) {
        for (let i = 0; i < this._initedFunctions.length; i++) {
            let item = this._initedFunctions[i];
            if (item.fun === fun && item.thisObj === thisObj) {
                this._initedFunctions.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Return internal Ammo.btRigidBody
     */
    public get btRigidbody(): Ammo.btRigidBody {
        return this._btRigidbody;
    }

    onUpdate(): void {

        if (this._btRigidbody?.isActive()) {

            // console.log('同步图形变换');

            this._btRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);

            let pos = Physics.TEMP_TRANSFORM.getOrigin()
            let qua = Physics.TEMP_TRANSFORM.getRotation()
            Quaternion.HELP_0.set(qua.x(), qua.y(), qua.z(), qua.w());

            this.transform.localPosition = Vector3.HELP_0.set(pos.x(), pos.y(), pos.z());
            this.transform.localRotQuat = Quaternion.HELP_0;

            Physics.checkBound(this);
        }
    }

    /**
     * 重设刚体变换
     * @param newPosition 可选，默认为图形对象的位置
     * @param newRotation 可选，默认为图形对象的欧拉角旋转
     */
    public resetRigidBody(newPosition?: Vector3, newRotation?: Vector3 | Quaternion): void {
        if (!this._btRigidbody) return console.error('No rigid body');

        newPosition ||= this.transform.localPosition;
        newRotation ||= this.transform.localRotation;
        RigidBodyUtil.resetRigidBody(this.btRigidbody, newPosition, newRotation)
    }

    public destroy(force?: boolean): void {
        // console.log('RigidBody Component Destroy', this.object3D, this.object3D.name);

        RigidBodyUtil.destroyRigidBody(this._btRigidbody)

        this._btRigidbody = null;
        this._initedFunctions = null;

        super.destroy(force);
    }

    /**
     * Get mass value。
     */
    public get mass(): number {
        return this._mass;
    }
    /**
     * Set mass value。
     */
    public set mass(value: number) {
        this._mass = value;
        if (this._btRigidbody) {

            Physics.world.removeRigidBody(this._btRigidbody);
            this.addRigidBodyComponent();
            // console.log("setMassProps", "mass: " + value, "flag: " + this._btRigidbody.getCollisionFlags());
            // this._btRigidbody.setMassProps(value, new Ammo.btVector3(0, 0, 0));
            // this._btRigidbody.setCollisionFlags(this._btRigidbody.getCollisionFlags());
            // console.log("setMassProps", "mass: " + value, "flag: " + this._btRigidbody.getCollisionFlags());
            // if(this.mass <= 0) {
            //     this._btRigidbody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            //     this._btRigidbody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            // }
        }
    }
    /**
     * Get velocity value of current object
     */
    public get velocity(): Vector3 {
        return this._velocity;
    }
    /**
     * Set velocity value of current object
     */
    public set velocity(value: Vector3) {
        this._velocity = value.clone();
        if (this._btRigidbody) {
            this._btRigidbody.applyForce(PhysicsMathUtil.toBtVector3(value), PhysicsMathUtil.setBtVector3(0, 0, 0));
        }
    }
    /**
     * Get the angular velocity value of current object
     */
    public get angularVelocity(): Vector3 {
        return this._angularVelocity;
    }

    /**
     * Set the angular velocity value of current object
     */
    public set angularVelocity(value: Vector3) {
        this._angularVelocity = value;
    }
    /**
     * Check if the rigidbody affect physics system
     */
    public get isKinematic(): boolean {
        return this._isKinematic;
    }
    /**
     * Set if the rigidbody affect physics system
     */
    public set isKinematic(value: boolean) {
        this._isKinematic = value;
    }

    public get isTrigger(): boolean {
        return this._isTrigger;
    }

    public set isTrigger(value: boolean) {
        this._isTrigger = value;
    }
}
