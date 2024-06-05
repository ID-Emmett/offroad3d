# Offroad3D

**Offroad3D** 是一个基于 0rillusion 引擎开发的3D沙盒越野驾驶模拟游戏

## 游戏特性

- **沙盒编辑**：玩家可以在游戏中自由地编辑地图环境，包括植被、建筑和地形。
- **载具越野**：
- **地形崎岖**：利用物理引擎（Ammo.js）和灰度图生成技术，创造出各种复杂和多变的地形，提供真实的越野驾驶挑战。
- **图形引擎技术**：基于 0rillusion 引擎和 WebGPU API，提供高性能的3D图形显示。

## 技术栈

- **0rillusion**：一个基于 WebGPU 的现代3D图形引擎，专为提供高效的图形渲染而设计。
- **Ammo.js**：Bullet Physics 引擎的 Emscripten 端口，用于模拟复杂的物理交互和碰撞。

## 分支说明

- `main`：这是稳定版本的分支，推荐从这个分支拉取代码。
- `dev`：这是开发分支，使用了 npm link 链接本地依赖，用于开发和调试功能。

## 快速开始

要在本地运行 **Offroad3D**，请按照以下步骤操作：

1. **克隆仓库**
    ```bash
    git clone https://github.com/ID-Emmett/offroad3d.git
    cd offroad3d
    ```

2. **安装依赖**
    ```bash
    npm install
    ```

3. **运行**
    ```bash
    npm dev
    ```
