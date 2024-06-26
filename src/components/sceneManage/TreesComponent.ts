import { ComponentBase, Engine3D, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Scene3D, Vector3, GPUAddressMode, Vector4, VertexAttributeName, BitmapTexture2D, CEvent, ColliderComponent, BoxColliderShape } from '@orillusion/core'
// import { Ammo, Physics, Rigidbody } from '@orillusion/physics'
import { perlinNoise, createNoiseSeed } from '@/utils/perlin.js';
import { TerrainGeometry } from '@orillusion/effect';
import { RigidBodyComponent, CollisionFlags, ActivationState, ShapeTypes, CollisionGroup, CollisionMask, RigidBodyUtil } from "@/physics";
import { TerrainUtil } from "@/utils/TerrainUtil";


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

        const SIZE = 0.3 
        const { width, height } = terrainGeometry;

        let points = new Float32Array(20 * 3); // 100个点 每个点3个坐标：x, y, z

        // 填充x和z值，y值默认为0
        for (let i = 0; i < points.length; i += 3) {
            points[i] = (Math.random() * width) - width / 2; // 随机x
            points[i + 2] = (Math.random() * height) - height / 2; // 随机z
        }

        points = TerrainUtil.calculateHeightsForPoints(points, terrainGeometry); // 计算高度值

        let glftModel = await Engine3D.res.loadGltf('models/trees/pine_tree_blue.glb');  // 蓝色树
        glftModel.scaleX = glftModel.scaleY = glftModel.scaleZ = SIZE;

        for (let i = 0, count = points.length / 3; i < count; i++) {
            let newModel = glftModel.clone()
            newModel.x = points[i * 3 + 0]
            newModel.y = points[i * 3 + 1]
            newModel.z = points[i * 3 + 2]
            // newModel.addComponent(RigidBodyComponent).shape = ShapeTypes.btBvhTriangleMeshShape
            this.terrain.addChild(newModel)
        }

        {
            let grassYellow = new Object3D();
            grassYellow.name = 'grassYellow'

            let glftModel = await Engine3D.res.loadGltf('models/trees/grass_yellow.glb');  // 黄草
            glftModel.scaleX = glftModel.scaleY = glftModel.scaleZ = 3 * SIZE;

            for (let i = 0; i < 1000; i++) {
                const newModel = glftModel.clone()
                let x = (Math.random() * width) - width / 2;
                let z = (Math.random() * height) - height / 2;
                newModel.x = x
                newModel.y = TerrainUtil.calculateHeightAtPoint(x, z, terrainGeometry)
                newModel.z = z
                newModel.rotationY = Math.floor(Math.random() * 360) - 180
                newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7 ) + Math.round(Math.random() * (newModel.scaleX * 0.3 ))

                let one = glftModel.entityChildren[0].entityChildren[0] as Object3D
                let mr = one.getComponent(MeshRenderer)
                mr.material.castShadow = false

                grassYellow.addChild(newModel);
            }
            this.terrain.addChild(grassYellow);

        }
        {
            let glftModel = await Engine3D.res.loadGltf('models/trees/birch_red.glb'); // 大红树

            for (let i = 0; i < 20; i++) {
                const newModel = glftModel.clone()
                let x = (Math.random() * width) - width / 2;
                let z = (Math.random() * height) - height / 2;
                newModel.x = x
                newModel.y = TerrainUtil.calculateHeightAtPoint(x, z, terrainGeometry)
                newModel.z = z
                newModel.rotationY = Math.floor(Math.random() * 360) - 180
                newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7 * SIZE * 2) + Math.round(Math.random() * (newModel.scaleX * 0.3 * SIZE * 2))

                // let rigidbody = newModel.addComponent(RigidBodyComponent)
                // rigidbody.mass = 0;
                // rigidbody.shape = ShapeTypes.btBoxShape
                // rigidbody.size = new Vector3(3, 30, 3)

                // let collider = newModel.addComponent(ColliderComponent)
                // collider.shape = new BoxColliderShape()
                // collider.shape.size = new Vector3(3, 30, 3)
                newModel.addComponent(RigidBodyComponent).shape = ShapeTypes.btBvhTriangleMeshShape
                this.terrain.addChild(newModel);
            }
        }
        {
            let glftModel = await Engine3D.res.loadGltf('models/trees/pine_tree_pink.glb'); // 中红树
            glftModel.scaleX = glftModel.scaleY = glftModel.scaleZ = SIZE;

            for (let i = 0; i < 200; i++) {
                const newModel = glftModel.clone()
                let x = (Math.random() * width) - width / 2;
                let z = (Math.random() * height) - height / 2;
                newModel.x = x
                newModel.y = TerrainUtil.calculateHeightAtPoint(x, z, terrainGeometry)
                newModel.z = z

                newModel.rotationY = Math.floor(Math.random() * 360) - 180
                // newModel.scaleX = newModel.scaleY = newModel.scaleZ = (Math.random() * 0.75) - 0.25
                // newModel.scaleX = newModel.scaleY = newModel.scaleZ = (newModel.scaleX * 0.7) + Math.round(Math.random() * (newModel.scaleX * 0.3))

                let rigidbody = newModel.addComponent(RigidBodyComponent)
                rigidbody.mass = 0;
                rigidbody.shape = ShapeTypes.btCylinderShape
                rigidbody.radius = 0.5 * SIZE;
                rigidbody.height = 24 * SIZE;


                this.terrain.addChild(newModel);
            }
        }

    }

    destroy(force?: boolean): void {
        Engine3D.inputSystem.removeEventListener("TerrainInited", this.onTerrainReady, this);
    }

}

