import { Vector3, MeshRenderer, GeometryBase, Quaternion, Object3D, VertexAttributeName, f32 } from '@orillusion/core';
import { Ammo, Physics, SoftBodyComponentBase, PhysicsMathUtil, CollisionMask } from '..';

export class VolumeSoftBodyComponent extends SoftBodyComponentBase {
    protected _geometry: GeometryBase;

    public indexFromOffset: number[];
    public numPointsX: number
    public numPointsY: number
    public numPointsZ: number
    public vertices: Float32Array
    public indices: Uint16Array | Uint32Array

    protected initSoftBody(): void {
        if (this._softBodyInited) return;

        this._geometry ||= this.object3D.getComponent(MeshRenderer).geometry;

        // 获取顶点和三角形索引
        const vertices = this.vertices || this._geometry.getAttribute(VertexAttributeName.position).data;
        const indices = this.indices || this._geometry.getAttribute(VertexAttributeName.indices).data;

        console.log(vertices);
        console.log(indices);
        console.log(indices.length / 3);


        let indexFromOffset = this.indexFromOffset
        let numPointsX = this.numPointsX
        let numPointsY = this.numPointsY
        let numPointsZ = this.numPointsZ

        // Create soft body
        var vectorTemp = new Ammo.btVector3(0, 0, 0);
        vectorTemp.setValue(vertices[0], vertices[1], vertices[2]);

        var volumeSoftBody = new Ammo.btSoftBody(Physics.worldInfo, 1, vectorTemp, [1.0]);
        this._btSoftBody = volumeSoftBody

        var physMat0 = volumeSoftBody.get_m_materials().at(0);

        for (var i = 1, il = vertices.length / 3; i < il; i++) {
            var i3 = i * 3;
            vectorTemp.setValue(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
            volumeSoftBody.appendNode(vectorTemp, 1.0);
        }

        for (var i = 0, il = indices.length / 3; i < il; i++) {
            var i3 = i * 3;
            volumeSoftBody.appendFace(indices[i3], indices[i3 + 1], indices[i3 + 2], physMat0);
        }

        // Create tetrahedrons
        var p = 0;
        console.log('indexFromOffset', indexFromOffset);
        console.log(numPointsX);
        console.log(numPointsY);
        console.log(numPointsZ);
        console.log(physMat0);
        

        function newTetra(i0: number, i1: number, i2: number, i3: number) {

            var v0 = p + indexFromOffset[i0];
            var v1 = p + indexFromOffset[i1];
            var v2 = p + indexFromOffset[i2];
            var v3 = p + indexFromOffset[i3];

            volumeSoftBody.appendTetra(v0, v1, v2, v3, null);

            volumeSoftBody.appendLink(v0, v1, physMat0, true);
            volumeSoftBody.appendLink(v0, v2, physMat0, true);
            volumeSoftBody.appendLink(v0, v3, physMat0, true);
            volumeSoftBody.appendLink(v1, v2, physMat0, true);
            volumeSoftBody.appendLink(v2, v3, physMat0, true);
            volumeSoftBody.appendLink(v3, v1, physMat0, true);

        }

        for (var k = 0; k < numPointsZ; k++) {
            for (var j = 0; j < numPointsY; j++) {
                for (var i = 0; i < numPointsX; i++) {

                    if (i < numPointsX - 1 && j < numPointsY - 1 && k < numPointsZ - 1) {

                        // Creates 5 tetrahedrons for each cube
                        newTetra(0, 4, 5, 6);
                        newTetra(0, 2, 3, 6);
                        newTetra(0, 1, 3, 5);
                        newTetra(3, 5, 6, 7);
                        newTetra(0, 3, 5, 6);
                        /*
                        volumeSoftBody.appendTetra( p + indexFromOffset[ 0 ], p + indexFromOffset[ 4 ], p + indexFromOffset[ 5 ], p + indexFromOffset[ 6 ] );
                        volumeSoftBody.appendTetra( p + indexFromOffset[ 0 ], p + indexFromOffset[ 2 ], p + indexFromOffset[ 3 ], p + indexFromOffset[ 6 ] );
                        volumeSoftBody.appendTetra( p + indexFromOffset[ 0 ], p + indexFromOffset[ 1 ], p + indexFromOffset[ 3 ], p + indexFromOffset[ 5 ] );
                        volumeSoftBody.appendTetra( p + indexFromOffset[ 3 ], p + indexFromOffset[ 5 ], p + indexFromOffset[ 6 ], p + indexFromOffset[ 7 ] );
                        volumeSoftBody.appendTetra( p + indexFromOffset[ 0 ], p + indexFromOffset[ 3 ], p + indexFromOffset[ 5 ], p + indexFromOffset[ 6 ] );
                        */
                    }

                    p++;
                }
            }
        }


        const position = this.transform.localPosition;
        const rotation = this.transform.localRotation;
        this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(position));
        this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(rotation.x, rotation.y, rotation.z)));
        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;


        // Config soft body

        var sbConfig = volumeSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);

        // Soft-soft and soft-rigid collisions
        sbConfig.set_collisions(0x11);
        // const COLLISION_MASK = 0x01 | 0x02 | 0x04 | 0x08 | 0x10 | 0x20;
        // sbConfig.set_collisions(COLLISION_MASK);

        // sbConfig.set_collisions(CollisionMask.DEFAULT_MASK);

        // Friction
        sbConfig.set_kDF(0.1);
        // Damping
        sbConfig.set_kDP(0.1);
        // Pressure
        sbConfig.set_kPR(0);
        // Stiffness
        // var stiffness = 0.05;
        var stiffness = 0.5;
        physMat0.set_m_kLST(stiffness);
        physMat0.set_m_kAST(stiffness);
        physMat0.set_m_kVST(stiffness);

        volumeSoftBody.setTotalMass(1, false);
        (Ammo as any).castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.05);
        Physics.addSoftBody(volumeSoftBody);
        // Disable deactivation
        volumeSoftBody.setActivationState(4);

        this._softBodyInited = true;
    }


}

