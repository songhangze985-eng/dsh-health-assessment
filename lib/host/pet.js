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
/** 桌宠路由前缀（对方包内固定）。 */
const PET_PREFIX = '/dsh-pet-7340';
/** 气泡最长显示时间，避免一条播报赖着不走。 */
const BUBBLE_MS = 8000;
/** 租约存活时间。 */
const LOCK_TTL_MS = 30_000;
/** 投喂桥。 */
export class PetBridge {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    /** 本机 origin；拿不到就说明 web 服务还没绑定，直接跳过。 */
    origin() {
        try {
            const webServer = this.ctx.webServer;
            return webServer?.getOrigin?.() ?? null;
        }
        catch {
            return null;
        }
    }
    /** 取一次租约；失败返回 null。 */
    async acquire(petId) {
        const origin = this.origin();
        if (!origin)
            return null;
        const url = `${origin}${PET_PREFIX}/lock?pet=${encodeURIComponent(petId)}&surface=web`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ttl: LOCK_TTL_MS }),
        });
        if (!response.ok)
            return null;
        const payload = (await response.json());
        return payload.ok && payload.lockId ? String(payload.lockId) : null;
    }
    /** 释放租约（尽力而为）。 */
    async release(petId) {
        const origin = this.origin();
        if (!origin)
            return;
        await fetch(`${origin}${PET_PREFIX}/lock/release?pet=${encodeURIComponent(petId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: true }),
        }).catch(() => undefined);
    }
    /**
     * 让桌宠说一句。
     *
     * @param text - 气泡内容。
     * @param petId - 宠物 id；默认 `main`。
     * @returns 是否真的投出去了。
     */
    async say(text, petId = 'main') {
        const origin = this.origin();
        if (!origin)
            return false;
        let lock = null;
        try {
            lock = await this.acquire(petId);
            const params = new URLSearchParams({ pet: petId, surface: 'web' });
            if (lock)
                params.set('lock', lock);
            const response = await fetch(`${origin}${PET_PREFIX}/broadcast?${params.toString()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, duration: BUBBLE_MS, anim: false }),
            });
            return response.ok;
        }
        catch {
            return false;
        }
        finally {
            if (lock)
                await this.release(petId);
        }
    }
}
