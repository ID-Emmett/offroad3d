import { Engine3D, Camera3D, View3D, Object3D, PointerEvent3D, clamp, Quaternion, Vector3, BoundUtil, Time, Vector3Ex, ComponentBase, lerp, lerpVector3, MathUtil, DEGREES_TO_RADIANS, RADIANS_TO_DEGREES, KeyEvent, KeyCode, Color, kPI, MeshRenderer, SphereGeometry, LitMaterial, ColliderComponent, SphereColliderShape, BoxGeometry, CylinderGeometry } from "@orillusion/core";
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";
import { AmmoRigidBody, ShapeTypes, CollisionFlags, ActivationState, CollisionGroup, CollisionMask } from "@/physics";


/**
 * Ammo Interact Ray
 */
export class InteractRay extends ComponentBase {

  private _mouseLeftDown: boolean = false;
  private _mouseRightDown: boolean = false;
  /**
   * 锁定鼠标
   */
  public lockMouse: boolean = false

  private camera: Camera3D

  private lastTime: number
  private lastX: number = -1
  private lastY: number = -1
  private onDraw: boolean = false
  public drawInterval: number = 10

  private diff: Vector3 = new Vector3()
  private btDiff: Ammo.btVector3 = new Ammo.btVector3

  constructor() {
    super();
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

    this.createReferencePoint()

    // test
    // this.oneBox()

  }

  private onMouseWheel(e: PointerEvent3D) {
    if (!this.enable) return;

  }


  private onMouseDown(e: PointerEvent3D) {
    // if (!this.enable) return;

    switch (e.mouseCode) {
      case 0:
        this._mouseLeftDown = true

        e.stopImmediatePropagation()
        this.lastTime = Date.now()

        Engine3D.views[0].graphic3D.Clear('interactRay')
        break;
      case 1:
        break;
      case 2:
        this._mouseRightDown = true

        if (this.intersection.equals(Vector3.ZERO)) return
        this._addBox(this.intersection)

        break;
      default:
        break;
    }
  }

  private onMouseMove(e: PointerEvent3D) {

    if (!this.enable) return;

    e.stopImmediatePropagation()
    const now = Date.now();
    if (now - this.lastTime > this.drawInterval) {
      this.lastTime = now;

      this.ray(e.mouseX, e.mouseY)

      // 按住左键进行移动时，控制物理对象跟随鼠标指针
      if (this._mouseLeftDown) {

        this.bodyRb.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
        this.btIntersection.setY(this.btIntersection.y())
        Physics.TEMP_TRANSFORM.setOrigin(this.btIntersection);
        this.bodyRb.getMotionState().setWorldTransform(Physics.TEMP_TRANSFORM);

        !this.bodyRb.isActive() && this.bodyRb.activate(true)
      }
    }
  }

  private onMouseUp(e: PointerEvent3D) {
    if (!this._enable) return;
    switch (e.mouseCode) {
      case 0:
        this._mouseLeftDown = false;
        this.cameraRay.set_m_collisionFilterMask(CollisionMask.DEFAULT_MASK); // 重设掩码，射线可获取所有碰撞体
        this.intersection.set(0, 0, 0)

        this.bodyRb.setCollisionFlags(this.bodyRb.getCollisionFlags() & ~CollisionFlags.KINEMATIC_OBJECT);  // 清除Kinematic标志
        if ((this.bodyRb.getCollisionFlags() & CollisionFlags.STATIC_OBJECT) !== 0) {
          console.log('静态刚体');
          this.bodyRb.forceActivationState(ActivationState.ISLAND_SLEEPING)
        } else {
          console.log('动态刚体');
          this.bodyRb.activate(); // 确保释放鼠标时刚体是激活的
        }
        this.bodyRb = null;

        break;
      case 1:
        break;
      case 2:
        this._mouseRightDown = false;
        break;
      default:
        break;
    }
  }

  private onKeyUp(e: KeyEvent) {
    this.updateControlState(e.keyCode, false);
  }
  private onKeyDown(e: KeyEvent) {
    this.updateControlState(e.keyCode, true, true);

  }
  private updateControlState(keyCode: number, state: boolean, isKeyDown: boolean = false) {
    switch (keyCode) {
      case KeyCode.Key_T:

        break;
      case KeyCode.Key_B:

        break;

    }
  }




  private ray(x: number, y: number) {
    const point = this.camera.screenPointToWorld(x, y, 1);

    let cameraPos = this.camera.object3D.localPosition;

    this.castCameraSightRay(cameraPos, point)

  }

  public onBeforeUpdate(view?: View3D) {

    if (!this.enable) return;


    // this.castCameraSightRay()

  }


  private intersection: Vector3 = new Vector3()
  private btIntersection: Ammo.btVector3 = new Ammo.btVector3

  private _tmpVecA = new Vector3()
  private _tmpVecB = new Vector3()

  private rayFrom: Ammo.btVector3
  private rayTo: Ammo.btVector3
  private cameraRay: Ammo.ClosestRayResultCallback;

  private initCameraRay(collisionFilterMask?: number) {
    this.rayFrom = new Ammo.btVector3()
    this.rayTo = new Ammo.btVector3()
    this.cameraRay = new Ammo.ClosestRayResultCallback(this.rayFrom, this.rayTo);

    this.cameraRay.set_m_collisionFilterGroup(CollisionGroup.CAMERA); // 定义射线或物体属于哪个碰撞组
    this.cameraRay.set_m_collisionFilterMask(collisionFilterMask || CollisionMask.DEFAULT_MASK); // 定义射线或物体可以与哪些碰撞组相碰撞
  }

  private resetRayCallback(callback: Ammo.ClosestRayResultCallback) {
    callback.set_m_closestHitFraction(1); // 重置最近击中分数为最大
    callback.set_m_collisionObject(null); // 清除碰撞对象
  }

  private bodyRb: Ammo.btRigidBody

  // 相机视线射线检测
  private castCameraSightRay(cameraPos: Vector3, targetPos: Vector3) {

    this.rayFrom.setValue(cameraPos.x, cameraPos.y, cameraPos.z);
    this.rayTo.setValue(targetPos.x, targetPos.y, targetPos.z);

    this.cameraRay.set_m_rayFromWorld(this.rayFrom)
    this.cameraRay.set_m_rayToWorld(this.rayTo)

    Physics.world.rayTest(this.rayFrom, this.rayTo, this.cameraRay);

    if (this.cameraRay.hasHit()) {
      // console.log(this.cameraRay.get_m_collisionObject().getWorldTransform().getOrigin().y());

      // console.log(this.cameraRay.get_m_collisionObject().getUserIndex());

      if (this._mouseLeftDown && this.cameraRay.get_m_collisionObject().getUserIndex() !== 2) {

        this.cameraRay.set_m_collisionFilterMask(CollisionGroup.TERRAIN); // 定义射线或物体可以与哪些碰撞组相碰撞
        console.log('选中物体');

        this.bodyRb = Ammo.castObject(this.cameraRay.get_m_collisionObject(), Ammo.btRigidBody);

        this.bodyRb.setCollisionFlags(this.bodyRb.getCollisionFlags() | CollisionFlags.KINEMATIC_OBJECT); // 保留原有标志，增加动力学标志

      }

      // 交点
      const hitPoint = this.cameraRay.get_m_hitPointWorld();
      let hitPointWorld = this.intersection.set(hitPoint.x(), hitPoint.y(), hitPoint.z());


      this.btIntersection = hitPoint

      // 法线向量
      let hitNormal = this.cameraRay.get_m_hitNormalWorld();
      let hitNormalWorld = Vector3.HELP_0.set(hitNormal.x(), hitNormal.y(), hitNormal.z());
      hitNormalWorld = hitNormalWorld.normalize();  // 确保目标法向量是单位向量

      // 计算旋转轴和角度
      let currentForward = Vector3.UP;  // 对象朝向
      let rotationAxis = currentForward.crossProduct(hitNormalWorld, Vector3.HELP_1).normalize();  // 计算旋转轴
      let angleRadians = Math.acos(currentForward.dotProduct(hitNormalWorld));  // 计算旋转角度

      // 计算四元数旋转
      let quaternion = Quaternion.HELP_0;
      quaternion.fromAxisAngle(rotationAxis, angleRadians * 180 / Math.PI); // 转换为度
      this.referencePoint.transform.localRotQuat = quaternion;

      // 计算底部接触点的位置
      // 此处2.5表示几何体质心与底部的距离，height / 2
      this.referencePoint.transform.localPosition = hitNormalWorld.scaleBy(2.5).add(hitPointWorld, Vector3.HELP_2); // 根据法向量乘以距离并与原位置相加，即可得到朝向法向量偏移的新位置


      // 相机射向指针的参考线
      Vector3.HELP_3.copyFrom(cameraPos).y -= 1
      this.transform.view3D.graphic3D.Clear('interactRay')
      this.transform.view3D.graphic3D.drawLines('interactRay', [hitPointWorld, Vector3.HELP_3],);

    }

    this.resetRayCallback(this.cameraRay)

  }


  private referencePoint: Object3D
  private createReferencePoint() {
    const obj = new Object3D()
    let mr = obj.addComponent(MeshRenderer)
    // mr.geometry = new BoxGeometry(5, 5, 5)
    mr.geometry = new CylinderGeometry(0.01, 2, 5, 32);
    let mat = new LitMaterial()
    mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
    mr.materials = [mat, mat, mat];

    this.referencePoint = obj
    Engine3D.views[0].scene.addChild(obj)
  }

  private testBox: Object3D
  private oneBox() {
    const obj = new Object3D()
    let mr = obj.addComponent(MeshRenderer)
    mr.geometry = new SphereGeometry(5, 32, 32)
    let mat = new LitMaterial()
    mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
    mr.material = mat;

    this.testBox = obj
    Engine3D.views[0].scene.addChild(obj)
  }

  private _addBox(pos: Vector3): void {
    const obj = new Object3D()
    let mr = obj.addComponent(MeshRenderer)
    // mr.geometry = new SphereGeometry(5, 32, 32); // 球
    mr.geometry = new BoxGeometry(5, 5, 5) // 盒子
    // mr.geometry = new CylinderGeometry(15, 15, 20, 32, 32); // 圆柱
    let mat = new LitMaterial()
    mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0)
    // mr.materials = [mat, mat, mat];
    mr.material = mat;
    obj.x = pos.x
    obj.y = pos.y + 5
    obj.z = pos.z
    let rigidbody = obj.addComponent(AmmoRigidBody)
    rigidbody.shape = ShapeTypes.btBoxShape
    rigidbody.mass = 100
    rigidbody.restitution = 1
    rigidbody.addInitedFunction(() => {
      rigidbody.btRigidbody.setUserIndex(1000)
    }, this)

    rigidbody.size = new Vector3(5, 5, 5);
    // rigidbody.radius = 5
    // rigidbody.height = 20


    // let rigidbody = obj.addComponent(Rigidbody)
    // rigidbody.mass = 100
    // let collider = obj.addComponent(ColliderComponent)
    // collider.shape = new SphereColliderShape(5)

    this.transform.scene3D.addChild(obj)
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
  }
}
