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
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
/** 插件行 id，必须与 `cordis.patch.yml` 里的 `id` 完全一致。 */
export declare const name = "health-assessment";
/** 只硬依赖工具注册表；其余按可用性降级。 */
export declare const inject: string[];
/** 插件配置（落在 profile 的插件行里，改动会热替换插件）。 */
export interface Config {
    /** 记忆库根目录；空表示 `~/.dsh/health-assessment`。 */
    memoryRoot: string;
    /** 桌宠 id；投喂气泡时使用。 */
    petId: string;
}
/** 配置 schema：给设置页与校验共用。 */
export declare const Config: Schema<Config>;
/**
 * 插件主体。
 *
 * @param ctx - 宿主上下文。
 * @param config - 插件配置。
 */
export declare function apply(ctx: Context, config: Config): void;
