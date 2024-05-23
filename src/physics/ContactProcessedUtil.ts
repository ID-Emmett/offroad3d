import { Ammo } from '.';

type Callback = (cp: Ammo.btManifoldPoint, bodyA: Ammo.btRigidBody, bodyB: Ammo.btRigidBody) => void;

/**
 * 碰撞处理回调工具
 */
export class ContactProcessedUtil {
    private static callbacks: Map<string, Callback> = new Map()
    /**
     * 注册碰撞处理回调
     */
    public static registerCollisionHandlingCallback(callbackName: string, callback: Callback): void {
        ContactProcessedUtil.callbacks.set(callbackName, callback);
    }
    /**
     * 注销碰撞处理回调
     */
    public static unregisterCollisionHandlingCallback(callbackName: string): void {
        ContactProcessedUtil.callbacks.delete(callbackName)
    }
    /**
     * 回调机制实时响应碰撞事件
     */
    public static contactProcessedCallback(cpPtr: number, colObj0WrapPtr: number, colObj1WrapPtr: number) {
        // 打印原始指针值
        // console.log('Raw pointers:', cpPtr, colObj0WrapPtr, colObj1WrapPtr);

        // 直接将指针转换为btRigidBody对象
        const bodyA = Ammo.wrapPointer(colObj0WrapPtr, Ammo.btRigidBody);
        const bodyB = Ammo.wrapPointer(colObj1WrapPtr, Ammo.btRigidBody);

        // console.log('Converted bodies:', bodyA, bodyB);

        if (bodyA && bodyB) {
            const cp = Ammo.wrapPointer(cpPtr, Ammo.btManifoldPoint);
            ContactProcessedUtil.callbacks.forEach((callback) => {
                callback(cp, bodyA, bodyB);
            });
        }

        return 0; // 确保返回0
    };
} 