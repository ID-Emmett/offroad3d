import { Engine3D, Vector3, Color, View3D, GetCountInstanceID } from "@orillusion/core";
import { Ammo, PhysicsMathUtil, DebugDrawMode, Physics } from ".";
import { GUIHelp } from "@/utils/debug/GUIHelp";

export type DebugDrawerOptions = Partial<{
    /**
     * 启用状态，默认 false
     */
    enable: boolean;
    /**
     * 线条渲染所在的视图索引，默认 0
     */
    viewIndex: number;
    /**
     * 设置 debug 模式，默认 2 （DrawAabb: 绘制物理对象的包围盒）
     */
    debugDrawMode: DebugDrawMode;
    /**
     * 更新频率，默认每 1 帧更新一次
     */
    updateFreq: number;
    /**
     * 最多渲染的线条，默认 25,000 （超过 32,000 可能会导致图形引擎崩溃 V0.7.2）
     */
    maxLineCount: number;
}>;

export class PhysicsDebugDrawer {
    private debugDrawer: Ammo.DebugDrawer;

    public world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    public debugDrawMode: number;
    public updateFreq: number;
    public viewIndex: number;
    public maxLineCount: number;

    private _enabled: boolean;
    private frameCount: number = 0;

    // Exceeding 32,000 lines may cause engine crash.
    private lineCount: number = 0;
    private lineNameList: string[] = [];
    private readonly _tmpCor: Color = new Color();
    private readonly _tmpVecA: Vector3 = new Vector3();
    private readonly _tmpVecB: Vector3 = new Vector3();

    constructor(world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld, options: DebugDrawerOptions = {}) {
        this.world = world;
        this._enabled = options.enable ?? false;
        this.viewIndex = options.viewIndex ?? 0;
        this.debugDrawMode = options.debugDrawMode ?? DebugDrawMode.DrawAabb;
        this.updateFreq = options.updateFreq || 1;
        this.maxLineCount = options.maxLineCount || 25000;

        this.debugDrawer = new Ammo.DebugDrawer();
        // @ts-ignore
        this.debugDrawer.drawLine = this.drawLine.bind(this);
        this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this);
        this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this);
        this.debugDrawer.draw3dText = this.draw3dText.bind(this);
        this.debugDrawer.setDebugMode = this.setDebugMode.bind(this);
        this.debugDrawer.getDebugMode = this.getDebugMode.bind(this);

        this.world.setDebugDrawer(this.debugDrawer);

        this.initDebugGUI();
    }

    public set enable(val: boolean) {
        this._enabled = val
    }

    public get enable() {
        return this._enabled
    }

    public update(): void {
        if (!this.enable) return;

        if (++this.frameCount % this.updateFreq !== 0) return;

        this.clearLines()

        this.world.debugDrawWorld();

        // console.log(this.lineCount);
        this.lineCount = 0
    }

    private drawLine(from: Ammo.btVector3, to: Ammo.btVector3, color: Ammo.btVector3): void {
        if (!this.enable) return;

        this.lineCount++
        if (this.lineCount > this.maxLineCount) return // console.log(`超出限制,正在渲染第 ${this.lineCount} 条线`);

        const fromVector = Ammo.wrapPointer(from as unknown as number, Ammo.btVector3);
        const toVector = Ammo.wrapPointer(to as unknown as number, Ammo.btVector3);
        const colorVector = Ammo.wrapPointer(color as unknown as number, Ammo.btVector3);

        const lineColor = this._tmpCor.copyFromVector(PhysicsMathUtil.fromBtVector3(colorVector, this._tmpVecA));
        const p0 = PhysicsMathUtil.fromBtVector3(fromVector, this._tmpVecA)
        const p1 = PhysicsMathUtil.fromBtVector3(toVector, this._tmpVecB)

        const name = `AmmoLine_${this.lineCount}`
        this.lineNameList.push(name)
        Engine3D.views[this.viewIndex].graphic3D.drawLines(name, [p0, p1], lineColor);
    }

    private drawContactPoint(pointOnB: Ammo.btVector3, normalOnB: Ammo.btVector3, distance: number, lifeTime: number, color: Ammo.btVector3): void {
        if (!this.enable) return;

        this.lineCount++
        if (this.lineCount > this.maxLineCount) return // console.log(`超出限制,正在渲染第 ${this.lineCount} 条线`);

        // console.log("drawContactPoint");
        const colorVector = Ammo.wrapPointer(color as unknown as number, Ammo.btVector3)
        const pointOnBVector = Ammo.wrapPointer(pointOnB as unknown as number, Ammo.btVector3)
        const normalOnBVector = Ammo.wrapPointer(normalOnB as unknown as number, Ammo.btVector3)

        const lineColor = this._tmpCor.copyFromVector(PhysicsMathUtil.fromBtVector3(colorVector, this._tmpVecA));
        const p0 = PhysicsMathUtil.fromBtVector3(pointOnBVector, this._tmpVecA);
        const normal = PhysicsMathUtil.fromBtVector3(normalOnBVector, this._tmpVecB);
        const p1 = p0.add(normal.multiplyScalar(distance), this._tmpVecB);

        const name = `AmmoContactPoint_${GetCountInstanceID()}`;
        Engine3D.views[this.viewIndex].graphic3D.drawLines(name, [p0, p1], lineColor);
        setTimeout(() => Engine3D.views[this.viewIndex].graphic3D.Clear(name), lifeTime * 1000);
    }

    private reportErrorWarning(warningString: string): void {
        console.warn(warningString);
    }

    private draw3dText(location: Ammo.btVector3, textString: string): void {
        console.log("draw3dText", location, textString);
    }

    public setDebugMode(debugMode: DebugDrawMode): void {
        this.debugDrawMode = debugMode;
    }

    public getDebugMode(): DebugDrawMode {
        return this.debugDrawMode;
    }

    private clearLines(): void {
        let view = Engine3D.views[this.viewIndex]
        this.lineNameList.forEach(name => view.graphic3D.Clear(name))
        this.lineNameList.length = 0;
        // console.log(view.graphic3D.mLineRender.shapes);
        // console.log(view.graphic3D.mLineRender.shapes.size);

        // Engine3D.views[this.viewIndex].graphic3D.ClearAll(); // 清理所有线条
    }

    private initDebugGUI() {
        GUIHelp.addFolder('PhysicsDebugDrawer');
        GUIHelp.add(this, 'enable').listen();
        GUIHelp.addButton('clearLines', () => this.clearLines());

        const debugModeKeys = Object.keys(DebugDrawMode).filter(key => isNaN(Number(key)));
        const guiState = {
            debugMode: debugModeKeys.find(key => DebugDrawMode[key as keyof typeof DebugDrawMode] === this.debugDrawMode)
        };
        GUIHelp.add(guiState, 'debugMode', debugModeKeys).onChange(value => {
            this.debugDrawMode = DebugDrawMode[value as keyof typeof DebugDrawMode];
        });

        GUIHelp.add(this, 'updateFreq', 1, 170, 1);
        GUIHelp.add(this, 'maxLineCount', 100, 33000, 100);

        // 物理步进模拟调试
        GUIHelp.add(Physics, 'maxSubSteps', 1, 10, 1);
        GUIHelp.add(Physics, 'fixedTimeStep', (1 / 170), (1 / 60), 0.00001);
        GUIHelp.open();
    }
}
