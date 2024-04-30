import { ComponentBase, Engine3D, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Scene3D, Vector3, GPUAddressMode, Vector4, VertexAttributeName, BitmapTexture2D, CEvent, ColliderComponent, BoxColliderShape } from '@orillusion/core'
import { Ammo, Physics, Rigidbody } from '@orillusion/physics'
import { perlinNoise, createNoiseSeed } from '@/utils/perlin.js';
import { TerrainGeometry } from '@orillusion/effect';
import { AmmoRigidBody, CollisionFlags, ActivationState, ShapeTypes, CollisionGroup, CollisionMask, RigidBodyUtil } from "@/physics";


/**
 * 根据地形几何体的数据创建场景内随机的树木元素
 * 树将会“种”在地上，所有树均为地形对象的子对象
 */
export class TreesComponent extends ComponentBase {

    private terrain: Object3D
    private terrainGeometry: TerrainGeometry

    init() {

        // 监听事件
        Engine3D.inputSystem.addEventListener("TerrainInited", this.onTerrainReady, this);

    }

    private onTerrainReady(e: CEvent) {
        if (!e.data.terrainName) return console.error("The terrain object has no name")

        this.initiate(e.data.terrainName);
        Engine3D.inputSystem.removeEventListener("TerrainInited", this.onTerrainReady, this);
    }

    public initiate(terrainName: string) {
        // 获取地形对象与几何体
        this.terrain = this.transform.scene3D.getChildByName(terrainName) as Object3D
        let geometry = this.terrain.getComponent(MeshRenderer).geometry

        if (geometry instanceof TerrainGeometry) {
            this.terrainGeometry = geometry;
            this.createTrees(this.terrainGeometry)
        } else {
            console.error('Terrain geometry type not supported');
        }
    }

    private async createTrees(terrainGeometry: TerrainGeometry) {

        const { width, height } = terrainGeometry;

        const numPoints = 100; // 有100个点
        let points = new Float32Array(numPoints * 3); // 每个点3个坐标：x, y, z

        // 填充x和z值，y值默认为0
        for (let i = 0; i < points.length; i += 3) {
            points[i] = (Math.random() * width) - width / 2; // 随机x
            points[i + 2] = (Math.random() * height) - height / 2; // 随机z
        }

        // 计算高度值
        points = this.interpolateHeights(terrainGeometry, points)


        let glftModel = await Engine3D.res.loadGltf('src/models/trees/pine_tree_blue.glb');  // 蓝色树
        glftModel.scaleX = glftModel.scaleY = glftModel.scaleZ = 1;

        for (let i = 0, count = points.length / 3; i < count; i++) {

            let newModel = glftModel.clone()
            newModel.x = points[i * 3 + 0]
            newModel.y = points[i * 3 + 1]
            // test 
            // newModel.y = this.interpolateHeight(points[i * 3 + 0], points[i * 3 + 2], terrainGeometry);
            // newModel.y = this.interpolateHeights(terrainGeometry, null, points[i * 3 + 0], points[i * 3 + 2])[1]

            newModel.z = points[i * 3 + 2]
            // newModel.rotationX = -90
            // newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7) + Math.round(Math.random() * (newModel.scaleX * 0.3))

            // let rigidbody = newModel.addComponent(AmmoRigidBody)
            // rigidbody.mass = 0;
            // rigidbody.shape = ShapeTypes.btCylinderShape

            // cloneArr.push(newModel)
            this.terrain.addChild(newModel)
        }

        {
            let glftModel = await Engine3D.res.loadGltf('src/models/trees/grass_yellow.glb');  // 黄草
            glftModel.scaleX = glftModel.scaleY = glftModel.scaleZ = 3;

            for (let i = 0; i < 1000; i++) {
                const newModel = glftModel.clone()
                let x = (Math.random() * width) - width / 2;
                let z = (Math.random() * height) - height / 2;
                newModel.x = x
                newModel.z = z
                newModel.y = this.interpolateHeights(terrainGeometry, null, x, z)[1]
                newModel.rotationY = Math.floor(Math.random() * 360) - 180
                newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7) + Math.round(Math.random() * (newModel.scaleX * 0.3))

                let one = glftModel.entityChildren[0].entityChildren[0] as Object3D
                let mr = one.getComponent(MeshRenderer)
                mr.material.castShadow = false

                this.terrain.addChild(newModel);
            }
        }
        {
            let glftModel = await Engine3D.res.loadGltf('src/models/trees/birch_red.glb'); // 大红树

            for (let i = 0; i < 20; i++) {
                const newModel = glftModel.clone()
                let x = (Math.random() * width) - width / 2;
                let z = (Math.random() * height) - height / 2;
                newModel.x = x
                newModel.z = z
                newModel.y = this.interpolateHeights(terrainGeometry, null, x, z)[1]
                newModel.rotationY = Math.floor(Math.random() * 360) - 180
                newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7) + Math.round(Math.random() * (newModel.scaleX * 0.3))

                // let rigidbody = newModel.addComponent(AmmoRigidBody)
                // rigidbody.mass = 0;
                // rigidbody.shape = ShapeTypes.btBoxShape
                // rigidbody.size = new Vector3(3, 30, 3)

                // let collider = newModel.addComponent(ColliderComponent)
                // collider.shape = new BoxColliderShape()
                // collider.shape.size = new Vector3(3, 30, 3)

                this.terrain.addChild(newModel);
            }
        }
        {
            let glftModel = await Engine3D.res.loadGltf('src/models/trees/pine_tree_pink.glb'); // 中红树

            for (let i = 0; i < 20; i++) {
                const newModel = glftModel.clone()
                let x = (Math.random() * width) - width / 2;
                let z = (Math.random() * height) - height / 2;
                newModel.x = x
                newModel.z = z
                newModel.y = this.interpolateHeights(terrainGeometry, null, x, z)[1]

                newModel.rotationY = Math.floor(Math.random() * 360) - 180
                // newModel.scaleX = newModel.scaleY = newModel.scaleZ = (Math.random() * 0.75) - 0.25
                // newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7) + Math.round(Math.random() * (newModel.scaleX * 0.3))

                let rigidbody = newModel.addComponent(AmmoRigidBody)
                rigidbody.mass = 0;
                rigidbody.shape = ShapeTypes.btCylinderShape
                rigidbody.radius = 0.5;
                rigidbody.height = 24;


                this.terrain.addChild(newModel);
            }
        }

    }

    /**
     * 插值计算地形上给定点的高度。
     * @param {TerrainGeometry} terrainGeometry - 地形的几何数据，包含宽、高、分段数和高度数据。
     * @param {Float32Array} points - 包含x, z坐标的浮点数组，可选。如果未提供，则根据x和z参数创建。
     * @param {number} x - x坐标，可选。
     * @param {number} z - z坐标，可选。
     * @returns {Float32Array} 包含更新高度的points数组。
     */
    protected interpolateHeights(terrainGeometry: TerrainGeometry, points?: Float32Array, x?: number, z?: number): Float32Array {
        if (!points && x !== undefined && z !== undefined) {
            points = new Float32Array([x, 0, z]);  // 如果只给出x和z，则构造points数组
        } else if (!points) {
            console.error('Invalid parameters: either points array or both x and z must be provided.');
            return null; // 返回null或抛出错误，以明确表示函数未能执行
        }

        const { width, height, segmentW, segmentH, heightData } = terrainGeometry;
        const scaleX = segmentW / width;
        const scaleZ = segmentH / height;

        for (let i = 0; i < points.length; i += 3) {
            const x = points[i];
            const z = points[i + 2];
            const gridX = (x + width / 2) * scaleX;
            const gridZ = (z + height / 2) * scaleZ;

            const x0 = Math.min(Math.floor(gridX), segmentW - 2);
            const z0 = Math.min(Math.floor(gridZ), segmentH - 2);
            const x1 = Math.min(x0 + 1, segmentW - 2);
            const z1 = Math.min(z0 + 1, segmentH - 2);
            const tx = gridX - x0;
            const tz = gridZ - z0;

            const h00 = heightData[z0][x0];
            const h01 = heightData[z0][x1];
            const h10 = heightData[z1][x0];
            const h11 = heightData[z1][x1];

            points[i + 1] = h00 + tx * (h01 - h00) + tz * ((h10 + tx * (h11 - h10)) - (h00 + tx * (h01 - h00))); // 双线性插值
        }
        return points;
    }

    // 图像识别
    private updateHeightsFromTexture(points: Float32Array, texture: BitmapTexture2D, width: number, height: number, maxHeight: number) {
        const canvas = new OffscreenCanvas(texture.width, texture.height);
        const context = canvas.getContext('2d');
        context.drawImage(texture.sourceImageData, 0, 0);
        const imageData = context.getImageData(0, 0, texture.width, texture.height);

        const scaleX = texture.width / width;
        const scaleZ = texture.height / height;

        for (let i = 0; i < points.length; i += 3) {
            const x = points[i];
            const z = points[i + 2];

            // 世界坐标到纹理坐标的映射
            const px = (x + width / 2) * scaleX;
            const pz = (z + height / 2) * scaleZ;

            const x0 = Math.floor(px);
            const z0 = Math.floor(pz);
            const x1 = Math.min(x0 + 1, texture.width - 1);
            const z1 = Math.min(z0 + 1, texture.height - 1);

            const tx = px - x0;
            const tz = pz - z0;

            // 双线性插值
            const index00 = (z0 * texture.width + x0) * 4;
            const index01 = (z0 * texture.width + x1) * 4;
            const index10 = (z1 * texture.width + x0) * 4;
            const index11 = (z1 * texture.width + x1) * 4;

            const h00 = imageData.data[index00];
            const h01 = imageData.data[index01];
            const h10 = imageData.data[index10];
            const h11 = imageData.data[index11];

            const h0 = h00 + tx * (h01 - h00);
            const h1 = h10 + tx * (h11 - h10);
            const h = h0 + tz * (h1 - h0);

            // 缩放高度值
            points[i + 1] = h / 255 * maxHeight;
        }
    }

    private interpolateHeight(x: number, z: number, terrainGeometry: TerrainGeometry) {
        // const width = terrainGeometry.width;
        // const height = terrainGeometry.height;
        // const segmentW = terrainGeometry.segmentW;
        // const segmentH = terrainGeometry.segmentH;
        // const heightData = terrainGeometry.heightData;

        const { width, height, segmentW, segmentH, heightData } = terrainGeometry;

        // 将世界坐标映射到网格坐标
        const gridX = (x + width / 2) / width * segmentW;
        const gridZ = (z + height / 2) / height * segmentH;

        const x0 = Math.min(Math.floor(gridX), segmentW - 2);
        const z0 = Math.min(Math.floor(gridZ), segmentH - 2);
        const x1 = Math.min(x0 + 1, segmentW - 2);
        const z1 = Math.min(z0 + 1, segmentH - 2);

        const tx = gridX - x0;
        const tz = gridZ - z0;

        // 确保索引在数组边界内
        if (x0 < 0 || z0 < 0 || x1 >= segmentW || z1 >= segmentH) {
            return 0; // 或其他默认高度值
        }

        // 双线性插值
        const h00 = heightData[z0][x0];
        const h01 = heightData[z0][x1];
        const h10 = heightData[z1][x0];
        const h11 = heightData[z1][x1];

        const h0 = h00 + tx * (h01 - h00);
        const h1 = h10 + tx * (h11 - h10);
        const interpolatedHeight = h0 + tz * (h1 - h0);

        return interpolatedHeight;
    }

}

