import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, Vector3, SphereGeometry, Engine3D, Quaternion, Object3DUtil, PlaneGeometry, GPUCullMode, VertexAttributeName, BoxGeometry, GeometryBase, UnLitMaterial, BitmapTexture2D } from '@orillusion/core'
import { ActivationState, RigidBodyComponent, CollisionFlags, ShapeTypes, RigidBodyUtil, Ammo, Physics, SoftBodyComponent, SoftBodyComponentBase, ClothSoftBodyComponent, SphereSoftBodyComponent, TriMeshSoftBodyComponent, VolumeSoftBodyComponent, CollisionGroup, CollisionMask, HingeConstraint, AnchorConstraint } from "@/physics";
import { GUIUtil } from '@/utils/GUIUtil'
import { GUIHelp } from "@/utils/debug/GUIHelp";
import { VehicleControl } from '../vehicleManage';
// import { Ammo, Physics } from '@orillusion/physics';

export class MainModelComponent extends ComponentBase {

    async start() {
        // 峡谷
        // let model = await Engine3D.res.loadGltf('models/scene/level_blockout_modify.glb')

        // 低多边形集合
        // let model = await Engine3D.res.loadGltf('models/scene/volumes_modify.glb')

        // 训练场
        let model = await Engine3D.res.loadGltf('models/scene/training_grounds_modify.glb')

        // 加载模型顶点数据
        // const response = await fetch('json/modelData/level_blockout_modify.json')
        // const data = await response.json() as { vertices: Float32Array, indices: Uint16Array };
        // const vertices = new Float32Array(data.vertices);
        // const indices = new Uint16Array(data.indices);

        // Adjust Transform
        model.scaleX = model.scaleY = model.scaleZ = 0.3
        // model.localQuaternion = new Quaternion(0.75, 0, 0, -0.75)

        model.y = -5

        let rigidbody = model.addComponent(RigidBodyComponent)
        rigidbody.shape = ShapeTypes.btBvhTriangleMeshShape
        // rigidbody.group = CollisionGroup.TERRAIN
        // rigidbody.mask = CollisionMask.DEFAULT_MASK
        // rigidbody.modelVertices = vertices
        // rigidbody.modelIndices = indices

        this.object3D.transform.scene3D.addChild(model)

        this.debug(model, rigidbody)


        // 空心复合体测试
        // let testHollow = Object3DUtil.GetSingleCube(0.1, 0.1, 0.1, 0.5, 0.2, 0.9)
        // let shapes = RigidBodyUtil.generatesHollowShapes(new Vector3(13, 1, 15), new Vector3(1, 1, 1), Vector3.ZERO, 'Y')
        // let testRBC = testHollow.addComponent(RigidBodyComponent)
        // testRBC.shape = ShapeTypes.btCompoundShape
        // testRBC.childShapes = shapes
        // this.object3D.transform.scene3D.addChild(testHollow)


        // 静态平面刚体测试
        if (false) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(1000, 1000, 1, 1)
            mr.material = new LitMaterial()
            mr.material.cullMode = GPUCullMode.none
            obj.localPosition = new Vector3(0, 0, 0)
            this.object3D.transform.scene3D.addChild(obj)

            let rigidBody = obj.addComponent(RigidBodyComponent)
            rigidBody.shape = ShapeTypes.btStaticPlaneShape
            // rigidBody.group = CollisionGroup.TERRAIN
            // rigidBody.mask = CollisionMask.DEFAULT_MASK
        }
        // 柱子测试软体锚点

        let boxObj = Object3DUtil.GetSingleCube(1, 5, 1, 0.8, 0.4, 0.3)
        boxObj.y = -2.5
        boxObj.z = 5
        let boxObjRbComponent = boxObj.addComponent(RigidBodyComponent)
        boxObjRbComponent.shape = ShapeTypes.btBoxShape
        boxObjRbComponent.mass = 10
        this.object3D.addChild(boxObj)

        // 软体布料测试0 车辆旗帜
        if (true) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            // mr.geometry = new PlaneGeometry(10 * 0.5, 6.6 * 0.5, 10, 10)
            mr.geometry = new PlaneGeometry(0.5*1, 0.33*1, 10, 7)

            let texture = await Engine3D.res.loadTexture('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/american_flag.png');
            let normalMapTexture = await Engine3D.res.loadTexture('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/sandstone_cracks_nor_gl_1k.png');
            let mat = new LitMaterial();
            mat.baseMap = texture;
            mat.normalMap = normalMapTexture;
            mat.cullMode = GPUCullMode.none
            mat.metallic = 0;
            mat.roughness = 10;
            // let texture = new BitmapTexture2D()
            // await texture.load('https://cdn.orillusion.com/gltfs/cube/material_02.png')
            // let mat = new UnLitMaterial()
            // mat.baseMap = texture;
            // mat.cullMode = GPUCullMode.none
            // mr.material = mat;


            mr.material = mat;
            // obj.localPosition = new Vector3(-28 * 0.5, 2 * -0.5, -30 * 0.5)
            // obj.localPosition = new Vector3(0, 0, 0)
            // obj.localRotation = new Vector3(0, 0, 0)
            this.object3D.transform.scene3D.addChild(obj)

            // 布料软体
            let softBody = obj.addComponent(ClothSoftBodyComponent)
            softBody.mass = 0.9
            softBody.margin = 0



            let carObj = this.transform.scene3D.getChildByName('vehicle') as Object3D
            let carRbComponent = carObj.getComponent(RigidBodyComponent)

            // 软体锚点约束
            let constraint = obj.addComponent(AnchorConstraint)
            constraint.targetRigidbody = carRbComponent
            constraint.anchorIndices = ['leftTop', 'leftBottom'];
            constraint.influence = [1, 1];
            constraint.disableCollision = true;

            // 布料左边与刚体相连
            let anchorX = (5 / 2 + 1 / 2) // x偏移 布料平面宽度的一半 + 刚体的宽度的一半
            // 布料的顶部与刚体对其
            let anchorY = (5 - 3.3) / 2 // (刚体高 - 布料平面高) / 2
            // 布料对其矩形刚体的左角
            let anchorZ = 1 / 2 // 刚体深度 / 2

            // constraint.relativePosition = new Vector3(0.8, 1.2, -1.58)
            constraint.relativePosition = new Vector3(0, 1, 0)
            // constraint.absoluteRotation = new Vector3(0, 0, 0)

            GUIHelp.addFolder('CarSoftBody')
            GUIHelp.addButton('stop SoftBody Movement', () => softBody.stopSoftBodyMovement())
            GUIHelp.addButton('Destroy AnchorConstraint', () => constraint.destroy())
            let rot = 0
            GUIHelp.addButton('change rotition', () => softBody.updateTransform(Vector3.ZERO, new Vector3(0, ++rot, 0)))
            GUIHelp.open()


        }
        if (true) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            // mr.geometry = new PlaneGeometry(10 * 0.5, 6.6 * 0.5, 10, 10)
            mr.geometry = new PlaneGeometry(5, 3.3, 10, 10)

            let texture = await Engine3D.res.loadTexture('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/american_flag.png');
            let normalMapTexture = await Engine3D.res.loadTexture('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/images/codepen/sandstone_cracks_nor_gl_1k.png');
            let mat = new LitMaterial();
            mat.baseMap = texture;
            mat.normalMap = normalMapTexture;
            mat.cullMode = GPUCullMode.none
            mat.metallic = 0;
            mat.roughness = 10;

            mr.material = mat;
            // obj.localPosition = new Vector3(-28 * 0.5, 2 * -0.5, -30 * 0.5)
            obj.localPosition = new Vector3(-14, 1, -15)
            obj.localRotation = new Vector3(0, 10, 0)
            this.object3D.transform.scene3D.addChild(obj)

            // 布料软体
            let softBody = obj.addComponent(ClothSoftBodyComponent)
            softBody.mass = 0.9

            GUIHelp.addFolder('SoftBody')
            GUIHelp.open()
            GUIHelp.addButton('stop SoftBody Movement', () => softBody.stopSoftBodyMovement())

            // 软体锚点约束
            let constraint = obj.addComponent(AnchorConstraint)
            constraint.targetRigidbody = boxObjRbComponent
            constraint.anchorIndices = ['leftTop', 'leftBottom'];

            // 布料左边与刚体相连
            let anchorX = (5 / 2 + 1 / 2) // x偏移 布料平面宽度的一半 + 刚体的宽度的一半
            // 布料的顶部与刚体对其
            let anchorY = (5 - 3.3) / 2 // (刚体高 - 布料平面高) / 2
            // 布料对其矩形刚体的左角
            let anchorZ = 1 / 2 // 刚体深度 / 2

            constraint.relativePosition = new Vector3(anchorX, anchorY, anchorZ)
            // constraint.relativePosition = new Vector3(0, 0, 0)
            // constraint.absoluteRotation = new Vector3(0, 0, 0)

            GUIHelp.addButton('Destroy AnchorConstraint', () => constraint.destroy())
            let rot = 0
            GUIHelp.addButton('change rotition', () => softBody.updateTransform(Vector3.ZERO, new Vector3(0, ++rot, 0)))

        }
        // 软体布料测试2  悟空
        if (true) {
            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(5, 5.5, 10, 10)

            let texture = new BitmapTexture2D()
            await texture.load('https://cdn.orillusion.com/gltfs/cube/material_02.png')
            let mat = new UnLitMaterial()
            mat.baseMap = texture;
            mat.cullMode = GPUCullMode.none
            mr.material = mat;

            obj.localPosition = new Vector3(-7 * 0.5, 1 * -2, -76.3 * 0.5)
            // obj.localPosition = new Vector3(-3.5, -1, -38.15)
            obj.localRotation = new Vector3(0, 90, 0)
            this.object3D.transform.scene3D.addChild(obj)

            let softBody = obj.addComponent(ClothSoftBodyComponent)
            softBody.fixNodeIndices = ['leftTop', 'rightTop']

            GUIHelp.addButton('fixClothNode leftBottom', () => softBody.fixClothNode(softBody.getCornerIndices(['leftBottom'])))

            // let softBody = obj.addComponent(SoftBodyComponent)

        }


        // 软体球体测试1
        if (false) {
            const radius = 5;
            const widthSegments = 10;
            const heightSegments = 10;
            const generateSphere = (radius: number, widthSegments: number, heightSegments: number) => {
                const vertices = [];
                const indices = [];

                for (let y = 0; y <= heightSegments; y++) {
                    const theta = y * Math.PI / heightSegments;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    for (let x = 0; x <= widthSegments; x++) {
                        const phi = x * 2 * Math.PI / widthSegments;
                        const sinPhi = Math.sin(phi);
                        const cosPhi = Math.cos(phi);

                        const vx = radius * sinTheta * cosPhi;
                        const vy = radius * cosTheta;
                        const vz = radius * sinTheta * sinPhi;
                        vertices.push(vx, vy, vz);
                    }
                }

                for (let y = 0; y < heightSegments; y++) {
                    for (let x = 0; x < widthSegments; x++) {
                        const a = y * (widthSegments + 1) + x;
                        const b = a + widthSegments + 1;
                        indices.push(a, b, a + 1);
                        indices.push(b, b + 1, a + 1);
                    }
                }

                return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
            }
            const { vertices, indices } = generateSphere(radius, widthSegments, heightSegments);



            const obj: Object3D = new Object3D()
            let mr: MeshRenderer = obj.addComponent(MeshRenderer)
            mr.geometry = new PlaneGeometry(10, 10, 10, 10)
            mr.geometry.setIndices(indices)

            mr.material = new LitMaterial()
            mr.material.cullMode = GPUCullMode.none
            obj.localPosition = new Vector3(-10, 2.5, 10)
            // obj.localRotation = new Vector3(0, 90, 0)


            this.object3D.transform.scene3D.addChild(obj)

            let softBody = obj.addComponent(SphereSoftBodyComponent)
        }

        // 网格软体测试1
        if (false) {

            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.8;
            mat.metallic = 0.1;

            let sphere = new Object3D();
            // sphere.transform.z = 0.5;
            let mr = sphere.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(5, 8, 8);
            // mr.geometry = new BoxGeometry(5,5,5)
            mr.material = mat;//new HDRLitMaterial();
            mr.castShadow = true;
            mr.material.cullMode = GPUCullMode.none
            // sphere.localPosition = new Vector3(30, 10, 50)
            this.object3D.transform.scene3D.addChild(sphere);
            setTimeout(() => {
                let softBody = sphere.addComponent(TriMeshSoftBodyComponent)
                // softBody.mass = 0

            }, 3000);

        }

        // 网格软体测试自定义几何体 矩形
        if (false) {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.8;
            mat.metallic = 0.1;

            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);

            var bx = 2;
            var by = 1;
            var bz = 3;
            var nn = 5;
            const { geometry, indexFromOffset, vertices, indices } = this.createBox(bx, by, bz, nn * bx, nn * by, nn * bz,);
            mr.geometry = geometry
            mr.material = mat; //new HDRLitMaterial();
            mr.castShadow = true;
            mr.material.cullMode = GPUCullMode.none
            // obj.localPosition = new Vector3(0,30,0)
            this.object3D.addChild(obj);

            setTimeout(() => {
                let softBody = obj.addComponent(VolumeSoftBodyComponent)
                softBody.mass = 15
                softBody.indexFromOffset = indexFromOffset
                softBody.numPointsX = nn * bx
                softBody.numPointsY = nn * by
                softBody.numPointsZ = nn * bz
                softBody.vertices = vertices
                softBody.indices = indices
            }, 3000);
        }


        // softBody.mass = 0
    }

    private createBox(
        sizeX: number, sizeY: number, sizeZ: number,
        numPointsX: number, numPointsY: number, numPointsZ: number,
    ) {
        if (numPointsX < 2 || numPointsY < 2 || numPointsZ < 2) {
            return;
        }

        const indexFromOffset: number[] = [];
        for (let offset = 0; offset < 8; offset++) {
            const a = offset & 1 ? 1 : 0;
            const b = offset & 2 ? 1 : 0;
            const c = offset & 4 ? 1 : 0;
            const index = a + b * numPointsX + c * numPointsX * numPointsY;
            indexFromOffset[offset] = index;
        }

        const numVertices = numPointsX * numPointsY * numPointsZ;
        const numFaces = 4 * ((numPointsX - 1) * (numPointsY - 1) + (numPointsX - 1) * (numPointsZ - 1) + (numPointsY - 1) * (numPointsZ - 1));

        const vertices = new Float32Array(numVertices * 3);
        const normals = new Float32Array(numVertices * 3);
        const indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);

        const sx = sizeX / (numPointsX - 1);
        const sy = sizeY / (numPointsY - 1);
        const sz = sizeZ / (numPointsZ - 1);
        let numFacesAdded = 0;

        for (let p = 0, k = 0; k < numPointsZ; k++) {
            for (let j = 0; j < numPointsY; j++) {
                for (let i = 0; i < numPointsX; i++) {
                    // let p3 = p * 3;
                    // vertices[p3] = i * sx - sizeX * 0.5;
                    // normals[p3++] = 0;
                    // vertices[p3 + 1] = j * sy - sizeY * 0.5;
                    // normals[p3 + 1] = 0;
                    // vertices[p3 + 2] = k * sz - sizeZ * 0.5;
                    // normals[p3 + 2] = 0;
                    var p3 = p * 3;
                    vertices[p3] = i * sx - sizeX * 0.5;
                    normals[p3++] = 0;
                    vertices[p3] = j * sy - sizeY * 0.5;
                    normals[p3++] = 0;
                    vertices[p3] = k * sz - sizeZ * 0.5;
                    normals[p3] = 0;

                    if (k == 0 && i < numPointsX - 1 && j < numPointsY - 1) {
                        let faceIndex = numFacesAdded * 3;
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[1];
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[2];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        numFacesAdded += 2;
                    }

                    if (k == numPointsZ - 2 && i < numPointsX - 1 && j < numPointsY - 1) {
                        let faceIndex = numFacesAdded * 3;
                        indices[faceIndex++] = p + indexFromOffset[7];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[4];
                        numFacesAdded += 2;
                    }

                    if (j == 0 && i < numPointsX - 1 && k < numPointsZ - 1) {
                        let faceIndex = numFacesAdded * 3;
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        indices[faceIndex++] = p + indexFromOffset[4];
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[1];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        numFacesAdded += 2;
                    }

                    if (j == numPointsY - 2 && i < numPointsX - 1 && k < numPointsZ - 1) {
                        let faceIndex = numFacesAdded * 3;
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[2];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[7];
                        numFacesAdded += 2;
                    }

                    if (i == 0 && j < numPointsY - 1 && k < numPointsZ - 1) {
                        let faceIndex = numFacesAdded * 3;
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[2];
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[4];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        numFacesAdded += 2;
                    }

                    if (i == numPointsX - 2 && j < numPointsY - 1 && k < numPointsZ - 1) {
                        let faceIndex = numFacesAdded * 3;
                        indices[faceIndex++] = p + indexFromOffset[1];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[7];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        numFacesAdded += 2;
                    }

                    p++;
                }
            }
        }

        const geometry = new GeometryBase();
        geometry.setIndices(indices);
        geometry.setAttribute(VertexAttributeName.position, vertices);
        geometry.setAttribute(VertexAttributeName.normal, normals);
        geometry.addSubGeometry({
            indexStart: 0,
            indexCount: indices.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });

        return { geometry, indexFromOffset, vertices, indices }
    }

    private debug(model: Object3D, rigidbody: RigidBodyComponent) {
        let gui = GUIUtil.GUI
        gui.addFolder('mainModelComponent')
        gui.add(model.transform, 'enable').onChange(v => {
            if (!rigidbody?.btRigidbody) return
            if (v) {
                rigidbody.btRigidbody.setActivationState(ActivationState.ACTIVE_TAG);
                Physics.world.addRigidBody(rigidbody.btRigidbody);
            } else {
                rigidbody.btRigidbody.setActivationState(ActivationState.DISABLE_SIMULATION);
                Physics.world.removeRigidBody(rigidbody.btRigidbody);

                // 激活所有动态刚体
                RigidBodyUtil.activateAllKinematicObject()

                console.log(Physics.rigidBodyMapping.getAllGraphicObjectMap);

            }
        })
        gui.open()
    }

    public onUpdate(): void {

    }
}