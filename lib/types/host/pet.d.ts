/**
 * 桌宠桥：把一句播报投给 `dsh-pet`。
 *
 * 走它自己的 HTTP 路由而不是 import 其内部模块——两个插件各自独立升级，
 * 对方没装、接口变了、锁被占，都只损失一次播报，不影响健康插件本体。
 *
 * `dsh-pet` 的气泡写入需要先取租约（`/lock`），投喂时带上 `lock` 参数，
 * 用完立刻释放；不抢租约就不会顶掉用户正在拖拽或播放的动画。
 *
 * @module dsh-health-assessment/src/host/pet
 */
import type { Context } from '@deepseek-ai/cordis';
/** 投喂桥。 */
export declare class PetBridge {
    private readonly ctx;
    constructor(ctx: Context);
    /** 本机 origin；拿不到就说明 web 服务还没绑定，直接跳过。 */
    private origin;
    /** 取一次租约；失败返回 null。 */
    private acquire;
    /** 释放租约（尽力而为）。 */
    private release;
    /**
     * 让桌宠说一句。
     *
     * @param text - 气泡内容。
     * @param petId - 宠物 id；默认 `main`。
     * @returns 是否真的投出去了。
     */
    say(text: string, petId?: string): Promise<boolean>;
}
