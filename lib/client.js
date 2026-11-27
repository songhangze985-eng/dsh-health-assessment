/* dsh-health-assessment 浏览器半侧：由 scripts/wrap-client.mjs 生成，请勿手改 */
(function () {
  var loader = window.__ModuleLoader__;
  if (!loader || typeof loader.load !== 'function') {
    console.warn('[dsh-health-assessment] 没有 __ModuleLoader__，面板无法加载');
    return;
  }
  // 第一段心跳：bundle 顶层就发，证明浏览器真的下载并执行了这个文件。
  try {
    fetch('/health-assessment-8221/client-hello', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'boot' })
    }).catch(function () {});
  } catch (e) {}

  /**
   * 模块本体：包成 function (require)，每次 factory 调用时再执行。
   * 之前直接在外层求值，导致 bundle 里的 require(...) 在无 require 的作用域运行，
   * 一执行就 ReferenceError——于是 boot 心跳有值、apply 永远不跑。
   */
  function loadBundle(require) {
    var module = { exports: {} };
    var exports = module.exports;
    (function (module, exports, require) {
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  makeFactory: () => makeFactory
});
module.exports = __toCommonJS(index_exports);

// src/client/health.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var PREFIX = "/health-assessment-8221";
function Icon({ path, size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.75,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: path })
    }
  );
}
var ICON = {
  refresh: "M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6",
  gear: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  attach: "M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.3-2.3l7.3-7.3",
  close: "M18 6 6 18M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  circle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
};
function localToday() {
  const d = /* @__PURE__ */ new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
async function request(path, init) {
  const response = await fetch(`${PREFIX}${path}`, {
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json" } : void 0,
    ...init
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.error || `\u8BF7\u6C42\u5931\u8D25\uFF1A${response.status}`);
  return payload;
}
function fileKind(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (/\.(png|jpe?g|webp)$/.test(lower)) return "image";
  return null;
}
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = () => reject(new Error("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25"));
    reader.readAsDataURL(file);
  });
}
function modeText(o) {
  if (!o) return "";
  const mode = o.score.mode;
  const missing = o.checklist.filter((i) => !i.done).length;
  if (mode === "redflag") return "\u8BB0\u5F55\u91CC\u6709\u9700\u8981\u9A6C\u4E0A\u5904\u7406\u7684\u4FE1\u53F7\uFF0C\u672C\u8F6E\u4E0D\u6253\u5206\uFF0C\u5148\u8054\u7CFB\u533B\u7597\u6216\u5F53\u5730\u7D27\u6025\u5E2E\u52A9\u3002";
  if (mode === "blocked_profile") return "\u57FA\u7840\u6863\u6848\u8FD8\u6CA1\u586B\u5B8C\uFF0C\u8865\u9F50\u540E\u7ACB\u523B\u751F\u6210\u8BC4\u5206\u3002";
  if (o.distinctDates < 7) return `\u5DF2\u8BB0\u5F55 ${o.distinctDates}/7 \u5929\uFF0C\u4ECA\u5929\u8FD8\u5DEE ${missing} \u9879\u5FC5\u586B\u3002`;
  return "\u4E03\u5929\u7A97\u53E3\u5DF2\u6EE1\uFF0C\u8BC4\u5206\u89C1\u4E0A\u65B9\u6307\u6807\u3002";
}
function heatLevel(hits) {
  if (hits <= 0) return 0;
  if (hits >= 5) return 4;
  if (hits >= 3) return 3;
  if (hits >= 2) return 2;
  return 1;
}
function HealthView() {
  const [date, setDate] = (0, import_react.useState)(localToday());
  const [overview, setOverview] = (0, import_react.useState)(null);
  const [sessions, setSessions] = (0, import_react.useState)([]);
  const [text, setText] = (0, import_react.useState)("");
  const [attachments, setAttachments] = (0, import_react.useState)([]);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [spinning, setSpinning] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [notice, setNotice] = (0, import_react.useState)("");
  const [connected, setConnected] = (0, import_react.useState)(false);
  const [dragging, setDragging] = (0, import_react.useState)(false);
  const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
  const [settings, setSettings] = (0, import_react.useState)({});
  const [workspaces, setWorkspaces] = (0, import_react.useState)([]);
  const [profileOpen, setProfileOpen] = (0, import_react.useState)(false);
  const [profile, setProfile] = (0, import_react.useState)({});
  const [confirming, setConfirming] = (0, import_react.useState)(null);
  const textRef = (0, import_react.useRef)(null);
  const fileRef = (0, import_react.useRef)(null);
  const load = (0, import_react.useCallback)(async () => {
    setSpinning(true);
    try {
      const [next, history] = await Promise.all([
        request(`/overview?date=${date}`),
        request("/sessions?limit=60")
      ]);
      setOverview(next);
      setSettings(next.settings ?? {});
      setSessions(history);
      setConnected(true);
      setError("");
    } catch (cause) {
      setConnected(false);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setTimeout(() => setSpinning(false), 450);
    }
  }, [date]);
  (0, import_react.useEffect)(() => {
    void load();
  }, [load]);
  (0, import_react.useEffect)(() => {
    if (!settingsOpen && !profileOpen && !confirming) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setSettingsOpen(false);
      setProfileOpen(false);
      setConfirming(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, profileOpen, confirming]);
  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3600);
  };
  const addFiles = (0, import_react.useCallback)(async (files) => {
    for (const file of files) {
      const kind = fileKind(file.name);
      if (!kind) {
        flash(`\u4E0D\u652F\u6301\u7684\u6587\u4EF6\uFF1A${file.name}`);
        continue;
      }
      const base64 = await readAsBase64(file);
      const attachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        kind,
        status: "ready",
        base64,
        mediaType: file.type || (kind === "image" ? "image/png" : "text/csv"),
        thumb: kind === "image" ? `data:${file.type || "image/png"};base64,${base64}` : void 0
      };
      setAttachments((current) => [...current, attachment]);
    }
  }, []);
  const onPaste = (0, import_react.useCallback)(async (event) => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const images = items.filter((item) => item.type.startsWith("image/"));
    if (images.length === 0) return;
    event.preventDefault();
    const files = [];
    for (const item of images) {
      const file = item.getAsFile();
      if (file) files.push(new File([file], `\u7C98\u8D34\u7684\u56FE\u7247-${Date.now()}.png`, { type: file.type }));
    }
    await addFiles(files);
  }, [addFiles]);
  const removeAttachment = (id) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
  };
  const submit = async () => {
    if (busy) return;
    const hasText = text.trim().length > 0;
    const pending = attachments.filter((item) => item.status === "ready");
    if (!hasText && pending.length === 0) return;
    setBusy(true);
    try {
      if (hasText) {
        await request("/checkin/text", { method: "POST", body: JSON.stringify({ text, date }) });
        setText("");
      }
      for (const attachment of pending) {
        if (attachment.kind === "image") {
          const preview = await request(
            "/checkin/image/preview",
            { method: "POST", body: JSON.stringify({ base64: attachment.base64, mediaType: attachment.mediaType, name: attachment.name, date }) }
          );
          setConfirming({ kind: "image", draft: preview.draft, warning: preview.warning, visionModel: preview.visionModel });
          break;
        }
        const result = await request("/checkin/table", {
          method: "POST",
          body: JSON.stringify({ fileBase64: attachment.base64, filename: attachment.name, date })
        });
        void result;
      }
      if (pending.every((item) => item.kind !== "image")) {
        setAttachments((current) => current.filter((item) => !pending.includes(item)));
        flash(pending.length > 0 ? `\u5DF2\u5904\u7406 ${pending.length} \u4E2A\u6587\u4EF6` : "\u5DF2\u8BB0\u5F55");
        await load();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const commitDraft = async () => {
    if (!confirming?.draft) return;
    setBusy(true);
    try {
      await request("/checkin/commit", { method: "POST", body: JSON.stringify({ draft: confirming.draft }) });
      setConfirming(null);
      setAttachments([]);
      flash("\u5DF2\u5199\u5165");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const openSettings = async () => {
    setSettingsOpen(true);
    try {
      const result = await request("/workspaces");
      setWorkspaces((result.rows || []).map((row) => ({
        path: String(row.path ?? row.id ?? ""),
        name: String(row.name ?? row.title ?? row.path ?? row.id ?? "")
      })).filter((row) => row.path));
    } catch {
      setWorkspaces([]);
    }
  };
  const saveSettings = async () => {
    setBusy(true);
    try {
      await request("/settings", { method: "POST", body: JSON.stringify(settings) });
      setSettingsOpen(false);
      flash("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const openProfile = () => {
    const p = overview?.profile ?? {};
    setProfile({
      height_cm: String(p.height_cm ?? ""),
      weight_kg: String(p.weight_kg ?? ""),
      age: String(p.age ?? ""),
      sex: String(p.sex ?? ""),
      training_years: String(p.training_years ?? ""),
      injury: p.injury === true ? "1" : ""
    });
    setProfileOpen(true);
  };
  const saveProfile = async () => {
    setBusy(true);
    try {
      await request("/profile", {
        method: "POST",
        body: JSON.stringify({
          height_cm: profile.height_cm ? Number(profile.height_cm) : null,
          weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
          age: profile.age ? Number(profile.age) : null,
          sex: profile.sex || null,
          training_years: profile.training_years ? Number(profile.training_years) : null,
          injury: profile.injury === "1"
        })
      });
      setProfileOpen(false);
      flash("\u6863\u6848\u5DF2\u4FDD\u5B58");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const checklist = overview?.checklist ?? [];
  const doneCount = checklist.filter((i) => i.done).length;
  const ratio = checklist.length > 0 ? doneCount / checklist.length : 0;
  const scores = overview?.score.scores;
  const total = scores?.total?.score ?? null;
  const heat = (0, import_react.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const s of sessions) {
      const b = s.body_required ?? {};
      const p = s.psych_required ?? {};
      let hits = 0;
      if (b.protein_g !== void 0 && b.protein_g !== null) hits += 1;
      if (b.resistance_done === true) hits += 1;
      if (b.progressive_overload === true) hits += 1;
      if (p.self_rating_1_to_5 !== void 0 || p.execution_likert !== void 0) hits += 1;
      if (p.classification || p.feedback_category) hits += 1;
      map.set(s.date, { hits, score: null });
    }
    const days = [];
    const now = /* @__PURE__ */ new Date();
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 864e5);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: key, hits: map.get(key)?.hits ?? 0 });
    }
    return days;
  }, [sessions]);
  const ring = 2 * Math.PI * 34;
  const ringDash = ring * Math.min(1, (total ?? 0) / 200);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "ha-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-title", children: "\u5065\u5EB7\u8BC4\u4F30" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "ha-date",
          type: "date",
          value: date,
          max: localToday(),
          onChange: (e) => setDate(e.target.value || localToday())
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-grow" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `ha-dot${connected ? " ok" : ""}`, title: connected ? "\u5DF2\u8FDE\u63A5" : "\u672A\u8FDE\u63A5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u5237\u65B0\u6570\u636E", onClick: () => void load(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: spinning ? "ha-spin" : "", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.refresh }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u8BBE\u7F6E", onClick: () => void openSettings(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.gear }) })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-banner err", children: error }) : null,
    notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-banner ok", children: notice }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "ha-col ha-col-left", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block ha-block-grow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4ECA\u5929\u7684\u60C5\u51B5" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: date })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              className: `ha-composer${dragging ? " dragging" : ""}`,
              onDragOver: (e) => {
                e.preventDefault();
                setDragging(true);
              },
              onDragLeave: () => setDragging(false),
              onDrop: (e) => {
                e.preventDefault();
                setDragging(false);
                void addFiles(Array.from(e.dataTransfer.files ?? []));
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "textarea",
                  {
                    ref: textRef,
                    className: "ha-textarea",
                    placeholder: "\u4F8B\u5982\uFF1A\u6297\u963B 45 \u5206\u949F\u52A0\u4E86\u5367\u63A8\u91CD\u91CF\uFF0C\u86CB\u767D\u8D28 140g\uFF0C\u72B6\u6001 5 \u5206\uFF0C\u542C\u53D6\u5EFA\u8BAE\u4E0D\u5185\u8017",
                    value: text,
                    onChange: (e) => setText(e.target.value),
                    onPaste: (e) => void onPaste(e),
                    onKeyDown: (e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
                    }
                  }
                ),
                attachments.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-chips", children: attachments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-chip", title: item.name, children: [
                  item.thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: item.thumb, alt: "", className: "ha-thumb" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: item.kind === "image" ? ICON.image : ICON.file, size: 14 }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-chip-name", children: item.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `ha-chip-state ${item.status}`, children: item.status === "done" ? "\u5DF2\u5B8C\u6210" : item.status === "error" ? "\u5931\u8D25" : "\u5F85\u89E3\u6790" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-chip-x", title: "\u79FB\u9664", onClick: () => removeAttachment(item.id), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.close, size: 12 }) })
                ] }, item.id)) }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-composer-bar", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u9009\u62E9\u6587\u4EF6\uFF08CSV / Excel / \u56FE\u7247\uFF09", onClick: () => fileRef.current?.click(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.attach }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "input",
                    {
                      ref: fileRef,
                      type: "file",
                      multiple: true,
                      hidden: true,
                      accept: ".csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp",
                      onChange: (e) => {
                        void addFiles(Array.from(e.target.files ?? []));
                        e.target.value = "";
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u62D6\u5165\u6587\u4EF6 \xB7 \u6216 \u2318V \u7C98\u8D34\u56FE\u7247 \xB7 \u2318Enter \u63D0\u4EA4" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-grow" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy || !text.trim() && attachments.length === 0, onClick: () => void submit(), children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u8BB0\u5F55" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block ha-block-grow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4ECA\u5929\u7684\u5FC5\u586B" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-muted", children: [
              doneCount,
              "/",
              checklist.length,
              " \u5DF2\u5B8C\u6210"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-progress", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${ratio * 100}%` } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list", children: checklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              className: "ha-row",
              "data-done": item.done,
              onClick: () => {
                if (item.done) return;
                const snippet = {
                  protein: "\u86CB\u767D\u8D28120g",
                  resistance: "\u6297\u963B45\u5206\u949F",
                  overload: "\u52A0\u4E86\u91CD\u91CF",
                  rating: "\u72B6\u60014\u5206",
                  feedback: "\u542C\u53D6\u5EFA\u8BAE"
                };
                const piece = snippet[item.key] ?? item.label;
                setText((cur) => cur.includes(piece) ? cur : `${cur}${cur ? "\uFF0C" : ""}${piece}`);
                textRef.current?.focus();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-row-icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: item.done ? ICON.check : ICON.circle, size: 15 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-row-label", children: item.label }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-row-hint", children: item.done ? item.value || "\u5DF2\u8BB0\u5F55" : item.hint }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `ha-pill${item.done ? " ok" : ""}`, children: item.done ? "\u5DF2\u5B8C\u6210" : "\u5F85\u8865" })
              ]
            },
            item.key
          )) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "ha-col ha-col-right", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4E03\u5929\u8BC4\u4F30" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-muted", children: [
              overview?.distinctDates ?? 0,
              "/7 \u5929"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-score", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "92", height: "92", viewBox: "0 0 92 92", className: "ha-ring", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "46", cy: "46", r: "34", fill: "none", stroke: "rgba(255,255,255,.08)", strokeWidth: "7" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "circle",
                {
                  cx: "46",
                  cy: "46",
                  r: "34",
                  fill: "none",
                  stroke: "#4faa80",
                  strokeWidth: "7",
                  strokeLinecap: "round",
                  strokeDasharray: `${ringDash} ${ring}`,
                  transform: "rotate(-90 46 46)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: "46", y: "44", textAnchor: "middle", className: "ha-ring-num", children: total === null ? "\u2014" : Math.round(total) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: "46", y: "58", textAnchor: "middle", className: "ha-ring-sub", children: "/ 200" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-bars", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-bar-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-bar-label", children: "\u8EAB\u4F53" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${Math.min(100, scores?.body?.score ?? 0)}%` } }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-bar-num", children: [
                  scores?.body?.score === null || scores?.body?.score === void 0 ? "\u2014" : Math.round(scores.body.score),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "/100" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-bar-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-bar-label", children: "\u5FC3\u7406" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${Math.min(100, scores?.psych?.score ?? 0)}%` } }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-bar-num", children: [
                  scores?.psych?.score === null || scores?.psych?.score === void 0 ? "\u2014" : Math.round(scores.psych.score),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "/100" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-status", children: modeText(overview) }),
          overview && overview.profileMissing.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: "ha-primary ha-profile-cta", onClick: openProfile, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.user, size: 14 }),
            " \u7ACB\u5373\u8865\u5168\u57FA\u7840\u6863\u6848"
          ] }) : null,
          overview?.score.next_steps?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "ha-steps", children: overview.score.next_steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: s }, s)) }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block ha-block-grow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6700\u8FD1 14 \u5929" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u8D8A\u6EE1\u8868\u793A\u5FC5\u586B\u8D8A\u9F50" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-heat", children: heat.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              className: `ha-cell lv${heatLevel(day.hits)}`,
              title: `${day.date}\uFF1A${day.hits}/5 \u9879\u5FC5\u586B`,
              onClick: () => setDate(day.date)
            },
            day.date
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-ticks", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: heat[0]?.date.slice(5) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: heat[6]?.date.slice(5) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: heat[13]?.date.slice(5) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-legend", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv0" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv1" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv2" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv3" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv4" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "5 \u9879" })
          ] }),
          heat.every((d) => d.hits === 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-empty", children: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\uFF0C\u5148\u5728\u5DE6\u8FB9\u5199\u4E00\u6761\u3002" }) : null
        ] })
      ] })
    ] }),
    settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-scrim", onClick: () => setSettingsOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BBE\u7F6E" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setSettingsOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-group-title", children: "\u6A21\u578B\u4E0E\u8BC6\u56FE\u5F15\u64CE" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6587\u672C\u62BD\u53D6\u6A21\u578B \xB7 provider" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.extractionProvider ?? ""),
                placeholder: "\u7559\u7A7A = \u6CBF\u7528 DSH \u9ED8\u8BA4",
                onChange: (e) => setSettings((c) => ({ ...c, extractionProvider: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6587\u672C\u62BD\u53D6\u6A21\u578B \xB7 model" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.extractionModel ?? ""),
                placeholder: "\u7559\u7A7A = \u6CBF\u7528 DSH \u9ED8\u8BA4",
                onChange: (e) => setSettings((c) => ({ ...c, extractionModel: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BC6\u56FE\u901A\u9053 \xB7 provider" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.visionProvider ?? ""),
                placeholder: "\u7559\u7A7A = \u4E0E\u62BD\u53D6\u6A21\u578B\u76F8\u540C",
                onChange: (e) => setSettings((c) => ({ ...c, visionProvider: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BC6\u56FE\u901A\u9053 \xB7 model" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.visionModel ?? ""),
                placeholder: "\u7559\u7A7A = \u4E0E\u62BD\u53D6\u6A21\u578B\u76F8\u540C",
                onChange: (e) => setSettings((c) => ({ ...c, visionModel: e.target.value }))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-group-title", children: "\u81EA\u52A8\u8FFD\u95EE\u4E0E\u5DE5\u4F5C\u533A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.autoPromptOnOpen !== false,
                onChange: (e) => setSettings((c) => ({ ...c, autoPromptOnOpen: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6253\u5F00 DSH \u81EA\u52A8\u68C0\u6D4B\u5E76\u8FFD\u95EE\uFF08\u6BCF\u5929\u6700\u591A\u4E00\u6B21\uFF09" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.dailyAskEnabled !== false,
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskEnabled: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5B9A\u65F6\u8FFD\u95EE\u4ECA\u65E5\u7F3A\u9879" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8FFD\u95EE\u5DE5\u4F5C\u533A" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                className: "ha-input",
                value: String(settings.dailyAskWorkspace ?? ""),
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskWorkspace: e.target.value })),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\uFF08\u5F53\u524D\u4F1A\u8BDD\u5DE5\u4F5C\u533A\uFF09" }),
                  workspaces.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: w.path, children: w.name }, w.path))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6216\u624B\u52A8\u8F93\u5165\u8DEF\u5F84" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.dailyAskWorkspace ?? ""),
                placeholder: "/path/to/workspace",
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskWorkspace: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5B9A\u65F6\u65F6\u523B" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.dailyAskTime ?? ""),
                placeholder: "HH:MM\uFF0C\u7559\u7A7A=\u53EA\u5728\u6253\u5F00\u65F6",
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskTime: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u672A\u56DE\u590D\u591A\u4E45\u540E\u5347\u7EA7\uFF08\u5C0F\u65F6\uFF09" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: "ha-input",
                type: "number",
                min: 1,
                value: String(settings.escalateHours ?? 5),
                onChange: (e) => setSettings((c) => ({ ...c, escalateHours: Number(e.target.value) || 5 }))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-group-title", children: "\u4EA4\u4E92\u504F\u597D" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.petEnabled !== false,
                onChange: (e) => setSettings((c) => ({ ...c, petEnabled: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u51FA\u5206\u65F6\u8BA9\u684C\u5BA0\u64AD\u62A5\u4E00\u6B21" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.confirmImageUpload !== false,
                onChange: (e) => setSettings((c) => ({ ...c, confirmImageUpload: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u56FE\u7247\u5165\u5E93\u524D\u9700\u8981\u786E\u8BA4" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-ghost", onClick: () => setSettingsOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void saveSettings(), children: "\u4FDD\u5B58\u8BBE\u7F6E" })
      ] })
    ] }) }) : null,
    profileOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-scrim", onClick: () => setProfileOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal ha-modal-sm", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8865\u5168\u57FA\u7840\u6863\u6848" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setProfileOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-muted", style: { margin: 0 }, children: "\u516D\u9879\u586B\u5B8C\u7ACB\u523B\u89E3\u9501\u8BC4\u5206\u3002\u7F3A\u9879\u4E0D\u4F1A\u4F30\u7B97\u3002" }),
        [
          ["height_cm", "\u8EAB\u9AD8\uFF08cm\uFF09"],
          ["weight_kg", "\u4F53\u91CD\uFF08kg\uFF09"],
          ["age", "\u5E74\u9F84"],
          ["training_years", "\u8BAD\u7EC3\u5E74\u9650"]
        ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "ha-input",
              type: "number",
              value: profile[key] ?? "",
              onChange: (e) => setProfile((c) => ({ ...c, [key]: e.target.value }))
            }
          )
        ] }, key)),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6027\u522B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              className: "ha-input",
              value: profile.sex ?? "",
              onChange: (e) => setProfile((c) => ({ ...c, sex: e.target.value })),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\u672A\u586B" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "male", children: "male" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "female", children: "female" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "other", children: "other" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: profile.injury === "1",
              onChange: (e) => setProfile((c) => ({ ...c, injury: e.target.checked ? "1" : "" }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6709\u4F24\u75C5\uFF08\u53EA\u4F5C\u5907\u6CE8\uFF0C\u4E0D\u56E0\u6B64\u505C\u5206\uFF09" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-ghost", onClick: () => setProfileOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void saveProfile(), children: "\u4FDD\u5B58\u5E76\u89E3\u9501\u8BC4\u5206" })
      ] })
    ] }) }) : null,
    confirming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-scrim", onClick: () => setConfirming(null), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal ha-modal-sm", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u786E\u8BA4\u5199\u5165" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setConfirming(null), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-body", children: [
        confirming.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-muted", style: { margin: 0 }, children: confirming.warning }) : null,
        confirming.visionModel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "ha-muted", style: { margin: 0 }, children: [
          "\u8BC6\u56FE\u901A\u9053\uFF1A",
          confirming.visionModel
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: "ha-pre", children: JSON.stringify(confirming.draft, null, 2) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-ghost", onClick: () => setConfirming(null), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void commitDraft(), children: "\u786E\u8BA4\u5199\u5165" })
      ] })
    ] }) }) : null
  ] });
}
function HealthNavIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { path: ICON.check, size: 16 });
}

// src/client/styles.ts
var STYLE_ID = "dsh-health-assessment-styles";
var CSS = `
.ha-root {
  display: flex; flex-direction: column; height: 100%; min-height: 100%;
  background: transparent; color: inherit; font-size: 13px; line-height: 1.5;
}
.ha-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px; flex: 0 0 auto;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.ha-title { font-weight: 600; }
.ha-date {
  background: #1f2125; border: 1px solid rgba(255,255,255,.08); border-radius: 8px;
  color: inherit; padding: 5px 8px; font: inherit; font-size: 12px; color-scheme: dark;
}
.ha-grow { flex: 1; }
.ha-dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7078; flex: 0 0 auto; }
.ha-dot.ok { background: #4faa80; }
.ha-icon {
  width: 32px; height: 32px; flex: 0 0 auto; border-radius: 8px;
  border: 1px solid rgba(255,255,255,.08); background: #1f2125; color: #c9ced6;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  padding: 0; transition: background .15s, color .15s;
}
.ha-icon:hover { background: #262a30; color: #fff; }
.ha-spin { display: inline-flex; animation: ha-rotate .9s linear infinite; }
@keyframes ha-rotate { to { transform: rotate(360deg); } }
.ha-banner { padding: 8px 16px; font-size: 12px; }
.ha-banner.err { background: rgba(210,102,102,.12); color: #e08b8b; }
.ha-banner.ok { background: rgba(79,170,128,.12); color: #6cc79a; }

/* \u5168\u9AD8\u53CC\u680F\uFF1A\u4E24\u680F\u90FD\u62C9\u4F38\u5230\u5E95 */
.ha-main {
  flex: 1 1 auto; min-height: 0; display: grid;
  grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 16px; padding: 16px;
}
.ha-col { display: flex; flex-direction: column; gap: 16px; min-height: 0; min-width: 0; }
.ha-block {
  background: #1c1e22; border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px; min-height: 0;
}
.ha-block-grow { flex: 1 1 auto; overflow: auto; }
.ha-block-head { display: flex; justify-content: space-between; align-items: center; color: #9aa0a8; font-size: 12px; flex: 0 0 auto; }
.ha-muted { color: #7f858d; font-size: 12px; }

/* \u8F93\u5165\u533A */
.ha-composer {
  display: flex; flex-direction: column; gap: 10px; flex: 1 1 auto; min-height: 0;
  border: 1px dashed transparent; border-radius: 10px; transition: border-color .15s, background .15s;
}
.ha-composer.dragging { border-color: #3757c9; background: rgba(55,87,201,.06); }
.ha-textarea {
  flex: 1 1 auto; min-height: 110px; resize: none; width: 100%;
  background: #22252a; border: 1px solid rgba(255,255,255,.06); border-radius: 9px;
  color: inherit; font: inherit; padding: 10px 12px;
}
.ha-textarea:focus { outline: none; border-color: rgba(255,255,255,.18); }
.ha-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ha-chip {
  display: inline-flex; align-items: center; gap: 6px; max-width: 260px;
  background: #22252a; border-radius: 8px; padding: 4px 6px 4px 8px; font-size: 12px;
}
.ha-thumb { width: 22px; height: 22px; border-radius: 4px; object-fit: cover; }
.ha-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #c9ced6; }
.ha-chip-state { font-size: 11px; color: #7f858d; flex: 0 0 auto; }
.ha-chip-state.done { color: #6cc79a; }
.ha-chip-state.error { color: #e08b8b; }
.ha-chip-x {
  width: 20px; height: 20px; border: 0; background: transparent; color: #7f858d;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; border-radius: 4px;
}
.ha-chip-x:hover { background: rgba(255,255,255,.08); color: #fff; }
.ha-composer-bar { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.ha-primary {
  background: #3757c9; border: 0; color: #fff; border-radius: 9px;
  padding: 8px 16px; font: inherit; cursor: pointer; display: inline-flex;
  align-items: center; gap: 6px; justify-content: center;
}
.ha-primary:hover { background: #3d5fdb; }
.ha-primary:disabled { opacity: .5; cursor: default; }
.ha-ghost {
  background: transparent; border: 1px solid rgba(255,255,255,.12); color: #c9ced6;
  border-radius: 9px; padding: 8px 16px; font: inherit; cursor: pointer;
}
.ha-ghost:hover { background: rgba(255,255,255,.06); }

/* \u6E05\u5355 */
.ha-progress { height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden; flex: 0 0 auto; }
.ha-progress i { display: block; height: 100%; background: #4faa80; border-radius: 2px; transition: width .25s; }
.ha-list { display: flex; flex-direction: column; gap: 2px; }
.ha-row {
  display: flex; align-items: center; gap: 10px; padding: 9px 8px; width: 100%;
  background: transparent; border: 0; border-radius: 8px; color: inherit;
  font: inherit; text-align: left; cursor: pointer;
}
.ha-row:hover { background: rgba(255,255,255,.04); }
.ha-row[data-done='true'] { cursor: default; }
.ha-row[data-done='true']:hover { background: transparent; }
.ha-row-icon { width: 18px; flex: 0 0 auto; display: inline-flex; color: #8b9099; }
.ha-row[data-done='true'] .ha-row-icon { color: #4faa80; }
.ha-row-label { min-width: 132px; flex: 0 0 auto; white-space: nowrap; }
.ha-row-hint { flex: 1; color: #7f858d; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ha-row[data-done='true'] .ha-row-hint { color: #6cc79a; }
.ha-pill {
  flex: 0 0 auto; font-size: 11px; padding: 2px 8px; border-radius: 999px;
  background: rgba(255,255,255,.06); color: #9aa0a8; white-space: nowrap;
}
.ha-pill.ok { background: rgba(79,170,128,.16); color: #6cc79a; }

/* \u4EEA\u8868\u76D8\uFF1A\u73AF\u5F62 + \u53CC\u8FDB\u5EA6\u6761 */
.ha-score { display: flex; align-items: center; gap: 18px; }
.ha-ring { flex: 0 0 auto; }
.ha-ring-num { fill: #e7e8ea; font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ha-ring-sub { fill: #7f858d; font-size: 10px; }
.ha-bars { flex: 1 1 auto; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ha-bar-row { display: flex; align-items: center; gap: 8px; }
.ha-bar-label { flex: 0 0 auto; width: 32px; color: #9aa0a8; font-size: 12px; white-space: nowrap; }
.ha-bar { flex: 1 1 auto; height: 6px; background: rgba(255,255,255,.08); border-radius: 3px; overflow: hidden; min-width: 0; }
.ha-bar i { display: block; height: 100%; background: #3757c9; border-radius: 3px; transition: width .25s; }
.ha-bar-num { flex: 0 0 auto; font-variant-numeric: tabular-nums; font-size: 12px; white-space: nowrap; min-width: 52px; text-align: right; }
.ha-bar-num em { font-style: normal; color: #7f858d; font-size: 11px; }
.ha-status { margin: 0; color: #9aa0a8; font-size: 12px; }
.ha-profile-cta { align-self: flex-start; }
.ha-steps { margin: 0; padding-left: 16px; color: #c9ced6; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }

/* \u70ED\u529B\u56FE */
.ha-heat { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; }
.ha-cell { aspect-ratio: 1; border-radius: 3px; background: #22252a; border: 0; cursor: pointer; padding: 0; }
.ha-cell:hover { outline: 1px solid rgba(255,255,255,.3); outline-offset: 1px; }
.ha-cell.lv1 { background: #2f4a3f; }
.ha-cell.lv2 { background: #33604c; }
.ha-cell.lv3 { background: #3d7d61; }
.ha-cell.lv4 { background: #4faa80; }
.ha-ticks { display: flex; justify-content: space-between; color: #7f858d; font-size: 10px; margin-top: 2px; }
.ha-legend { display: flex; align-items: center; gap: 4px; color: #7f858d; font-size: 11px; }
.ha-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; background: #22252a; }
.ha-legend i.lv1 { background: #2f4a3f; }
.ha-legend i.lv2 { background: #33604c; }
.ha-legend i.lv3 { background: #3d7d61; }
.ha-legend i.lv4 { background: #4faa80; }
.ha-empty { margin: 0; color: #7f858d; font-size: 12px; }

/* \u5C45\u4E2D Modal */
.ha-scrim {
  position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,.45);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ha-modal {
  width: min(560px, 92vw); max-height: 82vh; display: flex; flex-direction: column;
  background: #1b1d21; border-radius: 14px; border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 24px 64px rgba(0,0,0,.5); overflow: hidden;
}
.ha-modal-sm { width: min(460px, 92vw); }
.ha-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,.07); font-weight: 600;
}
.ha-modal-body { flex: 1 1 auto; overflow: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 16px; }
.ha-modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 18px; border-top: 1px solid rgba(255,255,255,.07);
}
.ha-group { display: flex; flex-direction: column; gap: 10px; }
.ha-group-title { color: #9aa0a8; font-size: 12px; padding-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,.05); }
.ha-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: #9aa0a8; }
.ha-input {
  background: #22252a; border: 1px solid rgba(255,255,255,.06); border-radius: 8px;
  color: inherit; font: inherit; padding: 8px 10px; width: 100%;
}
.ha-input:focus { outline: none; border-color: rgba(255,255,255,.18); }
.ha-check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #c9ced6; }
.ha-check input, .ha-field input[type=checkbox] { width: auto; }
.ha-pre {
  margin: 0; background: #22252a; border-radius: 8px; padding: 12px;
  font-size: 11px; line-height: 1.5; max-height: 260px; overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #c9ced6;
}

@media (max-width: 980px) {
  .ha-main { grid-template-columns: 1fr; grid-template-rows: auto auto; }
}
`;
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// src/client/app.ts
var ID = "health-assessment";
var ORDER = 24;
function makeFactory() {
  return (require2) => {
    const module2 = { exports: {} };
    const runtime = require2("react/jsx-runtime");
    const NavIcon = () => runtime.jsx(HealthNavIcon, {});
    const View = () => runtime.jsx(HealthView, {});
    function registerEntries(ctx) {
      const disposers = [];
      ctx.slots.inject("main", function* registerMain() {
        yield ctx.slots.register(
          {
            name: "main",
            key: ID,
            children: { [`main.${ID}`]: { kind: "single", scope: "session-maybe" } }
          },
          (props) => {
            const renderSlot = props?.renderSlot;
            return renderSlot ? renderSlot(`main.${ID}`, {}) : runtime.jsx(HealthView, {});
          }
        );
        yield ctx.slots.register({ name: `main.${ID}` }, View);
      });
      ctx.slots.inject("conversation.view", function* registerView() {
        yield ctx.slots.register(
          { name: "conversation.view", id: ID, order: ORDER, label: () => "\u5065\u5EB7\u8BC4\u4F30" },
          View
        );
      });
      ctx.slots.inject("sidebar.panellist", function* registerNav() {
        yield ctx.slots.register(
          { name: "sidebar.panellist", id: ID, order: ORDER, label: () => "\u5065\u5EB7\u8BC4\u4F30" },
          NavIcon
        );
      });
      return () => {
        for (const dispose of disposers.reverse()) dispose();
      };
    }
    const name = "dsh-health-assessment";
    const inject = ["slots"];
    function apply(ctx) {
      injectStyles();
      const dispose = registerEntries(ctx);
      ctx.effect?.(() => () => dispose(), "dsh-health-assessment: native entries");
    }
    module2.exports = { name, inject, apply };
    return module2.exports;
  };
}

    })(module, exports, require);
    return module.exports;
  }

  loader.load({
    id: 'dsh-health-assessment',
    factory: function (require) {
      var mod = loadBundle(require).makeFactory()(require);
      var originalApply = mod.apply;
      mod.apply = function (ctx) {
        try {
          originalApply(ctx);
          fetch('/health-assessment-8221/client-hello', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'apply' })
          }).catch(function () {});
        } catch (error) {
          fetch('/health-assessment-8221/client-hello', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'apply', error: String(error && error.stack || error) })
          }).catch(function () {});
          throw error;
        }
      };
      return mod;
    }
  });
})();
