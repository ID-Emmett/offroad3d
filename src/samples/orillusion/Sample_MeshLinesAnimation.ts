import { Engine3D, Scene3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, View3D, Color, Vector3, SphereGeometry, CylinderGeometry, MathUtil, PostProcessingComponent, BloomPost, LitMaterial, Time, clamp, AtmosphericComponent } from '@orillusion/core';
import * as dat from 'dat.gui';
import { Stats } from '@orillusion/stats';

/**
 * 线条动画示例
 * 由多个点构成的线，每两个点为一条线段，线段由一个球体与圆柱体构成，可动态控制线条长度
 *
 * @export
 * @class Sample_MeshLinesAnimation
 */
class Sample_MeshLinesAnimation {
    private scene: Scene3D
    private pointGeometry: SphereGeometry
    private lineGeometry: CylinderGeometry
    private material: LitMaterial
    private points: Vector3[] = []

    public lineSmooth: number = 20
    public lineWidth: number = 0.2
    public speed: number = 10
    public lineColor: Color = new Color(0.9, 1, 0)

    async run() {
        
        // init engine
        await Engine3D.init({ renderLoop: () => this.loop() });
        
        // create new Scene
        let scene = new Scene3D();
        scene.addComponent(Stats);
        this.scene = scene;

        this.scene.addComponent(AtmosphericComponent);
        
        // init camera3D
        let camera = CameraUtil.createCamera3D(null, scene);
        camera.perspective(60, Engine3D.aspect, 0.1, 2000.0);

        // add a basic camera controller
        let hoverControl = camera.object3D.addComponent(HoverCameraController);
        hoverControl.setCamera(198, -80, 30);
        hoverControl.flowTarget(new Object3D()); // always point towards the origin

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        // init point and line geometries
        this.pointGeometry = new SphereGeometry(0.5, 32, 32);
        this.lineGeometry = new CylinderGeometry(0.5, 0.5, 1, 32, 32);

        // configure line material with color and emissivity
        this.material = new LitMaterial();
        this.material.baseColor = this.lineColor;
        this.material.emissiveColor = this.lineColor;
        this.material.emissiveIntensity = 1.2;

        this.initLines();

        // start render
        Engine3D.startRenderView(view);

        this.initGui();

        // add bloom post-processing
        let postProcessing = this.scene.getOrAddComponent(PostProcessingComponent);
        let bloomPost = postProcessing.addPost(BloomPost);
    }

    initLines() {

        // 闭合五角星
        let basePoints = [
            new Vector3(15, 0, 0),
            new Vector3(-12.13525491562421, 0, 8.816778784387099),
            new Vector3(4.635254915624208, 2, -14.265847744427305),
            new Vector3(4.635254915624212, 2, 14.265847744427303),
            new Vector3(-12.135254915624213, 0, -8.816778784387095),
            new Vector3(15, 0, 0),
        ];

        this.points = this.generateCurve(basePoints, this.lineSmooth);

        // 计算每段线的距离与总距离
        let lineSegmentDistances = [], totalDistance = 0
        for (let i = 1; i < this.points.length; i++) {
            let distance = Vector3.distance(this.points[i - 1], this.points[i]);
            lineSegmentDistances.push(distance);
            totalDistance += distance;
        }

        this.lineSegmentDistances = lineSegmentDistances;
        this.totalDistance = totalDistance;
        this.selectedDistance = totalDistance;
    }

    public generateCurve(points: Vector3[], samples: number = 10, tension: number = 0.5): Vector3[] {
        const len = points.length;
        const closed = points[0].equals(points[len - 1]); // 起点和终点相同则视为闭合曲线
        let curveData: Vector3[] = [];
        let u = new Vector3(), v = new Vector3();
        for (let i = 0; i < len - 1; ++i) {
            const p0 = closed ? points[i - 1 < 0 ? len - 2 : i - 1] : points[Math.max(i - 1, 0)]
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, closed ? (i + 2) % len + 1 : len - 1)];

            p2.subtract(p0, u).multiplyScalar(tension / 3.0).add(p1, u);
            p1.subtract(p3, v).multiplyScalar(tension / 3.0).add(p2, v);

            curveData.push(p1);
            curveData.push(...this.calculateBezierCurve(p1, u, v, p2, samples));
        }
        curveData.push(points[len - 1]);
        return curveData;
    }

    protected calculateBezierCurve(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, samples: number): Vector3[] {
        var result = new Array<Vector3>(samples);
        for (let i = 0; i < samples; ++i) {
            let t = (i + 1) / (samples + 1.0);
            let _1t = 1 - t;
            let v0 = p0.mul(_1t * _1t * _1t);
            let v1 = p1.mul(3 * t * _1t * _1t);
            let v2 = p2.mul(3 * t * t * _1t);
            let v3 = p3.mul(t * t * t);
            result[i] = v0.add(v1, this._tmpVecA).add(v2, this._tmpVecA).add(v3);
        }
        return result;
    }

    initGui() {
        // debug GUI
        let gui = new dat.GUI();
        let f = gui.addFolder('Orillusion');
        f.add(this, 'lineSmooth', 0, 50, 1).onFinishChange(() => {
            clearLines();
            setTimeout(() => this.initLines(), 60);
        });
        f.add(this, 'lineWidth', 0.1, 2, 0.1);
        f.add(this, 'speed', 0.1, 100, 0.1);
        f.add(this, 'progress', 0, 100, 0.01).listen().onChange(v => {
            this.updateProgress(); // 舍弃gui内部进行的赋值结果 重新计算进度
            this.selectedDistance = this.totalDistance * (v / 100);
        });
        f.add({ tips: 'adjust line length freely' }, 'tips').name('drag progress');

        f.add({ 'extendLine': () => this.selectedDistance = this.totalDistance }, 'extendLine');
        f.add({ 'shortenLine': () => this.selectedDistance = 0 }, 'shortenLine');
        f.add({ 'stop': () => this.selectedDistance = this.currentDistance }, 'stop');

        f.add({ 'clearLine': () => clearLines() }, 'clearLine');

        f.addColor({ lineColor: Object.values(this.lineColor).map((v, i) => i === 3 ? v : v * 255) }, 'lineColor').onChange(v => {
            this.lineColor.rgba = v;
            this.material.emissiveColor = new Color(v[0] / 255, v[1] / 255, v[2] / 255, 1);
            this.material.baseColor = this.lineColor;
        });

        f.open()

        // clear lines and reset lines states
        const clearLines = () => {
            this.index = this.currentDistance = this.selectedDistance = this.progress = 0;
            this.currentScaleY = this.initialScaleY;
            setTimeout(() => {
                this.path.forEach(segment => segment.forEach(obj => this.scene.removeChild(obj)));
                this.path.length = 0;
            }, 50);
        }
    }

    private index: number = 0
    private path: Object3D[][] = []
    private lineSegmentDistances: number[] = []
    readonly initialScaleY: number = 0.001
    private currentScaleY: number = 0.001
    private _tmpVecA: Vector3 = new Vector3()
    private _tmpVecB: Vector3 = new Vector3()
    private totalDistance: number = 0

    public progress: number = 0
    public currentDistance: number = 0

    private _selectedDistance: number = 0

    /**
     * range [0, totalDistance]
     */
    public set selectedDistance(value: number) {
        this._selectedDistance = clamp(value, 0.0, this.totalDistance);
    }
    public get selectedDistance(): number {
        return this._selectedDistance;
    }

    loop() {
        if (this.currentDistance === this.selectedDistance) return;

        let speed = clamp(Time.delta / 1000, 0.0, 0.016) * this.speed;

        this.currentDistance < this.selectedDistance ?
            this.handleLineCreationOrUpdate(speed) :
            this.shortenLine(speed)
    }

    handleLineCreationOrUpdate(speed: number) {
        if (this.path[this.index] && this.currentScaleY !== 0) {
            this.extendLine(speed);
            return;
        }

        if (!this.path[this.index]) {
            this.drawLine();
            return;
        }

        // 处于边界情况下线段初始化
        this.currentScaleY = (this.currentDistance === 0 && this.currentScaleY === 0) ?
            this.initialScaleY :
            this.lineSegmentDistances[this.index]

        this.updateSegmentVisibilityAndScale(true);
    }

    drawLine() {
        let p0 = this.points[this.index];
        let p1 = this.points[this.index + 1];
        let direction = Vector3.sub(p1, p0, this._tmpVecA).normalize();
        let linePosition = direction.scaleToRef(this.currentScaleY / 2, this._tmpVecB).add(p0, this._tmpVecB);

        // 创建线条元素，包含一个球体`Point`和一个圆柱体`Line`
        this.createPoint(p0);
        this.createLine(linePosition, direction);
        if (this.index === 0) this.createPoint(p0); // 起始段将增加一个球体作为线头
    }

    createPoint(pos: Vector3) {
        let point = new Object3D();
        let mr = point.addComponent(MeshRenderer);
        mr.geometry = this.pointGeometry;
        mr.material = this.material;
        point.scaleX = point.scaleY = point.scaleZ = this.lineWidth;
        point.localPosition = pos;

        this.scene.addChild(point);
        this.path[this.index] = this.path[this.index] ?? [];
        this.path[this.index].push(point);
    }

    createLine(pos: Vector3, dir: Vector3) {
        let line = new Object3D();
        let mr = line.addComponent(MeshRenderer);
        mr.geometry = this.lineGeometry;
        mr.materials = [this.material, this.material, this.material];
        // mr.material = this.material;
        line.scaleX = line.scaleZ = this.lineWidth;
        line.scaleY = this.currentScaleY;
        line.localPosition = pos;

        const rot = MathUtil.fromToRotation(Vector3.Y_AXIS, dir);
        // make sure the rotation is valid
        if (!Number.isNaN(rot.x) && !Number.isNaN(rot.y) && !Number.isNaN(rot.z)) {
            line.transform.localRotQuat = rot;
        }

        this.scene.addChild(line);
        this.path[this.index] = this.path[this.index] ?? [];
        this.path[this.index].push(line);
    }

    extendLine(speed: number) {
        const distance = this.lineSegmentDistances[this.index];
        let newScaleY = this.currentScaleY + speed;
        this.updateLineLength(Math.min(newScaleY, distance));

        if ((newScaleY >= distance) && (this.index < this.points.length - 2)) {
            this.index++;
            if (!this.path[this.index]) {
                // 创建新索引对应的线，为下一帧的计算做准备
                const next_distance = this.lineSegmentDistances[this.index];
                this.currentScaleY = Math.min(newScaleY - distance, next_distance);
                this.drawLine();
            } else {
                this.updateSegmentVisibilityAndScale(true);
                this.currentScaleY = this.initialScaleY;
            }
        }

        if (this.currentDistance >= this.selectedDistance) {
            this.currentDistance = this.selectedDistance; // 完成更新
        }
    }

    shortenLine(speed: number) {
        const line = this.path[this.index][1];
        let newScaleY = Math.max(0, line.scaleY - speed);
        this.updateLineLength(newScaleY);

        // 当前线段已缩短到最小
        if (newScaleY === 0) {
            this.updateSegmentVisibilityAndScale(false);
            if (this.index !== 0) this.index--;
        }

        if (this.currentDistance <= this.selectedDistance) {
            this.currentDistance = this.selectedDistance; // 完成更新
        }
    }

    updateSegmentVisibilityAndScale(enable: boolean) {
        this.path[this.index].forEach((obj, i) => {
            obj.transform.enable = enable;  // 使用enable控制显隐，避免频繁增删线段对象
            if (enable && obj.scaleX !== this.lineWidth) {
                obj.scaleX = obj.scaleZ = this.lineWidth;
                if (i !== 1) obj.scaleY = this.lineWidth; // 只有球体需要更新scaleY
            }
        });
    }

    updateLineLength(newScaleY: number) {
        // 更新进度
        this.currentScaleY = newScaleY;
        this.updateProgress();

        let p0 = this.points[this.index];
        let p1 = this.points[this.index + 1];
        let direction = Vector3.sub(p1, p0, this._tmpVecA).normalize();

        // 更新线段的点和线元素
        const [point, line] = this.path[this.index];
        line.scaleY = newScaleY;
        line.localPosition = direction.scaleToRef(newScaleY / 2, this._tmpVecB).add(p0, this._tmpVecB);
        point.localPosition = direction.scaleToRef(newScaleY, this._tmpVecB).add(p0, this._tmpVecB);
    }

    updateProgress() {
        // 计算已完成的线段总距离
        let completedDistance = 0;
        for (let i = 0; i < this.index; i++) {
            completedDistance += this.lineSegmentDistances[i];
        }
        this.currentDistance = completedDistance + this.currentScaleY;

        // 进度百分比
        this.progress = this.currentDistance / this.totalDistance * 100;
    }

}

new Sample_MeshLinesAnimation().run()