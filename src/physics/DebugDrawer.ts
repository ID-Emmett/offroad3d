import { Ammo, Physics } from '.';
import { Object3D, BoundUtil, Vector3, Quaternion, Object3DUtil, MeshRenderer, VertexAttributeName, PlaneGeometry } from '@orillusion/core';

// 1: DBG_NoDebug
// 2: DBG_DrawWireframe
// 4: DBG_DrawAabb
// 8: DBG_DrawFeaturesText
// 16: DBG_DrawContactPoints
// 32: DBG_NoDeactivation
// 64: DBG_NoHelpText
// 128: DBG_DrawText
// 256: DBG_ProfileTimings
// 512: DBG_EnableSatComparison
// 1024: DBG_DisableBulletLCP
// 2048: DBG_EnableCCD
// 4096: DBG_DrawConstraints
// 8192: DBG_DrawConstraintLimits
// 16384: DBG_FastWireframe

// 定义符合 btIDebugDraw 的接口
interface DebugDrawer extends Ammo.btIDebugDraw {
    drawLine(from: Ammo.btVector3, to: Ammo.btVector3, color: Ammo.btVector3): void;
    drawContactPoint(pointOnB: Ammo.btVector3, normalOnB: Ammo.btVector3, distance: number, lifeTime: number, color: Ammo.btVector3): void;
    reportErrorWarning(warningString: string): void;
    draw3dText(location: Ammo.btVector3, textString: string): void;
    setDebugMode(debugMode: number): void;
    getDebugMode(): number;
}
export class SimpleDebugDrawer implements DebugDrawer {
    private debugMode: number = 0;

    drawLine(from: Ammo.btVector3, to: Ammo.btVector3, color: Ammo.btVector3) {        
        const fromVec = { x: from.x(), y: from.y(), z: from.z() };
        const toVec = { x: to.x(), y: to.y(), z: to.z() };
        console.log(`Drawing line from (${fromVec.x}, ${fromVec.y}, ${fromVec.z}) to (${toVec.x}, ${toVec.y}, ${toVec.z})`);
    }

    drawContactPoint(pointOnB: Ammo.btVector3, normalOnB: Ammo.btVector3, distance: number, lifeTime: number, color: Ammo.btVector3) {
        console.log(`Contact at (${pointOnB.x()}, ${pointOnB.y()}, ${pointOnB.z()}) with normal (${normalOnB.x()}, ${normalOnB.y()}, ${normalOnB.z()})`);
    }

    reportErrorWarning(warningString: string) {
        console.warn(warningString);
    }

    draw3dText(location: Ammo.btVector3, textString: string) {
        console.log(`3D Text: ${textString} at (${location.x()}, ${location.y()}, ${location.z()})`);
    }

    setDebugMode(debugMode: number) {
        this.debugMode = debugMode;
        console.log('set debugMode');
        
    }

    getDebugMode() {
        return this.debugMode;
    }
}
