import { Object3D, BoundUtil, Vector3, Quaternion, Object3DUtil, MeshRenderer, VertexAttributeName, PlaneGeometry } from '@orillusion/core';

import { Ammo, Physics } from '@orillusion/physics';

type RigidBodyData = {
	type?: string;
	position: { x: number; y: number; z: number };
	rotation?: { x: number; y: number; z: number, w: number };
	size: { width: number; height: number; depth: number };
};

/* 对于图形与物理对象的同步问题，以下有三种解决方案 （ori中应该是第一种）*/

/**
 * 方案一：图形与物理同步
 * 模型原点设置为其中心，这样图形引擎和物理引擎得到的都是相同的中心点，这样不需要运行时计算中心点偏移，
 * 但是更改模型的高度位置时需要根据中心点进行计算设置。
 * 目前模型方面可以通过拉伸地下部分与地上部分对其，无需设置位置，且也能同步刚体，这样会增加物理对象与图形对象的整体高度（长度）。
 */

/**
 * 方案二：实时同步偏移
 * 模型在建模软件中设置其高度位置，使模型底部正好贴合地面，在图形引擎中设置模型高度为0时，模型底部刚好贴合地面。无需计算偏移。
 * 但是物理引擎创建的形状的中心是在模型的坐标位置，这样会导致有一半的刚体在地下，
 * 可以通过设置刚体的初始位置来贴合模型对象，同时每次更新刚体位置时，模型对象的位置也需要这个偏移量进行同步。
 */

/**
 * 方案三：复合刚体
 * 使用复合刚体来调整形状的偏移位置，这样能保证更新刚体时模型对象无需计算偏移量，同时模型的高度设置为0时也能正好与刚体贴合。
 */


/**
 * 刚体工具
 */
export class RigidBodyUtil {

	/**
	 * 盒型碰撞体，未指定尺寸时默认使用包围盒大小
	 */
	public static boxShapeRigidBody(graphic: Object3D, mass: number, size?: Vector3) {
		size ||= BoundUtil.genMeshBounds(graphic).size;

		const halfExtents = new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2);
		let shape = new Ammo.btBoxShape(halfExtents);
		Ammo.destroy(halfExtents)

		return this.createRigidBody(shape, mass, graphic.localPosition, graphic.localQuaternion)
	}

	/**
	 * 球型碰撞体，未指定尺寸时默认使用包围盒半径(x)
	 */
	public static sphereShapeRigidBody(graphic: Object3D, mass: number, radius?: number) {
		radius ||= BoundUtil.genMeshBounds(graphic).extents.x;
		let shape = new Ammo.btSphereShape(radius);

		return this.createRigidBody(shape, mass, graphic.localPosition, graphic.localQuaternion)
	}

	/**
	 * 圆柱型碰撞体，未指定尺寸时默认使用包围盒半径和高度
	 * @param {Object3D} graphic - 用于创建碰撞体的三维对象。
	 * @param {number} mass - 碰撞体的质量。
	 * @param {number} [radius] - 圆柱的半径。
	 * @param {number} [height] - 圆柱的完整高度。
	 * @param {Vector3} [boundSize] - 三维对象的包围盒尺寸。
	 * @returns  The newly created Ammo.btRigidBody object.
	 */
	public static cylinderShapeRigidBody(graphic: Object3D, mass: number, radius?: number, height?: number, boundSize?: Vector3) {
		if (!radius || !height) boundSize ||= BoundUtil.genMeshBounds(graphic).size;

		radius ||= boundSize.x / 2;
		height ||= boundSize.y;

		const halfExtents = new Ammo.btVector3(radius, height / 2, radius);

		// graphic.addChild(Object3DUtil.GetSingleCube(radius, height / 2, radius, 1, 1, 1))

		let shape = new Ammo.btCylinderShape(halfExtents);
		Ammo.destroy(halfExtents)

		return this.createRigidBody(shape, mass, graphic.localPosition, graphic.localQuaternion)
	}

	/**
	 * 胶囊型碰撞体，未指定尺寸时默认使用包围盒半径和高度
	 * @param {Object3D} graphic - 用于创建碰撞体的三维对象。
	 * @param {number} mass - 碰撞体的质量。
	 * @param {number} [radius] - 胶囊的半径。
	 * @param {number} [height] - 胶囊中间的圆柱部分的高度。
	 * @param {Vector3} [boundSize] - 三维对象的包围盒尺寸。
	 * @returns  The newly created Ammo.btRigidBody object.
	 */
	public static capsuleShapeRigidBody(graphic: Object3D, mass: number, radius?: number, height?: number, boundSize?: Vector3) {
		if (!radius || !height) boundSize ||= BoundUtil.genMeshBounds(graphic).size;

		radius ||= boundSize.x / 2;
		height ||= boundSize.y - radius * 2;

		// graphic.addChild(Object3DUtil.GetSingleCube(radius, height, radius, 1, 1, 1));

		let shape = new Ammo.btCapsuleShape(radius, height);

		return this.createRigidBody(shape, mass, graphic.localPosition, graphic.localQuaternion);
	}


	/**
	 * Creates a rigid body with specified properties.
	 * @param mass The mass of the rigid body, where 0 represents an immovable object.
	 * @param shape The collision shape of the body, defined as any valid Ammo physics shape.
	 * @param position The starting world position of the rigid body as a Vector3.
	 * @param rotQuat (Optional) The initial rotation of the rigid body as a Quaternion.
	 * @returns The newly created Ammo.btRigidBody object.
	 */
	public static createRigidBody(shape: Ammo.btCollisionShape, mass: number, position: Vector3, rotQuat?: Quaternion): Ammo.btRigidBody {
		const transform = Physics.TEMP_TRANSFORM;
		transform.setIdentity();

		const origin = new Ammo.btVector3(position.x, position.y, position.z);
		transform.setOrigin(origin);
		Ammo.destroy(origin); // 立即销毁

		if (rotQuat) {
			const rotation = new Ammo.btQuaternion(rotQuat.x, rotQuat.y, rotQuat.z, rotQuat.w);
			transform.setRotation(rotation);
			Ammo.destroy(rotation); // 立即销毁
		}

		const motionState = new Ammo.btDefaultMotionState(transform);
		const localInertia = new Ammo.btVector3(0, 0, 0);
		if (mass !== 0) {
			shape.calculateLocalInertia(mass, localInertia);
		}

		const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		const bodyRb = new Ammo.btRigidBody(rbInfo);

		// 清理不再需要的实例
		Ammo.destroy(localInertia);


		// bodyRb.setFriction(1.0);  // 高摩擦系数以防止滑动
		// bodyRb.setRestitution(0.0);  // 低恢复系数以减少弹跳
		return bodyRb;
	}


	/**
	 * 高度场碰撞体，基于平面几何顶点构建
	 */
	public static heightfieldTerrainShapeRigidBody(
		graphic: Object3D,
		mass: number = 0,
		heightScale: number = 1,
		upAxis: number = 1,
		hdt: Ammo.PHY_ScalarType = 'PHY_FLOAT',
		flipQuadEdges: boolean = false,
	): Ammo.btRigidBody {

		let geometry = graphic.getComponent(MeshRenderer)?.geometry 
		if (!(geometry instanceof PlaneGeometry)) throw new Error("Wrong geometry type");

		const { width, height, segmentW, segmentH } = geometry;

		// 获得现有顶点信息
		let posAttrData = geometry.getAttribute(VertexAttributeName.position);

		// 高度数据
		const heightData = new Float32Array(posAttrData.data.length / 3);
		let minHeight = Infinity, maxHeight = -Infinity;

		// 顶点坐标
		for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
			let y = posAttrData.data[i * 3 + 1];
			heightData[i] = y;
			if (y < minHeight) minHeight = y;
			if (y > maxHeight) maxHeight = y;
		}

		let ammoHeightData = Ammo._malloc(heightData.length * 4);

		let ammoHeightDataF32 = new Float32Array(Ammo.HEAPF32.buffer, ammoHeightData, heightData.length);
		ammoHeightDataF32.set(heightData);

		// 创建高度场形状 
		let terrainShape = new Ammo.btHeightfieldTerrainShape(
			segmentW + 1,      //? heightStickWidth
			segmentH + 1,      //? heightStickLength
			ammoHeightData,    //? heightfieldData
			heightScale,       //? heightScale
			minHeight,         //? minHeight
			maxHeight,         //? maxHeight
			upAxis,            //? upAxis (1 = Y axis)
			hdt,               //? hdt (float data type)
			flipQuadEdges      //? flipQuadEdges
		);

		terrainShape.setMargin(0.04); // 碰撞边距

		// 设置地形的实际尺寸
		let localScaling = new Ammo.btVector3(width / segmentW, 1, height / segmentH);
		terrainShape.setLocalScaling(localScaling);
		Ammo.destroy(localScaling);

		// 设置位置
		let averageHeight = (minHeight + maxHeight) / 2;
		let origin = new Vector3(0, averageHeight, 0);

		let bodyRb = this.createRigidBody(terrainShape, mass, origin, graphic.localQuaternion)

		// body.setCcdMotionThreshold(1e-7);
		// body.setCcdSweptSphereRadius(0.2); // 根据实际尺寸调整

		// bodyRb.setFriction(1.0);  // 高摩擦系数以防止滑动
		// bodyRb.setRestitution(1);  // 低恢复系数以减少弹跳

		return bodyRb
	}

	/**
	 * Create a Convex Hull RigidBody.
	 * 仅计算模型中第一个网格对象的顶点 凸包形状 形状将会“填满”模型的凹部
	 * @param graphic 
	 * @param mass 
	 * @returns Shapes data
	 */
	public static convexHullShapeRigidBody(graphic: Object3D, mass: number = 0) {

		let mr = graphic.getComponents(MeshRenderer)
		let posAttrData = mr[0].geometry.getAttribute(VertexAttributeName.position)

		let convexHullShape = new Ammo.btConvexHullShape();
		let point = new Ammo.btVector3();
		for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
			point.setValue(posAttrData.data[3 * i], posAttrData.data[3 * i + 1], posAttrData.data[3 * i + 2]);
			convexHullShape.addPoint(point, true);
		}
		Ammo.destroy(point);

		return this.createRigidBody(convexHullShape, mass, graphic.localPosition, graphic.localQuaternion)
	}

	/**
	 * Create a triangle Mesh RigidBody.
	 * 仅计算模型中第一个网格对象的顶点
	 * @param graphic 
	 * @param mass 
	 * @returns Shapes data
	 */
	public static triangleMeshRigidBody(graphic: Object3D, mass: number = 0) {
		let mr = graphic.getComponents(MeshRenderer)
		let posAttrData = mr[0].geometry.getAttribute(VertexAttributeName.position)

		console.warn('实验性类型');
		console.log('triangleMeshRigidBody posAttrDataLength:', posAttrData.data.length);

		let triangleMesh = new Ammo.btTriangleMesh();

		// 每三个顶点形成一个三角形 posAttrData.data 是 Float32Array，包含所有顶点的 xyz 坐标
		{
			let v0 = new Ammo.btVector3();
			let v1 = new Ammo.btVector3();
			let v2 = new Ammo.btVector3();
			for (let i = 0; i < posAttrData.data.length; i += 9) {
				// 创建向量实例
				v0.setValue(posAttrData.data[i], posAttrData.data[i + 1], posAttrData.data[i + 2]);
				v1.setValue(posAttrData.data[i + 3], posAttrData.data[i + 4], posAttrData.data[i + 5]);
				v2.setValue(posAttrData.data[i + 6], posAttrData.data[i + 7], posAttrData.data[i + 8]);

				// 添加三角形
				triangleMesh.addTriangle(v0, v1, v2, true);
			}
			// 销毁向量实例
			Ammo.destroy(v0);
			Ammo.destroy(v1);
			Ammo.destroy(v2);
		}

		// 应用缩放
		let scaling = new Ammo.btVector3(graphic.scaleX, graphic.scaleY, graphic.scaleZ)
		triangleMesh.setScaling(scaling);
		Ammo.destroy(scaling)

		let useQuantizedAabbCompression = false;
		let shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, useQuantizedAabbCompression);

		let bodyRb = this.createRigidBody(shape, mass, graphic.transform.worldPosition, graphic.localQuaternion)

		return bodyRb
	}


	/**
	 * Create a composite rigid body
	 * @param graphic Graphic Object
	 * @param mass The total mass of the rigid body
	 * @param compoundShapeData  Data required for compound rigid body
	 */
	public static createCompoundRigidBody(graphic: Object3D, mass: number, compoundShapeData: RigidBodyData[]): Ammo.btRigidBody {
		const compoundShape = new Ammo.btCompoundShape();
		const btTransform = Physics.TEMP_TRANSFORM;

		compoundShapeData.forEach(rb => {
			let shape: Ammo.btCollisionShape
			if (rb.type === 'Circle') {
				shape = new Ammo.btCapsuleShape(rb.size.width, rb.size.height);
			} else {
				let boxSize = new Ammo.btVector3(rb.size.width, rb.size.height, rb.size.depth);
				shape = new Ammo.btBoxShape(boxSize);
				Ammo.destroy(boxSize); // 立即销毁
			}

			btTransform.setIdentity();

			let origin = new Ammo.btVector3(rb.position.x, rb.position.y, rb.position.z)
			btTransform.setOrigin(origin);
			Ammo.destroy(origin)

			if (rb.rotation) {
				const rotation = new Ammo.btQuaternion(rb.rotation.x, rb.rotation.y, rb.rotation.z, rb.rotation.w);
				btTransform.setRotation(rotation);
				Ammo.destroy(rotation); // 立即销毁
			}

			compoundShape.addChildShape(btTransform, shape);

			/* Visual object debug physicalVisualDebug */

			let visualObject = Object3DUtil.GetSingleCube(rb.size.width * 2, rb.size.height * 2, rb.size.depth * 2, Math.random(), Math.random(), Math.random())
			visualObject.transform.localPosition = new Vector3(rb.position.x, rb.position.y, rb.position.z)
			if (rb.rotation) {
				visualObject.transform.localRotQuat = new Quaternion(rb.rotation.x, rb.rotation.y, rb.rotation.z, rb.rotation.w)
			}
			graphic.addChild(visualObject)

		})

		// 1*1*1 box test Visual object debug
		// let visualObject = Object3DUtil.GetSingleCube(1, 1, 1, Math.random(), Math.random(), Math.random())
		// visualObject.transform.localPosition = new Vector3(4, 3.5, 0)
		// graphic.addChild(visualObject)

		let bodyRb = this.createRigidBody(compoundShape, mass, graphic.transform.worldPosition, graphic.localQuaternion)

		return bodyRb
	};

	/**
	 * Create a hollow composite shape.
	 * 相同的参数应用在不同的空心轴上可能会有意外结果，先确定轴向再指定空心区域的大小与偏移。
	 * @param outsideSize 
	 * @param insideSize 
	 * @param offset 
	 * @param hollowAxis Specifies the axis along which the hollow section runs: 'X' for left-to-right, 'Y' for top-to-bottom, 'Z' for front-to-back, Defaults to Y.
	 * @returns Shapes data
	 */
	public static createHollowShapes(
		outsideSize: Vector3,
		insideSize: Vector3,
		offset: Vector3 = Vector3.ZERO,
		hollowAxis: 'X' | 'Y' | 'Z' = 'Y',

	): RigidBodyData[] {

		let shapesInfo: RigidBodyData[]

		let { x: outsideWidth, y: outsideHeight, z: outsideDepth } = outsideSize.scaleBy(0.5)
		let { x: insideWidth, y: insideHeight, z: insideDepth } = insideSize.scaleBy(0.5)
		let { x: insideOffsetX, y: insideOffsetY, z: insideOffsetZ } = offset.scaleBy(0.5)

		outsideSize = insideSize = offset = null

		insideWidth = Math.min(insideWidth, outsideWidth - 0.01)
		insideHeight = Math.min(insideHeight, outsideHeight - 0.01)
		insideDepth = Math.min(insideDepth, outsideDepth - 0.01)

		insideOffsetX = insideOffsetX > 0 ? Math.min(outsideWidth - insideWidth, insideOffsetX) : Math.max(insideWidth - outsideWidth, insideOffsetX)
		insideOffsetY = insideOffsetY > 0 ? Math.min(outsideHeight - insideHeight, insideOffsetY) : Math.max(insideHeight - outsideHeight, insideOffsetY)
		insideOffsetZ = insideOffsetZ > 0 ? Math.min(outsideDepth - insideDepth, insideOffsetZ) : Math.max(insideDepth - outsideDepth, insideOffsetZ)

		const offsetX = (outsideWidth - insideWidth - insideOffsetX) / 2;
		const offsetY = (outsideHeight - insideHeight - insideOffsetY) / 2;
		const offsetZ = (outsideDepth - insideDepth + insideOffsetZ) / 2;

		// insideOffsetX /= 2
		// insideOffsetY /= 2
		// insideOffsetZ /= 2

		switch (hollowAxis) {
			case 'X': {
				const widthAdjustment = (outsideWidth - insideWidth) / 2
				const baseXOffset = (outsideWidth + insideWidth) / 2;
				shapesInfo = [
					// front
					{
						size: { width: outsideWidth, height: insideHeight, depth: offsetZ },
						position: { x: 0, y: insideOffsetY, z: offsetZ - outsideDepth }
					},
					// back
					{
						size: { width: outsideWidth, height: insideHeight, depth: outsideDepth - offsetZ - insideDepth },
						position: { x: 0, y: insideOffsetY, z: insideDepth + offsetZ }
					},
					// top
					{
						size: { width: outsideWidth, height: offsetY, depth: outsideDepth },
						position: { x: 0, y: outsideHeight - offsetY, z: 0 }
					},
					// bottom
					{
						size: { width: outsideWidth, height: outsideHeight - offsetY - insideHeight, depth: outsideDepth },
						position: { x: 0, y: -offsetY - insideHeight, z: 0 }
					},
					// closed border
					// left
					{
						size: { width: widthAdjustment - insideOffsetX, height: insideHeight, depth: insideDepth },
						position: { x: baseXOffset + insideOffsetX, y: insideOffsetY, z: insideOffsetZ }
					},
					// right
					{
						size: { width: widthAdjustment + insideOffsetX, height: insideHeight, depth: insideDepth },
						position: { x: -baseXOffset + insideOffsetX, y: insideOffsetY, z: insideOffsetZ }
					}
				];
			}
				break;

			case 'Y': {
				const heightAdjustment = (outsideHeight - insideHeight) / 2
				const baseYOffset = (outsideHeight + insideHeight) / 2;
				shapesInfo = [
					// front
					{
						size: { width: outsideWidth, height: outsideHeight, depth: offsetZ },
						position: { x: 0, y: 0, z: offsetZ - outsideDepth }
					},
					// back
					{
						size: { width: outsideWidth, height: outsideHeight, depth: outsideDepth - offsetZ - insideDepth },
						position: { x: 0, y: 0, z: insideDepth + offsetZ }
					},
					// right
					{
						size: { width: offsetX, height: outsideHeight, depth: insideDepth },
						position: { x: offsetX - outsideWidth, y: 0, z: insideOffsetZ }
					},
					// left
					{
						size: { width: outsideWidth - offsetX - insideWidth, height: outsideHeight, depth: insideDepth },
						position: { x: insideWidth + offsetX, y: 0, z: insideOffsetZ }
					},
					// closed border
					// top
					{
						size: { width: insideWidth, height: heightAdjustment - insideOffsetY, depth: insideDepth },
						position: { x: -insideOffsetX, y: baseYOffset + insideOffsetY, z: insideOffsetZ }
					},
					// bottom
					{
						size: { width: insideWidth, height: heightAdjustment + insideOffsetY, depth: insideDepth },
						position: { x: -insideOffsetX, y: -baseYOffset + insideOffsetY, z: insideOffsetZ }
					}
				];
			}
				break;

			case 'Z': {
				const depthAdjustment = (outsideDepth - insideDepth) / 2
				const baseZOffset = (outsideDepth + insideDepth) / 2;
				shapesInfo = [
					// top
					{
						size: { width: outsideWidth, height: offsetY, depth: outsideDepth },
						position: { x: 0, y: outsideHeight - offsetY, z: 0 }
					},
					// bottom
					{
						size: { width: outsideWidth, height: outsideHeight - offsetY - insideHeight, depth: outsideDepth },
						position: { x: 0, y: -offsetY - insideHeight, z: 0 }
					},
					// right
					{
						size: { width: offsetX, height: insideHeight, depth: outsideDepth },
						position: { x: offsetX - outsideWidth, y: insideOffsetY, z: 0 }
					},
					// left
					{
						size: { width: outsideWidth - offsetX - insideWidth, height: insideHeight, depth: outsideDepth },
						position: { x: insideWidth + offsetX, y: insideOffsetY, z: 0 }
					},
					// closed border
					// front
					{
						size: { width: insideWidth, height: insideHeight, depth: depthAdjustment - insideOffsetZ },
						position: { x: -insideOffsetX, y: insideOffsetY, z: baseZOffset + insideOffsetZ }
					},
					// back
					{
						size: { width: insideWidth, height: insideHeight, depth: depthAdjustment + insideOffsetZ },
						position: { x: -insideOffsetX, y: insideOffsetY, z: -baseZOffset + insideOffsetZ }
					}
				];
			}
				break;
		}

		// Fix borders and filter unwanted borders
		return shapesInfo.reduce((accumulator, shape) => {
			if (shape.size.width > 0.01 && shape.size.height > 0.01 && shape.size.depth > 0.01) {
				if (shape.size.width > outsideWidth) {
					shape.size.width = outsideWidth;
					shape.position.x = 0;
				}
				if (shape.size.height > outsideHeight) {
					shape.size.height = outsideHeight;
					shape.position.y = 0;
				}
				if (shape.size.depth > outsideDepth) {
					shape.size.depth = outsideDepth;
					shape.position.z = 0;
				}
				accumulator.push(shape);
			}
			return accumulator;
		}, []);
	}

	/**
	 * Reset the rigid body transform
	 * @param bodyRb rigid body
	 * @param newPosition
	 * @param newRotation
	 */
	public static resetRigidBody(bodyRb: Ammo.btRigidBody, newPosition: Vector3, newRotation: Quaternion = Quaternion._zero): void {
		const transform = Physics.TEMP_TRANSFORM;
		transform.setIdentity();  // 确保变换被重置

		// 创建位置和旋转的向量和四元数
		const origin = new Ammo.btVector3(newPosition.x, newPosition.y, newPosition.z);
		const rotation = new Ammo.btQuaternion(newRotation.x, newRotation.y, newRotation.z, newRotation.w);

		// 设置刚体的新变换
		transform.setOrigin(origin);
		transform.setRotation(rotation);
		bodyRb.setWorldTransform(transform);

		// 清除力和速度
		bodyRb.clearForces();
		const zeroVelocity = new Ammo.btVector3(0, 0, 0);
		bodyRb.setLinearVelocity(zeroVelocity);
		bodyRb.setAngularVelocity(zeroVelocity);

		// 销毁创建的Ammo对象
		Ammo.destroy(origin);
		Ammo.destroy(rotation);
		Ammo.destroy(zeroVelocity);
	}


	/**
	 * Destroy the rigid body 
	 * @param bodyRb Rigid body
	 */
	public static destroyRigidBody(bodyRb: Ammo.btRigidBody): void {
		Physics.world.removeRigidBody(bodyRb);
		Ammo.destroy(bodyRb.getCollisionShape());
		Ammo.destroy(bodyRb.getMotionState());
		Ammo.destroy(bodyRb);
	}

	/**
	 * Destroy the rigid body Constraint Or meanwhile clear the reference
	 * @param graphic Graphic Object. needs 'graphic.data.bodyRbConstraint = constraint'
	 * @param constraint Rigid body constraint
	 */
	public static destroyConstraint(graphic: Object3D = null, constraint: Ammo.btTypedConstraint = null): void {

		if (!graphic && !constraint) return

		constraint ||= graphic?.data?.bodyRbConstraint

		constraint && Physics.world.removeConstraint(constraint)
		constraint && Ammo.destroy(constraint)

		if (graphic?.data?.bodyRbConstraint) graphic.data.bodyRbConstraint = null

	}
}
