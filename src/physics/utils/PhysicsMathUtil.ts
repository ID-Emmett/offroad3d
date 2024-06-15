import { Vector3, Quaternion } from '@orillusion/core';
import { Ammo } from '..';

/**
 * Physics Math Utility
 * 提供向量和四元数的转换功能, 仅作为临时变量
 */
export class PhysicsMathUtil {
    public static tmpVecA: Ammo.btVector3 | null = null;
    public static tmpVecB: Ammo.btVector3 | null = null;
    public static tmpVecC: Ammo.btVector3 | null = null;
    public static tmpVecD: Ammo.btVector3 | null = null;
    public static tmpQuaA: Ammo.btQuaternion | null = null;
    public static tmpQuaB: Ammo.btQuaternion | null = null;

    public static BT_VEC_HELP_0: Ammo.btVector3 | null = null;
    public static BT_VEC_HELP_1: Ammo.btVector3 | null = null;
    public static BT_QUA_HELP_0: Ammo.btQuaternion | null = null;

    /**
     * 初始化 Ammo 后创建预定义的 btVector3 和 btQuaternion 实例，以便复用
     */
    public static init() {
        this.tmpVecA = new Ammo.btVector3(0, 0, 0);
        this.tmpVecB = new Ammo.btVector3(0, 0, 0);
        this.tmpVecC = new Ammo.btVector3(0, 0, 0);
        this.tmpVecD = new Ammo.btVector3(0, 0, 0);
        this.tmpQuaA = new Ammo.btQuaternion(0, 0, 0, 1);
        this.tmpQuaB = new Ammo.btQuaternion(0, 0, 0, 1);

        this.BT_VEC_HELP_0 = new Ammo.btVector3(0, 0, 0);
        this.BT_VEC_HELP_1 = new Ammo.btVector3(0, 0, 0);
        this.BT_QUA_HELP_0 = new Ammo.btQuaternion(0, 0, 0, 1);
    }

    /**
     *  Quaternion to Ammo.Quaternion
     */
    public static toBtQuaternion(qua: Quaternion, btQua?: Ammo.btQuaternion): Ammo.btQuaternion {
        btQua ||= this.tmpQuaA;
        btQua.setValue(qua.x, qua.y, qua.z, qua.w);
        return btQua;
    }

    /**
     *  Vector3 to Ammo.btVector3 
     */
    public static toBtVector3(vec: Vector3, btVec?: Ammo.btVector3): Ammo.btVector3 {
        btVec ||= this.tmpVecA;
        btVec.setValue(vec.x, vec.y, vec.z);
        return btVec;
    }

    /**
     * x, y, z set Ammo.btVector3
     */
    public static setBtVector3(x: number, y: number, z: number, btVec?: Ammo.btVector3): Ammo.btVector3 {
        btVec ||= this.tmpVecA;
        btVec.setValue(x, y, z);
        return btVec;
    }

    /**
     * x, y, z, w set Ammo.btQuaternion
     */
    public static setBtQuaternion(x: number, y: number, z: number, w: number, btQua?: Ammo.btQuaternion): Ammo.btQuaternion {
        btQua ||= this.tmpQuaA;
        btQua.setValue(x, y, z, w);
        return btQua;
    }

    /**
     *  Ammo.btVector3 to Vector3
     */
    public static fromBtVector3(btVec: Ammo.btVector3, vec?: Vector3): Vector3 {
        vec ||= new Vector3();
        vec.set(btVec.x(), btVec.y(), btVec.z());
        return vec;
    }

    /**
     *  Ammo.btQuaternion to Quaternion
     */
    public static fromBtQuaternion(btQua: Ammo.btQuaternion, qua?: Quaternion): Quaternion {
        qua ||= new Quaternion();
        qua.set(btQua.x(), btQua.y(), btQua.z(), btQua.w());
        return qua;
    }

    /**
     *  Sets the given Ammo.btVector3 to (0, 0, 0)
     */
    public static zeroBtVector3(btVec?: Ammo.btVector3): Ammo.btVector3 {
        btVec ||= this.tmpVecA;
        btVec.setValue(0, 0, 0);
        return btVec;
    }

    /**
     *  Sets the given Ammo.btQuaternion to (0, 0, 0, 1)
     */
    public static resetBtQuaternion(btQua?: Ammo.btQuaternion): Ammo.btQuaternion {
        btQua ||= this.tmpQuaA;
        btQua.setValue(0, 0, 0, 1);
        return btQua;
    }
}
