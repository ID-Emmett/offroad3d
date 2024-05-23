import { Vector3, MeshRenderer, GeometryBase, Quaternion, BoundUtil, SphereGeometry, PlaneGeometry } from '@orillusion/core';
import { Ammo, Physics, SoftBodyComponentBase, PhysicsMathUtil } from '..';

export class SphereSoftBodyComponent extends SoftBodyComponentBase {
    public radius3: Vector3 = new Vector3(5, 5, 5);
    public segments: number;

    protected _geometry: PlaneGeometry;

    public set geometry(value: PlaneGeometry) {
        this._geometry = value
    }

    protected initSoftBody(): void {
        if (this._softBodyInited) return;

        const softBodyHelpers = new Ammo.btSoftBodyHelpers();
        const softBodyWorldInfo = Physics.worldInfo;

        this._geometry ||= this.object3D.getComponent(MeshRenderer).geometry as PlaneGeometry;

        const position = this.transform.localPosition;
        const rotation = this.transform.localRotation;

        let segments = this.segments || this._geometry.segmentW;
        let radius3 = this.radius3;

        let btCenter = PhysicsMathUtil.toBtVector3(position, PhysicsMathUtil.tmpVecA);
        let btRadius = PhysicsMathUtil.toBtVector3(radius3, PhysicsMathUtil.tmpVecB);
        this._btSoftBody = softBodyHelpers.CreateEllipsoid(
            softBodyWorldInfo,
            btCenter,
            btRadius,
            // segments * 2,
            121 - 3,
            // 363 // 363 128
        );

        this._btSoftBody.translate(PhysicsMathUtil.toBtVector3(position));
        this._btSoftBody.rotate(PhysicsMathUtil.toBtQuaternion(Quaternion.HELP_0.fromEulerAngles(rotation.x, rotation.y, rotation.z)));

        // const btTransform = new Ammo.btTransform();
        // btTransform.setIdentity();
        // btTransform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        // const btQuaternion = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        // btTransform.setRotation(btQuaternion);
        // this._btSoftBody.transform(btTransform);


        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;

        let sbConfig = this._btSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        this._btSoftBody.setActivationState(4);

        this._btSoftBody.get_m_materials().at(0).set_m_kLST(0.4);
        this._btSoftBody.get_m_materials().at(0).set_m_kAST(0.4);
        this._btSoftBody.setTotalMass(this.mass, false);

        Physics.addSoftBody(this._btSoftBody);
        this._softBodyInited = true;
    }
}