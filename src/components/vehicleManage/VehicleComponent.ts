import { BoundUtil, ComponentBase, Engine3D, GPUCullMode, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Vector2, Vector3, View3D } from '@orillusion/core'
import { RigidBodyComponent, CollisionFlags, ActivationState, ShapeTypes, CollisionGroup, CollisionMask, RigidBodyUtil, Physics, Ammo, PhysicsMathUtil } from "@/physics";
import { VehicleControl, VehicleType } from '.'
import { GUIUtil } from '@/utils/GUIUtil'
import { CustomCameraController } from '../cameraController';

import { VehicleCollisionHandler, vehicleRigidBodies } from './VehicleCollisionHandler';
import { ClothSoftBody } from '@/physics/softBody/ClothSoftBody';
import { GUIHelp } from '@/utils/debug/GUIHelp';
/**
 * 载具组件
 */
export class VehicleComponent extends ComponentBase {

    private vehicle: Object3D

    private _position: Vector3 = new Vector3(0, 5, 0)
    private _vehicleType: VehicleType = VehicleType.Pickup

    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];

    public get position() {
        return this._position
    }

    public set position(value: Vector3) {
        this._position = value
    }

    public get vehicleType() {
        return this._vehicleType
    }

    public set vehicleType(type: VehicleType) {
        if (this.vehicleType === type) return;
        this._vehicleType = type;
        if (this.vehicle) {
            // 如果存在则清除当前载具，并创建新的载具
            this.vehicle.destroy()
            this.initVehicle()
        }
    }

    public set enable(value: boolean) {
        this._enable = value
        this.vehicle.getComponent(VehicleControl).enable = value

    }

    public get enable(): boolean {
        return this._enable
    }

    async start() {
        await this.initVehicle()
        // 碰撞事件
        this.registerCollisionHandling()

        for (let i = 0; i < this._initedFunctions.length; i++) {
            let fun = this._initedFunctions[i];
            fun.fun.call(fun.thisObj, this.vehicle);
        }

        this.debug()
    }

    private registerCollisionHandling() {
        const contactProcessedCallback = function (cpPtr: number, colObj0WrapPtr: number, colObj1WrapPtr: number) {
            // 打印原始指针值
            // console.log('Raw pointers:', cpPtr, colObj0WrapPtr, colObj1WrapPtr);

            // 直接将指针转换为btRigidBody对象
            // const bodyA = Ammo.castObject(Ammo.wrapPointer(colObj0WrapPtr, Ammo.btRigidBody), Ammo.btRigidBody);
            // const bodyB = Ammo.castObject(Ammo.wrapPointer(colObj1WrapPtr, Ammo.btRigidBody), Ammo.btRigidBody);
            const bodyA = Ammo.wrapPointer(colObj0WrapPtr, Ammo.btRigidBody);
            const bodyB = Ammo.wrapPointer(colObj1WrapPtr, Ammo.btRigidBody);

            // console.log('Converted bodies:', bodyA, bodyB);

            if (bodyA && bodyB) {

                if (vehicleRigidBodies.has(bodyA) || vehicleRigidBodies.has(bodyB)) {
                    const vehicle = vehicleRigidBodies.has(bodyA) ? bodyA : bodyB;
                    const otherBody = vehicleRigidBodies.has(bodyA) ? bodyB : bodyA;

                    const cp = Ammo.wrapPointer(cpPtr, Ammo.btManifoldPoint);

                    // 获取碰撞点的冲量
                    // const appliedImpulse = cp.getAppliedImpulse();
                    // appliedImpulse && console.log('Applied impulse:', appliedImpulse);
                    // const damage = appliedImpulse * 0.0001;  // 动态调整车辆血量
                    // VehicleCollisionHandler.handleCollision(vehicle, otherBody, damage);


                    /*  // 获取碰撞点的法向力
                     const normalForce = cp.getAppliedImpulse();
                     // 获取碰撞点法线
                     const normal = cp.get_m_normalWorldOnB();
 
                     // 获取速度差异
                     const velocityA = bodyA.getLinearVelocity();
                     const velocityB = bodyB.getLinearVelocity();
                     const relativeVelocity = new Ammo.btVector3(
                         velocityA.x() - velocityB.x(),
                         velocityA.y() - velocityB.y(),
                         velocityA.z() - velocityB.z()
                     );
 
                     // 计算相对速度在碰撞法线方向上的分量
                     const impactSpeed = relativeVelocity.dot(normal);
 
                     // 计算碰撞强度
                     const impactStrength = normalForce * Math.abs(impactSpeed);
 
                     // impactStrength && console.log('Impact strength:', impactStrength);
 
                     // 动态调整车辆血量
                     const damage = impactStrength * 0.0001; // 根据需求调整比例
                     VehicleCollisionHandler.handleCollision(vehicle, otherBody, damage);
 
                     // 释放临时创建的 Ammo 对象
                     Ammo.destroy(relativeVelocity); */


                    /*                     // 获取碰撞点的法向力
                                        const normalForce = cp.getAppliedImpulse();
                                        // 获取碰撞点法线
                                        const normal = cp.get_m_normalWorldOnB();
                    
                                        // 获取速度差异
                                        const velocityA = bodyA.getLinearVelocity();
                                        const velocityB = bodyB.getLinearVelocity();
                                        const relativeVelocity = new Ammo.btVector3(
                                            velocityA.x() - velocityB.x(),
                                            velocityA.y() - velocityB.y(),
                                            velocityA.z() - velocityB.z()
                                        );
                    
                                        // 计算相对速度在碰撞法线方向上的分量
                                        const impactSpeed = relativeVelocity.dot(normal);
                    
                                        // 释放临时创建的 Ammo 对象
                                        Ammo.destroy(relativeVelocity);
                    
                                        // 速度和法向力的阈值
                                        const velocityThreshold = 1.0;
                                        const forceThreshold = 0.5;
                    
                                        if (Math.abs(impactSpeed) > velocityThreshold && normalForce > forceThreshold) {
                                            // 计算碰撞强度
                                            const impactStrength = normalForce * Math.abs(impactSpeed);
                    
                                            console.log('Impact strength:', impactStrength);
                    
                                            // 动态调整车辆血量
                                            const damage = impactStrength * 0.0001; // 根据需求调整比例
                                            if (vehicleRigidBodies.has(bodyA) || vehicleRigidBodies.has(bodyB)) {
                                                const vehicle = vehicleRigidBodies.has(bodyA) ? bodyA : bodyB;
                                                const otherBody = vehicleRigidBodies.has(bodyA) ? bodyB : bodyA;
                                                VehicleCollisionHandler.handleCollision(vehicle, otherBody, damage);
                                            }
                                        } */


                    const velA = bodyA.getLinearVelocity();
                    const velB = bodyB.getLinearVelocity();

                    const relativeVelocity = new Ammo.btVector3(
                        velB.x() - velA.x(),
                        velB.y() - velA.y(),
                        velB.z() - velA.z()
                    );

                    const speed = relativeVelocity.length();
                    Ammo.destroy(relativeVelocity);

                    // Define thresholds
                    const velocityThreshold = 1.0; // Adjust based on your game needs
                    const forceThreshold = 0.5;    // Adjust based on your game needs

                    // Calculate the component of the relative velocity along the collision normal
                    const normalForce = cp.getAppliedImpulse();
                    const impactStrength = normalForce * speed;

                    console.log('Impact strength:', impactStrength);

                    // Apply damage based on impact strength
                    const damage = impactStrength * 0.00001; // Adjust the multiplier as needed
                    if (vehicleRigidBodies.has(bodyA) || vehicleRigidBodies.has(bodyB)) {
                        const vehicle = vehicleRigidBodies.has(bodyA) ? bodyA : bodyB;
                        const otherBody = vehicleRigidBodies.has(bodyA) ? bodyB : bodyA;
                        VehicleCollisionHandler.handleCollision(vehicle, otherBody, damage);
                    }


                }
            } else {
                console.error('One or both bodies are invalid:', bodyA, bodyB);
            }

            return 0; // 确保返回0
        };


        // 设置全局碰撞回调
        // Physics.world.setContactProcessedCallback(Ammo.addFunction(contactProcessedCallback));

        // 注册碰撞处理回调
        Physics.contactProcessedUtil.registerCollisionHandlingCallback('VehicleCollision', (cp, bodyA, bodyB) => {
            if (vehicleRigidBodies.has(bodyA) || vehicleRigidBodies.has(bodyB)) {
                const vehicle = vehicleRigidBodies.has(bodyA) ? bodyA : bodyB;
                const otherBody = vehicleRigidBodies.has(bodyA) ? bodyB : bodyA;

                // 计算相对速度
                const velA = bodyA.getLinearVelocity();
                const velB = bodyB.getLinearVelocity();
                const speed = PhysicsMathUtil.setBtVector3(velB.x() - velA.x(), velB.y() - velA.y(), velB.z() - velA.z()).length()

                // 获取碰撞冲击力
                const normalForce = cp.getAppliedImpulse();
                const impactStrength = normalForce * speed;
                const damage = impactStrength * 0.001; // 调整系数以适应需求

                VehicleCollisionHandler.handleCollision(vehicle, otherBody, damage);
            }
        });
        // 设置碰撞回调
        // console.warn('Registered global collision event callback');

        // 车辆刚体集合
        // console.warn('Registered vehicle rigid bodies:', Array.from(vehicleRigidBodies));
    }


    /**
     * Add init callback
     * @param fun callback function
     * @param thisObj this
     */
    public addInitedFunction(fun: Function, thisObj: Object) {
        this._initedFunctions.push({ fun: fun, thisObj: thisObj });
    }

    private async initVehicle() {

        let vehicle: Object3D;

        switch (this.vehicleType) {
            case VehicleType.Pickup: {

                vehicle = await Engine3D.res.loadGltf('models/vehicles/red_pickup_chassis.glb');
                vehicle.localPosition = this.position
                vehicle.name = 'vehicle'
                this.object3D.addChild(vehicle);

                // 创建刚体
                this.initRigidBody(vehicle, 1000)

                // add keyboard controller to the car
                let controller = vehicle.addComponent(VehicleControl);
                controller.mVehicleArgs = {
                    wheelSize: 1,
                    friction: 1000, // 摩擦力
                    suspensionStiffness: 10.0, // 悬架刚度 20.0
                    suspensionDamping: 0.5, // 悬架阻尼 2.3
                    suspensionCompression: 0.8, // 悬架压缩 4.4
                    suspensionRestLength: 0.7, // 悬吊长度 0.6
                    rollInfluence: 0.9, // 离心力 影响力 0.2
                    steeringIncrement: 0.002,  // 转向增量 0.04
                    steeringClamp: 0.4, // 转向钳 0.5
                    maxEngineForce: 1300, // 最大发动机力 1500
                    maxBreakingForce: 50, // 最大断裂力 500
                    maxSuspensionTravelCm: 100 // 最大悬架行程
                }
                // 车轮位置偏移
                controller.wheelPosOffset = [
                    { x: 1.1, z: 1.9 },
                    { x: -1.1, z: 1.9 },
                    { x: 1.1, z: -1.8 },
                    { x: -1.1, z: -1.8 },
                ];
            }
                break;
            case VehicleType.Truck: {
                vehicle = await Engine3D.res.loadGltf('models/vehicles/truck_chassis.glb');
                vehicle.localPosition = this.position
                vehicle.name = 'vehicle'

                this.object3D.addChild(vehicle);

                // 创建刚体
                this.initRigidBody(vehicle, 5000)

                let controller = vehicle.addComponent(VehicleControl);
                controller.mVehicleArgs = {
                    wheelSize: 1.3,
                    friction: 1000, // 摩擦力 1000 值越大越滑
                    suspensionStiffness: 5, // 悬架刚度 20.0
                    suspensionDamping: 0.1, // 悬架阻尼 2.3
                    suspensionCompression: 0.4, // 悬架压缩 4.4
                    suspensionRestLength: 0.9, // 悬吊长度 0.6
                    rollInfluence: 0.9, // 离心力 影响力 0.2
                    steeringIncrement: 0.004,  // 转向增量 0.04
                    steeringClamp: 0.4, // 转向钳 0.5
                    maxEngineForce: 1000, // 最大发动机力 1500
                    maxBreakingForce: 100, // 最大断裂力 500
                    maxSuspensionTravelCm: 100 // 最大悬架行程
                }

                controller.wheelPosOffset = [
                    { x: 1.8, z: 5.8 },
                    { x: -1.8, z: 5.8 },

                    { x: 1.8, z: 1.4 },
                    { x: -1.8, z: 1.4 },
                    { x: 1.8, z: 0 },
                    { x: -1.8, z: 0 },

                    { x: 1.8, z: -4.2 },
                    { x: -1.8, z: -4.2 },
                    { x: 1.8, z: -5.6 },
                    { x: -1.8, z: -5.6 },
                ];
            }
                break;
            case VehicleType.FireTruck: {
                vehicle = await Engine3D.res.loadGltf('models/vehicles/fire_truck_chassis.glb');
                vehicle.localPosition = this.position
                vehicle.name = 'vehicle'

                this.object3D.addChild(vehicle);

                // 创建刚体
                this.initRigidBody(vehicle, 3000)

                // 载具控制器依赖载具刚体，需要先为载具添加刚体再添加控制器
                let controller = vehicle.addComponent(VehicleControl);
                controller.mVehicleArgs = {
                    wheelSize: 1.1,
                    friction: 10, // 摩擦力 1000 值越大越滑
                    suspensionStiffness: 8.0, // 悬架刚度 20.0
                    suspensionDamping: 0.1, // 悬架阻尼 2.3
                    suspensionCompression: 0.2, // 悬架压缩 4.4
                    suspensionRestLength: 0.7, // 悬架未受压时的长度 0.6  
                    rollInfluence: 0.99, // 离心力 影响力 0.2
                    steeringIncrement: 0.003,  // 转向增量 0.04
                    steeringClamp: 0.35, // 转向钳 0.5
                    maxEngineForce: 1500, // 最大发动机力 1500
                    maxBreakingForce: 50, // 最大断裂力 500
                    maxSuspensionTravelCm: 135 // 最大悬架行程
                }
                controller.wheelPosOffset = [
                    { x: 1.44, z: 2.8 },
                    { x: -1.44, z: 2.8 },
                    { x: 1.44, z: -2.55 },
                    { x: -1.44, z: -2.55 },
                ]
            }
            case VehicleType.LargePickup: {

                const SCALE = 0.3
                let wheel = await Engine3D.res.loadGltf('models/vehicles/large_wheel.glb')
                // vehicle = await Engine3D.res.loadGltf('models/vehicles/large_pickup_chassis.glb');
                vehicle = await Engine3D.res.loadGltf('models/vehicles/large_pickup_aerial_chassis.glb');
                vehicle.localPosition = this.position
                vehicle.name = 'vehicle'
                vehicle.scaleX = vehicle.scaleY = vehicle.scaleZ = SCALE
                // console.log('vehicle size', BoundUtil.genMeshBounds(vehicle).size.toString());


                this.object3D.addChild(vehicle);

                // 加载碰撞体数据
                const response = await fetch('json/modelData/large_pickup.json')
                const data = await response.json() as { vertices: Float32Array };
                const vertices = new Float32Array(data.vertices);

                // 创建刚体
                let rigidBodyComponent = this.initRigidBody(vehicle, 1000 * SCALE)
                rigidBodyComponent.modelVertices = vertices;
                rigidBodyComponent.addInitedFunction(() => {
                    // 创建旗帜软体
                    this.initFlagSoftBody(rigidBodyComponent.btRigidbody)
                }, this)


                // 载具控制器依赖载具刚体，需要先为载具添加刚体再添加控制器
                let controller = vehicle.addComponent(VehicleControl);
                // controller.enable = false
                controller.mVehicleArgs = {
                    wheelSize: SCALE,
                    friction: 100, // 摩擦力 1000 值越大越滑
                    suspensionStiffness: 30, // 悬架刚度 20.0
                    suspensionDamping: 1, // 悬架阻尼 2.3
                    suspensionCompression: 1, // 悬架压缩 4.4
                    suspensionRestLength: 0.08, // 悬架未受压时的长度 0.6  
                    rollInfluence: 0.5, // 离心力 影响力 0.2
                    steeringIncrement: .004,  // 转向增量 0.04
                    steeringClamp: 0.35, // 转向钳 0.5
                    maxEngineForce: 300, // 最大发动机力 1500
                    maxBreakingForce: 10, // 最大断裂力 500
                    maxSuspensionTravelCm: 135 // 最大悬架行程 
                }
                controller.wheelObject = wheel
                controller.wheelPosOffset = [
                    { x: 1.2 * SCALE, z: 1.25 * SCALE },
                    { x: -1.2 * SCALE, z: 1.25 * SCALE },
                    { x: 1.2 * SCALE, z: -1.25 * SCALE },
                    { x: -1.2 * SCALE, z: -1.25 * SCALE },
                ]

                // 轮胎大小标准	wheelRadiusFront = .35; wheelWidthFront = .2;
                // 底部大小标准 chassisWidth = 1.8;  chassisHeight = .6; chassisLength = 4;  massVehicle = 800;
            }
                break;
            default:
                throw new Error("Wrong Vehicle Type");
        }

        this.vehicle = vehicle;

    }

    private initRigidBody(vehicle: Object3D, mass: number, damping?: Vector2): RigidBodyComponent {
        const rigidBodyComponent = vehicle.addComponent(RigidBodyComponent)
        rigidBodyComponent.mass = mass;
        rigidBodyComponent.damping = damping || new Vector2(0.2, 0.2);
        // rigidBodyComponent.restitution = 0;
        // rigidBodyComponent.friction = 0;
        // rigidBodyComponent.rollingFriction = 1;
        rigidBodyComponent.shape = ShapeTypes.btConvexHullShape;
        rigidBodyComponent.group = CollisionGroup.VEHICLE;
        rigidBodyComponent.mask = CollisionMask.DEFAULT_MASK
        rigidBodyComponent.activationState = ActivationState.DISABLE_DEACTIVATION
        rigidBodyComponent.enable = false; // 由于载具为复杂刚体类，此处刚体组件只进行刚体构建，不需要内部进行更新
        rigidBodyComponent.userIndex = 99

        rigidBodyComponent.addInitedFunction(() => {
            VehicleCollisionHandler.registerVehicle(rigidBodyComponent.btRigidbody);
        }, this)
        return rigidBodyComponent
    }

    private async initFlagSoftBody(btRigidbody: Ammo.btRigidBody) {
        const obj: Object3D = new Object3D()
        let mr: MeshRenderer = obj.addComponent(MeshRenderer)
        mr.geometry = new PlaneGeometry(0.5 * 1, 0.33 * 1, 10, 7)

        let texture = await Engine3D.res.loadTexture('textures/flag.jpg');
        // let normalMapTexture = await Engine3D.res.loadTexture('textures/sandstone_cracks/sandstone_cracks_diff_1k.jpg');
        let mat = new LitMaterial();
        mat.baseMap = texture;
        // mat.normalMap = normalMapTexture;
        mat.cullMode = GPUCullMode.none
        mat.metallic = 0;
        mat.roughness = 10;
        // let texture = new BitmapTexture2D()
        // await texture.load('textures/flag.jpg')
        // let mat = new UnLitMaterial()
        // mat.baseMap = texture;
        // mat.cullMode = GPUCullMode.none
        // mr.material = mat;

        mr.material = mat;
        this.object3D.transform.scene3D.addChild(obj)

        let softBody = obj.addComponent(ClothSoftBody)
        softBody.mass = 0.9
        softBody.margin = 0
        softBody.appendRigidbody = btRigidbody
        softBody.anchorIndices = ['leftTop', 'leftBottom'];
        softBody.influence = 1;
        softBody.disableCollision = false;
        softBody.applyPosition = new Vector3(0.02, 1.05, -0.03)
        softBody.applyRotation = new Vector3(0, 0, 0)
        softBody.addInitedFunction(() => {
            let sbConfig = softBody.btSoftBody.get_m_cfg();
            sbConfig.set_viterations(10);
            sbConfig.set_piterations(10);
            sbConfig.set_kDF(0.2);
            sbConfig.set_kDP(0.01);
            sbConfig.set_kLF(0.15);
            sbConfig.set_kDG(0.01);
        }, this)

        GUIHelp.addFolder('SoftBody Vehicle flag')
        GUIHelp.open()
        GUIHelp.addButton('Stop SoftBody Movement', () => softBody.stopSoftBodyMovement())
        GUIHelp.addButton('Clear Anchors', () => softBody.clearAnchors())
    }

    private debug() {

        let gui = GUIUtil.GUI
        gui.removeFolder('vehicle')
        let f = gui.addFolder('vehicle')
        f.add(this.vehicleGUI, 'HP', 0, 100, 0.1).listen()
        f.add(this.vehicleGUI, 'SPEED').listen();
        f.open()

        // 提取枚举键值对
        // const vehicleTypeObject = Object.keys(VehicleType)
        //     .filter(key => isNaN(Number(key))) // 过滤出非数值键
        //     .reduce((obj, key) => {
        //         obj[key] = VehicleType[key as keyof typeof VehicleType];
        //         return obj;
        //     }, {} as Record<string, VehicleType>);

        // const params = { vehicleType: this._vehicleType }; // 默认值

        // f.add(params, 'vehicleType', vehicleTypeObject)
        //     .onChange(value => {
        //         console.log('Selected vehicle type:', value);
        //         this.vehicleType = +value
        //         setTimeout(() => {
        //             this.transform.view3D.camera.object3D.getComponent(CustomCameraController).flowTarget(this.vehicle, new Vector3(0, 2, 0));
        //         }, 5000);
        //     });


    }
    public vehicleGUI = {
        HP: 100,
        SPEED: 0,
    };

    // 暂时只获取第一辆车的值
    public onUpdate(view?: View3D) {

        this.vehicleGUI.HP = Array.from(VehicleCollisionHandler.healthMap.values())[0] || 100;
        this.vehicleGUI.SPEED = this.vehicle?.getComponent(VehicleControl)?.vehicleSpeed || 0

    }
    /**
      * @internal
      */
    public destroy(force?: boolean) {

        console.log('Vehicle Component destroy');

        this._initedFunctions = null;

        // super.destroy(force);

        this.vehicle.destroy(force)

    }
}
