// ammo-extensions.d.ts

// 从该模块中导入 Ammo 命名空间。
import { Ammo } from "@orillusion/physics";

// 在该模块中扩展 Ammo 命名空间，这允许向现有的 Ammo 命名空间中添加额外的枚举或定义。
declare module "@orillusion/physics" {
    export namespace Ammo {
        export function castObject<T extends btCollisionObject, C extends new (...args: any[]) => T>(
            object: T,
            type: C
        ): InstanceType<C> {
            return object as InstanceType<C>;
        }

        // export enum CollisionFlags {
        //   /**
        //    * 用于静态对象，这些对象不移动，但可以被其他对象碰撞。
        //    */
        //   STATIC_OBJECT = 1,
        //   /**
        //    * 用于运动学对象。这些对象不受物理影响（如重力或碰撞），但可以通过编程方式移动，并影响它们碰撞的动态对象。
        //    */
        //   KINEMATIC_OBJECT = 2,
        //   /**
        //    * 设置此标志的对象不参与碰撞响应，但仍会触发碰撞事件。
        //    */
        //   NO_CONTACT_RESPONSE = 4,
        //   /**
        //    * 此标志表示对象将使用自定义材料交互回调。
        //    */
        //   CUSTOM_MATERIAL_CALLBACK = 8,
        //   /**
        //    * 特别标记角色控制器使用的碰撞对象。这通常用于优化游戏中的角色碰撞处理。
        //    */
        //   CHARACTER_OBJECT = 16,
        //   DISABLE_VISUALIZE_OBJECT = 32, // 禁止在物理调试视图中显示此对象。
        //   DISABLE_SPU_COLLISION_PROCESSING = 64, // 禁止在辅助处理单元上处理此对象的碰撞，用于优化特定硬件平台上的性能。
        //   HAS_CONTACT_STIFFNESS_DAMPING = 128, // 为该对象启用自定义接触刚度和阻尼设置。这允许在处理碰撞时调整物理响应的刚度和阻尼，用于模拟更复杂的物理交互效果。
        //   HAS_CUSTOM_DEBUG_RENDERING_COLOR = 256, // 允许为该对象在物理调试视图中指定自定义的渲染颜色。这有助于在进行物理调试时，通过颜色区分和识别特定的物理对象。
        //   HAS_FRICTION_ANCHOR = 512, // 为该对象启用摩擦锚。摩擦锚能够提高对象在接触面上的摩擦效果，通常用于车辆的轮胎以增强其在地面上的抓地力，减少滑动。
        //   HAS_COLLISION_SOUND_TRIGGER = 1024, // 使对象在发生碰撞时触发声音效果。这个标志可以用于为特定碰撞配置声音反馈，增加游戏或模拟环境的真实感和沉浸感。
        // }

        // export enum ActivationState {
        //   /**
        //    * 对象处于活动状态，将由模拟处理。
        //    */
        //   ACTIVE_TAG = 1,
        //   /**
        //    * 对象处于非活动状态，但如果其他活动对象与之碰撞，可能会被激活。
        //    */
        //   ISLAND_SLEEPING = 2,
        //   /**
        //    * 物体希望在下一个模拟步骤中被停用。如果没有进一步的交互，物体将进入休眠状态。
        //    */
        //   WANTS_DEACTIVATION = 3,
        //   /**
        //    * 禁用自动休眠。此状态下的物体即使静止也会持续被模拟。
        //    */
        //   DISABLE_DEACTIVATION = 4,
        //   /**
        //    * 该物体不会被物理引擎模拟，无论是动态还是碰撞，但可以通过编程方式移动或操作。
        //    */
        //   DISABLE_SIMULATION = 5,
        // }

    }
}
