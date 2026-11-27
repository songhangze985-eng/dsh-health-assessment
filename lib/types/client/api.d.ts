/**
 * 面板与宿主路由之间的最小客户端。
 *
 * 同源请求，沿用 DSH GUI 的登录态；不拼接端口、不发绝对地址。
 *
 * @module dsh-health-assessment/src/client/api
 */
/** 与宿主侧一致的路由前缀。 */
declare const PREFIX = "/health-assessment-8221";
/** 今日总览。 */
export interface Overview {
    date: string;
    profile: Record<string, unknown>;
    profileMissing: string[];
    daily: {
        target_date: string;
        required_completion_ratio: number;
        missing_required_fields: string[];
        recorded_optional_fields: string[];
    };
    score: Record<string, any>;
    distinctDates: number;
    redFlags: string[];
    settings: Record<string, any>;
}
/** 一条打卡记录。 */
export interface SessionItem {
    date: string;
    body_required?: Record<string, unknown>;
    psych_required?: Record<string, unknown>;
    optional?: Record<string, unknown>;
    sources?: string[];
}
/** 面板用到的全部接口。 */
export declare const api: {
    overview: () => Promise<Overview>;
    score: () => Promise<Record<string, any>>;
    sessions: () => Promise<SessionItem[]>;
    profile: () => Promise<{
        profile: Record<string, unknown>;
        score: Record<string, any>;
    }>;
    saveProfile: (profile: Record<string, unknown>) => Promise<{
        profile: Record<string, unknown>;
        score: Record<string, any>;
    }>;
    checkinText: (text: string, date?: string) => Promise<{
        session: SessionItem;
        source: string;
        warning: string;
    }>;
    checkinTable: (payload: {
        csv?: string;
        rows?: Record<string, unknown>[];
        filename?: string;
        date?: string;
    }) => Promise<{
        imported: number;
        redFlags: string[];
    }>;
    checkinImage: (payload: {
        base64: string;
        mediaType: string;
        name?: string;
        date?: string;
        note?: string;
    }) => Promise<{
        session: SessionItem;
        source: string;
    }>;
    settings: () => Promise<Record<string, unknown>>;
    saveSettings: (patch: Record<string, unknown>) => Promise<Record<string, unknown>>;
    importLibrary: (sourceRoot: string) => Promise<{
        imported: number;
        skipped: number;
    }>;
    followUp: () => Promise<Record<string, any>>;
    markReply: () => Promise<{
        ok: boolean;
    }>;
    ackPet: () => Promise<{
        ok: boolean;
    }>;
    say: (text: string) => Promise<{
        ok: boolean;
    }>;
};
export { PREFIX as HEALTH_API_PREFIX };
