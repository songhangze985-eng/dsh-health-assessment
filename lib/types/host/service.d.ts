/**
 * 业务层：把「记忆库 + 计分内核 + 抽取」拼成面板与工具都用得上的少量动作。
 *
 * 这里不含 HTTP、不含工具描述、不含 React；宿主入口负责接线。
 * 所有写操作都经 `HealthStore`，所有分数都来自 `scorePayload`——本层不做第二套算术。
 *
 * @module dsh-health-assessment/src/host/service
 */
import { type TableRow } from '../core/extract.js';
import type { DailyProgress, ProfileRecord, ScoreResult, SessionRecord } from '../core/types.js';
import { HealthStore, type HealthSettings, type SourceType } from './store.js';
/** 抽取来源：结果里显式标注，面板上不假装是用户自己写的。 */
export type ExtractionSource = 'rule' | 'model' | 'table' | 'image';
/** 抽取结果。 */
export interface ExtractionResult {
    session: SessionRecord;
    source: ExtractionSource;
    /** 模型失败或图片未识别时的说明；成功时为空。 */
    warning: string;
}
/** 视觉/结构化抽取需要的宿主能力（按用到的成员声明，不引整包类型）。 */
export interface ExtractionHost {
    /** 取当前默认模型；拿不到时返回 undefined。 */
    defaultSelection?: () => {
        provider: string;
        model: string;
    } | undefined;
    /** 调模型；`image` 为已经存好的附件引用。 */
    streamText?: (options: {
        provider: string;
        model: string;
        system: string;
        text: string;
        image?: unknown;
        signal?: AbortSignal;
    }) => Promise<string>;
    /** 存图并返回附件引用。 */
    saveImage?: (base64: string, mediaType: string, name: string) => Promise<unknown>;
}
/** 结构化抽取的系统提示词（移植自上游 `EXTRACTION_SYSTEM_PROMPT`）。 */
export declare const EXTRACTION_SYSTEM_PROMPT = "\u4F60\u662F\u5065\u5EB7\u6253\u5361\u7684\u7ED3\u6784\u5316\u63D0\u53D6\u5668\u3002\n\u628A\u7528\u6237\u81EA\u8FF0\u6216\u56FE\u7247\u91CC\u5DF2\u7ECF\u51FA\u73B0\u7684\u5185\u5BB9\u63D0\u53D6\u6210 JSON\u3002\u4E0D\u8981\u8BA1\u7B97\u5206\u6570\uFF0C\u4E0D\u8981\u7F16\u9020\u6CA1\u63D0\u5230\u7684\u6570\u5B57\uFF0C\u4E0D\u8981\u4E0B\u8BCA\u65AD\u3002\n\u7EA2\u65D7\u53EA\u5728\u539F\u6587\u786E\u5B9E\u51FA\u73B0\u80F8\u75DB\u3001\u660F\u53A5\u3001\u6655\u53A5\u3001\u81EA\u4F24\u3001\u8F7B\u751F\u3001\u81EA\u884C\u505C\u836F\u3001\u6025\u6027\u5267\u75DB\u3001\u547C\u5438\u56F0\u96BE\u3001\u5F02\u5E38\u5FC3\u60B8\u3001\u9AA8\u88C2\u3001\u5173\u8282\u6025\u6027\u80BF\u80C0\u65F6\u5199\u5165 red_flags\u3002\n\u8F93\u51FA JSON:\n{\n  \"date\": \"YYYY-MM-DD\",\n  \"red_flags\": [],\n  \"body_required\": {\"protein_g\": null, \"resistance_done\": null, \"progressive_overload\": null},\n  \"psych_required\": {\"self_rating_1_to_5\": null, \"feedback_category\": null},\n  \"optional\": {\"sleep_quality\": null, \"anti_inflammatory_diet\": null, \"stress_relief\": null, \"focus_state\": null},\n  \"pet_reply\": \"30\u5B57\u4EE5\u5185\u7684\u684C\u5BA0\u56DE\u5E94\uFF0C\u4E0D\u7ED9\u533B\u7597\u5EFA\u8BAE\"\n}";
/** 从模型输出里剥掉 ```json 围栏。 */
export declare function stripJsonFence(content: string): string;
/**
 * 健康评估的业务门面。
 *
 * 一个实例绑定一个记忆库目录；设置与追问状态都落在库里，因此换库即换全套状态。
 */
export declare class HealthService {
    /** 记忆库。 */
    readonly store: HealthStore;
    private readonly host;
    private settingsCache;
    constructor(store: HealthStore, host?: ExtractionHost);
    /** 读设置（带缓存）。 */
    settings(force?: boolean): Promise<HealthSettings>;
    /** 写设置并刷新缓存。 */
    saveSettings(patch: Partial<HealthSettings>): Promise<HealthSettings>;
    /** 读档案。 */
    profile(): Promise<ProfileRecord>;
    /** 写档案。 */
    saveProfile(profile: ProfileRecord): Promise<ProfileRecord>;
    /** 当前评估（全量记录，默认窗口由计分器按「满 7 天」规则处理）。 */
    score(payload?: {
        window?: {
            start?: string;
            end?: string;
        } | null;
    }): Promise<ScoreResult>;
    /** 今日进度（缺项、完成度、已写选填）。 */
    daily(date?: string): Promise<DailyProgress>;
    /** 汇总状态：面板首屏一次拿全。 */
    overview(): Promise<{
        date: string;
        profile: ProfileRecord;
        profileMissing: string[];
        daily: DailyProgress;
        score: ScoreResult;
        distinctDates: number;
        redFlags: string[];
        settings: HealthSettings;
    }>;
    /**
     * 一句话打卡。
     *
     * 规则先跑；规则没写全且配了模型时再请模型补。模型失败不阻塞打卡——
     * 规则结果照常入库，只在返回值里标 warning。
     */
    submitText(input: {
        text: string;
        date?: string;
        source?: SourceType;
    }): Promise<{
        session: SessionRecord;
        source: ExtractionSource;
        warning: string;
    }>;
    /** 表格导入（CSV 文本或已解析的行）。 */
    submitTable(input: {
        rows?: TableRow[];
        csv?: string;
        filename?: string;
        date?: string;
    }): Promise<{
        sessions: SessionRecord[];
        imported: number;
        redFlags: string[];
    }>;
    /**
     * 图片导入：先存附件，再请视觉模型读成结构化记录。
     *
     * 没配模型或没视觉能力时不猜——直接抛错说明缺什么，避免把「未识别」当「没摄入」。
     */
    submitImage(input: {
        base64: string;
        mediaType: string;
        name?: string;
        date?: string;
        note?: string;
    }): Promise<{
        session: SessionRecord;
        source: ExtractionSource;
        warning: string;
    }>;
    /** 从旧记忆库导入。 */
    importLibrary(sourceRoot: string): Promise<{
        imported: number;
        skipped: number;
    }>;
    /** 当前生效的模型选择：设置优先，其次 DSH 默认。 */
    resolveModel(settings: HealthSettings): {
        provider: string;
        model: string;
    } | null;
    /** 调模型并解析；任何失败都降级为规则并给出说明。 */
    private callModel;
    /** 带超时的模型调用。 */
    private callStream;
    /** 解析模型 JSON；失败返回 null。 */
    private parseModelJson;
}
/**
 * 规则结果与模型结果合并：模型只补规则没写的字段，不覆盖已写值。
 *
 * 这条规则是为了让「用户写明的数字」永远赢过模型猜测。
 */
export declare function mergeExtraction(rule: SessionRecord, model: SessionRecord): SessionRecord;
