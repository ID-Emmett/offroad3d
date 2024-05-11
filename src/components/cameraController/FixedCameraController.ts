import { Object3D, Vector3, ComponentBase, Quaternion, Camera3D, Vector3Ex, lerpVector3, clamp, Time, View3D } from '@orillusion/core';

import { HoverCameraController } from './HoverCameraController';

/**
 * Fix camera to a target
 */
export class FixedCameraController extends ComponentBase {
    private camera: Camera3D;
    public distance = 20; // distance to target
    public pitch = 30; // camera pitch angle
    private _tempDir: Vector3;
    private _tempPos: Vector3;
    private _target: Object3D;

    private _currentTarget: Vector3 = new Vector3(); // 存储插值后的目标位置
    private _currentCamera: Vector3 = new Vector3(); // 存储插值后的相机位置

    start() {
        this._tempDir = new Vector3();
        this._tempPos = new Vector3();
        this.camera = this.object3D.getComponent(Camera3D);

        // this.camera.object3D.getComponent(HoverCameraController).enable = false

        // this.camera.object3D.removeComponent(HoverCameraController)

        // this._currentTarget.copy(this._target.transform.localPosition)
    }
    get target() {
        return this._target;
    }
    set target(obj: Object3D) {
        this._target = obj;
    }

    onEnable(view?: View3D) {
        // this.object3D.getComponent(HoverCameraController).enable = false;
        let hoverCamera = this.object3D.getComponent(HoverCameraController);
        hoverCamera.enable = false;

        // this._currentTarget = this._target.localPosition.clone()
        // this._currentTarget = new Vector3(100, 100, 100)
        this._currentTarget.copy(this._target.transform.localPosition)

        this._currentCamera.copy(this.camera.transform.localPosition)
    }
    onDisable(view?: View3D) {
        // const camera = this.object3D.getComponent(Camera3D)
        // let cameraPos = camera.object3D.transform.localPosition.clone()

        let hoverCamera = this.object3D.getComponent(HoverCameraController);


        // hoverCamera.object3D.transform.localPosition = new Vector3(100, 100, 100)


        // hoverCamera.target = this._currentCamera

        // hoverCamera.target = this._target.transform.localPosition
        // hoverCamera.slowTracking(this._target)
        hoverCamera.enable = true;

    }

    onUpdate() {
        if (!this._target) return;

        let dt = clamp(Time.delta, 0.01, 0.03);
        // let dt = clamp(Time.delta, 0.01, 0.014);


        this._currentTarget = lerpVector3(this._currentTarget, this._target.transform.worldPosition, dt);

        this._tempDir.set(0, 0, -1);

        const q = Quaternion.HELP_0;
        q.fromEulerAngles(this.pitch, 0, 0.0);
        this._tempDir.applyQuaternion(q);
        this._tempDir = this._target.transform.worldMatrix.transformVector(this._tempDir, this._tempDir);
        // this._tempDir.normalize();

        Vector3Ex.mulScale(this._tempDir, this.distance, this._tempPos);
        Vector3.add(this._currentTarget, this._tempPos, this._tempPos)

        this._currentCamera = lerpVector3(this._currentCamera, this._tempPos, dt);
        this.camera.transform.lookAt(this._currentCamera, this._target.transform.worldPosition);

    }

}

