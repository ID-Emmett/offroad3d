import { Scene3D, Object3D, Engine3D, ColliderComponent, BoxColliderShape, Vector3, ComponentBase, KeyCode, KeyEvent, Quaternion, BoundUtil, Camera3D, Vector3Ex, MeshRenderer, LitMaterial, Color, BoxGeometry, AtmosphericComponent, CameraUtil, DirectLight, KelvinUtil, View3D, BlendMode, BitmapTexture2D, UnLitMaterial, Time, lerpVector3, Matrix4, Orientation3D } from '@orillusion/core';
// import { Ammo, Physics, Rigidbody } from '@orillusion/physics';

import { eventBus } from '@/modules/store/index'
import { RigidBodyComponent, RigidBodyUtil, Ammo, Physics, CollisionFlags, CollisionMask, CollisionGroup, ShapeTypes, PhysicsMathUtil } from '@/physics';
import { CustomCameraController } from '../cameraController';
import { GUIHelp } from '@/utils/debug/GUIHelp';

enum VehicleControlType {
    acceleration,
    braking,
    left,
    right,
    handbrake
}

export class VehicleControl extends ComponentBase {
    private scene: Scene3D;
    private mWheels: Object3D[] = [];
    private mEngineForce = 0;
    private mBreakingForce = 0;
    private mVehicleSteering = 0;
    private speed: number
    private mAmmoVehicle: Ammo.btRaycastVehicle;
    private rigidbody: Ammo.btRigidBody;
    private mWheelInfos: Ammo.btWheelInfo[] = []
    private mVehicleControlState = [false, false, false, false]; // 车辆控制状态

    private _enableKeyEvent: boolean = true

    /**
     * 车辆配置
     */
    public mVehicleArgs = {
        wheelSize: 1,
        friction: 1000, // 摩擦力 1000 值越大越滑
        suspensionStiffness: 20.0, // 悬架刚度 20.0
        suspensionDamping: 0.8, // 悬架阻尼 2.3
        suspensionCompression: 0.6, // 悬架压缩 4.4
        suspensionRestLength: 0.35, // 悬吊长度 0.6
        rollInfluence: 0.15, // 离心力 影响力 0.2
        steeringIncrement: 0.04,  // 转向增量 0.04
        steeringClamp: 0.35, // 转向钳 0.5
        maxEngineForce: 1000, // 最大发动机力 1500
        maxBreakingForce: 60, // 最大断裂力 车身前后惯性力 500  
        maxSuspensionTravelCm: 500 // 最大悬架行程
    };

    /**
     * 车轮位置偏移
     */
    public wheelPosOffset = [{ x: 0, z: 0 }]
    /**
     * 车轮图形对象，如果不指定则使用默认车轮
     */
    public wheelObject: Object3D

    async start() {

        this.scene = this.transform.scene3D
        this.rigidbody = this.object3D.getComponent(RigidBodyComponent)?.btRigidbody;

        this.wheelObject ||= await Engine3D.res.loadGltf('models/vehicles/low_poly_wheel.glb');

        // 添加轮胎
        for (let index = 0; index < this.wheelPosOffset.length; index++) {
            let newWheel = this.wheelObject.clone()
            newWheel.scaleX = newWheel.scaleY = newWheel.scaleZ = this.mVehicleArgs.wheelSize
            this.scene.addChild(newWheel);
            this.mWheels.push(newWheel)
        }

        this.wheelObject = null

        this.initRaycastVehicle();

        this._enableKeyEvent && this.updateKeyboardEventListeners()

        this.fov = this.transform.view3D.camera.fov
    }

    /**
     * @param enabled 启用/禁用键盘事件
     */
    public set enableKeyEvent(enabled: boolean) {
        if (this._enableKeyEvent !== enabled) {
            this._enableKeyEvent = enabled;
            this.updateKeyboardEventListeners(enabled);
        }
    }

    private updateKeyboardEventListeners(enable: boolean = true) {
        if (enable) {
            Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
            Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);
        } else {
            Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
            Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);
            this.mVehicleControlState = [false, false, false, false]
        }
    }

    public get wheelInfos(): Ammo.btWheelInfo[] {
        return this.mWheelInfos
    }

    private async initRaycastVehicle() {

        let tuning = new Ammo.btVehicleTuning(); // 车辆调校
        // tuning.set_m_suspensionStiffness(20.0);
        // tuning.set_m_suspensionDamping(2.3);
        // tuning.set_m_suspensionCompression(4.4);
        // tuning.set_m_maxSuspensionTravelCm(500.0);
        // tuning.set_m_frictionSlip(10.5);
        // tuning.set_m_maxSuspensionForce(6000.0);

        let rayCaster = new Ammo.btDefaultVehicleRaycaster(Physics.world); // 光线投射 默认车辆光线投射器
        let vehicle = new Ammo.btRaycastVehicle(tuning, this.rigidbody, rayCaster); // 车辆光线投射
        vehicle.setCoordinateSystem(0, 1, 2); // 设置坐标系统


        // 设置车辆的CCD参数
        const ccdMotionThreshold = 25; // 米/秒
        const ccdSweptSphereRadius = 0.375; // 米
        this.rigidbody.setCcdMotionThreshold(ccdMotionThreshold);  // 当对象移动超过这个阈值时启用CCD
        this.rigidbody.setCcdSweptSphereRadius(ccdSweptSphereRadius); // 设置CCD使用的扫描半径，应适当大于物体的最小尺寸

        this.mAmmoVehicle = vehicle;

        Physics.world.addAction(vehicle);

        let wheelDirectCS0 = new Ammo.btVector3(0, -1, 0);
        let wheelAxleCS = new Ammo.btVector3(-1, 0, 0);  // 轴

        let addWheel = (isFront: boolean, x: number, y: number, z: number, radius: number) => {
            let wheelInfo = vehicle.addWheel(PhysicsMathUtil.setBtVector3(x, y, z), wheelDirectCS0, wheelAxleCS, this.mVehicleArgs.suspensionRestLength, radius, tuning, isFront);
            wheelInfo.set_m_suspensionStiffness(this.mVehicleArgs.suspensionStiffness); // 设置悬架刚度
            wheelInfo.set_m_wheelsDampingRelaxation(this.mVehicleArgs.suspensionDamping); // 设置车轮阻尼松弛
            wheelInfo.set_m_wheelsDampingCompression(this.mVehicleArgs.suspensionCompression); // 设置车轮阻尼压缩
            // wheelInfo.set_m_frictionSlip(isFront ? this.mVehicleArgs.friction : 4); // 设置摩擦滑动
            wheelInfo.set_m_frictionSlip(this.mVehicleArgs.friction); // 设置摩擦滑动
            wheelInfo.set_m_rollInfluence(this.mVehicleArgs.rollInfluence); // 设置滚动影响
            // wheelInfo.set_m_maxSuspensionTravelCm(this.mVehicleArgs.maxSuspensionTravelCm); // 设置悬架行程

            // wheelInfo.set_m_suspensionRestLength1(0.2); 
            // wheelInfo.set_m_chassisConnectionPointCS(new Ammo.btVector3(x, y - 0.1, z));
            // wheelInfo.set_m_clippedInvContactDotSuspension(10.5);
            // wheelInfo.set_m_maxSuspensionForce(this.mVehicleArgs.suspensionStiffness * 100000);

            // wheelInfo.set_m_wheelsSuspensionForce(100000); // 设置悬架力

            // console.log(this.mVehicleArgs);

            this.mWheelInfos.push(wheelInfo)
        };

        const r = BoundUtil.genMeshBounds(this.mWheels[0]).size.y / 2; // 半径
        const x = this.mWheels[0].transform.worldPosition.x;
        // const y = BoundUtil.genMeshBounds(this.mWheels[0]).size.y - r + 0.76;
        const y = -r;
        const z = this.mWheels[0].transform.worldPosition.z;


        const [w1, w2, w3, w4] = this.wheelPosOffset
        addWheel(true, (-x + w1.x), -y, (z + w1.z), r);
        addWheel(true, (x + w2.x), -y, (z + w2.z), r);
        addWheel(false, (-x + w3.x), -y, (-z + w3.z), r);
        addWheel(false, (x + w4.x), -y, (-z + w4.z), r);

        Ammo.destroy(wheelDirectCS0)
        Ammo.destroy(wheelAxleCS)
        // 追加额外的车轮
        // for (let index = 0; index < this.wheelPosOffset.length - 4; index++) {
        //     addWheel(false, (-x + this.wheelPosOffset[4 + index].x), -y, (-z + this.wheelPosOffset[4 + index].z), r);
        // }

        // this.debug()
    }

    private debug() {
        let wheelInfos = this.wheelInfos;
        let wheelObj: any = {}
        wheelObj['getSuspensionRestLength'] = wheelInfos[0].getSuspensionRestLength()
        // wheelObj['get_m_bIsFrontWheel'] = wheelInfos[0].get_m_bIsFrontWheel()
        wheelObj['get_m_brake'] = wheelInfos[0].get_m_brake()
        // wheelObj['get_m_chassisConnectionPointCS'] = wheelInfos[0].get_m_chassisConnectionPointCS()
        wheelObj['get_m_clippedInvContactDotSuspension'] = wheelInfos[0].get_m_clippedInvContactDotSuspension()
        wheelObj['get_m_deltaRotation'] = wheelInfos[0].get_m_deltaRotation()
        wheelObj['get_m_engineForce'] = wheelInfos[0].get_m_engineForce()
        wheelObj['get_m_frictionSlip'] = wheelInfos[0].get_m_frictionSlip()
        wheelObj['get_m_maxSuspensionForce'] = wheelInfos[0].get_m_maxSuspensionForce()
        wheelObj['get_m_maxSuspensionTravelCm'] = wheelInfos[0].get_m_maxSuspensionTravelCm()
        // wheelObj['get_m_raycastInfo'] = wheelInfos[0].get_m_raycastInfo()
        wheelObj['get_m_rollInfluence'] = wheelInfos[0].get_m_rollInfluence()
        wheelObj['get_m_rotation'] = wheelInfos[0].get_m_rotation()
        wheelObj['get_m_skidInfo'] = wheelInfos[0].get_m_skidInfo()
        wheelObj['get_m_steering'] = wheelInfos[0].get_m_steering()
        wheelObj['get_m_suspensionRelativeVelocity'] = wheelInfos[0].get_m_suspensionRelativeVelocity()
        wheelObj['get_m_suspensionRestLength1'] = wheelInfos[0].get_m_suspensionRestLength1()
        wheelObj['get_m_suspensionStiffness'] = wheelInfos[0].get_m_suspensionStiffness()
        // wheelObj['get_m_wheelAxleCS'] = wheelInfos[0].get_m_wheelAxleCS()
        // wheelObj['get_m_wheelDirectionCS'] = wheelInfos[0].get_m_wheelDirectionCS()
        wheelObj['get_m_wheelsDampingCompression'] = wheelInfos[0].get_m_wheelsDampingCompression()
        wheelObj['get_m_wheelsDampingRelaxation'] = wheelInfos[0].get_m_wheelsDampingRelaxation()
        wheelObj['get_m_wheelsRadius'] = wheelInfos[0].get_m_wheelsRadius()
        wheelObj['get_m_wheelsSuspensionForce'] = wheelInfos[0].get_m_wheelsSuspensionForce()
        wheelObj['get_m_worldTransform'] = wheelInfos[0].get_m_worldTransform()
        console.log(wheelObj);

        GUIHelp.addFolder('vehicle')
        GUIHelp.add(wheelObj, 'getSuspensionRestLength').onChange((v) => {
        })
        GUIHelp.add(wheelObj, 'get_m_brake').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_brake(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_clippedInvContactDotSuspension').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_clippedInvContactDotSuspension(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_deltaRotation').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_deltaRotation(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_engineForce').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_engineForce(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_frictionSlip').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_frictionSlip(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_maxSuspensionForce').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_maxSuspensionForce(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_maxSuspensionTravelCm').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_maxSuspensionTravelCm(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_rollInfluence').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_rollInfluence(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_rotation').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_rotation(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_skidInfo').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_skidInfo(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_steering').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_steering(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_suspensionRelativeVelocity').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_suspensionRelativeVelocity(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_suspensionRestLength1').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_suspensionRestLength1(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_suspensionStiffness').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_suspensionStiffness(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_wheelsDampingCompression').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_wheelsDampingCompression(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_wheelsDampingRelaxation').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_wheelsDampingRelaxation(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_wheelsRadius').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_wheelsRadius(+v))
        })
        GUIHelp.add(wheelObj, 'get_m_wheelsSuspensionForce').onChange((v) => {
            this.wheelInfos.forEach(item => item.set_m_wheelsSuspensionForce(+v))
        })


    }

    // onUpdate() {  // 标准更新 载具跳动 场景平滑 渲染58hz （set 80 frameRate）
    onLateUpdate() { // 物理步进在更新时或更新前 此处后 载具可以平滑 但场景跳动  新测试较为正常
        // onBeforeUpdate() { // 还未测试

        if (!this.mAmmoVehicle) return;

        const vehicle = this.mAmmoVehicle;
        const n = vehicle.getNumWheels()


        // 仅受控时处理相关操作
        if (this._enableKeyEvent) {
            const delta = Time.delta * 0.16
            const speed = this.speed = vehicle.getCurrentSpeedKmHour();

            this.mBreakingForce = 0;
            this.mEngineForce = 0;

            if (this.mVehicleControlState[VehicleControlType.acceleration]) {
                if (speed < -1) this.mBreakingForce = this.mVehicleArgs.maxBreakingForce;
                else this.mEngineForce = this.mVehicleArgs.maxEngineForce * this.speedUp;
            }

            // if (this.speedUp === 1) {
            //     if (this.transform.view3D.camera.fov >= this.fov) {
            //         this.transform.view3D.camera.fov -= 0.1 * delta
            //     }
            // } else {                
            //     if (this.transform.view3D.camera.fov - 5  <= this.fov) {
            //         this.transform.view3D.camera.fov += 0.1 * delta
            //     }
            // }
            // this.transform.view3D.camera.fov = this.fov + (speed*0.1)


            if (this.mVehicleControlState[VehicleControlType.braking]) {
                if (speed > 1) this.mBreakingForce = this.mVehicleArgs.maxBreakingForce;
                else this.mEngineForce = -this.mVehicleArgs.maxEngineForce / 2;
            }

            if (this.mVehicleControlState[VehicleControlType.left]) {
                if (this.mVehicleSteering < this.mVehicleArgs.steeringClamp) this.mVehicleSteering += delta * this.mVehicleArgs.steeringIncrement;
            } else if (this.mVehicleControlState[VehicleControlType.right]) {
                if (this.mVehicleSteering > -this.mVehicleArgs.steeringClamp) this.mVehicleSteering -= delta * this.mVehicleArgs.steeringIncrement;
            } else {

                if (this.mVehicleSteering < -this.mVehicleArgs.steeringIncrement) {
                    this.mVehicleSteering += delta * this.mVehicleArgs.steeringIncrement;
                } else {
                    // 未转向时执行
                    if (this.mVehicleSteering > this.mVehicleArgs.steeringIncrement) this.mVehicleSteering -= delta * this.mVehicleArgs.steeringIncrement;
                    else this.mVehicleSteering = 0;
                }
            }


            const FRONT_LEFT = 0;
            const FRONT_RIGHT = 1;
            const BACK_LEFT = 2;
            const BACK_RIGHT = 3;

            vehicle.setSteeringValue(this.mVehicleSteering, FRONT_LEFT); // 转向
            vehicle.setSteeringValue(this.mVehicleSteering, FRONT_RIGHT); // 转向  



            vehicle.setBrake(this.mBreakingForce / 2, FRONT_LEFT);
            vehicle.setBrake(this.mBreakingForce / 2, FRONT_RIGHT);
            vehicle.setBrake(this.mBreakingForce, BACK_LEFT);
            vehicle.setBrake(this.mBreakingForce, BACK_RIGHT);


            // 手刹
            if (this.mVehicleControlState[VehicleControlType.handbrake]) {
                vehicle.applyEngineForce(0, BACK_LEFT);
                vehicle.applyEngineForce(0, BACK_RIGHT);
                vehicle.applyEngineForce(0, FRONT_LEFT);
                vehicle.applyEngineForce(0, FRONT_RIGHT);
                vehicle.setBrake(30, BACK_LEFT);
                vehicle.setBrake(30, BACK_RIGHT);
            } else {
                vehicle.applyEngineForce(this.mEngineForce, BACK_LEFT);
                vehicle.applyEngineForce(this.mEngineForce, BACK_RIGHT);
                vehicle.applyEngineForce(this.mEngineForce, FRONT_LEFT);
                vehicle.applyEngineForce(this.mEngineForce, FRONT_RIGHT);
            }


            // if (n === 10) {

            //     vehicle.setSteeringValue(this.mVehicleSteering / 2, 2);
            //     vehicle.setSteeringValue(this.mVehicleSteering / 2, 3);
            //     vehicle.setSteeringValue(this.mVehicleSteering / 4, 4);
            //     vehicle.setSteeringValue(this.mVehicleSteering / 4, 5);

            //     vehicle.applyEngineForce(this.mEngineForce, 4);
            //     vehicle.applyEngineForce(this.mEngineForce, 5);
            //     vehicle.applyEngineForce(this.mEngineForce, 6);
            //     vehicle.applyEngineForce(this.mEngineForce, 7);
            //     vehicle.applyEngineForce(this.mEngineForce, 8);
            //     vehicle.applyEngineForce(this.mEngineForce, 9);
            // }
        }

        // update body position and rotation
        for (let i = 0; i < n; i++) {
            vehicle.updateWheelTransform(i, true);
            Physics.syncGraphic(this.mWheels[i], vehicle.getWheelTransformWS(i))
        }

        this.rigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM)
        Physics.syncGraphic(this.object3D, Physics.TEMP_TRANSFORM)

    }

    private checkCollisions(carUserIndex: number) {
        let dispatcher = Physics.world.getDispatcher();
        let numManifolds = dispatcher.getNumManifolds();
        // console.log(numManifolds);

        for (let i = 0; i < numManifolds; i++) {
            let contactManifold = dispatcher.getManifoldByIndexInternal(i);
            let body0 = contactManifold.getBody0();
            let body1 = contactManifold.getBody1();

            if (body0.getUserIndex() === carUserIndex || body1.getUserIndex() === carUserIndex) {
                // 车辆参与了碰撞
                // 根据另一个刚体的 userIndex 进行相应处理

                // console.log(body0.getUserIndex(), body1.getUserIndex());

                let otherBody = (body0.getUserIndex() === carUserIndex) ? body1 : body0;

                if (otherBody.getUserIndex() > 10000) {
                    // 执行碰撞触发器逻辑
                    console.log('触发器执行');

                    eventBus.publish('collisionLamp', { index: otherBody.getUserIndex(), lampTrigger: otherBody });
                    otherBody.setUserIndex(0)
                    // otherBody.setCollisionFlags(1)

                    // 移除触发器 此处测试不能移除，否则离开区域时释放资源会产生意外结果
                    // Physics.world.removeCollisionObject(otherBody);
                    // Ammo.destroy(otherBody.getCollisionShape());
                    // Ammo.destroy(otherBody);
                }
            }



        }
    }


    onKeyUp(e: KeyEvent) {
        this.updateControlState(e.keyCode, false);
    }
    onKeyDown(e: KeyEvent) {
        this.updateControlState(e.keyCode, true);
    }

    private speedUp: number = 1
    private fov: number = 0
    updateControlState(keyCode: number, state: boolean) {
        switch (keyCode) {
            case KeyCode.Key_W:
                this.mVehicleControlState[VehicleControlType.acceleration] = state;
                break;
            case KeyCode.Key_Up:
                this.mVehicleControlState[VehicleControlType.acceleration] = state;
                break;
            case KeyCode.Key_S:
                this.mVehicleControlState[VehicleControlType.braking] = state;
                break;
            case KeyCode.Key_Down:
                this.mVehicleControlState[VehicleControlType.braking] = state;
                break;
            case KeyCode.Key_A:
                this.mVehicleControlState[VehicleControlType.left] = state;
                break;
            case KeyCode.Key_Left:
                this.mVehicleControlState[VehicleControlType.left] = state;
                break;
            case KeyCode.Key_D:
                this.mVehicleControlState[VehicleControlType.right] = state;
                break;
            case KeyCode.Key_Right:
                this.mVehicleControlState[VehicleControlType.right] = state;
                break;
            case KeyCode.Key_Space:
                this.mVehicleControlState[VehicleControlType.handbrake] = state;
                break;
            case KeyCode.Key_Shift_L:
                this.speedUp = state ? 1.8 : 1; // 加速

                break;
            case KeyCode.Key_P:
                if (state) {
                    let { x, y, z } = this.object3D.transform.localPosition
                    RigidBodyUtil.resetRigidBody(this.rigidbody, new Vector3(x, 10, z), Quaternion._zero)
                }
        }
    }

    /**
     * Gets the vehicle speed per hour
     */
    public get vehicleSpeed(): number {
        return this.speed;
    }

    /**
     * @internal
     */
    public destroy(force?: boolean) {

        console.log('VehicleControlComponent destroy');

        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);
        super.destroy(force);

        this.mWheels.forEach(e => e.destroy())
        this.mWheels = null;
        if (this.wheelObject) this.wheelObject.destroy()

        Physics.world.removeAction(this.mAmmoVehicle);
        Ammo.destroy(this.mAmmoVehicle);

        this.mWheelInfos = null
        this.mVehicleArgs = null
    }
}
