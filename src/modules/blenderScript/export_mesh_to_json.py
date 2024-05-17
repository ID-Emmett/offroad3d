# 导出模型数据 

import bpy
import os
import json

def export_mesh_to_json(obj):
    if obj.type != 'MESH':
        print("请选择一个网格对象")
        return

    mesh = obj.data

    # 确保所有面为三角形
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.quads_convert_to_tris()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 创建顶点列表
    vertices = []
    for vertex in mesh.vertices:
        vertices.extend([vertex.co.x, vertex.co.z, -vertex.co.y])  # 按照 x, y, z 顺序导出

    # 创建索引列表
    indices = []
    for polygon in mesh.polygons:
        if len(polygon.vertices) == 3:
            indices.extend([polygon.vertices[0], polygon.vertices[1], polygon.vertices[2]])
        else:
            print(f"警告：检测到非三角面 {obj.name}，当前脚本仅支持三角面。")

    # 获取文件路径
    filepath = bpy.data.filepath
    if not filepath:
        print("请确保已保存当前的 Blender 文件或导入的模型文件。")
        return

    directory = os.path.dirname(filepath)
    filename = f"{obj.name}_model_data.json"
    file_path = os.path.join(directory, filename)

    # 创建 JSON 数据
    data = {
        "vertices": vertices,
        "indices": indices
    }

    # 将数据写入 JSON 文件
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)

    print(f"顶点和索引数据已导出到: {file_path}")

# 获取当前活动对象
obj = bpy.context.active_object
export_mesh_to_json(obj)