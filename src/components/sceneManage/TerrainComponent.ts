import { ComponentBase, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, GPUAddressMode, Vector4, BitmapTexture2D, PlaneGeometry, Vector3, VertexAttributeName, CEvent, Reference } from '@orillusion/core'
import { TerrainGeometry } from '@orillusion/effect';
import { AmmoRigidBody, ShapeTypes, CollisionGroup, CollisionMask, RigidBodyUtil } from "@/physics";
import { Physics } from '@orillusion/physics';
import { perlinNoise, createNoiseSeed } from '@/utils/perlin.js';
import { GUIUtil } from '@/utils/GUIUtil'
import dat from 'dat.gui'


/**
 * 根据高度图创建具有物理碰撞的地形
 */
export class TerrainComponent extends ComponentBase {

	public terrainName: string = 'mainTerrain'
	public width: number = 1000
	public height: number = 1000
	public segmentW: number = 199
	public segmentH: number = 199
	public terrainMaxHeight: number = -250

	private _terrainGeometry: TerrainGeometry

	public get terrainGeometry() {
		return this._terrainGeometry
	}

	async start() {

		let terrain = await this.generateTerrain();

		this.transform.scene3D.addChild(terrain);

		this.initRigidBody(terrain)

		// 关联 CreateTree 组件
		Engine3D.inputSystem.dispatchEvent(new CEvent("TerrainInited", { terrainName: this.terrainName }));

		this.debug(terrain)

	}

	private async generateTerrain(): Promise<Object3D> {

		/* 瓷砖 */
		// let texture = await Engine3D.res.loadTexture('src/assets/images/floor_tiles_06_4k/floor_tiles_06_diff_4k.jpg');
		// let normalMap = await Engine3D.res.loadTexture('src/assets/images/floor_tiles_06_4k/floor_tiles_06_nor_gl_4k.jpg');
		// let aoMap = await Engine3D.res.loadTexture('src/assets/images/floor_tiles_06_4k/floor_tiles_06_ao_4k.jpg');
		// let rough = await Engine3D.res.loadTexture('src/assets/images/floor_tiles_06_4k/floor_tiles_06_rough_4k.jpg');

		/* 土地0 */
		// let texture = await Engine3D.res.loadTexture('src/assets/images/rock_boulder_cracked_4k/rock_boulder_cracked_diff_4k.jpg');
		// let normalMap = await Engine3D.res.loadTexture('src/assets/images/rock_boulder_cracked_4k/rock_boulder_cracked_nor_gl_4k.jpg');
		// let aoMap = await Engine3D.res.loadTexture('src/assets/images/rock_boulder_cracked_4k/rock_boulder_cracked_ao_4k.jpg');
		// let rough = await Engine3D.res.loadTexture('src/assets/images/rock_boulder_cracked_4k/rock_boulder_cracked_rough_4k.jpg');

		/* 土地黑白 */
		// let texture = await Engine3D.res.loadTexture('src/assets/images/concrete_wall_003_4k/concrete_wall_003_diff_4k.jpg');
		// let normalMap = await Engine3D.res.loadTexture('src/assets/images/concrete_wall_003_4k/concrete_wall_003_nor_gl_4k.jpg');
		// let aoMap = await Engine3D.res.loadTexture('src/assets/images/concrete_wall_003_4k/concrete_wall_003_ao_4k.jpg');
		// let rough = await Engine3D.res.loadTexture('src/assets/images/concrete_wall_003_4k/concrete_wall_003_rough_4k.jpg');

		/* 绿地 */
		// let texture = await Engine3D.res.loadTexture('src/assets/images/moss_wood_4k/moss_wood_diff_4k.jpg');
		// let normalMap = await Engine3D.res.loadTexture('src/assets/images/moss_wood_4k/moss_wood_nor_gl_4k.jpg');
		// let aoMap = await Engine3D.res.loadTexture('src/assets/images/moss_wood_4k/moss_wood_ao_4k.jpg');
		// let rough = await Engine3D.res.loadTexture('src/assets/images/moss_wood_4k/moss_wood_rough_4k.jpg');

		/* 黑地 */
		// let texture = await Engine3D.res.loadTexture('src/assets/images/concrete_floor_painted_4k/concrete_floor_painted_diff_4k.jpg');
		// let normalMap = await Engine3D.res.loadTexture('src/assets/images/concrete_floor_painted_4k/concrete_floor_painted_nor_gl_4k.jpg');
		// let aoMap = await Engine3D.res.loadTexture('src/assets/images/concrete_floor_painted_4k/concrete_floor_painted_ao_4k.jpg');
		// let rough = await Engine3D.res.loadTexture('src/assets/images/concrete_floor_painted_4k/concrete_floor_painted_rough_4k.jpg');

		/* 山 */
		// let texture = await Engine3D.res.loadTexture('src/assets/images/coast_sand_rocks_02_diff_2k.png'); 
		// let normalMap = await Engine3D.res.loadTexture('src/assets/images/coast_sand_rocks_02_nor_dx_2k.png');
		// let aoMap = await Engine3D.res.loadTexture('src/assets/images/coast_sand_rocks_02_ao_2k.png');
		// let rough = await Engine3D.res.loadTexture('src/assets/images/coast_sand_rocks_02_rough_2k.png');

		/* 土地 */
		let texture = await Engine3D.res.loadTexture('src/assets/images/sandstone_cracks/sandstone_cracks_diff_1k.jpg');
		let normalMap = await Engine3D.res.loadTexture('src/assets/images/sandstone_cracks/sandstone_cracks_nor_gl_1k.png');

		let heightTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/test01/height.png')

		let terrainGeometry: TerrainGeometry = new TerrainGeometry(this.width, this.height, this.segmentW, this.segmentH);
		terrainGeometry.setHeight(heightTexture as BitmapTexture2D, this.terrainMaxHeight);

		let terrain = new Object3D();
		terrain.name = this.terrainName;
		let mr = terrain.addComponent(MeshRenderer);
		mr.geometry = terrainGeometry;
		this._terrainGeometry = terrainGeometry

		let mat = new LitMaterial()
		mat.name = 'terrainMaterial'
		mat.setUniformVector4('transformUV1', new Vector4(0, 0, 30, 30))
		mat.baseMap = texture
		mat.normalMap = normalMap
		// mat.aoMap = aoMap
		// mat.clearCoatRoughnessMap = rough
		// mat.maskMap = 
		mat.cullMode = 'none'
		mat.metallic = 0
		mat.roughness = 2
		// mat.acceptShadow = true

		texture.addressModeU = GPUAddressMode.repeat;     // 水平方向与竖直方向
		texture.addressModeV = GPUAddressMode.repeat;

		mr.material = mat;
		mr.receiveShadow = false;
		mr.castShadow = false;

		return terrain
	}

	private initRigidBody(terrain: Object3D) {
		const rigidbody = terrain.addComponent(AmmoRigidBody)
		rigidbody.mass = 0;
		rigidbody.shape = ShapeTypes.btHeightfieldTerrainShape
		rigidbody.group = CollisionGroup.TERRAIN;
		rigidbody.mask = CollisionMask.DEFAULT_MASK;
		rigidbody.userIndex = 2;
		rigidbody.enable = false;
	}

	private debug(terrain: Object3D) {
		let gui = new dat.GUI()
		let f = gui.addFolder(this.terrainName)

		f.add(this, 'terrainMaxHeight', -1000, 1000, 1).onChange(v => setTerrainSize(v, 'terrainMaxHeight')).onFinishChange(v => resetRigidBody())
		f.add(this, 'width', 100, 5000, 10).onChange(v => setTerrainSize(v, 'width')).onFinishChange(v => resetRigidBody())
		f.add(this, 'height', 100, 5000, 10).onChange(v => setTerrainSize(v, 'height')).onFinishChange(v => resetRigidBody())
		f.add(this, 'segmentW', 1, 1000, 1).onFinishChange(v => setTerrainSegment())
		f.add(this, 'segmentH', 1, 1000, 1).onFinishChange(v => setTerrainSegment())
		f.open()
		let dimensionSpecs = {
			width: { index: 0, value: this.width },
			height: { index: 2, value: this.height },
			terrainMaxHeight: { index: 1, value: this.terrainMaxHeight }
		}
		const setTerrainSize = (size: number, specs: 'width' | 'height' | 'terrainMaxHeight') => {
			if (size !== 0) {
				let posAttrData = this.terrainGeometry.getAttribute(VertexAttributeName.position);
				let dimension = dimensionSpecs[specs];
				for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
					posAttrData.data[i * 3 + dimension.index] *= size / dimension.value;
				}
				dimension.value = size;

				if (specs !== 'terrainMaxHeight') this.terrainGeometry[specs] = size;

				this.terrainGeometry.vertexBuffer.upload(VertexAttributeName.position, posAttrData);
				this.terrainGeometry.computeNormals();
			}
		}

		const setTerrainSegment = async () => {
			let heightTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/test01/height.png');
			let newGeometry = new TerrainGeometry(this.width, this.height, this.segmentW, this.segmentH);
			newGeometry.setHeight(heightTexture as BitmapTexture2D, this.terrainMaxHeight);

			// 由于直接修改几何体的分段数涉及到多项数据替换，性能开销巨大，此处通过删增的方式进行处理

			// 克隆网格克隆材质
			let material = terrain.getComponent(MeshRenderer).material.clone() as LitMaterial;

			// 删除网格，这会清除几何体与材质
			terrain.removeComponent(MeshRenderer)

			// 重新添加网格
			let mesh = terrain.addComponent(MeshRenderer)
			mesh.material = material
			mesh.geometry = newGeometry
			// mesh.receiveShadow = false;
			// mesh.castShadow = false;
			this._terrainGeometry = newGeometry

			resetRigidBody();

			GUIUtil.removeFolder(`terrainMaterial`);
			GUIUtil.renderLitMaterial(material, true, 'terrainMaterial')
		}

		const resetRigidBody = () => {
			terrain.removeComponent(AmmoRigidBody)
			this.initRigidBody(terrain)
		}

		GUIUtil.renderLitMaterial((terrain.getComponent(MeshRenderer).material as LitMaterial), false, 'terrainMaterial')

	}


	// TEST
	private async createModelFloor(scene3D: Scene3D) {


		let glftModel = await Engine3D.res.loadGltf('src/models/wethumid_desert_-_terrain_merge.glb');  // 地图
		// let m = glftModel.getComponents(MeshRenderer)

		glftModel.scaleX = glftModel.scaleY = glftModel.scaleZ = 1000

		// console.log(m[0].geometry);

		// let posAttrData = m[0].geometry.getAttribute(VertexAttributeName.position)
		// console.log(posAttrData);

		scene3D.addChild(glftModel)


		let bodyRb = RigidBodyUtil.triangleMeshRigidBody(glftModel, 0)
		Physics.world.addRigidBody(bodyRb);

	}

	private async createNoiseFloor(scene3D: Scene3D) {

		let width = 1000
		let height = 1000

		let segmentW = 80;
		let segmentH = 80;

		let floor = new Object3D()
		floor.name = 'floor'

		let mr = floor.addComponent(MeshRenderer)
		mr.geometry = new PlaneGeometry(width, height, segmentW, segmentH, Vector3.UP)

		// 获得现有顶点信息
		let posAttrData = mr.geometry.getAttribute(VertexAttributeName.position);

		// 高度数据
		const heightData = new Float32Array(posAttrData.data.length / 3);
		let minHeight = Infinity, maxHeight = -Infinity;

		// 重写顶点坐标
		for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
			let y = perlinNoise(posAttrData.data[i * 3 + 0], posAttrData.data[i * 3 + 2], 0) // position y
			posAttrData.data[i * 3 + 1] = y
			heightData[i] = y;
			if (y < minHeight) minHeight = y;
			if (y > maxHeight) maxHeight = y;
		}

		// 更新顶点信息
		mr.geometry.vertexBuffer.upload(VertexAttributeName.position, posAttrData);

		// 重新计算法向量
		mr.geometry.computeNormals();

		let texture = await Engine3D.res.loadTexture('src/assets/images/sandstone_cracks_diff_1k.jpg'); // 土地纹理
		let normalMapTexture = await Engine3D.res.loadTexture('src/assets/images/sandstone_cracks_nor_gl_1k.png'); // 土地法线纹理

		let mat = new LitMaterial()
		mat.setUniformVector4('transformUV1', new Vector4(0, 0, 20, 20))
		mat.baseMap = texture
		mat.normalMap = normalMapTexture
		mat.cullMode = 'none'
		mat.metallic = 0
		mat.roughness = 10

		// 水平方向与竖直方向
		texture.addressModeU = GPUAddressMode.repeat;
		texture.addressModeV = GPUAddressMode.repeat;

		mr.material = mat
		mr.receiveShadow = true

		scene3D.addChild(floor)

		// ?--------------------物理start----------------------------
		// let bodyRb = RigidBodyUtil.terrainShapeRigidBody(width, height, segmentW, segmentH, heightData, minHeight, maxHeight)
		// Physics.world.addRigidBody(bodyRb);
		// ?--------------------物理end----------------------------
	}
}