import { Engine3D, PostProcessingComponent, GlobalFog, ComponentBase, DepthOfFieldPost, BloomPost } from '@orillusion/core'
import { GUIUtil } from '@/utils/GUIUtil'

/**
 * 后处理特效管理与配置
 */
export class PostProcessingSetup extends ComponentBase {

    async start() {

        let post = this.transform.scene3D.addComponent(PostProcessingComponent)

        this.initPost(post)
    }

    private initPost(post: PostProcessingComponent) {

        let fog = post.addPost(GlobalFog)
        fog.enable = false
        /**
         * config...
         */
        GUIUtil.renderGlobalFog(fog, false)

        let depthOfField = post.addPost(DepthOfFieldPost)
        depthOfField.enable = false
        /**
         * config...
         */
        GUIUtil.renderDepthOfField(depthOfField, false)

        let bloom = post.addPost(BloomPost)
        bloom.enable = false
        /**
         * config...
         */
        GUIUtil.renderBloom(bloom, false)
        
    }

}
