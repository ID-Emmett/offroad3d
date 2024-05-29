/**
 * Ammo 碰撞标志
 */
export enum CollisionFlags {
    /**
     * 用于静态对象，这些对象不移动，但可以被其他对象碰撞。
     */
    STATIC_OBJECT = 1,
    /**
     * 用于运动学对象。这些对象不受物理影响（如重力或碰撞），但可以通过编程方式移动，并影响它们碰撞的动态对象。
     */
    KINEMATIC_OBJECT = 2,
    /**
     * 设置此标志的对象不参与碰撞响应，但仍会触发碰撞事件。
     */
    NO_CONTACT_RESPONSE = 4,
    /**
     * 此标志表示对象将使用自定义材料交互回调。
     */
    CUSTOM_MATERIAL_CALLBACK = 8,
    /**
     * 特别标记角色控制器使用的碰撞对象。这通常用于优化游戏中的角色碰撞处理。
     */
    CHARACTER_OBJECT = 16,
    DISABLE_VISUALIZE_OBJECT = 32, // 禁止在物理调试视图中显示此对象。
    DISABLE_SPU_COLLISION_PROCESSING = 64, // 禁止在辅助处理单元上处理此对象的碰撞，用于优化特定硬件平台上的性能。
    HAS_CONTACT_STIFFNESS_DAMPING = 128, // 为该对象启用自定义接触刚度和阻尼设置。这允许在处理碰撞时调整物理响应的刚度和阻尼，用于模拟更复杂的物理交互效果。
    HAS_CUSTOM_DEBUG_RENDERING_COLOR = 256, // 允许为该对象在物理调试视图中指定自定义的渲染颜色。这有助于在进行物理调试时，通过颜色区分和识别特定的物理对象。
    HAS_FRICTION_ANCHOR = 512, // 为该对象启用摩擦锚。摩擦锚能够提高对象在接触面上的摩擦效果，通常用于车辆的轮胎以增强其在地面上的抓地力，减少滑动。
    HAS_COLLISION_SOUND_TRIGGER = 1024, // 使对象在发生碰撞时触发声音效果。这个标志可以用于为特定碰撞配置声音反馈，增加游戏或模拟环境的真实感和沉浸感。
}

/**
 * Ammo 激活状态
 */
export enum ActivationState {
    /**
     * 对象处于活动状态，将由模拟处理。
     */
    ACTIVE_TAG = 1,
    /**
     * 对象处于非活动状态，但如果其他活动对象与之碰撞，可能会被激活。
     */
    ISLAND_SLEEPING = 2,
    /**
     * 物体希望在下一个模拟步骤中被停用。如果没有进一步的交互，物体将进入休眠状态。
     */
    WANTS_DEACTIVATION = 3,
    /**
     * 禁用自动休眠。此状态下的物体即使静止也会持续被模拟。
     */
    DISABLE_DEACTIVATION = 4,
    /**
     * 该物体不会被物理引擎模拟，无论是动态还是碰撞，但可以通过编程方式移动或操作。
     */
    DISABLE_SIMULATION = 5,
}

/**
 * Ammo 碰撞形状类型
 */
export enum ShapeTypes {
    /**
     * 箱形，用于创建立方体或长方体形状。
     */
    btBoxShape,

    /**
     * 球形，代表一个完美的球体。
     */
    btSphereShape,

    /**
     * 胶囊形，结合了圆柱体和半球端部，适用于角色物理。
     */
    btCapsuleShape,

    /**
     * 圆柱形，基于圆柱的几何形状。
     */
    btCylinderShape,

    /**
     * 锥形，通过底部半径和高度定义。
     */
    btConeShape,

    /**
     * 多球体形状，可以用多个球体来定义一个复杂的形状。
     */
    btMultiSphereShape,

    /**
     * 代表无限大的平面，常用于创建地面或障碍物。
     */
    btStaticPlaneShape,

    /**
     * 允许将多个碰撞体合并成一个复杂的碰撞体。
     */
    btCompoundShape,

    /**
     * 凸包形状，通过点集定义，覆盖点集的最小凸形状。
     */
    btConvexHullShape,

    /**
     * 用于创建具有复杂内部空间的静态物体，例如地形。
     */
    btConcaveShape,

    /**
     * 利用三角网格和边界体积层次（BVH）结构，主要用于静态三角网格。
     */
    btBvhTriangleMeshShape,

    /**
     * 高度场地形形状，用于创建大规模的地形场景。
     */
    btHeightfieldTerrainShape,

    /**
     * 通过三角网格定义的凸形状，不如btConvexHullShape常用。
     */
    btConvexTriangleMeshShape,

    /**
     * 基于 GIMPACT 算法，可以用于复杂的三角网格碰撞检测，包括动态物体的交互。
     */
    btGImpactMeshShape,

    /**
     * 用于创建柔软的、可以变形的物体，如布料或绳子。
     */
    btSoftBody,

    /**
     * 一个空的形状，可以用作占位符或特殊逻辑处理。
     */
    btEmptyShape,

    /**
     * 闵可夫斯基和形状，用于计算两个其他形状的几何求和。
     */
    btMinkowskiSumShape
}


/**
 * Ammo 碰撞组
 */
export enum CollisionGroup {
    /**
     * 默认动态刚体
     */
    DEFAULT1 = 1 << 0,

    /**
     * 默认静态刚体
     */
    DEFAULT2 = 1 << 1,

    /**
     * 地形
     */
    TERRAIN = 1 << 2,

    /**
     * 树木
     */
    TREE = 1 << 3,

    /**
     * 建筑
     */
    BUILDING = 1 << 4,

    /**
     * 载具
     */
    VEHICLE = 1 << 5,

    /**
     * 动态物体1
     */
    DYNAMIC1 = 1 << 6,

    /**
     * 动态物体2
     */
    DYNAMIC2 = 1 << 7,

    /**
     * 相机射线
     */
    CAMERA = 1 << 8,

    /**
     * 零
     */
    ZERO = 0
}


/**
 * Ammo 碰撞掩码
 */
export enum CollisionMask {
    /**
     * 默认掩码，允许与所有组碰撞
     */
    DEFAULT_MASK = 0xFFFF,

    /**
     * 车辆的碰撞掩码，允许与所有组碰撞
     */
    VEHICLE_MASK = CollisionMask.DEFAULT_MASK,

    /**
     * 静态物体的碰撞掩码，允许与地形、树木、建筑碰撞
     */
    STATIC_MASK = CollisionGroup.TERRAIN | CollisionGroup.TREE | CollisionGroup.BUILDING,

    /**
     * 动态物体的碰撞掩码，允许与车辆、动态物体1和2碰撞
     */
    DYNAMIC_MASK = CollisionGroup.VEHICLE | CollisionGroup.DYNAMIC1 | CollisionGroup.DYNAMIC2,

    /**
     * 零，不与任何物体碰撞
     */
    ZERO_MASK = 0
}

/**
 * Ammo 复合子形状类型
 */
export type ChildShapes = {
    shape?: ShapeTypes;
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number, w: number };
    size: { width: number; height: number; depth: number };
};

/**
 * Ammo 平面的各个角
 */
export type CornerType = 'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom' | 'left' | 'right' | 'top' | 'bottom' | 'center';

/**
 * Ammo 调试模式
 */
export enum DebugDrawMode {
    /**
     * 不显示调试信息
     */
    NoDebug = 0,
    /**
     * 绘制物理对象的线框
     */
    DrawWireframe = 1,
    /**
     * 绘制物理对象的包围盒（AABB）
     */
    DrawAabb = 2,
    /**
     * 绘制特征点文本
     */
    DrawFeaturesText = 4,
    /**
     * 绘制接触点
     */
    DrawContactPoints = 8,
    /**
     * 禁用去激活
     */
    NoDeactivation = 16,
    /**
     * 不显示帮助文本
     */
    NoHelpText = 32,
    /**
     * 绘制文本信息
     */
    DrawText = 64,
    /**
     * 显示性能计时信息
     */
    ProfileTimings = 128,
    /**
     * 启用 SAT 比较
     */
    EnableSatComparison = 256,
    /**
     * 禁用 Bullet 的 LCP 算法
     */
    DisableBulletLCP = 512,
    /**
     * 启用连续碰撞检测
     */
    EnableCCD = 1024,
    /**
     * 绘制约束
     */
    DrawConstraints = 2048,
    /**
     * 绘制约束限制
     */
    DrawConstraintLimits = 4096,
    /**
     * 绘制快速剔除代理的 AABB
     */
    FastWireframe = 8192,
    /**
     * 绘制动态 AABB 树
     */
    DrawAabbDynamic = 16384,
    /**
     * 绘制软体物理
     */
    DrawSoftBodies = 32768,
}

