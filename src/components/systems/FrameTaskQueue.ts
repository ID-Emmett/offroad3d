import { ComponentBase } from "@orillusion/core";

/**
 * frame task queue 
 */
export class FrameTaskQueue extends ComponentBase {
    private taskQueue: Array<() => void> = [];

    /**
     * 默认每帧执行的最大任务数，初始化时设置，这样能保证执行任务时设置的最大任务数在完成任务后恢复默认值，确保下一次其他组件发送任务时能按照默认的任务数执行
     */
    public defaultMaxTasksPerFrame: number = 50;

    /**
     * 每帧执行的最大任务数，最佳实践-执行任务时设置
     */
    public maxTasksPerFrame: number = this.defaultMaxTasksPerFrame;

    /**
     * 添加单个任务
     */
    public enqueue(task: () => void): void {
        this.enable ||= true;
        this.taskQueue.push(task);
    }

    /**
     * 添加任务队列
     */
    public addTasks(tasks: Array<() => void>, maxTasksPerFrame?: number): void {
        this.enable ||= true;
        if (maxTasksPerFrame) this.maxTasksPerFrame = maxTasksPerFrame;
        this.taskQueue.push(...tasks);
    }

    public onUpdate(): void {
        if (this.taskQueue.length === 0) {
            this.maxTasksPerFrame = this.defaultMaxTasksPerFrame; // reset
            this.enable = false;
            return
        }
        const taskCount = Math.min(this.taskQueue.length, this.maxTasksPerFrame);
        for (let i = 0; i < taskCount; i++) {
            this.taskQueue.shift()?.();
        }
    }

    /**
     * 检查队列是否为空
     */
    public isEmpty(): boolean {
        return this.taskQueue.length === 0;
    }

    /**
     * 清空任务队列
     */
    public clearQueue(): void {
        this.taskQueue = [];
    }
}
