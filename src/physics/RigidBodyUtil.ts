import { Object3D, BoundUtil, Vector3, Quaternion, Object3DUtil, MeshRenderer, VertexAttributeName, PlaneGeometry, type ArrayBufferData } from '@orillusion/core';

import { Ammo, Physics } from '@orillusion/physics';

import { type ChildShapes, ShapeTypes, rigidBodyMapping } from './index';

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
     * 平面碰撞体，适用于静态无限平面的碰撞形状，通常用于表示地面、墙壁等静态平面
     */
    public static staticPlaneShapeRigidBody(graphic: Object3D, mass: number, planeNormal: Vector3 = Vector3.UP, planeConstant: number = 0) {

        const normal = new Ammo.btVector3(planeNormal.x, planeNormal.y, planeNormal.z);

        const shape = new Ammo.btStaticPlaneShape(normal, planeConstant);

        Ammo.destroy(normal)

        return this.createRigidBody(shape, mass, graphic);
    }
    /**
     * 盒型碰撞体，未指定尺寸时默认使用包围盒大小，使用包围盒时需要禁止应用旋转，否则包围盒尺寸数据将无法准确匹配
     */
    public static boxShapeRigidBody(graphic: Object3D, mass: number, size?: Vector3) {
        size ||= BoundUtil.genMeshBounds(graphic).size;

        const halfExtents = new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2);
        let shape = new Ammo.btBoxShape(halfExtents);
        Ammo.destroy(halfExtents)

        return this.createRigidBody(shape, mass, graphic)
    }

    /**
     * 球型碰撞体，未指定尺寸时默认使用包围盒半径(x)
     */
    public static sphereShapeRigidBody(graphic: Object3D, mass: number, radius?: number) {
        radius ||= BoundUtil.genMeshBounds(graphic).extents.x;
        let shape = new Ammo.btSphereShape(radius);

        return this.createRigidBody(shape, mass, graphic)
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

        return this.createRigidBody(shape, mass, graphic);
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

        return this.createRigidBody(shape, mass, graphic)
    }

    /**
     * 圆锥形碰撞体，如果未指定尺寸则默认使用包围盒半径和高度
     * @param {Object3D} graphic - 用于创建碰撞体的三维对象。
     * @param {number} mass - 碰撞体的质量。
     * @param {number} [radius] - 圆锥的半径。
     * @param {number} [height] - 圆锥的高度。
     * @param {Vector3} [boundSize] - 三维对象的包围盒尺寸。
     * @returns  The newly created Ammo.btRigidBody object.
     */
    public static coneShapeRigidBody(graphic: Object3D, mass: number, radius?: number, height?: number, boundSize?: Vector3) {
        if (!radius || !height) boundSize ||= BoundUtil.genMeshBounds(graphic).size;

        radius ||= boundSize.x / 2;
        height ||= boundSize.y;

        const shape = new Ammo.btConeShape(radius, height);

        return this.createRigidBody(shape, mass, graphic);
    }

    /**
     * 高度场形状刚体体，基于平面几何顶点
     * @static
     * @param {Object3D} graphic
     * @param {number} [mass=0]
     * @param {number} [heightScale=1]
     * @param {number} [upAxis=1]
     * @param {Ammo.PHY_ScalarType} [hdt='PHY_FLOAT']
     * @param {boolean} [flipQuadEdges=false]
     * @return  Ammo.btRigidBody
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
        let newPosition = graphic.localPosition.add(Vector3.HELP_0.set(0, averageHeight, 0));

        let bodyRb = this.createRigidBody(terrainShape, mass, graphic, newPosition)

        // body.setCcdMotionThreshold(1e-7);
        // body.setCcdSweptSphereRadius(0.2); // 根据实际尺寸调整

        // bodyRb.setFriction(1.0);  // 高摩擦系数以防止滑动
        // bodyRb.setRestitution(1);  // 低恢复系数以减少弹跳

        return bodyRb
    }

    /**
     * 凸包形状刚体 形状将会“填满”模型的凹部
     * @param graphic 
     * @param mass 
     * @param modelVertices 可选，碰撞体需要的顶点数据，默认值为图形对象的顶点数据
     * @param lowObject 可选，从该图形对象取得顶点数据构建碰撞体
     * @returns Ammo.btRigidBody
     */
    public static convexHullShapeRigidBody(graphic: Object3D, mass: number = 0, modelVertices: Float32Array = null, lowObject: Object3D = null) {

        let vertices = modelVertices || this.getMeshVerticesAndIndices(lowObject || graphic).vertices

        // console.log(vertices);

        let convexHullShape = new Ammo.btConvexHullShape();
        let point = new Ammo.btVector3();
        for (let i = 0, count = vertices.length / 3; i < count; i++) {
            point.setValue(vertices[3 * i], vertices[3 * i + 1], vertices[3 * i + 2]);
            convexHullShape.addPoint(point, true);
        }
        Ammo.destroy(point);

        return this.createRigidBody(convexHullShape, mass, graphic)
    }

    /**
     * 三角网格形状刚体
     * @param graphic 
     * @param mass 
     * @param modelVertices 可选，碰撞体需要的顶点数据，默认值为图形对象的顶点数据
     * @param lowObject 可选，从该图形对象取得顶点数据构建碰撞体
     * @returns bodyRb
     */
    public static bvhTriangleMeshShapeRigidBody(graphic: Object3D, mass: number = 0, modelVertices: Float32Array = null, modelIndices: Uint16Array = null, lowObject: Object3D = null) {

        // orillusion图形引擎中解析的模型顶点与索引值与blender脚本导出的json数据不一致，具体实现有差异，但均能正常工作，前提是vertices与indices必须同一来源。
        const { vertices, indices } = (modelVertices && modelIndices)
            ? { vertices: modelVertices, indices: modelIndices }
            : this.getMeshVerticesAndIndices(lowObject || graphic);

        // modelVertices && modelIndices && console.log('使用内部数据构建TriangleMeshShape')
        // console.log('vertices', vertices.length);
        // console.log('indices', indices.length);

        let triangleMesh = new Ammo.btTriangleMesh();

        // 每三个索引形成一个三角形，必须依赖indices数据
        {
            let v0 = new Ammo.btVector3();
            let v1 = new Ammo.btVector3();
            let v2 = new Ammo.btVector3();
            for (let i = 0; i < indices.length; i += 3) {
                const index1 = indices[i] * 3;
                const index2 = indices[i + 1] * 3;
                const index3 = indices[i + 2] * 3;

                v0.setValue(vertices[index1], vertices[index1 + 1], vertices[index1 + 2]);
                v1.setValue(vertices[index2], vertices[index2 + 1], vertices[index2 + 2]);
                v2.setValue(vertices[index3], vertices[index3 + 1], vertices[index3 + 2]);

                triangleMesh.addTriangle(v0, v1, v2, true);
            }
            Ammo.destroy(v0);
            Ammo.destroy(v1);
            Ammo.destroy(v2);
        }

        // 启用 AABB 树的量化压缩 为 true 可以提高性能，尤其是在处理大型或复杂的网格时可以更快地处理碰撞检测，但精准度可能会有略微影响。
        let useQuantizedAabbCompression = true;
        let shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, useQuantizedAabbCompression, true);

        // 应用缩放，无法处理建模软件中设定的缩放，仅支持图形引擎应用的缩放，最佳实践中导出模型缩放应默认为 1 ，通过全选crtl+A应用全部变换，缩放变换由图形引擎控制。
        let scaling = new Ammo.btVector3(graphic.scaleX, graphic.scaleY, graphic.scaleZ)
        shape.setLocalScaling(scaling)
        Ammo.destroy(scaling)

        let bodyRb = this.createRigidBody(shape, mass, graphic)

        return bodyRb
    }

    /**
     * 复合形状刚体，支持简单的几何形状组合 箱形、球形、胶囊形、圆柱形、圆锥形，半径参数使用 size.width
     * @param graphic - 用于创建碰撞体的三维对象。
     * @param mass - 碰撞体的质量。
     * @param childShapes - 子形状数组。
     * @returns Ammo.btRigidBod
     */
    public static compoundShapeRigidBody(graphic: Object3D, mass: number, childShapes: ChildShapes[]): Ammo.btRigidBody {
        const compoundShape = new Ammo.btCompoundShape();
        const btTransform = Physics.TEMP_TRANSFORM;
        const position = new Ammo.btVector3()
        const rotation = new Ammo.btQuaternion(0, 0, 0, 1)
        const size = new Ammo.btVector3()

        childShapes.forEach(rb => {
            let shape: Ammo.btCollisionShape
            switch (rb.shape) {
                case ShapeTypes.btBoxShape: // 箱形		
                    size.setValue(rb.size.width, rb.size.height, rb.size.depth);
                    shape = new Ammo.btBoxShape(size);

                    break;
                case ShapeTypes.btSphereShape: // 球形
                    shape = new Ammo.btSphereShape(rb.size.width);

                    break;
                case ShapeTypes.btCapsuleShape: // 胶囊形
                    shape = new Ammo.btCapsuleShape(rb.size.width, rb.size.height)

                    break;
                case ShapeTypes.btCylinderShape: // 圆柱形
                    size.setValue(rb.size.width, rb.size.height, rb.size.depth);
                    shape = new Ammo.btCylinderShape(size);

                    break;
                case ShapeTypes.btConeShape: // 圆锥形
                    shape = new Ammo.btConeShape(rb.size.width, rb.size.height)

                    break;
                default:
                    console.warn('复合刚体 错误的子形状类型, 默认应用箱型');

                    size.setValue(rb.size.width, rb.size.height, rb.size.depth);
                    shape = new Ammo.btBoxShape(size);
            }

            btTransform.setIdentity();

            position.setValue(rb.position.x, rb.position.y, rb.position.z)
            btTransform.setOrigin(position);

            if (rb.rotation) {
                rotation.setValue(rb.rotation.x, rb.rotation.y, rb.rotation.z, rb.rotation.w);
                btTransform.setRotation(rotation);
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

        Ammo.destroy(position);
        Ammo.destroy(rotation);
        Ammo.destroy(size);

        let bodyRb = this.createRigidBody(compoundShape, mass, graphic)

        return bodyRb
    };

    /**
     * 创建刚体的通用方法
     * @param shape 碰撞形状。
     * @param mass 碰撞体的质量。
     * @param graphic 图形对象。
     * @param position 可选，刚体的位置，默认使用图形对象的位置
     * @param rotation 可选，刚体的旋转，默认使用图形对象的欧拉角旋转。注意图形引擎中设置对象的欧拉角并不会同步更新旋转四元数的值。
     * @returns 新创建的 Ammo.btRigidBody 对象。
     */
    public static createRigidBody(shape: Ammo.btCollisionShape, mass: number, graphic: Object3D, position?: Vector3, rotation?: Vector3 | Quaternion): Ammo.btRigidBody {
        position ||= graphic.localPosition;
        rotation ||= graphic.localRotation;

        const transform = Physics.TEMP_TRANSFORM;
        transform.setIdentity();
        const origin = new Ammo.btVector3(position.x, position.y, position.z);
        transform.setOrigin(origin);
        Ammo.destroy(origin);

        let rotQuat: Ammo.btQuaternion
        if (rotation instanceof Vector3) {
            Quaternion.HELP_0.fromEulerAngles(rotation.x, rotation.y, rotation.z);
            rotQuat = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        } else {
            rotQuat = new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        }

        transform.setRotation(rotQuat);
        Ammo.destroy(rotQuat);

        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0);
        if (mass !== 0) {
            shape.calculateLocalInertia(mass, localInertia);
        }

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const bodyRb = new Ammo.btRigidBody(rbInfo);

        Ammo.destroy(localInertia);

        // 映射图形与物理对象
        rigidBodyMapping.addMapping(graphic, bodyRb)

        // bodyRb.setFriction(1.0);  // 高摩擦系数以防止滑动
        // bodyRb.setRestitution(0.0);  // 低恢复系数以减少弹跳
        return bodyRb;
    }

    /**
     * 获取3D对象的所有网格顶点与索引
     * @param graphic
     * @returns vertex data and  indices data
     */
    protected static getMeshVerticesAndIndices(graphic: Object3D): { vertices: Float32Array, indices: Uint16Array } {
        let mr = graphic.getComponents(MeshRenderer);

        if (mr.length === 1) {
            return {
                vertices: mr[0].geometry.getAttribute(VertexAttributeName.position).data as Float32Array,
                indices: mr[0].geometry.getAttribute(VertexAttributeName.indices).data as Uint16Array
            };
        }

        // 计算总长度
        let totalVertexLength = 0;
        let totalIndexLength = 0;
        mr.forEach(e => {
            totalVertexLength += e.geometry.getAttribute(VertexAttributeName.position).data.length;
            totalIndexLength += e.geometry.getAttribute(VertexAttributeName.indices).data.length;
        });

        // 分配大小
        let vertices = new Float32Array(totalVertexLength);
        let indices = new Uint16Array(totalIndexLength);

        // 填充数据
        let vertexOffset = 0;
        let indexOffset = 0;
        let currentIndexOffset = 0;

        mr.forEach(e => {
            let vertexArray = e.geometry.getAttribute(VertexAttributeName.position).data;
            vertices.set(vertexArray, vertexOffset);
            vertexOffset += vertexArray.length;

            let indexArray = e.geometry.getAttribute(VertexAttributeName.indices).data;
            for (let i = 0; i < indexArray.length; i++) {
                indices[indexOffset + i] = indexArray[i] + currentIndexOffset;
            }
            indexOffset += indexArray.length;
            currentIndexOffset += vertexArray.length / 3; // 因为每个顶点有3个分量（x, y, z）
        });

        return { vertices, indices };
    }

    /**
     * 空心复合形状
     * 相同的参数应用在不同的空心轴上可能会有意外结果，先确定轴向再指定空心区域的大小与偏移。
     * @param outsideSize 
     * @param insideSize 
     * @param offset 
     * @param hollowAxis Specifies the axis along which the hollow section runs: 'X' for left-to-right, 'Y' for top-to-bottom, 'Z' for front-to-back, Defaults to Y.
     * @returns Shapes data
     */
    public static generatesHollowShapes(
        outsideSize: Vector3,
        insideSize: Vector3,
        offset: Vector3 = Vector3.ZERO,
        hollowAxis: 'X' | 'Y' | 'Z' = 'Y',

    ): ChildShapes[] {

        let shapesInfo: ChildShapes[]

        let { x: outsideWidth, y: outsideHeight, z: outsideDepth } = outsideSize.mul(0.5);
        let { x: insideWidth, y: insideHeight, z: insideDepth } = insideSize.mul(0.5);
        let { x: insideOffsetX, y: insideOffsetY, z: insideOffsetZ } = offset.mul(0.5);

        insideWidth = Math.min(insideWidth, outsideWidth - 0.01);
        insideHeight = Math.min(insideHeight, outsideHeight - 0.01);
        insideDepth = Math.min(insideDepth, outsideDepth - 0.01);

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
     * 激活所有动态刚体
     */
    public static activateAllKinematicObject() {
        rigidBodyMapping.getAllPhysicsObjectMap.forEach((graphic, rigidBody) => {
            // 检查是否是动态刚体
            if (!rigidBody.isStaticObject() && !rigidBody.isKinematicObject()) {
                rigidBody.activate();
            }
        })
    }

    /**
     * Reset the rigid body transform
     * @param bodyRb rigid body
     * @param newPosition
     * @param newRotation
     */
    public static resetRigidBody(bodyRb: Ammo.btRigidBody, newPosition: Vector3, newRotation: Vector3 | Quaternion = Quaternion._zero): void {
        const transform = Physics.TEMP_TRANSFORM;
        transform.setIdentity();  // 确保变换被重置

        // 创建位置和旋转的向量和四元数
        const origin = new Ammo.btVector3(newPosition.x, newPosition.y, newPosition.z);
        let rotQuat: Ammo.btQuaternion
        if (newRotation instanceof Vector3) {
            Quaternion.HELP_0.fromEulerAngles(newRotation.x, newRotation.y, newRotation.z);
            rotQuat = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        } else {
            rotQuat = new Ammo.btQuaternion(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
        }

        // 设置刚体的新变换
        transform.setOrigin(origin);
        transform.setRotation(rotQuat);
        bodyRb.setWorldTransform(transform);

        // 清除力和速度
        bodyRb.clearForces();
        const zeroVelocity = new Ammo.btVector3(0, 0, 0);
        bodyRb.setLinearVelocity(zeroVelocity);
        bodyRb.setAngularVelocity(zeroVelocity);

        // 销毁创建的Ammo对象
        Ammo.destroy(origin);
        Ammo.destroy(rotQuat);
        Ammo.destroy(zeroVelocity);
    }

    /**
     * Destroy the rigid body 
     * @param bodyRb Rigid body
     */
    public static destroyRigidBody(bodyRb: Ammo.btRigidBody): void {
        // 移除映射
        rigidBodyMapping.removeMappingByPhysics(bodyRb);

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
