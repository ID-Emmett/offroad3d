import { ComponentBase, GeometryBase, VertexAttributeName } from '@orillusion/core';
import { Ammo, Physics } from '.';

/**
 * SoftBody Component
 * 用于创建和管理软体物体，例如布料、柔性物体等。
 * @group Components
 */
export abstract class SoftBodyComponentBase extends ComponentBase {
    protected _btSoftBody: Ammo.btSoftBody;
    protected _softBodyInited: boolean = false;

    public mass: number = 1;

    protected abstract _geometry: GeometryBase;

    init() {
        if (!Physics.isSoftBodyWord) {
            console.error('！！重置为软体世界，之前创建的刚体数据将会被销毁')
            Physics.switchWorld(true);
        }
    }
    
    async start(): Promise<void> {
        this.initSoftBody();
    }

    protected abstract initSoftBody(): void;

    onUpdate(): void {
        if (this._softBodyInited) {
            // 更新软体物体的位置
            const nodes = this._btSoftBody.get_m_nodes();
            const vertices = this._geometry.getAttribute(VertexAttributeName.position);
            const normals = this._geometry.getAttribute(VertexAttributeName.normal);
            // console.log(normals.data.length);

            // console.log(vertices.data.length);
            // console.log(nodes.size());

            for (let i = 0; i < nodes.size(); i++) {
                const node = nodes.at(i);
                const pos = node.get_m_x();

                vertices.data[3 * i] = pos.x();
                vertices.data[3 * i + 1] = pos.y();
                vertices.data[3 * i + 2] = pos.z();

                const normal = node.get_m_n();
                normals.data[3 * i] = normal.x();
                normals.data[3 * i + 1] = normal.y();
                normals.data[3 * i + 2] = normal.z();
            }
            this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
            this._geometry.vertexBuffer.upload(VertexAttributeName.normal, normals);
        }
    }

    public destroy(force?: boolean): void {
        if (this._softBodyInited) {
            (Physics.world as Ammo.btSoftRigidDynamicsWorld).removeSoftBody(this._btSoftBody);
            Ammo.destroy(this._btSoftBody);
            this._softBodyInited = false;
        }
        super.destroy(force);
    }

    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftBody;
    }
}
