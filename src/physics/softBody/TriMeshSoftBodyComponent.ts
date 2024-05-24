import { Vector3, MeshRenderer, GeometryBase, Quaternion, Object3D, VertexAttributeName } from '@orillusion/core';
import { Ammo, Physics, SoftBodyComponentBase, PhysicsMathUtil } from '..';


function isEqual(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean {
    const delta = 0.000001;
    return Math.abs(x2 - x1) < delta &&
        Math.abs(y2 - y1) < delta &&
        Math.abs(z2 - z1) < delta;
}

function mapIndices(geometry: GeometryBase, indexedVertices: Float32Array): number[][] {
    const vertices = geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
    const numVertices = vertices.length / 3;
    const numIndexedVertices = indexedVertices.length / 3;
    const indexAssociation: number[][] = [];

    for (let i = 0; i < numIndexedVertices; i++) {
        const assoc = [];
        const i3 = i * 3;

        for (let j = 0; j < numVertices; j++) {
            const j3 = j * 3;
            if (isEqual(indexedVertices[i3], indexedVertices[i3 + 1], indexedVertices[i3 + 2], vertices[j3], vertices[j3 + 1], vertices[j3 + 2])) {
                assoc.push(j3);
            }
        }

        indexAssociation.push(assoc);
    }

    return indexAssociation;
}

function processGeometry(geometry: GeometryBase): { vertices: Float32Array, indices: Uint32Array, ammoIndexAssociation: number[][] } {
    const vertices = geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
    const indices = geometry.getAttribute(VertexAttributeName.indices).data as Uint32Array;

    const uniqueVertices = new Map<string, number>();
    const indexedVertices: number[] = [];
    const newIndices: number[] = [];

    for (let i = 0; i < indices.length; i++) {
        const vertexIndex = indices[i];
        const x = vertices[vertexIndex * 3];
        const y = vertices[vertexIndex * 3 + 1];
        const z = vertices[vertexIndex * 3 + 2];
        const key = `${x},${y},${z}`;

        if (!uniqueVertices.has(key)) {
            uniqueVertices.set(key, indexedVertices.length / 3);
            indexedVertices.push(x, y, z);
        }

        newIndices.push(uniqueVertices.get(key)!);
    }

    const ammoIndexAssociation = mapIndices(geometry, new Float32Array(indexedVertices));

    return { vertices: new Float32Array(indexedVertices), indices: new Uint32Array(newIndices), ammoIndexAssociation };
}

export class TriMeshSoftBodyComponent extends SoftBodyComponentBase {
    protected _geometry: GeometryBase;

    public set geometry(value: GeometryBase) {
        // 这里执行比initSoftBody慢
        console.log(1, value);
        
        this._geometry = value;
    }

    protected initSoftBody(): void {
        if (this._btBodyInited) return;

        const softBodyHelpers = new Ammo.btSoftBodyHelpers();
        const softBodyWorldInfo = Physics.worldInfo;
        console.log(2, this._geometry);

        this._geometry ||= this.object3D.getComponent(MeshRenderer).geometry;

        // 获取顶点和三角形索引
        const vertices = this._geometry.getAttribute(VertexAttributeName.position).data;
        const indices = this._geometry.getAttribute(VertexAttributeName.indices).data;
        // 处理几何体数据
        // const { vertices, indices } = this.processGeometry(this._geometry);
        // const { vertices, indices } =  processGeometry(this._geometry);


        console.log(vertices);
        console.log(indices);
        console.log(indices.length / 3);
        
        
        const ntriangles = indices.length / 3;

        // 创建软体物体
        this._btSoftBody = softBodyHelpers.CreateFromTriMesh(
            softBodyWorldInfo,
            vertices as unknown as number[],
            indices as unknown as number[],
            ntriangles,
            true // 是否随机化约束
        );        

        let sbConfig = this._btSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        this._btSoftBody.setActivationState(4);

        // Soft-soft and soft-rigid collisions
        sbConfig.set_collisions(0x11);

        // Friction 动态摩擦系数
        sbConfig.set_kDF(0.5);
        // Damping 阻尼系数
        sbConfig.set_kDP(0.5);
        // Pressure 压缩恢复系数
        sbConfig.set_kPR(1);

        var physMat0 = this._btSoftBody.get_m_materials().at(0);
        // Stiffness
        var stiffness = 0.5;
        physMat0.set_m_kLST(stiffness);
        physMat0.set_m_kAST(stiffness);
        physMat0.set_m_kVST(stiffness);


        // sbConfig.set_viterations(10);
        // sbConfig.set_piterations(10);
        // sbConfig.set_diterations(10);
        // sbConfig.set_citerations(10);
        // sbConfig.set_kDF(0.5); // 动态摩擦系数
        // sbConfig.set_kDP(0.01); // 阻尼系数
        // sbConfig.set_kPR(0.5); // 压缩恢复系数
        // sbConfig.set_kLST(0.4); // 拉伸系数
        // sbConfig.set_kAST(0.4); // 弯曲系数

        this._btSoftBody.get_m_materials().at(0).set_m_kLST(0.9);
        this._btSoftBody.get_m_materials().at(0).set_m_kAST(0.9);
        this._btSoftBody.setTotalMass(this.mass, false);

        Physics.addSoftBody(this._btSoftBody);
        this._btBodyInited = true;
    }

    private processGeometry(geometry: GeometryBase): { vertices: Float32Array, indices: Uint32Array, ammoIndexAssociation: number[][] } {
        const vertices = geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
        const indices = geometry.getAttribute(VertexAttributeName.indices).data as Uint32Array;

        // Creating a Set to avoid duplicate vertices
        const uniqueVertices = new Set<string>();
        const vertexMap = new Map<string, number>();
        const indexedVertices: number[] = [];
        const newIndices: number[] = [];

        for (let i = 0; i < indices.length; i++) {
            const vertexIndex = indices[i];
            const x = vertices[vertexIndex * 3];
            const y = vertices[vertexIndex * 3 + 1];
            const z = vertices[vertexIndex * 3 + 2];
            const key = `${x},${y},${z}`;

            if (!uniqueVertices.has(key)) {
                uniqueVertices.add(key);
                vertexMap.set(key, indexedVertices.length / 3);
                indexedVertices.push(x, y, z);
            }

            newIndices.push(vertexMap.get(key)!);
        }

        const ammoIndexAssociation = this.mapIndices(geometry, new Float32Array(indexedVertices));

        return { vertices: new Float32Array(indexedVertices), indices: new Uint32Array(newIndices), ammoIndexAssociation };
    }

    private mapIndices(geometry: GeometryBase, indexedVertices: Float32Array): number[][] {
        const vertices = geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
        const numVertices = vertices.length / 3;
        const numIndexedVertices = indexedVertices.length / 3;
        const indexAssociation: number[][] = [];

        for (let i = 0; i < numIndexedVertices; i++) {
            const assoc = [];
            const i3 = i * 3;

            for (let j = 0; j < numVertices; j++) {
                const j3 = j * 3;
                if (this.isEqual(indexedVertices[i3], indexedVertices[i3 + 1], indexedVertices[i3 + 2], vertices[j3], vertices[j3 + 1], vertices[j3 + 2])) {
                    assoc.push(j3);
                }
            }

            indexAssociation.push(assoc);
        }

        return indexAssociation;
    }
    private isEqual(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean {
        const delta = 0.000001;
        return Math.abs(x2 - x1) < delta && Math.abs(y2 - y1) < delta && Math.abs(z2 - z1) < delta;
    }
}

