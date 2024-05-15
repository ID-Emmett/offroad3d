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

        
        // }

    }
}
