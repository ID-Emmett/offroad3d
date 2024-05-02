import type { BitmapTexture2D } from '@orillusion/core';
import { TerrainGeometry } from '@orillusion/effect';

export class TerrainUtil {

    /**
     * 双线性插值，计算四个顶点确定的平面内的点的高度。
     * @param h00 左下角顶点的高度
     * @param h01 右下角顶点的高度
     * @param h10 左上角顶点的高度
     * @param h11 右上角顶点的高度
     * @param tx 目标点在X轴的插值比例
     * @param tz 目标点在Z轴的插值比例
     * @returns 计算得到的插值高度
     */
    public static bilinearInterpolation(h00: number, h01: number, h10: number, h11: number, tx: number, tz: number): number {
        return h00 + tx * (h01 - h00) + tz * ((h10 + tx * (h11 - h10)) - (h00 + tx * (h01 - h00)));
    }

    /**
     * 根据给定的坐标和地形数据，计算并返回地形上该点的高度。
     * @param x 指定点的X坐标
     * @param z 指定点的Z坐标
     * @param terrainGeometry 地形的几何数据
     * @param terrainVertexs 可选的地形顶点数据
     * @returns 地形上该点的高度
     */
    public static calculateHeightAtPoint(x: number, z: number, terrainGeometry: TerrainGeometry, terrainVertexs?: Float32Array): number {

        const { width, height, segmentW, segmentH } = terrainGeometry;
        const scaleX = segmentW / width;
        const scaleZ = segmentH / height;

        const gridX = (x + width / 2) * scaleX;
        const gridZ = (z + height / 2) * scaleZ;

        const x0 = Math.min(Math.floor(gridX), segmentW - 2);
        const z0 = Math.min(Math.floor(gridZ), segmentH - 2);
        const x1 = Math.min(x0 + 1, segmentW - 2);
        const z1 = Math.min(z0 + 1, segmentH - 2);
        const tx = gridX - x0;
        const tz = gridZ - z0;

        let h00, h01, h10, h11;
        if (terrainVertexs) {
            h00 = terrainVertexs[3 * (z0 * (segmentW + 1) + x0) + 1];
            h01 = terrainVertexs[3 * (z0 * (segmentW + 1) + x1) + 1];
            h10 = terrainVertexs[3 * (z1 * (segmentW + 1) + x0) + 1];
            h11 = terrainVertexs[3 * (z1 * (segmentW + 1) + x1) + 1];
        } else {
            const heightData = terrainGeometry.heightData;
            h00 = heightData[z0][x0];
            h01 = heightData[z0][x1];
            h10 = heightData[z1][x0];
            h11 = heightData[z1][x1];
        }

        return this.bilinearInterpolation(h00, h01, h10, h11, tx, tz);
    }

    /**
     * 对一个坐标数组中的每一个点计算地形高度，并更新数组中的Y坐标。
     * @param points 包含x, y, z坐标的Float32Array数组
     * @param terrainGeometry 地形的几何数据
     * @param terrainVertexs 可选的地形顶点数据
     * @returns 更新Y坐标后的点数组
     */
    public static calculateHeightsForPoints(points: Float32Array, terrainGeometry: TerrainGeometry, terrainVertexs?: Float32Array): Float32Array {
        const { width, height, segmentW, segmentH } = terrainGeometry;
        const scaleX = segmentW / width;
        const scaleZ = segmentH / height;

        for (let i = 0; i < points.length; i += 3) {
            const x = points[i];
            const z = points[i + 2];
            const gridX = (x + width / 2) * scaleX;
            const gridZ = (z + height / 2) * scaleZ;

            const x0 = Math.min(Math.floor(gridX), segmentW - 2);
            const z0 = Math.min(Math.floor(gridZ), segmentH - 2);
            const x1 = Math.min(x0 + 1, segmentW - 2);
            const z1 = Math.min(z0 + 1, segmentH - 2);
            const tx = gridX - x0;
            const tz = gridZ - z0;

            let h00, h01, h10, h11;
            if (terrainVertexs) {
                h00 = terrainVertexs[3 * (z0 * (segmentW + 1) + x0) + 1];
                h01 = terrainVertexs[3 * (z0 * (segmentW + 1) + x1) + 1];
                h10 = terrainVertexs[3 * (z1 * (segmentW + 1) + x0) + 1];
                h11 = terrainVertexs[3 * (z1 * (segmentW + 1) + x1) + 1];
            } else {
                const heightData = terrainGeometry.heightData;
                h00 = heightData[z0][x0];
                h01 = heightData[z0][x1];
                h10 = heightData[z1][x0];
                h11 = heightData[z1][x1];
            }
            points[i + 1] = this.bilinearInterpolation(h00, h01, h10, h11, tx, tz);

        }
        return points;
    }

    /**
     * 根据灰度图纹理数据，计算并更新一个坐标数组中的点的高度。与TerrainGeometry类相同的顶点计算方式
     * @param points 包含x, y, z坐标的Float32Array数组
     * @param texture 表示高度数据的灰度图纹理
     * @param width 地形的宽度，需要确保与地形数据一致
     * @param height 地形的高度，需要确保与地形数据一致
     * @param maxHeight 地形的最大高度，需要确保与地形数据一致
     * @returns 更新高度后的点数组
     */
    public static calculateHeightFromTexture(points: Float32Array, texture: BitmapTexture2D, width: number, height: number, maxHeight: number): Float32Array {

        const canvas = new OffscreenCanvas(texture.width, texture.height);
        const context = canvas.getContext('2d');
        context.drawImage(texture.sourceImageData, 0, 0);
        const imageData = context.getImageData(0, 0, texture.width, texture.height);

        const scaleX = texture.width / width;
        const scaleZ = texture.height / height;

        for (let i = 0; i < points.length; i += 3) {
            const x = points[i];
            const z = points[i + 2];

            // 世界坐标到纹理坐标的映射
            const px = (x + width / 2) * scaleX;
            const pz = (z + height / 2) * scaleZ;

            const x0 = Math.floor(px);
            const z0 = Math.floor(pz);
            const x1 = Math.min(x0 + 1, texture.width - 1);
            const z1 = Math.min(z0 + 1, texture.height - 1);

            const tx = px - x0;
            const tz = pz - z0;

            const index00 = (z0 * texture.width + x0) * 4;
            const index01 = (z0 * texture.width + x1) * 4;
            const index10 = (z1 * texture.width + x0) * 4;
            const index11 = (z1 * texture.width + x1) * 4;

            const h00 = imageData.data[index00];
            const h01 = imageData.data[index01];
            const h10 = imageData.data[index10];
            const h11 = imageData.data[index11];

            const h = this.bilinearInterpolation(h00, h01, h10, h11, tx, tz);

            // 缩放高度值
            points[i + 1] = h / 255 * maxHeight;
        }
        return points;
    }
}
