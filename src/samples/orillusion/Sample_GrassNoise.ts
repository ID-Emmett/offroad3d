import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, Vector3, PostProcessingComponent, BitmapTexture2D, GlobalFog, Color, PlaneGeometry, VertexAttributeName, Vector4, GPUAddressMode } from '@orillusion/core';
import { GrassComponent, TerrainGeometry } from '@orillusion/effect'
import { Stats } from '@orillusion/stats'
import dat from 'dat.gui'
import { perlinNoise, createNoiseSeed } from '@/utils/perlin.js';

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
        let heightTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/test01/height.png')
        let grassTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/grass/GrassThick.png')
        // let grassTexture = await Engine3D.res.loadTexture('src/assets/images/grass1.png')
        let gustNoiseTexture = await Engine3D.res.loadTexture('https://cdn.orillusion.com/terrain/grass/displ_noise_curl_1.png')
        let sunObj = new Object3D()
        let sunLight = sunObj.addComponent(DirectLight)
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553)
        sunLight.castShadow = true
        sunLight.intensity = 49
        sunObj.transform.rotationX = 50
        sunObj.transform.rotationY = 50
        scene.addChild(sunObj)

        let terrainSize = 3000
        let grassCount = 6795 * 8
        let des = 11
        let space = 200

        // let terrainSize = 1000
        // let grassCount = 6795
        // let des = 1
        // let space = 2

        let terrainGeometry: TerrainGeometry
        {
            terrainGeometry = new TerrainGeometry(terrainSize, terrainSize)
            terrainGeometry.setHeight(heightTexture as BitmapTexture2D, 100)

            {
                let floor = new Object3D()
                floor.name = 'floor'
                let renderer = floor.addComponent(MeshRenderer)
                renderer.geometry = new PlaneGeometry(5000, 5000, 250, 250)
                let posAttrData = renderer.geometry.getAttribute(VertexAttributeName.position);
                for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
                    posAttrData.data[i * 3 + 1] = perlinNoise(posAttrData.data[i * 3 + 0], posAttrData.data[i * 3 + 2]) // position y
                }
                renderer.geometry.vertexBuffer.upload(VertexAttributeName.position, posAttrData);
                renderer.geometry.computeNormals();

                let texture = await Engine3D.res.loadTexture('textures/sandstone_cracks/sandstone_cracks_diff_1k.jpg');
                let normalMap = await Engine3D.res.loadTexture('textures/sandstone_cracks/sandstone_cracks_nor_gl_1k.png');

                let mat = new LitMaterial()
                mat.setUniformVector4('transformUV1', new Vector4(0, 0, 10, 10))
                mat.baseMap = texture
                mat.normalMap = normalMap
                mat.metallic = 0
                mat.roughness = 10

                // 水平方向与竖直方向
                texture.addressModeU = GPUAddressMode.repeat;
                texture.addressModeV = GPUAddressMode.repeat;

                renderer.material = mat
                renderer.receiveShadow = true
                scene.addChild(floor)
            }

        }

        let grassCom: GrassComponent
        {
            let grass = new Object3D()
            grassCom = grass.addComponent(GrassComponent)
            grassCom.setGrassTexture(Engine3D.res.whiteTexture)
            // grassCom.setGrassTexture(grassTexture);
            grassCom.setWindNoiseTexture(gustNoiseTexture)
            grassCom.setGrass(18, 1, 5, 1, grassCount)
            // grassCom.grassMaterial.grassHeight = 1
            grassCom.grassMaterial.specular = 0 //镜面反射
            grassCom.grassMaterial.grassBaseColor = new Color(10.8, 1, 2.1, 1)
            grassCom.grassMaterial.grassTopColor = new Color(2.8, 0.5, 0.3, 1)

            let index = 0

            let tsw = terrainSize / terrainGeometry.segmentW
            let tsh = terrainSize / terrainGeometry.segmentH
            terrainGeometry.greenData.forEach((data) => {
                for (let d = 0; d < des; d++) {
                    let node = grassCom.nodes[index++]
                    if (node) {
                        let px = data.x * tsw - terrainSize * 0.5 + Math.random() * space - space * 0.5
                        let pz = data.z * tsh - terrainSize * 0.5 + Math.random() * space - space * 0.5
                        // let px = Math.floor(Math.random() * 500) - 250
                        // let pz = Math.floor(Math.random() * 500) - 250
                        let pos = new Vector3(px, 0, pz)

                        pos.y = perlinNoise(px, pz)
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
    }
}

new Sample_Grass().run();