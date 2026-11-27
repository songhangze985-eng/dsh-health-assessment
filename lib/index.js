/**
 * 宿主半侧入口：接线、配置、生命周期。
 *
 * 一个插件行里做四件事：注册工具、注册面板路由、启动追问检查、把抽取需要的
 * 宿主能力（默认模型 / llm / 附件）以最小接口交给业务层。
 *
 * 依赖原则：只有 `tools` 是硬依赖。`webServer`、`llm`、`attachments`、`agents`
 * 都按「有就用、没有就降级」处理——这样同一份包在 headless 组合里也能加载。
 *
 * @module dsh-health-assessment
 */
import Schema from '@deepseek-ai/schemastery';
import { registerApi } from './host/api.js';
import { FollowUpManager } from './host/followup.js';
import { PetBridge } from './host/pet.js';
import { HealthService } from './host/service.js';
import { HealthStore, defaultRoot } from './host/store.js';
import { registerTools } from './host/tools.js';
/** 插件行 id，必须与 `cordis.patch.yml` 里的 `id` 完全一致。 */
export const name = 'dsh-health-assessment';
/** 只硬依赖工具注册表；其余按可用性降级。 */
export const inject = ['tools'];
/** 配置 schema：给设置页与校验共用。 */
export const Config = Schema.object({
    memoryRoot: Schema.string().default('').description('记忆库目录，留空使用 ~/.dsh/health-assessment'),
    petId: Schema.string().default('main').description('dsh-pet 的宠物 id'),
});
/** 把宿主里零散的服务收敛成业务层要的抽取能力。 */
function makeExtractionHost(ctx) {
    const anyCtx = ctx;
    return {
        defaultSelection: () => {
            const model = anyCtx.get?.('agentDefaultModel');
            const selection = model?.currentSelection?.();
            if (!selection?.provider || !selection.model)
                return undefined;
            return { provider: selection.provider, model: selection.model };
        },
        streamText: async (options) => {
            const llm = anyCtx.get?.('llm');
            if (!llm?.stream)
                throw new Error('宿主没有可用的 llm 服务。');
            const content = [{ type: 'text', text: options.text }];
            if (options.image)
                content.push({ type: 'image', attachment: options.image });
            let output = '';
            const stream = llm.stream({
                provider: options.provider,
                model: options.model,
                system: options.system,
                messages: [{ role: 'user', content }],
                temperature: 0.1,
                maxTokens: 900,
                signal: options.signal,
            });
            for await (const chunk of stream) {
                if (chunk.type === 'text-delta' && chunk.text)
                    output += chunk.text;
            }
            return output;
        },
        saveImage: async (base64, mediaType, imageName) => {
            const attachments = anyCtx.get?.('attachments');
            if (!attachments?.saveImage)
                throw new Error('宿主没有可用的附件服务，无法读取图片。');
            // saveImage 要 Uint8Array，不接受 base64 字符串——传错会被判 malformed。
            const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
            return attachments.saveImage({ data: bytes, mediaType, name: imageName });
        },
    };
}
/**
 * 插件主体。
 *
 * @param ctx - 宿主上下文。
 * @param config - 插件配置。
 */
export function apply(ctx, config) {
    const root = config.memoryRoot?.trim() ? config.memoryRoot.trim() : defaultRoot();
    const store = new HealthStore(root);
    const service = new HealthService(store, makeExtractionHost(ctx));
    const pet = new PetBridge(ctx);
    void store.ensure().catch(() => undefined);
    registerTools(ctx, service);
    // webServer 是可选能力：没有它插件照常算分，只是没有面板。
    ctx.inject(['webServer'], (scope) => {
        const followUp = new FollowUpManager(scope, store, service, pet);
        const stop = followUp.start();
        const disposeRoutes = registerApi(scope, service, store, {
            say: (text) => followUp.say(text),
            markReply: () => followUp.markReply(),
            followUp: () => followUp.state(),
            ackPet: () => followUp.ackPet(),
            askNow: () => followUp.askNow(),
            clientHello: (stage, error) => followUp.clientHello(stage, error),
            autoPrompt: () => followUp.autoPrompt(),
        });
        scope.effect(() => () => {
            stop();
            disposeRoutes();
        }, 'dsh-health-assessment: routes');
        // 打开 DSH 即自检：档案/今日必填有缺口时，在设定工作区自动开新会话追问。
        // 去重由 followup.json 的 autoPromptDate 保证，同一天重启不会重复。
        setTimeout(() => {
            void followUp.autoPrompt().catch(() => undefined);
        }, 3000);
    });
}
