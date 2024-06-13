// ammo-extensions.d.ts

// 导入 Ammo 命名空间。
import { Ammo } from "@orillusion/physics";

// 在该模块中扩展 Ammo 命名空间，这允许向现有的 Ammo 命名空间中添加额外的枚举或定义。
declare module "@orillusion/physics" {
    export namespace Ammo {

        // 扩展 btSliderConstraint 类以包括新的方法。
        export interface btSliderConstraint {
            getLinearPos(): number;
            setTargetLinMotorVelocity(velocity: number): void;
            setPoweredLinMotor(onOff: boolean): void;
            setMaxLinMotorForce(force: number): void;
        }

        export function castObject<T, C extends new (...args: any[]) => T>(
            object: any,
            type: C
        ): InstanceType<C> {
            return object as InstanceType<C>;
        }

        export function wrapPointer<T>(ptr: number, type: new (...args: any[]) => T): T;

        export function addFunction(func: Function): number {
            return 0;
        }


    }
}
