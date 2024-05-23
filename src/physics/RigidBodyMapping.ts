import { Object3D, BiMap } from '@orillusion/core';
import { Ammo } from ".";

export class RigidBodyMapping {
    // BiMap 双向映射
    private mapping: BiMap<Object3D, Ammo.btRigidBody> = new BiMap();

    /**
     * 获取管理的全部刚体对象映射组
     * @returns 刚体映射组
     */
    public get getAllPhysicsObjectMap(): Map<Ammo.btRigidBody, Object3D> {
        return this.mapping["negtive"];
    }

    /**
     * 获取管理的全部图形对象映射组
     * @returns 图形映射组
     */
    public get getAllGraphicObjectMap(): Map<Object3D, Ammo.btRigidBody> {
        return this.mapping;
    }

    /**
     * 添加图形对象和刚体对象的映射
     * @param graphic 图形对象
     * @param physics 刚体对象
     */
    public addMapping(graphic: Object3D, physics: Ammo.btRigidBody) {
        this.mapping.set(graphic, physics);
    }

    /**
     * 根据图形对象获取刚体对象
     * @param graphic 图形对象
     * @returns 刚体对象或undefined
     */
    public getPhysicsObject(graphic: Object3D): Ammo.btRigidBody | undefined {
        return this.mapping.get(graphic);
    }

    /**
     * 根据刚体对象获取图形对象
     * @param physics 刚体对象
     * @returns 图形对象或undefined
     */
    public getGraphicObject(physics: Ammo.btRigidBody): Object3D | undefined {
        return this.mapping.getKey(physics);
    }

    /**
     * 根据图形对象删除映射
     * @param graphic 图形对象
     */
    public removeMappingByGraphic(graphic: Object3D) {
        this.mapping.delete(graphic);
    }

    /**
     * 根据刚体对象删除映射
     * @param physics 刚体对象
     */
    public removeMappingByPhysics(physics: Ammo.btRigidBody) {
        this.mapping.deleteValue(physics);
    }
}
