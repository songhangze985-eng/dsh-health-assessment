/**
 * 插件自己的记忆库：`~/.dsh/health-assessment`。
 *
 * 目录形状沿用上游（`profile.json`、`sessions/YYYY-MM-DD.json`、`analyses/`），
 * 这样从旧记忆库导入时是文件级平移，不需要转换格式。写入一律「临时文件 + rename」，
 * 避免面板与工具同时写时留下半截 JSON。
 *
 * @module dsh-health-assessment/src/host/store
 */
import type { ProfileRecord, SessionRecord } from '../core/types.js';
/** 打卡来源。顺序决定同字段谁赢。 */
export type SourceType = 'self_report' | 'wearable_table' | 'image_ocr' | 'manual_form';
/** 插件设置（面板「设置」页读写）。 */
export interface HealthSettings {
    /** 抽取用的 provider；空表示沿用 DSH 当前默认模型。 */
    extractionProvider: string;
    /** 抽取用的模型 id；空表示沿用 DSH 当前默认模型。 */
    extractionModel: string;
    /** 每日首次打开时是否自动开新会话追问。 */
    dailyAskEnabled: boolean;
    /** 每日追问的目标工作区路径；空表示当前会话工作区。 */
    dailyAskWorkspace: string;
    /** 定时追问的本地时刻，`HH:MM`；空表示不定时。 */
    dailyAskTime: string;
    /** 追问后多久没回复就升级追问（小时）。 */
    escalateHours: number;
    /** 是否允许把气泡投喂给 dsh-pet。 */
    petEnabled: boolean;
    /** 图片发送给模型前是否需要确认。 */
    confirmImageUpload: boolean;
}
/** 默认设置：追问开、不排定时、5 小时升级、宠物开。 */
export declare const DEFAULT_SETTINGS: HealthSettings;
/** 追问状态：用于「每天一次」与「5 小时未回复升级」。 */
export interface FollowUpState {
    /** 最近一次自动追问的日期 `YYYY-MM-DD`。 */
    lastAskDate: string;
    /** 最近一次追问的时间戳（毫秒）。 */
    lastAskAt: number;
    /** 最近一次用户在该会话里回复的时间戳（毫秒）。 */
    lastReplyAt: number;
    /** 已经升级过的日期集合（每天最多升级一次）。 */
    escalatedDates: string[];
    /** 最近一次出分播报的时间戳。 */
    lastPetAt: number;
    /** 上一次播报时的总分，用于「变动 ≥5 才播」。 */
    lastPetScore: number | null;
    /** host 侧待投喂的气泡；client 取走后置空。 */
    pendingBubble: string;
    /** 最近一次追问的结论文本（成功或失败原因），便于面板与排查。 */
    lastAskDetail: string;
    /** 最近一次浏览器侧插件加载的时间戳；用来判断 client bundle 有没有执行。 */
    lastClientHello: number;
}
/** 空的追问状态。 */
export declare const EMPTY_FOLLOW_UP: FollowUpState;
/** 本地日期 `YYYY-MM-DD`（按系统时区，不用 UTC）。 */
export declare function localDay(now?: Date): string;
/** 校验并返回合法日期字符串；非法直接抛错。 */
export declare function requireSessionDay(value: unknown): string;
/** 一条空记录。 */
export declare function emptySession(dateStr: string): SessionRecord;
/** 合并一条新记录到已有记录（同日多来源）。 */
export declare function mergeRecords(existing: SessionRecord, incoming: SessionRecord, sourceType: SourceType): SessionRecord;
/** 记忆库根目录：设置覆盖 > `~/.dsh/health-assessment`。 */
export declare function defaultRoot(): string;
/**
 * 记忆库读写。
 *
 * 一个实例只服务一个目录；目录在构造时确定，运行中不再切换（单人单库）。
 */
export declare class HealthStore {
    /** 记忆库根目录。 */
    readonly root: string;
    constructor(root?: string);
    private get sessionsDir();
    private get analysesDir();
    private get settingsPath();
    private get followUpPath();
    /** 建目录，幂等。 */
    ensure(): Promise<void>;
    /** 读档案；文件不存在返回空对象。 */
    loadProfile(): Promise<ProfileRecord>;
    /** 写档案（`profile.json` 与 `settings/config.json` 同步，兼容上游读取顺序）。 */
    saveProfile(profile: ProfileRecord): Promise<ProfileRecord>;
    /** 读一条按日期的记录。 */
    readSession(day: string): Promise<SessionRecord | null>;
    /** 读全部记录：同日多文件按来源合并，主文件为 `YYYY-MM-DD.json`。 */
    loadSessions(): Promise<SessionRecord[]>;
    /** 合并并保存一条记录；返回合并结果。 */
    mergeAndSaveSession(incoming: SessionRecord, sourceType?: SourceType): Promise<SessionRecord>;
    /** 写一份评估快照。 */
    writeAnalysis(day: string, payload: unknown): Promise<void>;
    /** 读设置；缺字段用默认值补齐。 */
    loadSettings(): Promise<HealthSettings>;
    /** 写设置。 */
    saveSettings(patch: Partial<HealthSettings>): Promise<HealthSettings>;
    /** 读追问状态。 */
    loadFollowUp(): Promise<FollowUpState>;
    /** 写追问状态。 */
    saveFollowUp(state: FollowUpState): Promise<FollowUpState>;
    /**
     * 从旧记忆库导入记录。
     *
     * 只读旧库、只写新库；同名日期文件按来源合并，不覆盖已有值。
     * @param sourceRoot - 旧记忆库根目录。
     * @returns 导入与跳过的文件数。
     */
    importFrom(sourceRoot: string): Promise<{
        imported: number;
        skipped: number;
    }>;
}
