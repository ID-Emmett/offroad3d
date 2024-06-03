// import { Vector3, Quaternion, Object3D } from '@orillusion/core';

// class AntennaBendUtil {
//     static updateAntennaBend(antenna: Object3D, rootPos: Vector3, rootQuat: Quaternion, topPos: Vector3): void {
//         const nodeCount = antenna.numChildren;
//         const height = Vector3.distance(rootPos, topPos);
//         const segmentHeight = height / nodeCount;

//         const helperVec = Vector3.HELP_0;
//         const direction = Vector3.HELP_1;
//         const up = Vector3.Y_AXIS;
//         const rotation = Quaternion.HELP_0;

//         // 更新根节点位置和旋转
//         antenna.localPosition = rootPos;
//         antenna.localQuaternion = rootQuat;

//         for (let i = 0; i <= nodeCount; i++) {
//             const y = i * segmentHeight;
//             const t = i / nodeCount;

//             // 计算局部坐标系中的位置
//             helperVec.lerp(rootPos, topPos, t);
//             helperVec.y = y;

//             // 应用根节点的旋转
//             helperVec.applyQuaternion(rootQuat);
//             antenna.entityChildren[i].transform.localPosition = helperVec;

//             if (i > 0) {
//                 const prevPosition = antenna.entityChildren[i - 1].transform.localPosition;
//                 direction.subVectors(helperVec, prevPosition).normalize();

//                 // 计算旋转四元数
//                 const axis = up.crossProduct(direction, Vector3.HELP_2).normalize();
//                 const angle = Math.acos(up.dotProduct(direction));
//                 rotation.fromAxisAngle(axis, angle);
//                 rotation.multiply(rotation, rootQuat);
//                 antenna.entityChildren[i].transform.localRotQuat = rotation;
//             } else {
//                 antenna.entityChildren[i].transform.localRotQuat = rootQuat;
//             }
//         }
//     }
// }

// // 示例调用
// const rootPos = new Vector3(0, 0, 0); // 车辆的世界坐标
// const rootQuat = new Quaternion().fromEulerAngles(0, 0, 45); // 车辆的旋转四元数
// const topPos = new Vector3(2, 10, 2); // 天线顶部节点的世界坐标

// // 假设antenna是一个包含子对象的3D对象
// const antenna = new Object3D();
// for (let i = 0; i <= 10; i++) {
//     const segment = new Object3D();
//     antenna.addChild(segment);
// }
// antenna.localPosition = rootPos;
// antenna.localQuaternion = rootQuat;

// // 在每一帧中调用此方法
// AntennaBendUtil.updateAntennaBend(antenna, rootPos, rootQuat, topPos);
// console.log('Antenna positions and rotations updated');



// import { Vector3, Quaternion, Object3D } from '@orillusion/core';

export function bend(antenna: Object3D, rootPos: Vector3, rootQuat: Quaternion, topPos: Vector3, bendRate: number = 1.0): void {
    const nodeCount = antenna.numChildren;
    const height = Vector3.distance(rootPos, topPos);
    const segmentHeight = height / nodeCount;

    const helperVec = Vector3.HELP_0;
    const direction = Vector3.HELP_1;
    const up = Vector3.Y_AXIS;
    const rotation = Quaternion.HELP_0;

    // 更新根节点位置和旋转
    antenna.transform.localPosition = rootPos;
    antenna.transform.localRotQuat = rootQuat;

    for (let i = 0; i < nodeCount; i++) {
        const t = i / nodeCount;
        const y = i * segmentHeight;

        // 计算非线性插值的位置
        const curvedT = Math.pow(t, bendRate);
        helperVec.lerp(rootPos, topPos, curvedT);
        helperVec.y = y;




        // 应用根节点的旋转
        helperVec.applyQuaternion(rootQuat);

        antenna.entityChildren[i].transform.localPosition = helperVec;



        if (i > 0) {
            /*             const prevPosition = antenna.entityChildren[i - 1].transform.localPosition;
                        direction.subVectors(helperVec, prevPosition).normalize();
            
                        // 计算旋转四元数
                        const axis = up.crossProduct(direction, Vector3.HELP_2).normalize();
                        const angle = Math.acos(up.dotProduct(direction));
                        rotation.fromAxisAngle(axis, angle);
                        // console.log(rotation.toString());
                        
                        rotation.multiply(rootQuat, rotation);
                        // console.log(rotation.toString());
            
                        antenna.entityChildren[i].transform.localRotQuat = rotation; */


            antenna.entityChildren[i].transform.lookAt(antenna.entityChildren[i].transform.localPosition, antenna.entityChildren[i - 1].transform.localPosition, new Vector3(0, 1, 0))
            // antenna.entityChildren[i].transform.rotationX += 90

        } else {

            // antenna.entityChildren[i].transform.localRotQuat = rootQuat;
            antenna.entityChildren[i].transform.lookAt(antenna.entityChildren[i].transform.localPosition, antenna.transform.localPosition, Vector3.Y_AXIS)
        }
    }
}


// // 示例调用
// const rootPos = new Vector3(0, 0, 0); // 车辆的世界坐标
// const rootQuat = new Quaternion().fromEulerAngles(0, 0, 45); // 车辆的旋转四元数
// const topPos = new Vector3(2, 10, 2); // 天线顶部节点的世界坐标

// // 假设antenna是一个包含子对象的3D对象
// const antenna = new Object3D();
// for (let i = 0; i <= 10; i++) {
//     const segment = new Object3D();
//     antenna.addChild(segment);
// }
// antenna.localPosition = rootPos;
// antenna.localQuaternion = rootQuat;

// // 在每一帧中调用此方法，传入弯曲率
// const bendRate = 0.5; // 弯曲率
// AntennaBendUtil.updateAntennaBend(antenna, rootPos, rootQuat, topPos, bendRate);
// console.log('Antenna positions and rotations updated');


import { Vector3, Quaternion, Object3D } from '@orillusion/core';

export function bend2(antenna: Object3D, rootPos: Vector3, rootQuat: Quaternion, topPos: Vector3, bendRate: number = 1.0): void {
    const nodeCount = antenna.numChildren;
    const height = Vector3.distance(rootPos, topPos);
    const segmentHeight = height / nodeCount;

    const helperVec = Vector3.HELP_0;
    const direction = Vector3.HELP_1;
    const up = Vector3.Y_AXIS;
    const rotation = Quaternion.HELP_0;

    // 更新根节点位置和旋转
    antenna.transform.localPosition = rootPos;
    antenna.transform.localRotQuat = rootQuat;

    for (let i = 0; i < nodeCount; i++) {
        const t = i / nodeCount;
        const y = (i + 0.5) * segmentHeight;  // 中心点在段高的中间位置

        // 计算非线性插值的位置
        const curvedT = Math.pow(t, bendRate);
        helperVec.lerp(rootPos, topPos, curvedT);
        helperVec.y = y;

        // 应用根节点的旋转
        helperVec.applyQuaternion(rootQuat);
        antenna.entityChildren[i].transform.localPosition = helperVec;

        if (i > 0) {
            const prevPosition = antenna.entityChildren[i - 1].transform.localPosition;
            direction.subVectors(helperVec, prevPosition).normalize();

            // 计算旋转四元数
            const axis = up.crossProduct(direction, Vector3.HELP_2).normalize();
            const angle = Math.acos(up.dotProduct(direction));
            rotation.fromAxisAngle(axis, angle);
            rotation.multiply(rootQuat, rotation);
            antenna.entityChildren[i].transform.localRotQuat = rotation;
        } else {
            antenna.entityChildren[i].transform.localRotQuat = rootQuat;
        }
    }

    // 更新最后一个节点的位置
    // antenna.entityChildren[nodeCount - 1].transform.localPosition = topPos;
    // antenna.entityChildren[nodeCount - 1].transform.localRotQuat = rootQuat;
}

export function interpolatePoints(A: Vector3, B: Vector3, N: number, curvature: number): Vector3[] {
    const points: Vector3[] = [];

    // 计算控制点C的位置
    const midPoint = new Vector3(
        (A.x + B.x) / 2,
        (A.y + B.y) / 2,
        (A.z + B.z) / 2
    );

    const direction = Vector3.sub(B, A).normalize();
    const normal = new Vector3(-direction.y, direction.x, 0).normalize();

    const controlPoint = new Vector3(
        midPoint.x + normal.x * curvature * Vector3.distance(A, B) / 2,
        midPoint.y + normal.y * curvature * Vector3.distance(A, B) / 2,
        midPoint.z + normal.z * curvature * Vector3.distance(A, B) / 2
    );

    for (let i = 0; i <= N; i++) {
        const t = i / N;
        const t1 = 1 - t;

        const x = t1 * t1 * A.x + 2 * t1 * t * controlPoint.x + t * t * B.x;
        const y = t1 * t1 * A.y + 2 * t1 * t * controlPoint.y + t * t * B.y;
        const z = t1 * t1 * A.z + 2 * t1 * t * controlPoint.z + t * t * B.z;

        points.push(new Vector3(x, y, z));
    }

    return points;
}