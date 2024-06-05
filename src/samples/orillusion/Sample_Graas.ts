import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, Vector3, PostProcessingComponent, BitmapTexture2D, GlobalFog, Color } from '@orillusion/core';
import { GrassComponent, TerrainGeometry } from '@orillusion/effect'
import { Stats } from '@orillusion/stats'
import dat from 'dat.gui'

class Sample_Grass {
    view: View3D
    post: PostProcessingComponent

    async run() {
        Engine3D.setting.shadow.autoUpdate = true
        Engine3D.setting.shadow.updateFrameRate = 1
        Engine3D.setting.shadow.shadowBound = 500
        Engine3D.setting.shadow.shadowSize = 1024

        await Engine3D.init()
        this.view = new View3D()
        this.view.scene = new Scene3D()
        this.view.scene.addComponent(AtmosphericComponent)
        this.view.scene.addComponent(Stats)

        this.view.camera = CameraUtil.createCamera3DObject(this.view.scene)
        this.view.camera.enableCSM = true
        this.view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0)
        this.view.camera.object3D.addComponent(HoverCameraController).setCamera(35, -20, 500)

        Engine3D.startRenderView(this.view)
        this.createScene(this.view.scene)
    }

    private async createScene(scene: Scene3D) {
        //bitmap
        let bitmapTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/test01/bitmap.png')
        let heightTexture = await Engine3D.res.loadTexture('images/height_map.jpg')
        let grassTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/grass/GrassThick.png')
        let gustNoiseTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/grass/displ_noise_curl_1.png')
        let sunObj = new Object3D()
        let sunLight = sunObj.addComponent(DirectLight)
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553)
        sunLight.castShadow = true
        sunLight.intensity = 49
        sunObj.transform.rotationX = 50
        sunObj.transform.rotationY = 50
        scene.addChild(sunObj)

        let terrainSize = 1000
        let size = 1000
        let grassCount = 6795
        // let grassCount = 10;
        let des = 1
        let space = 2
        let terrainGeometry: TerrainGeometry
        {
            let mat = new LitMaterial()
            terrainGeometry = new TerrainGeometry(terrainSize, terrainSize)
            terrainGeometry.setHeight(heightTexture as BitmapTexture2D, 100)
            let floor = new Object3D()
            let mr = floor.addComponent(MeshRenderer)
            mr.geometry = terrainGeometry
            mat.baseMap = bitmapTexture
            mr.material = mat
            scene.addChild(floor)
        }

        let grassCom: GrassComponent
        {
            let grass = new Object3D()
            grassCom = grass.addComponent(GrassComponent)
            grassCom.setGrassTexture(Engine3D.res.whiteTexture)
            // grassCom.setGrassTexture(grassTexture);
            grassCom.setWindNoiseTexture(gustNoiseTexture)
            grassCom.setGrass(18, 1, 5, 1, grassCount)

            let tsw = terrainSize / terrainGeometry.segmentW
            let tsh = terrainSize / terrainGeometry.segmentH
            let index = 0
            terrainGeometry.greenData.forEach((data) => {
                for (let d = 0; d < des; d++) {
                    let node = grassCom.nodes[index++]
                    if (node) {
                        let px = data.x * tsw - terrainSize * 0.5 + Math.random() * space - space * 0.5
                        let pz = data.z * tsh - terrainSize * 0.5 + Math.random() * space - space * 0.5
                        let pos = new Vector3(px, 0, pz)

                        let tw = terrainGeometry.segmentW
                        let th = terrainGeometry.segmentH
                        let tx = Math.floor(((pos.x + size * 0.5) / size) * terrainGeometry.segmentW)
                        let tz = Math.floor(((pos.z + size * 0.5) / size) * terrainGeometry.segmentH)

                        if (terrainGeometry.heightData.length > tz && terrainGeometry.heightData[tz].length > tx) {
                            pos.y = terrainGeometry.heightData[tz][tx]
                        }

                        let gassSize = 0.8
                        let scale = (Math.random() * 0.75 + 0.25) * gassSize
                        node.localPosition = pos
                        node.localRotation.y = Math.random() * 360
                        node.localScale = new Vector3(scale, scale, scale)
                        node.updateWorldMatrix(true)
                    }
                }
            })
            scene.addChild(grass)
        }

        // let gui = new dat.GUI()
        // let dir = gui.addFolder('grass-wind')
        // dir.addColor(grassCom.grassMaterial, 'grassBaseColor')
        // dir.addColor(grassCom.grassMaterial, 'grassTopColor')
        // dir.add(grassCom.grassMaterial.windDirection, 'x', -1.0, 1, 0.0001).onChange((v:any) => {
        //     let tv = grassCom.grassMaterial.windDirection
        //     tv.x = v
        //     grassCom.grassMaterial.windDirection = tv
        // })
        // dir.add(grassCom.grassMaterial.windDirection, 'y', -1.0, 1, 0.0001).onChange((v: any) => {
        //     let tv = grassCom.grassMaterial.windDirection
        //     tv.y = v
        //     grassCom.grassMaterial.windDirection = tv
        // })
        // dir.add(grassCom.grassMaterial, 'windPower', 0.0, 20, 0.0001)
        // dir.add(grassCom.grassMaterial, 'windSpeed', 0.0, 20, 0.0001)
        // dir.add(grassCom.grassMaterial, 'curvature', 0.0, 1, 0.0001)
        // dir.add(grassCom.grassMaterial, 'grassHeight', 0.0, 100, 0.0001)
        // dir.add(grassCom.grassMaterial, 'roughness', 0.0, 1, 0.0001)
        // dir.add(grassCom.grassMaterial, 'translucent', 0.0, 1, 0.0001)
        // dir.add(grassCom.grassMaterial, 'soft', 0.0, 10, 0.0001)
        // dir.add(grassCom.grassMaterial, 'specular', 0.0, 10, 0.0001)
    }
}

new Sample_Grass().run();