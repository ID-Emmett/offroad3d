import { Object3D } from '@orillusion/core';
import { Ammo } from "@orillusion/physics";

class RigidBodyMapping {
    private graphicToPhysicsMap: Map<Object3D, Ammo.btRigidBody> = new Map();
    private physicsToGraphicMap: Map<Ammo.btRigidBody, Object3D> = new Map();

    /**
     * 获取管理的全部刚体对象映射组
     * @returns 刚体映射组
     */
    public get getAllPhysicsObjectMap(): Map<Ammo.btRigidBody, Object3D> {
        return this.physicsToGraphicMap
    }

    /**
     * 获取管理的全部图形对象映射组
     * @returns 图形映射组
     */
    public get getAllGraphicObjectMap(): Map<Object3D, Ammo.btRigidBody> {
        return this.graphicToPhysicsMap
    }
    /**
     * 添加图形对象和刚体对象的映射
     * @param graphic 图形对象
     * @param physics 刚体对象
     */
    public addMapping(graphic: Object3D, physics: Ammo.btRigidBody) {
        this.graphicToPhysicsMap.set(graphic, physics);
        this.physicsToGraphicMap.set(physics, graphic);
    }

    /**
     * 根据图形对象获取刚体对象
     * @param graphic 图形对象
     * @returns 刚体对象或undefined
     */
    public getPhysicsObject(graphic: Object3D): Ammo.btRigidBody | undefined {
        return this.graphicToPhysicsMap.get(graphic);
    }

    /**
     * 根据刚体对象获取图形对象
     * @param physics 刚体对象
     * @returns 图形对象或undefined
     */
    public getGraphicObject(physics: Ammo.btRigidBody): Object3D | undefined {
        return this.physicsToGraphicMap.get(physics);
    }

    /**
     * 根据图形对象删除映射
     * @param graphic 图形对象
     */
    public removeMappingByGraphic(graphic: Object3D) {
        const physics = this.graphicToPhysicsMap.get(graphic);
        if (physics) {
            this.physicsToGraphicMap.delete(physics);
        }
        this.graphicToPhysicsMap.delete(graphic);
    }

    /**
     * 根据刚体对象删除映射
     * @param physics 刚体对象
     */
    public removeMappingByPhysics(physics: Ammo.btRigidBody) {
        const graphic = this.physicsToGraphicMap.get(physics);
        if (graphic) {
            this.graphicToPhysicsMap.delete(graphic);
        }
        this.physicsToGraphicMap.delete(physics);
    }
}
/**
 * 物理刚体与图形对象映射实例
 */
export const rigidBodyMapping = new RigidBodyMapping();
