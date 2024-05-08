import { Engine3D, Object3D, MeshRenderer, Vector3, ComponentBase, CEvent, Color } from '@orillusion/core';
import { GrassComponent, TerrainGeometry } from '@orillusion/effect'
import dat from 'dat.gui'
import { GUIUtil } from '@/utils/GUIUtil'
import { TerrainUtil } from "@/utils/TerrainUtil";

/**
 * 草地
 */
export class Grass extends ComponentBase {

    async start() {

        Engine3D.inputSystem.addEventListener("TerrainInited", this.onTerrainReady, this);
    }
    private onTerrainReady(e: CEvent) {
        if (!e.data.terrainName) return console.error("The terrain object has no name")

        this.initiate(e.data.terrainName);
    }

    public async initiate(terrainName: string) {

        // 获取地形对象与几何体
        let terrain = this.transform.scene3D.getChildByName(terrainName) as Object3D
        let geometry = terrain.getComponent(MeshRenderer).geometry

        if (geometry instanceof TerrainGeometry) {
            await this.createGrass(terrain, geometry)
        } else {
            console.error('Terrain geometry type not supported');
        }
    }
    private async createGrass(terrain: Object3D, terrainGeometry: TerrainGeometry) {

        // 风噪声
        let gustNoiseTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/grass/displ_noise_curl_1.png')

        let grassCount = 3000 //6795

        let grass = new Object3D();
        grass.name = 'grass'

        let grassCom = grass.addComponent(GrassComponent)
        grassCom.setGrassTexture(Engine3D.res.whiteTexture)
        // grassCom.setGrassTexture(grassTexture);
        grassCom.setWindNoiseTexture(gustNoiseTexture)
        // grassCom.setGrass(18, 1, 5, 1, grassCount)
        grassCom.setGrass(1, 1, 5, 1, grassCount)
        // grassCom.setMinMax(new Vector3(-10, -5, -10), new Vector3(10, 5, 10))
        grassCom.grassMaterial.grassHeight = 0.5
        grassCom.grassMaterial.roughness = 0.7
        // grassCom.grassMaterial.castShadow = true
        grassCom.grassMaterial.windPower = 0.2
        grassCom.grassMaterial.specular = 0 //镜面反射
        grassCom.grassMaterial.grassBaseColor = new Color(10.8, 1, 2.1, 1)
        grassCom.grassMaterial.grassTopColor = new Color(2.8, 0.5, 0.3, 1)
        // grassCom.grassMaterial.grassBaseColor = new Color(0.8, 1, 0.6, 0.1)
        // grassCom.grassMaterial.grassTopColor = new Color(0.2, 1, 0.3, 1)
        // grassCom.grassMaterial.translucent = 0.5

        const { width, height } = terrainGeometry;

        for (let i = 0; i < grassCount; i++) {
            let node = grassCom.nodes[i]
            let gassSize = 2
            // let x = (Math.random() * width) - width / 2;
            // let z = (Math.random() * height) - height / 2;
            let x = (Math.random() * width / 10) - width / 10 / 2;
            let z = (Math.random() * height / 10) - height / 10 / 2;
            let y = TerrainUtil.calculateHeightAtPoint(x, z, terrainGeometry)
            node.localPosition = Vector3.HELP_0.set(x, y, z)

            node.rotationY = Math.random() * 360
            node.scaleX = (Math.random() * 0.75 + 0.25) * gassSize
            node.updateWorldMatrix(true)

        }

        terrain.addChild(grass)


        // let size = 1000
        // let terrainSize = 1000
        // let des = 1
        // let space = 2
        // let tsw = terrainSize / width
        // let tsh = terrainSize / height
        // let index = 0
        // terrainGeometry.greenData.forEach((data) => {
        //     for (let d = 0; d < des; d++) {
        //         let node = grassCom.nodes[index++]
        //         if (node) {
        //             let px = data.x * tsw - terrainSize * 0.5 + Math.random() * space - space * 0.5
        //             let pz = data.z * tsh - terrainSize * 0.5 + Math.random() * space - space * 0.5
        //             let pos = new Vector3(px, 0, pz)

        //             let tx = Math.floor(((pos.x + size * 0.5) / size) * terrainGeometry.segmentW)
        //             let tz = Math.floor(((pos.z + size * 0.5) / size) * terrainGeometry.segmentH)

        //             if (terrainGeometry.heightData.length > tz && terrainGeometry.heightData[tz].length > tx) {
        //                 pos.y = terrainGeometry.heightData[tz][tx]
        //             }

        //             let gassSize = 1
        //             let scale = (Math.random() * 0.75 + 0.25) * gassSize
        //             node.localPosition = pos
        //             node.localRotation.y = Math.random() * 360
        //             node.localScale = new Vector3(scale, scale, scale)
        //             node.updateWorldMatrix(true)
        //         }
        //     }
        // })


        // this.debug(grassCom)

    }

    private debug(grassCom: GrassComponent) {
        // let gui = new dat.GUI()
        let gui = GUIUtil.GUI
        let dir = gui.addFolder('grass-wind')
        dir.addColor(grassCom.grassMaterial, 'grassBaseColor')
        dir.addColor(grassCom.grassMaterial, 'grassTopColor')
        dir.add(grassCom.grassMaterial.windDirection, 'x', -1.0, 1, 0.0001).onChange((v: any) => {
            let tv = grassCom.grassMaterial.windDirection
            tv.x = v
            grassCom.grassMaterial.windDirection = tv
        })
        dir.add(grassCom.grassMaterial.windDirection, 'y', -1.0, 1, 0.0001).onChange((v: any) => {
            let tv = grassCom.grassMaterial.windDirection
            tv.y = v
            grassCom.grassMaterial.windDirection = tv
        })
        dir.add(grassCom.grassMaterial, 'windPower', 0.0, 20, 0.0001)
        dir.add(grassCom.grassMaterial, 'windSpeed', 0.0, 20, 0.0001)
        dir.add(grassCom.grassMaterial, 'curvature', 0.0, 1, 0.0001)
        dir.add(grassCom.grassMaterial, 'grassHeight', 0.0, 100, 0.0001)
        dir.add(grassCom.grassMaterial, 'roughness', 0.0, 1, 0.0001)
        dir.add(grassCom.grassMaterial, 'translucent', 0.0, 1, 0.0001)
        dir.add(grassCom.grassMaterial, 'soft', 0.0, 10, 0.0001)
        dir.add(grassCom.grassMaterial, 'specular', 0.0, 10, 0.0001)
    }

    destroy(force?: boolean): void {
        Engine3D.inputSystem.removeEventListener("TerrainInited", this.onTerrainReady, this);
    }
}