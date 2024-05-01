import { ComponentBase, Engine3D, Object3D, Vector2, Vector3 } from '@orillusion/core'
import { AmmoRigidBody, CollisionFlags, ActivationState, ShapeTypes, CollisionGroup, CollisionMask, RigidBodyUtil } from "@/physics";
import { VehicleControl, VehicleType } from './index'

/**
 * 载具组件
 */
export class VehicleComponent extends ComponentBase {

	private vehicle: Object3D

	private _position: Vector3 = new Vector3(0, -30, 0)
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

	async start() {
		await this.initVehicle()

		for (let i = 0; i < this._initedFunctions.length; i++) {
			let fun = this._initedFunctions[i];
			fun.fun.call(fun.thisObj, this.vehicle);
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

	private async initVehicle() {

		let vehicle: Object3D;

		switch (this.vehicleType) {
			case VehicleType.Pickup: {

				vehicle = await Engine3D.res.loadGltf('src/models/vehicles/redPickup_chassis.glb');
				vehicle.localPosition = this.position
				vehicle.name = 'vehicle'
				this.object3D.addChild(vehicle);

				// 创建刚体
				// this._vehicleRigidBody = RigidBodyUtil.convexHullShapeRigidBody(vehicle, 1000)
				// this._vehicleRigidBody.setDamping(0.2, 0)
				// this._vehicleRigidBody.setActivationState(4)
				// vehicle.data ||= { bodyRb: this._vehicleRigidBody }
				// Physics.world.addRigidBody(this._vehicleRigidBody, CollisionGroup.VEHICLE, CollisionMask.DEFAULT_MASK);


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


					// friction: 10, // 摩擦力 1000 值越大越滑
					// suspensionStiffness: 20.0, // 悬架刚度 20.0
					// suspensionDamping: 0.3, // 悬架阻尼 2.3
					// suspensionCompression: 1.3, // 悬架压缩 4.4
					// suspensionRestLength: 0.6, // 悬吊长度 0.6
					// rollInfluence: 0.8, // 离心力 影响力 0.2
					// steeringIncrement: 0.003,  // 转向增量 0.04
					// steeringClamp: 0.42, // 转向钳 0.5
					// maxEngineForce: 1320, // 最大发动机力 1500
					// maxBreakingForce: 50, // 最大断裂力 500
					// maxSuspensionTravelCm: 500 // 最大悬架行程

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
				vehicle = await Engine3D.res.loadGltf('src/models/vehicles/truck_chassis.glb');
				vehicle.localPosition = this.position
				vehicle.name = 'vehicle'

				this.object3D.addChild(vehicle);

				// 创建刚体
				// this._vehicleRigidBody = RigidBodyUtil.convexHullShapeRigidBody(vehicle, 5000)
				// this._vehicleRigidBody.setDamping(0.2, 0)
				// this._vehicleRigidBody.setActivationState(4)
				// vehicle.data ||= { bodyRb: this._vehicleRigidBody }
				// Physics.world.addRigidBody(this._vehicleRigidBody);

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
				vehicle = await Engine3D.res.loadGltf('src/models/vehicles/fireTruck_chassis2.glb');
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
				break;
			default:
				throw new Error("Wrong Vehicle Type");
		}
		
		this.vehicle = vehicle;

	}

	private initRigidBody(vehicle: Object3D, mass: number, damping?: Vector2) {
		const rigidBodyComponent = vehicle.addComponent(AmmoRigidBody)
		rigidBodyComponent.mass = mass;
		rigidBodyComponent.damping = damping || new Vector2(0.2, 0);
		rigidBodyComponent.restitution = 0;
		// rigidBodyComponent.friction = 1;
		// rigidBodyComponent.rollingFriction = 1;
		rigidBodyComponent.shape = ShapeTypes.btConvexHullShape;
		rigidBodyComponent.group = CollisionGroup.VEHICLE
		rigidBodyComponent.mask = CollisionMask.DEFAULT_MASK
		rigidBodyComponent.activationState = ActivationState.DISABLE_DEACTIVATION
		rigidBodyComponent.enable = false; // 由于载具为复杂刚体类，此处刚体组件只进行刚体构建，不需要内部进行更新
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
