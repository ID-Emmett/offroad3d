import { Engine3D, Camera3D, View3D, Object3D, PointerEvent3D, clamp, Quaternion, Vector3, BoundUtil, Time, Vector3Ex, ComponentBase, lerp, lerpVector3, MathUtil, DEGREES_TO_RADIANS, RADIANS_TO_DEGREES, KeyEvent, KeyCode, Color, kPI } from "@orillusion/core";
import { easeInOutCubic, easeOutCubic, easeOutQuad } from '@/utils/EasingUtils'
import { perlinNoise, createNoiseSeed } from '@/utils/perlin.js';
import { Ammo, Physics } from "@orillusion/physics";
import { CollisionGroup, CollisionMask } from "@/physics";


import { InteractRay } from '@/components/ammoRay/InteractRay';


/**
 * Hovering camera controller
 * @group CameraController 
 */
export class HoverCameraController extends ComponentBase {
  /**
   * camera controlling
   */
  public camera: Camera3D;

  /**
   * The closest distance that the mouse wheel can operate
   */
  public minDistance: number = 0.1;

  /**
   * The farthest distance that the mouse wheel can operate
   */
  public maxDistance: number = 500;

  /**
   * Smoothing coefficient of rolling angle
   */
  public rollSmooth: number = 15.0;

  /**
   * Smoothing coefficient of dragging
   */
  public dragSmooth: number = 20;

  /**
   * Smoothing coefficient of rolling
   */
  public wheelSmooth: number = 10;

  /**
   * Mouse scrolling step coefficient
   */
  public wheelStep: number = 0.002;

  /**
   * Right mouse movement coefficient
   */
  public mouseRightFactor: number = 0.5;

  /**
   * Left mouse movement coefficient
   */
  public mouseLeftFactor: number = 20;

  /**
   * Whether to enable smooth mode
   */
  public smooth: boolean = true;

  /**
   * @internal
   */
  private _wheelStep: number = 0.002;

  private _distance: number = 0;

  /**
   * Distance between camera and target
   */
  public distance: number = 10;
  private _roll: number = 0;

  /**
   * Roll angle around y-axis
   */
  public roll: number = 0;
  private _pitch: number = 0;

  /**
   * Pitch angle around x-axis
   */
  public pitch: number = 0;

  private _currentPos: Object3D;

  /**
   * 未控制鼠标时，间隔一段时间后相机自动过渡到目标后方
   */
  public autoTrackingBack: boolean = false;

  /**
   * 锁定鼠标
   */
  public lockMouse: boolean = false

  /**
   * 相机避障
   */
  public avoidObstacles: boolean = false


  /**
   * @internal
   */
  private _targetPos: Object3D;
  private _flowTarget: Object3D;
  private _flowOffset: Vector3;

  private _mouseLeftDown: boolean = false;
  private _mouseRightDown: boolean = false;
  private _bottomClamp: number = 89.99;
  private _topClamp: number = -89.99;
  // private _bottomClamp: number = 30;
  // private _topClamp: number = -30;
  private _tempDir = new Vector3();
  private _tempPos = new Vector3();



  /**
   * @constructor
   */
  constructor() {
    super();
    this._currentPos = new Object3D();
    this._targetPos = new Object3D();
  }

  /**
   * @internal
   */
  public start(): void {
    this.camera = this.object3D.getOrAddComponent(Camera3D);
    Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
    Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
    Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
    Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_WHEEL, this.onMouseWheel, this);

    Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
    Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);

    this.initCameraRay()
    const canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
    canvas.addEventListener('dblclick', () => {
      canvas.requestPointerLock();
      this.lockMouse = true; // 锁定相机控制

      this.camera.object3D.getComponent(InteractRay).enable = false
    });
  }

  public flowTarget(target?: Object3D, offset: Vector3 = Vector3.ZERO) {
    this._flowTarget = target;
    this._flowOffset ||= new Vector3();
    if (!target) {
      // 当传入null时将停止更新，设计之初用于载具销毁或同组件载具切换时避免相机更新错误
      this._flowTarget = this._targetPos
      return
    }
    this._flowOffset.copyFrom(offset);
  }

  public getFlowTarget(): Object3D {
    return this._flowTarget;
  }

  /**
   * Initialize Camera
   * @param roll  Roll angle around y-axis
   * @param pitch Pitch angle around x-axis
   * @param distance max distance to target
   * @param target coordinates of the target
   */
  public setCamera(roll: number, pitch: number, distance: number, target?: Vector3) {
    this.roll = roll;
    this.pitch = pitch;
    this.distance = distance;
    if (this.maxDistance < distance * 1.5) {
      this.maxDistance = distance * 1.5;
    }
    if (target) {
      this._targetPos.transform.localPosition.copy(target);
    }
  }

  public focusByBounds(obj: Object3D) {
    let bounds = BoundUtil.genMeshBounds(obj);
    this.target = bounds.center;
  }

  /**
   * Set target position
   */
  public set target(target: Vector3) {
    this._targetPos.transform.localPosition.copy(target);
  }

  /**
   * Get target position
   * @return {Vector3}
   */
  public get target(): Vector3 {
    return this._targetPos.transform.localPosition;
  }

  private onMouseWheel(e: PointerEvent3D) {
    if (!this.enable) return;
    this._wheelStep = (this.wheelStep * Vector3Ex.distance(this._currentPos.transform.worldPosition, this.camera.transform.worldPosition)) / 10;
    this.distance -= Engine3D.inputSystem.wheelDelta * this._wheelStep;
    this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
    //console.log("distance", this.transform.view3D.camera.far, this.distance);

    // 相机距离较远时，调整阴影渲染范围与远景深
    if (this.distance > 60) {
      // Engine3D.setting.render.postProcessing.depthOfView.far = this.distance * 5
      // Engine3D.setting.shadow.csmAreaScale = this.distance * 0.0016
    }
  }

  private onMouseDown(e: PointerEvent3D) {
    // if (!this.enable) return;

    switch (e.mouseCode) {
      case 0:
        // this._mouseLeftDown = true;
        // this.camera.object3D.getComponent(InteractRay).enable = false

        break;
      case 1:
        break;
      case 2:
        this._mouseRightDown = true;

        /* 解锁鼠标，禁止相机控制 */
        this.lockMouse = false
        document.exitPointerLock();

        this.camera.object3D.getComponent(InteractRay).enable = true

        break;
      default:
        break;
    }
  }

  private onMouseUp(e: PointerEvent3D) {
    // if (!this._enable) return;
    this._mouseLeftDown = false;
    this._mouseRightDown = false;
    // console.log("mouseup");
  }

  private onKeyUp(e: KeyEvent) {
    this.updateControlState(e.keyCode, false);
  }
  private onKeyDown(e: KeyEvent) {
    this.updateControlState(e.keyCode, true, true);
  }
  private updateControlState(keyCode: number, state: boolean, isKeyDown: boolean = false) {
    switch (keyCode) {
      case KeyCode.Key_O:
        if (isKeyDown) {
          // 自动追踪
          this.autoTrackingBack = !this.autoTrackingBack;
        }
        break;
      case KeyCode.Key_B:
        // 相机面向目标前方
        this.lookAtFront = !this.lookAtFront;
        this.isTransitioning = false

        break;
      case KeyCode.Key_L:
        // 锁定相机跟踪
        if (isKeyDown) {
          this.enableFixedCamera = !this.enableFixedCamera;
          if (this.enableFixedCamera) {
            this._currentTarget.copy(this._targetPos.transform.localPosition)
            this._currentCamera.copy(this.camera.transform.localPosition)
          }
        }
        break;
      case KeyCode.Key_M:
        // 相机位置到水底
        if (isKeyDown) {
          let scene = this.transform.scene3D
          if (!scene.getChildByName('test')) {
            let obj = new Object3D()
            obj.name = 'test'
            scene.addChild(obj)
            // obj.localPosition = new Vector3(976.2945556640625, 40, 948.9457397460938) // 水上
            // obj.localPosition = new Vector3(743.4409790039062, 983.6719360351562, 11475.818359375 - 10000) // 停机坪后面
            // obj.localPosition = new Vector3(761.4771728515625, 979.090576171875, 1429.517822265625) // 停机坪后面
            obj.localPosition = scene.getChildByName('vehicle').localPosition
            // this._flowTarget = obj
            this.slowTracking(obj)
          } else {
            // this._flowTarget = scene.getChildByName('vehicle')
            this.slowTracking(scene.getChildByName('vehicle'))
            scene.getChildByName('test').removeSelf()
          }

        }
        break;
      case KeyCode.Key_KP_7:
        if (isKeyDown) this.camera.fov += 1
        break;
      case KeyCode.Key_KP_8:
        if (isKeyDown) this.camera.fov -= 1
        break;
      case KeyCode.Key_P: // 相机到扑翼机此时的位置
        if (isKeyDown) {
          let obj = new Object3D()
          let flappingWing = Engine3D.views[0].scene.getChildByName('flappingWing')
          obj.localPosition = flappingWing.localPosition.clone()
          this._flowTarget = obj
        }
        break;
      case KeyCode.Key_KP_5:
        if (isKeyDown) this._flowTarget.z += 2
        break;
      case KeyCode.Key_KP_2:
        if (isKeyDown) this._flowTarget.z -= 2
        break;
      case KeyCode.Key_KP_1:
        if (isKeyDown) this._flowTarget.x += 2
        break;
      case KeyCode.Key_KP_3:
        if (isKeyDown) this._flowTarget.x -= 2
        break;
      case KeyCode.Key_KP_4:
        if (isKeyDown) this._flowTarget.y += 1
        break;
      case KeyCode.Key_KP_6:
        if (isKeyDown) this._flowTarget.y -= 1
        break;

      case KeyCode.Key_U:
        if (state) {
          if (Engine3D.frameRate === 60) {
            Engine3D.frameRate = 170
          } else {
            Engine3D.frameRate = 60
          }
        }
        break;

      case KeyCode.Key_K:
        if (isKeyDown) this.avoidObstacles = !this.avoidObstacles;
        break;

    }
  }
  private lastMouseMoveTime: number = 0

  /**
   * @internal
   */
  private onMouseMove(e: PointerEvent3D) {

    if (!this.enable) return;

    if (!this.lockMouse) return

    this.lastMouseMoveTime = Time.time;  // 更新上次鼠标移动的时间

    // 更新目标 pitch 和 roll
    this.roll -= e.movementX * 0.001 * this.mouseLeftFactor;
    this.pitch -= e.movementY * 0.001 * this.mouseLeftFactor;

    // 限制 pitch 的范围
    this.pitch = clamp(this.pitch, this._topClamp, this._bottomClamp);

    this.isTransitioning = false
  }



  //! -------------------------------------------------------------
  /** 开始缓动追踪
   * @param target 相机跟随的目标
   * @param duration 过渡持续时间，默认3000ms
   * @param offset 相机位置偏移，默认0,0,0
   * @param isYAxis 只在y轴进行过渡，默认false
   */
  public slowTracking(targetObj: Object3D, time: number = 3000, offset: Vector3 = Vector3.ZERO, isYAxis: boolean = false) {
    // todo 可以使用方向向量来决定只对某个方向xyz进行过渡，一个或者两个或者三个 ZERO将会三个方向均过渡
    this._startTime = Time.time;
    this._duration = time
    this._startPosition = this.target.clone()
    this.isYAxis = isYAxis
    this.flowTarget(targetObj, offset)
  }

  private _startTime: number = 0; // 开始时间
  private _duration: number = 0; // 持续时间 毫秒
  private _startPosition: Vector3 | null // 初始位置
  private isYAxis: boolean // 仅在Y轴过渡

  private transitionTargetPosition() {

    let timeElapsed = Time.time - this._startTime;
    let progress = Math.min(timeElapsed / this._duration, 1);

    // progress = this.easeOutCubic(progress);
    progress = easeInOutCubic(progress);

    if (!this.isYAxis) {
      this.target = lerpVector3(this._startPosition, this._flowTarget.transform.worldPosition.add(this._flowOffset), progress)
    } else {
      this.target.x = this._flowTarget.transform.worldPosition.add(this._flowOffset).x
      this.target.y = lerp(this._startPosition.y, this._flowTarget.transform.worldPosition.add(this._flowOffset).y, progress)
      this.target.z = this._flowTarget.transform.worldPosition.add(this._flowOffset).z
    }
    // 过渡完毕
    if (timeElapsed >= this._duration) this._startPosition = null

  }


  //! -------------------------------------------------------------

  private isTransitioning: boolean = false;
  private autoTransitionStartTime: number = 0

  private lookAtFront: boolean = true; // 相机面向目标的偏移量，90为后方 -90为前方

  private autoTransition() {
    // 检测鼠标是否静止
    const isMouseIdle = (Time.time - this.lastMouseMoveTime) > 1500;  // 1.5秒无鼠标移动视为静止

    // 当检测到鼠标没有进行控制时，初始化自动过渡的状态
    if (!this.isTransitioning && (isMouseIdle || !this.lookAtFront)) {
      this.isTransitioning = true;
    }

    // 线性过渡
    if (this.isTransitioning) {
      Vector3.HELP_0.copyFrom(this._flowTarget.transform[this.lookAtFront ? 'forward' : 'back']).normalize();
      let targetRollRadians = -(Math.atan2(Vector3.HELP_0.z, Vector3.HELP_0.x) - kPI);

      let lerpFactor = this.lookAtFront ? 0.01 : 0.02
      // let lerpFactor = this.lookAtFront ? 0.02 : 0.02
      const TWO_PI = 2 * kPI;
      let currentRollRadians = (this.roll - 90) * DEGREES_TO_RADIANS

      // 将角度规范化到 [0, 2π] 范围
      const normalizedCurrentRollRadians = (currentRollRadians + TWO_PI) % TWO_PI;
      const normalizedTargetRollRadians = (targetRollRadians + TWO_PI) % TWO_PI;

      // 计算角度差的最短路径
      let angleDifference = normalizedTargetRollRadians - normalizedCurrentRollRadians;
      if (angleDifference > kPI) angleDifference -= TWO_PI;
      else if (angleDifference < -kPI) angleDifference += TWO_PI;

      // 更新当前 roll 角度
      currentRollRadians += angleDifference * lerpFactor;
      this.roll = currentRollRadians * RADIANS_TO_DEGREES + 90;

      // 处理 pitch
      const desiredPitchRadians = -15 * DEGREES_TO_RADIANS;
      let currentPitchRadians = this.pitch * DEGREES_TO_RADIANS

      const pitchDiff = desiredPitchRadians - currentPitchRadians;
      currentPitchRadians += pitchDiff * lerpFactor;
      this.pitch = currentPitchRadians * RADIANS_TO_DEGREES;
    }

    // easeInOut缓速过渡，会有两个问题：
    // 1、相机追踪时会根据过渡时间的不同导致跟踪速度不同，在过渡结束时如果目标仍在旋转会有停顿感。
    // 2、相机视角前后切换时，回退后方视角速度过慢
    /*     if (isMouseIdle && this._flowTarget && !this.isTransitioning || (!this.lookAtFront && !this.isTransitioning)) {
          this.isTransitioning = true;
          this.autoTransitionStartTime = Time.time;
        }
        if (this.isTransitioning) {
          const duration = this.lookAtFront ? 20000 : 2000
          const progress = Math.min((Time.time - this.autoTransitionStartTime) / duration, 1);
          const dynamicLerpFactor = easeInOutCubic(progress);
    
          // 将目标物体的方向向量投影到水平平面上，并计算角度，因为坐标计算问题，此处right方向表示相机从后方观察目标，left表示前方
          Vector3.HELP_0.copyFrom(this._flowTarget.transform[this.lookAtFront ? 'forward' : 'back']).normalize();
          let targetRollRadians = -(Math.atan2(Vector3.HELP_0.z, Vector3.HELP_0.x) - kPI);
    
          const TWO_PI = 2 * kPI;
    
          let currentRollRadians = (this.roll - 90) * DEGREES_TO_RADIANS
    
          // 将角度规范化到 [0, 2π] 范围
          const normalizedCurrentRollRadians = (currentRollRadians + TWO_PI) % TWO_PI;
          const normalizedTargetRollRadians = (targetRollRadians + TWO_PI) % TWO_PI;
    
          // 计算角度差的最短路径
          let angleDifference = normalizedTargetRollRadians - normalizedCurrentRollRadians;
          if (angleDifference > kPI) angleDifference -= TWO_PI;
          else if (angleDifference < -kPI) angleDifference += TWO_PI;
    
          // 更新当前 roll 角度
          currentRollRadians += angleDifference * dynamicLerpFactor;
          this.roll = currentRollRadians * RADIANS_TO_DEGREES + 90;
    
          // 处理 pitch
          const desiredPitchRadians = -15 * DEGREES_TO_RADIANS;
    
          let currentPitchRadians = this.pitch * DEGREES_TO_RADIANS
    
          const pitchDiff = desiredPitchRadians - currentPitchRadians;
          currentPitchRadians += pitchDiff * dynamicLerpFactor;
          this.pitch = currentPitchRadians * RADIANS_TO_DEGREES;
    
          // 检查过渡是否完成
          if (progress >= 1) this.isTransitioning = false;
          // if (progress >= 0.16) this.isTransitioning = false;
        } */

  }

  public enableFixedCamera: boolean = false;
  private _currentTarget: Vector3 = new Vector3(); // 存储插值后的目标位置
  private _currentCamera: Vector3 = new Vector3(); // 存储插值后的相机位置

  private fixedCamera(dt: number) {

    // let dt2 = clamp(Time.delta, 0.01, 0.03);

    this._currentTarget = lerpVector3(this._currentTarget, this._targetPos.transform.localPosition, dt * 5)
    // this._currentTarget = this._targetPos.transform.localPosition

    this._tempDir.set(0, 0, -1);

    // const pitch = 0, distance = 15, roll = -70
    const pitch = 30, distance = 20, roll = 0

    // const q = Quaternion.HELP_0;
    const q = Quaternion._zero;
    // q.fromEulerAngles(pitch, roll, 0.0);
    this._tempDir.applyQuaternion(q);
    this._tempDir = this._flowTarget.transform.worldMatrix.transformVector(this._tempDir, this._tempDir);
    // this._tempDir.normalize();

    Vector3Ex.mulScale(this._tempDir, distance, this._tempPos);
    Vector3.add(this._currentTarget, this._tempPos, this._tempPos)

    this._currentCamera = lerpVector3(this._currentCamera, this._tempPos, dt * 5);
    this._currentCamera.y = this._currentTarget.y + 10; // 相机始终高于目标
    this.camera.transform.lookAt(this._currentCamera, this._currentTarget);

  }

  public onBeforeUpdate(view?: View3D) {

    if (!this.enable) return;
    if (this._flowTarget) {
      if (this._flowTarget.transform.isDestroyed) return this._flowTarget = null;
      Vector3.HELP_0.copyFrom(this._flowTarget.transform.worldPosition);
      Vector3.HELP_0.add(this._flowOffset, Vector3.HELP_0);
      this.target = Vector3.HELP_0;
    }

    let dt = clamp(Time.delta / 1000, 0.0, 0.016);

    // 固定相机
    if (this.enableFixedCamera) return this.fixedCamera(dt)

    // 缓动追踪新的目标
    if (this._startPosition) this.transitionTargetPosition()

    // 围绕目标自动过渡至目标后方或前方
    if (this.autoTrackingBack || !this.lookAtFront) this.autoTransition()

    if (this.smooth) {


      // 相机晃动实验 假设 time 是以秒为单位的全局时间变量，随着每一帧递增
      // time += dt; 其中 dt 是每帧的持续时间
      /* 
      const timeScale = 0.001; // 减慢时间的缩放因子，使噪声变化更平缓
      const amplitudeScaleRoll = 0.1; // 降低晃动幅度的系数，使 roll 方向晃动更微妙
      const amplitudeScalePitch = 0.1; // 降低晃动幅度的系数，使 pitch 方向晃动更微妙

      // 使用缩放的时间和降低的幅度来计算更平缓和微妙的晃动
      const randomRoll = Math.sin(perlinNoise(Time.time * timeScale, 0.5) * kPI) * amplitudeScaleRoll;
      const randomPitch = Math.sin(perlinNoise((Time.time + 100) * timeScale, 0.5) * kPI) * amplitudeScalePitch;


      this._currentPos.x += (this._targetPos.x - this._currentPos.x) * dt * this.dragSmooth + randomRoll;
      this._currentPos.y += (this._targetPos.y - this._currentPos.y) * dt * this.dragSmooth
      this._currentPos.z += (this._targetPos.z - this._currentPos.z) * dt * this.dragSmooth + randomPitch;
       */
      this._currentPos.x += (this._targetPos.x - this._currentPos.x) * dt * this.dragSmooth;

      this._currentPos.y += (this._targetPos.y - this._currentPos.y) * dt * this.dragSmooth * 0.4

      this._currentPos.z += (this._targetPos.z - this._currentPos.z) * dt * this.dragSmooth;

      if (Math.abs(this._distance - this.distance) > 0.1) {
        this._distance += (this.distance - this._distance) * dt * this.wheelSmooth;
      }

      this._roll += (this.roll - this._roll) * dt * this.rollSmooth;
      this._pitch += (this.pitch - this._pitch) * dt * this.rollSmooth;

    } else {
      // 直接使用目标值
      this._currentPos.x = this._targetPos.x;
      // this._currentPos.y = this._targetPos.y;
      this._currentPos.y += (this._targetPos.y - this._currentPos.y) * dt * this.dragSmooth * 0.4
      this._currentPos.z = this._targetPos.z;

      if (Math.abs(this._distance - this.distance) > 0.1) {
        this._distance += (this.distance - this._distance) * dt * this.wheelSmooth;
      }

      this._roll += (this.roll - this._roll) * dt * this.rollSmooth;
      this._pitch += (this.pitch - this._pitch) * dt * this.rollSmooth;
    }

    this._tempDir.set(0, 0, 1);
    let q = Quaternion.HELP_0;
    q.fromEulerAngles(this._pitch, this._roll, 0.0);
    this._tempDir.applyQuaternion(q);

    // 计算新的相机位置
    Vector3Ex.mulScale(this._tempDir, this._distance, this._tempPos);
    this._tempPos.add(this._currentPos.transform.localPosition, this._tempPos);

    // ?----------------------物理射线start----------------------

    // this.castCameraPosRay(this.camera.transform.worldPosition, this._tempPos)
    // this.castCameraSightRay(this._tempPos, this._currentPos.transform.localPosition)
    this.avoidObstacles && this.castCameraSightRay(this._tempPos, this.target)

    // ?----------------------物理射线end------------------------

    // 更新相机朝向
    this.camera.transform.lookAt(this._tempPos, this._currentPos.transform.localPosition, this._tempDir.set(0, 1, 0));
    // this.camera.transform.lookAt(this._tempPos, this.target, this._tempDir.set(0, 1, 0));
  }


  private _tmpVecA = new Vector3()
  private _tmpVecB = new Vector3()

  private rayFrom: Ammo.btVector3
  private rayTo: Ammo.btVector3
  private cameraRay: Ammo.ClosestRayResultCallback;

  private initCameraRay() {
    this.rayFrom = new Ammo.btVector3()
    this.rayTo = new Ammo.btVector3()
    this.cameraRay = new Ammo.ClosestRayResultCallback(this.rayFrom, this.rayTo);

    this.cameraRay.set_m_collisionFilterGroup(CollisionGroup.CAMERA); // 定义射线或物体属于哪个碰撞组
    this.cameraRay.set_m_collisionFilterMask(CollisionGroup.TERRAIN); // 定义射线或物体可以与哪些碰撞组相碰撞
  }

  private resetRayCallback(callback: Ammo.ClosestRayResultCallback) {
    callback.set_m_closestHitFraction(1); // 重置最近击中分数为最大
    callback.set_m_collisionObject(null); // 清除碰撞对象
  }

  // 相机视线射线检测
  private castCameraSightRay(cameraPos: Vector3, targetPos: Vector3, targetOffsetY: number = 2, cameraOffsetY: number = 2) {
    this.rayFrom.setValue(targetPos.x, targetPos.y + targetOffsetY, targetPos.z);
    this.rayTo.setValue(cameraPos.x, cameraPos.y - cameraOffsetY, cameraPos.z);

    this.cameraRay.set_m_rayFromWorld(this.rayFrom)
    this.cameraRay.set_m_rayToWorld(this.rayTo)

    Physics.world.rayTest(this.rayFrom, this.rayTo, this.cameraRay);

    // Engine3D.views[0].graphic3D.Clear('cameraSightRay');

    if (this.cameraRay.hasHit()) {
      const hitPoint = this.cameraRay.get_m_hitPointWorld();
      // 调整相机位置逻辑
      // console.log('视线发生碰撞的点', hitPoint.x(), hitPoint.y(), hitPoint.z());

      this._tempPos.set(hitPoint.x(), hitPoint.y() + cameraOffsetY, hitPoint.z());


      // Engine3D.views[0].graphic3D.drawLines('cameraSightRay', [this._tempPos, this._tmpVecA.set(targetPos.x, targetPos.y + targetOffsetY, targetPos.z)],);

      // console.log(this.pitch);
      // this.pitch = 2

      // let fov = this.camera.fov
      // this.camera.fov *= 1.001; // 缩小视场

      // if (this.camera.fov > 50) {
      //   this.camera.fov = 50; // 缩小视场

      // }

    } else {
      // this.camera.fov *= 0.999
      // // console.log(this.camera.fov);

      // if (this.camera.fov < 45) {
      //   this.camera.fov = 45
      // }
    }



    this.resetRayCallback(this.cameraRay)

  }

  // 相机移动射线检测
  private castCameraPosRay(cameraPos: Vector3, targetPos: Vector3) {
    this.rayFrom.setValue(cameraPos.x, cameraPos.y, cameraPos.z);
    this.rayTo.setValue(targetPos.x, targetPos.y, targetPos.z);

    // let rayCallback = new Ammo.ClosestRayResultCallback(this.rayFrom, this.rayTo);
    this.cameraRay.set_m_rayFromWorld(this.rayFrom)
    this.cameraRay.set_m_rayToWorld(this.rayTo)
    Physics.world.rayTest(this.rayFrom, this.rayTo, this.cameraRay);

    if (this.cameraRay.hasHit()) {
      const hitPoint = this.cameraRay.get_m_hitPointWorld();
      // 调整相机位置逻辑
      console.log('位置发生碰撞的点', hitPoint, hitPoint.x(), hitPoint.y(), hitPoint.z());

      let newPos = new Vector3(hitPoint.x(), hitPoint.y(), hitPoint.z())

      let direction = Vector3.sub(targetPos, newPos, this._tmpVecA).normalize();

      let val = direction.scaleToRef(2, this._tmpVecB).add(newPos, this._tmpVecB)
      this._tempPos = val;

    }

    this.resetRayCallback(this.cameraRay)

    // Ammo.destroy(rayCallback);
  }


  /**
   * @internal
   */
  public destroy(force?: boolean) {
    Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
    Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
    Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
    Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_WHEEL, this.onMouseWheel, this);
    Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
    Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);
    super.destroy(force);
    this.camera = null;
    this._flowTarget = null;
  }
}
