import { Vector3 } from '@orillusion/core';

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