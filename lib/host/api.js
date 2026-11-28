/**
 * 面板与宿主之间的 JSON 路由。
 *
 * 用 `ctx.webServer` 的 handler 形态（面板需要 POST），前缀独立，避免与其他插件撞路径。
 * 只挂在 DSH GUI 的同一 origin 上，浏览器沿用既有登录态；不额外开放端口。
 *
 * @module dsh-health-assessment/src/host/api
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { OPTIONAL_GROUPS, OPTIONAL_HINTS } from '../core/optional-catalog.js';
import { renderUiPage } from './ui-page.js';
/** 路由前缀；带插件特征后缀，防止与生态里的同名插件冲突。 */
export const API_PREFIX = '/health-assessment-8221';
/** 请求体上限：面板只传文本与表格，图片单独走 12 MB。 */
const MAX_BODY = 12 * 1024 * 1024;
/** 读完整请求体。 */
async function readBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_BODY)
            throw new Error('请求体过大。');
        chunks.push(buffer);
    }
    return Buffer.concat(chunks).toString('utf8');
}
/** 写 JSON 响应。 */
function sendJson(res, status, payload) {
    const body = JSON.stringify(payload, null, 2);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}
/** 包装 handler：统一错误 → 400/500 JSON。 */
function wrap(fn) {
    return async (req, res) => {
        try {
            const body = req.method === 'GET' || req.method === 'HEAD' ? '' : await readBody(req);
            const result = await fn(req, body);
            sendJson(res, 200, result ?? { ok: true });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            sendJson(res, 400, { error: message });
        }
    };
}
/** 解析 JSON body；空体返回空对象。 */
function jsonBody(body) {
    if (!body.trim())
        return {};
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('请求体必须是 JSON 对象。');
    return parsed;
}
/** 从 URL 取查询参数。 */
function query(req) {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    return url.searchParams;
}
/**
 * 注册全部路由。
 *
 * @param ctx - 宿主上下文（需要 `webServer`）。
 * @param service - 业务门面。
 * @param store - 记忆库（日历视图直接读文件列表）。
 * @param hooks - 宠物与追问的钩子。
 * @returns 注销函数。
 */
export function registerApi(ctx, service, store, hooks = {}) {
    const disposers = [];
    const register = (path, handler) => {
        disposers.push(ctx.webServer.register({
            kind: 'prefix',
            path: `${API_PREFIX}${path}`,
            handler: wrap(handler),
        }));
    };
    register('/', async () => ({ ok: true, prefix: API_PREFIX, ui: `${API_PREFIX}/ui` }));
    // 独立界面：宿主直接吐一页自包含 HTML，不依赖 DSH 的浏览器插件加载链。
    disposers.push(ctx.webServer.register({
        kind: 'prefix',
        path: `${API_PREFIX}/ui`,
        handler: async (_req, res) => {
            const html = renderUiPage();
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
                'Content-Length': Buffer.byteLength(html),
            });
            res.end(html);
        },
    }));
    register('/overview', async (req) => service.overview(query(req).get('date') ?? undefined));
    register('/score', async (req) => {
        const params = query(req);
        const start = params.get('start');
        const end = params.get('end');
        return service.score(start || end ? { window: { start: start ?? undefined, end: end ?? undefined } } : undefined);
    });
    register('/sessions', async (req) => {
        const limit = Number(query(req).get('limit') ?? '30');
        const sessions = await store.loadSessions();
        return sessions.slice(-Math.max(1, Math.min(limit, 200))).reverse();
    });
    register('/profile', async (req, body) => {
        if (req.method === 'GET' || req.method === 'HEAD') {
            return { profile: await service.profile(), score: await service.score() };
        }
        const patch = jsonBody(body);
        const current = await service.profile();
        const next = { ...current, ...patch };
        if (patch.targets)
            next.targets = { ...(current.targets ?? {}), ...patch.targets };
        return { profile: await service.saveProfile(next), score: await service.score() };
    });
    register('/checkin/text', async (_req, body) => {
        const input = jsonBody(body);
        const result = await service.submitText({
            text: String(input.text ?? ''),
            date: input.date ? String(input.date) : undefined,
        });
        return { ...result, daily: await service.daily(result.session.date) };
    });
    register('/checkin/table', async (_req, body) => {
        const input = jsonBody(body);
        const result = await service.submitTable({
            fileBase64: input.fileBase64 ? String(input.fileBase64) : undefined,
            csv: input.csv ? String(input.csv) : undefined,
            rows: Array.isArray(input.rows) ? input.rows : undefined,
            filename: input.filename ? String(input.filename) : undefined,
            date: input.date ? String(input.date) : undefined,
        });
        return { ...result, daily: await service.daily() };
    });
    // 识图预览：只读取与结构化，不写库；用于「入库前确认」。
    register('/checkin/image/preview', async (_req, body) => {
        const input = jsonBody(body);
        const result = await service.previewImage({
            base64: String(input.base64 ?? ''),
            mediaType: String(input.mediaType ?? 'image/jpeg'),
            name: input.name ? String(input.name) : undefined,
            date: input.date ? String(input.date) : undefined,
            note: input.note ? String(input.note) : undefined,
        });
        return result;
    });
    // 确认后写入：接受草稿（用户可能改过字段）。
    register('/checkin/commit', async (_req, body) => {
        const input = jsonBody(body);
        const draft = input.draft;
        if (!draft)
            throw new Error('缺少待写入的记录。');
        const merged = await service.commitSession(draft);
        return { session: merged, daily: await service.daily(String(merged.date ?? '')) };
    });
    register('/checkin/image', async (_req, body) => {
        const input = jsonBody(body);
        const preview = await service.previewImage({
            base64: String(input.base64 ?? ''),
            mediaType: String(input.mediaType ?? 'image/jpeg'),
            name: input.name ? String(input.name) : undefined,
            date: input.date ? String(input.date) : undefined,
            note: input.note ? String(input.note) : undefined,
        });
        if (input.confirmed === true) {
            const merged = await service.commitSession(preview.draft, 'image_ocr');
            return { session: merged, source: 'image', warning: preview.warning, daily: await service.daily(String(merged.date ?? '')) };
        }
        return { ...preview, needsConfirm: true };
    });
    // 宿主工作区列表：给「追问工作区」下拉用。
    // 优先用宿主的 workspaceController；没有就直读 DSH 的工作区存储文件，
    // 两条都是真实数据来源，不返回假列表。
    register('/workspaces', async () => {
        const controller = ctx.get?.('workspaceController');
        if (controller?.list) {
            try {
                const rows = await controller.list();
                if (Array.isArray(rows) && rows.length > 0) {
                    return {
                        rows: rows.map((row) => {
                            const record = row;
                            return { path: String(record.path ?? ''), name: String(record.title ?? record.name ?? record.path ?? '') };
                        }).filter((row) => row.path),
                        detail: 'workspaceController',
                    };
                }
            }
            catch {
                // 落到文件读取。
            }
        }
        const storagePath = join(process.env.DSH_HOME || join(process.env.HOME || '', '.dsh'), 'storages', 'workspace.json');
        try {
            const raw = JSON.parse(readFileSync(storagePath, 'utf8'));
            const table = raw.tables?.workspaces ?? {};
            const rows = Object.values(table)
                .filter((row) => typeof row.path === 'string' && row.path !== '')
                .map((row) => ({ path: String(row.path), name: String(row.title || row.path) }));
            return { rows, detail: 'workspace storage file' };
        }
        catch (error) {
            return { rows: [], detail: error instanceof Error ? error.message : String(error) };
        }
    });
    register('/followup/auto', async () => (hooks.autoPrompt ? hooks.autoPrompt() : { ok: false, detail: '未接线' }));
    // 选填：58 项目录 + 写入
    register('/optional/catalog', async () => ({ groups: OPTIONAL_GROUPS, hints: OPTIONAL_HINTS }));
    register('/checkin/optional', async (_req, body) => {
        const input = jsonBody(body);
        const date = String(input.date ?? '');
        if (!date)
            throw new Error('缺少日期。');
        const items = (input.items ?? {});
        const session = await service.submitOptional({ date, items });
        return { session, daily: await service.daily(date) };
    });
    // 红旗专用：只记日期与红旗
    register('/checkin/flag-only', async (_req, body) => {
        const input = jsonBody(body);
        const session = await service.submitFlagOnly({
            date: String(input.date ?? ''),
            flags: Array.isArray(input.flags) ? input.flags : [],
        });
        return { session };
    });
    // 单日记录：读 / 改 / 删
    register('/session', async (req, body) => {
        const params = query(req);
        const date = params.get('date') ?? '';
        if (req.method === 'DELETE') {
            if (!date)
                throw new Error('缺少日期。');
            const removed = await service.deleteDay(date);
            return { removed, daily: await service.daily(date) };
        }
        if (req.method === 'GET' || req.method === 'HEAD') {
            if (!date)
                throw new Error('缺少日期。');
            return { session: await service.readDay(date) };
        }
        const input = jsonBody(body);
        const target = String(input.date ?? date);
        if (!target)
            throw new Error('缺少日期。');
        const patch = { date: target };
        for (const field of ['body_required', 'psych_required', 'optional', 'red_flags']) {
            if (input[field] !== undefined)
                patch[field] = input[field];
        }
        const session = await service.commitSession(patch, 'manual_form');
        return { session, daily: await service.daily(target) };
    });
    // 自定义计分标准
    register('/targets', async (req, body) => {
        if (req.method === 'GET' || req.method === 'HEAD')
            return service.targets();
        const input = jsonBody(body);
        return service.saveTargets({
            protein_g_per_kg: Number(input.protein_g_per_kg),
            resistance_sessions_per_7d: Number(input.resistance_sessions_per_7d),
            confirm: input.confirm === true,
        });
    });
    register('/log', async () => ({ rows: await service.standardLog() }));
    register('/analyses', async (req) => {
        const name = query(req).get('name');
        if (name)
            return { name, payload: await service.readAnalysis(name) };
        return service.analyses();
    });
    // 导出
    register('/export', async (req) => {
        const format = query(req).get('format') === 'csv' ? 'csv' : 'json';
        const result = await service.exportAll(format);
        return { ...result, encoding: 'utf8' };
    });
    // 真实模型目录
    register('/models', async () => {
        const llm = ctx.get?.('llm');
        if (!llm?.listProviders)
            return { providers: [], detail: '宿主没有 llm 服务' };
        try {
            const raw = llm.listProviders() ?? [];
            const providers = [];
            for (const provider of raw) {
                const id = String(provider.id ?? provider.name ?? '');
                if (!id)
                    continue;
                let models = [];
                if (llm.listModels) {
                    try {
                        const list = await llm.listModels(id);
                        models = (list ?? [])
                            .map((model) => ({ id: String(model.id ?? model.name ?? ''), name: String(model.name ?? model.id ?? '') }))
                            .filter((model) => model.id);
                    }
                    catch {
                        models = [];
                    }
                }
                providers.push({ id, name: String(provider.name ?? id), models });
            }
            return { providers, detail: 'ok' };
        }
        catch (error) {
            return { providers: [], detail: error instanceof Error ? error.message : String(error) };
        }
    });
    // 记忆库：列表 / 新增 / 切换
    register('/libraries', async (req, body) => {
        if (req.method === 'GET' || req.method === 'HEAD') {
            const settings = await service.settings(true);
            return { libraries: settings.libraries ?? [], active: settings.activeLibrary || '', root: store.root };
        }
        const input = jsonBody(body);
        const path = String(input.path ?? '').trim();
        if (!path)
            throw new Error('请给出记忆库绝对路径。');
        const settings = await service.settings(true);
        const libraries = [...(settings.libraries ?? [])];
        if (!libraries.some((item) => item.path === path)) {
            libraries.push({ path, codename: String(input.codename ?? path.split('/').pop() ?? '') });
        }
        const active = input.switch === true ? path : settings.activeLibrary;
        const next = await service.saveSettings({ libraries, activeLibrary: active });
        if (input.switch === true)
            store.switchTo(path);
        return { libraries: next.libraries, active: next.activeLibrary, root: store.root };
    });
    register('/settings', async (req, body) => {
        if (req.method === 'GET' || req.method === 'HEAD')
            return service.settings(true);
        return service.saveSettings(jsonBody(body));
    });
    register('/import', async (_req, body) => {
        const input = jsonBody(body);
        const sourceRoot = String(input.sourceRoot ?? '').trim();
        if (!sourceRoot)
            throw new Error('请给出旧记忆库目录。');
        return service.importLibrary(sourceRoot);
    });
    register('/followup', async () => (hooks.followUp ? hooks.followUp() : {}));
    // 诊断：看 loader 里的 entry 与各自 client 声明能不能解析。
    register('/debug/roster', async () => {
        const loader = ctx.loader;
        const raw = loader?.entries?.();
        const list = [];
        if (raw && typeof raw[Symbol.iterator] === 'function') {
            for (const item of raw)
                list.push(item);
        }
        else if (raw && typeof raw === 'object') {
            list.push(...Object.values(raw));
        }
        const requireHere = createRequire(import.meta.url);
        const rows = list.map((entry) => {
            const options = entry.options ?? {};
            const name = options.name ?? '';
            const row = { id: options.id ?? '', name };
            try {
                const pkgPath = requireHere.resolve(`${name}/package.json`);
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
                const clientExport = pkg.exports?.['./client'];
                const rel = typeof clientExport === 'string'
                    ? clientExport
                    : clientExport?.default;
                row.pkgPath = pkgPath;
                row.dshClient = pkg.dsh?.client ?? null;
                row.clientRel = rel ?? null;
                row.clientExists = rel ? existsSync(join(dirname(pkgPath), rel)) : false;
            }
            catch (error) {
                row.error = error instanceof Error ? error.message : String(error);
            }
            return row;
        });
        return {
            count: rows.length,
            rawKind: raw === undefined ? 'undefined' : raw?.constructor?.name ?? typeof raw,
            rows,
        };
    });
    register('/client-hello', async (_req, body) => {
        const input = jsonBody(body);
        await hooks.clientHello?.(String(input.stage ?? 'unknown'), input.error ? String(input.error) : undefined);
        return { ok: true };
    });
    register('/followup/ask', async () => (hooks.askNow ? hooks.askNow() : { ok: false, detail: '未接线' }));
    register('/followup/reply', async () => {
        await hooks.markReply?.();
        return { ok: true };
    });
    register('/pet/ack', async () => {
        await hooks.ackPet?.();
        return { ok: true };
    });
    register('/pet/say', async (_req, body) => {
        const input = jsonBody(body);
        const text = String(input.text ?? '').trim();
        if (!text)
            throw new Error('气泡内容不能为空。');
        await hooks.say?.(text);
        return { ok: true };
    });
    return () => {
        for (const dispose of disposers.reverse())
            dispose();
    };
}
