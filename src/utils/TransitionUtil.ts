
type TransitionType = 'easeInOutCubic' | 'easeOutCubic' | 'easeOutQuad';

/**
 * 缓入缓出
 */
export const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
/**
 * 先快后慢
 */
export const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
}
/**
 * 先慢后快
 */
export const easeOutQuad = (t: number): number => {
    return 1 - (1 - t) * (1 - t);
}

export class TransitionUtil {

    /**
     * 进行渐进式无缝过渡动画。
     * @param durations 每个阶段的持续时间数组。
     * @param totalDuration 所有阶段的总持续时间。
     * @param currentFrameTime 当前帧的时间。
     * @param offsetTime 当前元素的偏移时间。
     * @param stageCallbacks 每个阶段的回调函数数组，用于定义每个阶段的动画效果，参数：'progress: number, progressLinear?: number'。
     * @param transitionType 每个阶段使用的过渡类型，默认 'linear'。
     */
    public static progressiveSeamlessTransition(
        durations: number[],
        totalDuration: number,
        currentFrameTime: number,
        offsetTime: number,
        stageCallbacks: ((progress: number, progressLinear?: number) => void)[],
        transitionType: TransitionType[] = []
    ) {
        let timeElapsed = currentFrameTime - offsetTime;

        if (timeElapsed >= totalDuration) return;

        // 确保键名与 transitionType 中的字符串值完全匹配
        const easingFunctions = { easeInOutCubic, easeOutCubic, easeOutQuad };

        let stage = 0, accumulatedDuration = 0;
        while (stage < durations.length && timeElapsed > accumulatedDuration + durations[stage]) {
            accumulatedDuration += durations[stage++];
        }

        let stageTime = Math.max(0, timeElapsed - accumulatedDuration);
        let progressLinear = Math.min(stageTime / durations[stage], 1);

        // 使用字符串键来获取正确的缓动函数
        const easingFunction = easingFunctions[transitionType[stage]];

        // 使用缓动函数调整进度值
        let progress = easingFunction ? easingFunction(progressLinear) : progressLinear;

        // 调用对应阶段的回调函数
        if (stage < stageCallbacks.length) {
            stageCallbacks[stage](progress, progressLinear);
        }
    }
}
