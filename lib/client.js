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
var import_react2 = require("react");

// src/client/optional.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var PREFIX = "/health-assessment-8221";
function levelOf(value) {
  if (typeof value === "number" && value >= 1 && value <= 5) return Math.round(value);
  return 0;
}
function hoursOf(value) {
  if (value && typeof value === "object" && "hours" in value) {
    const hours = Number(value.hours);
    return Number.isFinite(hours) ? String(hours) : "";
  }
  return "";
}
function OptionalDialog(props) {
  const [groups, setGroups] = (0, import_react.useState)([]);
  const [hints, setHints] = (0, import_react.useState)({});
  const [draft, setDraft] = (0, import_react.useState)({});
  const [open, setOpen] = (0, import_react.useState)("sleep");
  const [error, setError] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    setDraft({ ...props.written });
    let alive = true;
    void (async () => {
      try {
        const response = await fetch(`${PREFIX}/optional/catalog`, { credentials: "same-origin" });
        const payload = await response.json();
        if (!alive) return;
        setGroups(payload.groups ?? []);
        setHints(payload.hints ?? {});
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
    return () => {
      alive = false;
    };
  }, [props.date]);
  const writtenCount = (0, import_react.useMemo)(
    () => Object.values(draft).filter((value) => value !== null && value !== void 0).length,
    [draft]
  );
  const setLevel = (0, import_react.useCallback)((key, level) => {
    setDraft((current) => {
      const next = { ...current };
      if (next[key] === level) delete next[key];
      else next[key] = level;
      return next;
    });
  }, []);
  const clear = (0, import_react.useCallback)((key) => {
    setDraft((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const items = {};
      for (const [key, value] of Object.entries(draft)) {
        if (value === null || value === void 0 || value === "") continue;
        items[key] = value;
      }
      const response = await fetch(`${PREFIX}/checkin/optional`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: props.date, items })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `\u4FDD\u5B58\u5931\u8D25\uFF1A${response.status}`);
      props.onSaved();
      props.onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-scrim", onClick: props.onClose, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal ha-modal-wide", onClick: (event) => event.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        "\u9009\u586B \xB7 ",
        props.date
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: props.onClose, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.75",
          strokeLinecap: "round",
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 6 6 18M6 6l12 12" })
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "ha-muted", style: { margin: 0 }, children: [
        "\u53EA\u5199\u4ECA\u5929\u5B9E\u9645\u53D1\u751F\u7684\u5C0F\u9879\uFF1B\u6CA1\u5199\u7684\u4E0D\u8BB0 0 \u5206\uFF0C\u8BB0\u300C\u65E0\u6CD5\u8BC4\u5206\u300D\u3002\u5DF2\u5199 ",
        writtenCount,
        " \u9879\u3002"
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-error-text", children: error }) : null,
      groups.map((group) => {
        const expanded = open === group.id;
        const groupWritten = group.items.filter((item) => draft[item.key] !== void 0 && draft[item.key] !== null).length;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-acc", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: "ha-acc-head", onClick: () => setOpen(expanded ? "" : group.id), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `ha-acc-caret${expanded ? " open" : ""}`, children: "\u25B8" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: group.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-muted", children: [
              group.side === "body" ? "\u8EAB\u4F53" : "\u5FC3\u7406",
              " \xB7 ",
              groupWritten,
              "/",
              group.items.length
            ] })
          ] }),
          expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-acc-body", children: group.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-opt-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-opt-label", title: hints[item.key] ?? "", children: item.key }),
            item.hours ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-opt-hours", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  className: "ha-input ha-input-inline",
                  type: "number",
                  step: "0.5",
                  min: "0",
                  max: "24",
                  placeholder: "\u5C0F\u65F6",
                  value: hoursOf(draft[item.key]),
                  onChange: (event) => {
                    const value = event.target.value;
                    setDraft((current) => {
                      const next = { ...current };
                      if (value === "") delete next[item.key];
                      else next[item.key] = { hours: Number(value) };
                      return next;
                    });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u5C0F\u65F6" })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-levels", children: [1, 2, 3, 4, 5].map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                className: "ha-level",
                "data-active": levelOf(draft[item.key]) === level,
                title: hints[item.key] ?? `${level} \u5206`,
                onClick: () => setLevel(item.key, level),
                children: level
              },
              level
            )) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                className: "ha-chip-x",
                title: "\u6E05\u9664\u8FD9\u4E00\u9879",
                onClick: () => clear(item.key),
                disabled: draft[item.key] === void 0 || draft[item.key] === null,
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "svg",
                  {
                    width: "12",
                    height: "12",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    strokeLinecap: "round",
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 6 6 18M6 6l12 12" })
                  }
                )
              }
            )
          ] }, item.key)) }) : null
        ] }, group.id);
      })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-modal-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", style: { marginRight: "auto" }, children: "\u9009\u586B\u53EA\u5728\u5199\u8FC7\u7684\u5C0F\u9879\u4E4B\u95F4\u5E73\u5206 20 \u5206\uFF08\u6BCF\u4FA7\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-ghost", onClick: props.onClose, children: "\u53D6\u6D88" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: saving || props.busy, onClick: () => void save(), children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u9009\u586B" })
    ] })
  ] }) });
}

// src/client/health.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var PREFIX2 = "/health-assessment-8221";
function Icon({ path, size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: path })
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
  const response = await fetch(`${PREFIX2}${path}`, {
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
  const [date, setDate] = (0, import_react2.useState)(localToday());
  const [overview, setOverview] = (0, import_react2.useState)(null);
  const [sessions, setSessions] = (0, import_react2.useState)([]);
  const [text, setText] = (0, import_react2.useState)("");
  const [attachments, setAttachments] = (0, import_react2.useState)([]);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [spinning, setSpinning] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const [notice, setNotice] = (0, import_react2.useState)("");
  const [connected, setConnected] = (0, import_react2.useState)(false);
  const [dragging, setDragging] = (0, import_react2.useState)(false);
  const [settingsOpen, setSettingsOpen] = (0, import_react2.useState)(false);
  const [settings, setSettings] = (0, import_react2.useState)({});
  const [workspaces, setWorkspaces] = (0, import_react2.useState)([]);
  const [profileOpen, setProfileOpen] = (0, import_react2.useState)(false);
  const [profile, setProfile] = (0, import_react2.useState)({});
  const [view, setView] = (0, import_react2.useState)("main");
  const [csvText, setCsvText] = (0, import_react2.useState)("");
  const [optionalOpen, setOptionalOpen] = (0, import_react2.useState)(false);
  const [detailOpen, setDetailOpen] = (0, import_react2.useState)(false);
  const [detailDate, setDetailDate] = (0, import_react2.useState)("");
  const [detail, setDetail] = (0, import_react2.useState)(null);
  const [showParts, setShowParts] = (0, import_react2.useState)(false);
  const [targets, setTargets] = (0, import_react2.useState)(null);
  const [modelCatalog, setModelCatalog] = (0, import_react2.useState)([]);
  const [libraries, setLibraries] = (0, import_react2.useState)([]);
  const [activeLibrary, setActiveLibrary] = (0, import_react2.useState)("");
  const [logRows, setLogRows] = (0, import_react2.useState)([]);
  const [diag, setDiag] = (0, import_react2.useState)("");
  const [newLibrary, setNewLibrary] = (0, import_react2.useState)("");
  const [importPath, setImportPath] = (0, import_react2.useState)("");
  const [confirming, setConfirming] = (0, import_react2.useState)(null);
  const textRef = (0, import_react2.useRef)(null);
  const fileRef = (0, import_react2.useRef)(null);
  const load = (0, import_react2.useCallback)(async () => {
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
  (0, import_react2.useEffect)(() => {
    void load();
  }, [load]);
  (0, import_react2.useEffect)(() => {
    if (!settingsOpen && !profileOpen && !confirming && !optionalOpen && !detailOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setSettingsOpen(false);
      setProfileOpen(false);
      setConfirming(null);
      setOptionalOpen(false);
      setDetailOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, profileOpen, confirming, optionalOpen, detailOpen]);
  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3600);
  };
  const addFiles = (0, import_react2.useCallback)(async (files) => {
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
  const onPaste = (0, import_react2.useCallback)(async (event) => {
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
    void (async () => {
      try {
        const [t, m, l, g] = await Promise.all([
          request("/targets"),
          request("/models"),
          request("/libraries"),
          request("/log")
        ]);
        setTargets(t);
        setModelCatalog(m.providers ?? []);
        setLibraries(l.libraries ?? []);
        setActiveLibrary(l.active ?? "");
        setLogRows(g.rows ?? []);
      } catch {
      }
    })();
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
  const flagOnly = async () => {
    const flags = overview?.redFlags ?? [];
    if (flags.length === 0) return;
    setBusy(true);
    try {
      await request("/checkin/flag-only", {
        method: "POST",
        body: JSON.stringify({ date, flags })
      });
      flash("\u5DF2\u53EA\u8BB0\u5F55\u8FD9\u4E00\u5929\u7684\u7EA2\u65D7");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const importCsv = async () => {
    if (!csvText.trim() || busy) return;
    setBusy(true);
    try {
      const result = await request("/checkin/table", {
        method: "POST",
        body: JSON.stringify({ csv: csvText, date })
      });
      setCsvText("");
      flash(`\u5DF2\u5BFC\u5165 ${result.imported} \u5929`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const download = async (format) => {
    try {
      const result = await request(`/export?format=${format}`);
      const blob = new Blob([result.body], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 2e3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  const runDiagnostic = async (path, label) => {
    setDiag(`${label}\u2026`);
    try {
      const result = await request(path, { method: "POST", body: "{}" });
      setDiag(`${label}\uFF1A${JSON.stringify(result.detail ?? result).slice(0, 220)}`);
    } catch (cause) {
      setDiag(`${label}\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    }
  };
  const saveTargets = async (perKg, per7d, confirm) => {
    try {
      const result = await request("/targets", {
        method: "POST",
        body: JSON.stringify({ protein_g_per_kg: perKg, resistance_sessions_per_7d: per7d, confirm })
      });
      if (!result.saved) {
        flash(result.range);
        return false;
      }
      flash("\u8BA1\u5206\u6807\u51C6\u5DF2\u4FDD\u5B58");
      await load();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    }
  };
  const switchLibrary = async (path) => {
    try {
      const result = await request("/libraries", {
        method: "POST",
        body: JSON.stringify({ path: path || "", switch: true })
      });
      setLibraries(result.libraries ?? []);
      setActiveLibrary(result.active ?? "");
      flash(path ? `\u5DF2\u5207\u5230 ${path}` : "\u5DF2\u5207\u56DE\u9ED8\u8BA4\u5E93");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  const addLibrary = async () => {
    const path = newLibrary.trim();
    if (!path) return;
    await switchLibrary(path);
    setNewLibrary("");
  };
  const runImport = async () => {
    const path = importPath.trim();
    if (!path) return;
    setBusy(true);
    try {
      const result = await request("/import", {
        method: "POST",
        body: JSON.stringify({ sourceRoot: path })
      });
      flash(`\u5BFC\u5165 ${result.imported} \u4E2A\u6587\u4EF6\uFF0C\u8DF3\u8FC7 ${result.skipped} \u4E2A`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const openDetail = async (day) => {
    setDetailDate(day);
    setDetailOpen(true);
    try {
      const result = await request(`/session?date=${day}`);
      setDetail(result.session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  const deleteDay = async () => {
    if (!detailDate) return;
    setBusy(true);
    try {
      await request(`/session?date=${detailDate}`, { method: "DELETE" });
      setDetailOpen(false);
      flash(`\u5DF2\u5220\u9664 ${detailDate}`);
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
  const heat = (0, import_react2.useMemo)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "ha-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-title", children: "\u5065\u5EB7\u8BC4\u4F30" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          className: "ha-date",
          type: "date",
          value: date,
          max: localToday(),
          onChange: (e) => setDate(e.target.value || localToday())
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-switch", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { "data-active": view === "main", onClick: () => setView("main"), children: "\u6253\u5361\u4E0E\u8BC4\u4F30" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { "data-active": view === "history", onClick: () => setView("history"), children: "\u5386\u53F2\u4E0E\u5BFC\u5165" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-grow" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `ha-dot${connected ? " ok" : ""}`, title: connected ? "\u5DF2\u8FDE\u63A5" : "\u672A\u8FDE\u63A5" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u5237\u65B0\u6570\u636E", onClick: () => void load(), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: spinning ? "ha-spin" : "", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.refresh }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u8BBE\u7F6E", onClick: () => void openSettings(), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.gear }) })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-banner err", children: error }) : null,
    notice ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-banner ok", children: notice }) : null,
    view === "main" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "ha-col ha-col-left", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block ha-block-grow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u4ECA\u5929\u7684\u60C5\u51B5" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: date })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                attachments.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-chips", children: attachments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-chip", title: item.name, children: [
                  item.thumb ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: item.thumb, alt: "", className: "ha-thumb" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: item.kind === "image" ? ICON.image : ICON.file, size: 14 }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-chip-name", children: item.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `ha-chip-state ${item.status}`, children: item.status === "done" ? "\u5DF2\u5B8C\u6210" : item.status === "error" ? "\u5931\u8D25" : "\u5F85\u89E3\u6790" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-chip-x", title: "\u79FB\u9664", onClick: () => removeAttachment(item.id), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.close, size: 12 }) })
                ] }, item.id)) }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-composer-bar", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u9009\u62E9\u6587\u4EF6\uFF08CSV / Excel / \u56FE\u7247\uFF09", onClick: () => fileRef.current?.click(), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.attach }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: "\u62D6\u5165\u6587\u4EF6 \xB7 \u6216 \u2318V \u7C98\u8D34\u56FE\u7247 \xB7 \u2318Enter \u63D0\u4EA4" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-grow" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-primary", disabled: busy || !text.trim() && attachments.length === 0, onClick: () => void submit(), children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u8BB0\u5F55" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block ha-block-grow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u4ECA\u5929\u7684\u5FC5\u586B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-row gap8", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-muted", children: [
                doneCount,
                "/",
                checklist.length,
                " \u5DF2\u5B8C\u6210"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "ha-mini", onClick: () => setOptionalOpen(true), children: [
                "\u9009\u586B ",
                overview ? overview.optional.bodyCount + overview.optional.psychCount : 0,
                "/58"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-progress", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { style: { width: `${ratio * 100}%` } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-list", children: checklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-row-icon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: item.done ? ICON.check : ICON.circle, size: 15 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-row-label", children: item.label }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-row-hint", children: item.done ? item.value || "\u5DF2\u8BB0\u5F55" : item.hint }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `ha-pill${item.done ? " ok" : ""}`, children: item.done ? "\u5DF2\u5B8C\u6210" : "\u5F85\u8865" })
              ]
            },
            item.key
          )) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "ha-col ha-col-right", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u4E03\u5929\u8BC4\u4F30" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-muted", children: [
              overview?.distinctDates ?? 0,
              "/7 \u5929"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-score", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "92", height: "92", viewBox: "0 0 92 92", className: "ha-ring", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "46", cy: "46", r: "34", fill: "none", stroke: "rgba(255,255,255,.08)", strokeWidth: "7" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("text", { x: "46", y: "44", textAnchor: "middle", className: "ha-ring-num", children: total === null ? "\u2014" : Math.round(total) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("text", { x: "46", y: "58", textAnchor: "middle", className: "ha-ring-sub", children: "/ 200" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-bars", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-bar-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-bar-label", children: "\u8EAB\u4F53" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-bar", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { style: { width: `${Math.min(100, scores?.body?.score ?? 0)}%` } }) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-bar-num", children: [
                  scores?.body?.score === null || scores?.body?.score === void 0 ? "\u2014" : Math.round(scores.body.score),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", { children: "/100" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-bar-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-bar-label", children: "\u5FC3\u7406" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-bar", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { style: { width: `${Math.min(100, scores?.psych?.score ?? 0)}%` } }) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-bar-num", children: [
                  scores?.psych?.score === null || scores?.psych?.score === void 0 ? "\u2014" : Math.round(scores.psych.score),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", { children: "/100" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-status", children: modeText(overview) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-row gap8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => setShowParts((v) => !v), children: showParts ? "\u6536\u8D77\u660E\u7EC6" : "\u67E5\u770B\u660E\u7EC6" }),
            overview && overview.redFlags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void flagOnly(), children: "\u53EA\u8BB0\u8FD9\u4E00\u5929\uFF08\u4EC5\u7EA2\u65D7\uFF09" }) : null
          ] }),
          showParts ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PartsBreakdown, { overview }) : null,
          overview && overview.profileMissing.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "ha-primary ha-profile-cta", onClick: openProfile, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.user, size: 14 }),
            " \u7ACB\u5373\u8865\u5168\u57FA\u7840\u6863\u6848"
          ] }) : null,
          overview?.score.next_steps?.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "ha-steps", children: overview.score.next_steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: s }, s)) }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block ha-block-grow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6700\u8FD1 14 \u5929" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: "\u8D8A\u6EE1\u8868\u793A\u5FC5\u586B\u8D8A\u9F50" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-heat", children: heat.map((day) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: `ha-cell lv${heatLevel(day.hits)}`,
              title: `${day.date}\uFF1A${day.hits}/5 \u9879\u5FC5\u586B`,
              onClick: () => setDate(day.date)
            },
            day.date
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-ticks", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: heat[0]?.date.slice(5) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: heat[6]?.date.slice(5) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: heat[13]?.date.slice(5) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-legend", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "0" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "lv0" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "lv1" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "lv2" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "lv3" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "lv4" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "5 \u9879" })
          ] }),
          heat.every((d) => d.hits === 0) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-empty", children: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\uFF0C\u5148\u5728\u5DE6\u8FB9\u5199\u4E00\u6761\u3002" }) : null
        ] })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { className: "ha-col ha-col-left", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block ha-block-grow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5BFC\u5165\u8868\u683C" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: "CSV \u7C98\u8D34\u6216\u9009\u62E9\u6587\u4EF6" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          {
            className: "ha-textarea",
            placeholder: "\u65E5\u671F,\u86CB\u767D\u8D28(g),\u65E0\u6C27\u8BAD\u7EC3(\u5206\u949F),\u6267\u884C\u529B\u81EA\u8BC4,\u8BC4\u4EF7\u5206\u7C7B\n2026-11-28,140,45,5,kept_and_changed",
            value: csvText,
            onChange: (e) => setCsvText(e.target.value)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-primary", disabled: busy || !csvText.trim(), onClick: () => void importCsv(), children: "\u5BFC\u5165 CSV" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: "\u4E5F\u53EF\u4EE5\u76F4\u63A5\u62D6\u6587\u4EF6\u5230\u300C\u6253\u5361\u4E0E\u8BC4\u4F30\u300D\u7684\u8F93\u5165\u533A" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { className: "ha-col ha-col-right", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block ha-block-grow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-block-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6700\u8FD1\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-row gap8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-muted", children: [
              sessions.length,
              " \u5929"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void download("csv"), children: "\u5BFC\u51FA CSV" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void download("json"), children: "\u5BFC\u51FA JSON" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-history", children: [
          sessions.slice(0, 60).map((session) => {
            const body = session.body_required ?? {};
            const psych = session.psych_required ?? {};
            const tags = [];
            if (body.protein_g !== void 0 && body.protein_g !== null) tags.push("\u86CB\u767D\u8D28");
            if (body.resistance_done === true) tags.push("\u6297\u963B");
            if (body.progressive_overload === true) tags.push("\u8D85\u8D1F\u8377");
            if (psych.self_rating_1_to_5 !== void 0 || psych.execution_likert !== void 0) tags.push("\u81EA\u8BC4");
            if (psych.classification || psych.feedback_category) tags.push("\u8BC4\u4EF7\u5904\u7406");
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "ha-hrow ha-hrow-btn", onClick: () => void openDetail(session.date), children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-mono", children: session.date }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-tags", children: tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-tag", children: tag }, tag)) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: "\u65E0\u5FC5\u586B" }) })
            ] }, session.date);
          }),
          sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-empty", children: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002" }) : null
        ] })
      ] }) })
    ] }),
    settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-scrim", onClick: () => setSettingsOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u8BBE\u7F6E" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setSettingsOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-group-title", children: "\u6A21\u578B\u4E0E\u8BC6\u56FE\u5F15\u64CE" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            ModelPicker,
            {
              label: "\u6587\u672C\u62BD\u53D6\u6A21\u578B",
              catalog: modelCatalog,
              provider: String(settings.extractionProvider ?? ""),
              model: String(settings.extractionModel ?? ""),
              onChange: (provider, model) => setSettings((c) => ({ ...c, extractionProvider: provider, extractionModel: model }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            ModelPicker,
            {
              label: "\u8BC6\u56FE\u901A\u9053",
              catalog: modelCatalog,
              provider: String(settings.visionProvider ?? ""),
              model: String(settings.visionModel ?? ""),
              emptyHint: "\u7559\u7A7A = \u4E0E\u62BD\u53D6\u6A21\u578B\u76F8\u540C",
              onChange: (provider, model) => setSettings((c) => ({ ...c, visionProvider: provider, visionModel: model }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-group-title", children: "\u81EA\u52A8\u8FFD\u95EE\u4E0E\u5DE5\u4F5C\u533A" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.autoPromptOnOpen !== false,
                onChange: (e) => setSettings((c) => ({ ...c, autoPromptOnOpen: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6253\u5F00 DSH \u81EA\u52A8\u68C0\u6D4B\u5E76\u8FFD\u95EE\uFF08\u6BCF\u5929\u6700\u591A\u4E00\u6B21\uFF09" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.dailyAskEnabled !== false,
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskEnabled: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5B9A\u65F6\u8FFD\u95EE\u4ECA\u65E5\u7F3A\u9879" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u8FFD\u95EE\u5DE5\u4F5C\u533A" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                className: "ha-input",
                value: String(settings.dailyAskWorkspace ?? ""),
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskWorkspace: e.target.value })),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "\uFF08\u5F53\u524D\u4F1A\u8BDD\u5DE5\u4F5C\u533A\uFF09" }),
                  workspaces.map((w) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: w.path, children: w.name }, w.path))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6216\u624B\u52A8\u8F93\u5165\u8DEF\u5F84" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.dailyAskWorkspace ?? ""),
                placeholder: "/path/to/workspace",
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskWorkspace: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5B9A\u65F6\u65F6\u523B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "ha-input",
                value: String(settings.dailyAskTime ?? ""),
                placeholder: "HH:MM\uFF0C\u7559\u7A7A=\u53EA\u5728\u6253\u5F00\u65F6",
                onChange: (e) => setSettings((c) => ({ ...c, dailyAskTime: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u672A\u56DE\u590D\u591A\u4E45\u540E\u5347\u7EA7\uFF08\u5C0F\u65F6\uFF09" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-group-title", children: "\u8BA1\u5206\u6807\u51C6" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u86CB\u767D\u8D28\uFF08\u514B / \u516C\u65A4\u4F53\u91CD\uFF09" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "ha-input",
                type: "number",
                step: "0.1",
                min: "0.5",
                value: String(targets?.protein_g_per_kg ?? 1.6),
                onChange: (e) => setTargets((c) => ({
                  protein_g_per_kg: Number(e.target.value) || 1.6,
                  resistance_sessions_per_7d: c?.resistance_sessions_per_7d ?? 3,
                  targetProteinG: c?.targetProteinG ?? null
                }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6BCF\u5468\u6297\u963B\u6B21\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "ha-input",
                type: "number",
                step: "1",
                min: "1",
                value: String(targets?.resistance_sessions_per_7d ?? 3),
                onChange: (e) => setTargets((c) => ({
                  protein_g_per_kg: c?.protein_g_per_kg ?? 1.6,
                  resistance_sessions_per_7d: Number(e.target.value) || 3,
                  targetProteinG: c?.targetProteinG ?? null
                }))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-row gap8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void saveTargets(
              targets?.protein_g_per_kg ?? 1.6,
              targets?.resistance_sessions_per_7d ?? 3,
              true
            ), children: "\u4FDD\u5B58\u6807\u51C6" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: targets?.targetProteinG ? `\u5F53\u524D\u76EE\u6807 ${targets.targetProteinG} \u514B/\u5929` : "\u5148\u586B\u6863\u6848\u4F53\u91CD\u624D\u80FD\u7B97\u76EE\u6807\u514B\u6570" })
          ] }),
          logRows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "ha-muted", style: { margin: 0 }, children: [
            "\u6700\u8FD1\u4E00\u6B21\u6807\u51C6\u53D8\u66F4\uFF1A",
            String(logRows[logRows.length - 1].sentence ?? "")
          ] }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-group-title", children: "\u8BB0\u5FC6\u5E93" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-muted", style: { margin: 0 }, children: "\u4E00\u4E2A\u8DEF\u5F84\u5C31\u662F\u4E00\u4E2A\u4EBA\uFF1B\u5207\u6362\u5373\u6362\u4EBA\uFF0C\u4E0D\u505A\u8DE8\u5E93\u5408\u5E76\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5F53\u524D\u5E93" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                className: "ha-input",
                value: activeLibrary,
                onChange: (e) => void switchLibrary(e.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "\uFF08\u9ED8\u8BA4\uFF1A~/.dsh/health-assessment\uFF09" }),
                  libraries.map((lib) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: lib.path, children: [
                    lib.codename,
                    " \xB7 ",
                    lib.path
                  ] }, lib.path))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u65B0\u589E\u5E93\u8DEF\u5F84" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "ha-input",
                value: newLibrary,
                placeholder: "/Users/you/health-memory-b",
                onChange: (e) => setNewLibrary(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-row gap8", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void addLibrary(), children: "\u6DFB\u52A0\u5E76\u5207\u6362" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u4ECE\u65E7\u8BB0\u5FC6\u5E93\u5BFC\u5165" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "ha-input",
                value: importPath,
                placeholder: "\u65E7\u5E93\u76EE\u5F55\uFF0C\u53EA\u8BFB\u4E0D\u5199",
                onChange: (e) => setImportPath(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-row gap8", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void runImport(), children: "\u5BFC\u5165\u65E7\u5E93" }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-group-title", children: "\u8BCA\u65AD" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-row gap8", style: { flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void runDiagnostic("/followup/auto", "\u81EA\u52A8\u8FFD\u95EE"), children: "\u7ACB\u5373\u81EA\u52A8\u68C0\u6D4B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void runDiagnostic("/followup/ask", "\u624B\u52A8\u8FFD\u95EE"), children: "\u7ACB\u5373\u8FFD\u95EE" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-mini", onClick: () => void runDiagnostic("/pet/say", "\u5BA0\u7269\u64AD\u62A5"), children: "\u6D4B\u8BD5\u684C\u5BA0" })
          ] }),
          diag ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-muted", style: { margin: 0 }, children: diag }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-group-title", children: "\u4EA4\u4E92\u504F\u597D" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.petEnabled !== false,
                onChange: (e) => setSettings((c) => ({ ...c, petEnabled: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u51FA\u5206\u65F6\u8BA9\u684C\u5BA0\u64AD\u62A5\u4E00\u6B21" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: settings.confirmImageUpload !== false,
                onChange: (e) => setSettings((c) => ({ ...c, confirmImageUpload: e.target.checked }))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u56FE\u7247\u5165\u5E93\u524D\u9700\u8981\u786E\u8BA4" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-ghost", onClick: () => setSettingsOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void saveSettings(), children: "\u4FDD\u5B58\u8BBE\u7F6E" })
      ] })
    ] }) }) : null,
    profileOpen ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-scrim", onClick: () => setProfileOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal ha-modal-sm", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u8865\u5168\u57FA\u7840\u6863\u6848" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setProfileOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-muted", style: { margin: 0 }, children: "\u516D\u9879\u586B\u5B8C\u7ACB\u523B\u89E3\u9501\u8BC4\u5206\u3002\u7F3A\u9879\u4E0D\u4F1A\u4F30\u7B97\u3002" }),
        [
          ["height_cm", "\u8EAB\u9AD8\uFF08cm\uFF09"],
          ["weight_kg", "\u4F53\u91CD\uFF08kg\uFF09"],
          ["age", "\u5E74\u9F84"],
          ["training_years", "\u8BAD\u7EC3\u5E74\u9650"]
        ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "ha-input",
              type: "number",
              value: profile[key] ?? "",
              onChange: (e) => setProfile((c) => ({ ...c, [key]: e.target.value }))
            }
          )
        ] }, key)),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6027\u522B" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "select",
            {
              className: "ha-input",
              value: profile.sex ?? "",
              onChange: (e) => setProfile((c) => ({ ...c, sex: e.target.value })),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "\u672A\u586B" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "male", children: "male" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "female", children: "female" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "other", children: "other" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "checkbox",
              checked: profile.injury === "1",
              onChange: (e) => setProfile((c) => ({ ...c, injury: e.target.checked ? "1" : "" }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6709\u4F24\u75C5\uFF08\u53EA\u4F5C\u5907\u6CE8\uFF0C\u4E0D\u56E0\u6B64\u505C\u5206\uFF09" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-ghost", onClick: () => setProfileOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void saveProfile(), children: "\u4FDD\u5B58\u5E76\u89E3\u9501\u8BC4\u5206" })
      ] })
    ] }) }) : null,
    optionalOpen ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      OptionalDialog,
      {
        date,
        written: overview?.optional.written ?? {},
        onSaved: () => {
          void load();
        },
        onClose: () => setOptionalOpen(false),
        busy
      }
    ) : null,
    detailOpen ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-scrim", onClick: () => setDetailOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal ha-modal-sm", onClick: (event) => event.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
          detailDate,
          " \u7684\u8BB0\u5F55"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setDetailOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-modal-body", children: detail ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "ha-muted", style: { margin: 0 }, children: [
          "\u6765\u6E90\uFF1A",
          detail.sources?.join("\u3001") || "\u672A\u77E5"
        ] }),
        (() => {
          const body = detail.body_required ?? {};
          const psych = detail.psych_required ?? {};
          const optional = detail.optional ?? {};
          const line = (label, value) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-kv", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: value === null || value === void 0 || value === "" ? "\u2014" : String(value) })
          ] });
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-detail", children: [
            line("\u86CB\u767D\u8D28(g)", body.protein_g),
            line("\u6297\u963B\u5206\u949F", body.resistance_minutes),
            line("\u5B8C\u6210\u6297\u963B", body.resistance_done === true ? "\u662F" : body.resistance_done === false ? "\u5426" : null),
            line("\u8D85\u8D1F\u8377", body.progressive_overload === true || body.overload === true ? "\u662F" : null),
            line("\u81EA\u8BC4", psych.self_rating_1_to_5 ?? psych.execution_likert),
            line("\u8BC4\u4EF7\u5206\u7C7B", psych.classification ?? psych.feedback_category),
            line("\u7EA2\u65D7", (detail.red_flags ?? []).join("\u3001")),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-kv", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-muted", children: "\u9009\u586B" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: Object.keys(optional).length > 0 ? Object.entries(optional).map(([k, v]) => `${k}`).join("\u3001") : "\u2014" })
            ] })
          ] });
        })()
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-empty", children: "\u8FD9\u4E00\u5929\u6CA1\u6709\u8BB0\u5F55\u3002" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-ghost", onClick: () => void deleteDay(), disabled: busy, children: "\u5220\u9664\u8FD9\u4E00\u5929" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-primary", onClick: () => {
          setDetailOpen(false);
          setDate(detailDate);
        }, children: "\u5207\u5230\u8FD9\u4E00\u5929" })
      ] })
    ] }) }) : null,
    confirming ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ha-scrim", onClick: () => setConfirming(null), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal ha-modal-sm", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u786E\u8BA4\u5199\u5165" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-icon", title: "\u5173\u95ED", onClick: () => setConfirming(null), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.close }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-body", children: [
        confirming.warning ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-muted", style: { margin: 0 }, children: confirming.warning }) : null,
        confirming.visionModel ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "ha-muted", style: { margin: 0 }, children: [
          "\u8BC6\u56FE\u901A\u9053\uFF1A",
          confirming.visionModel
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { className: "ha-pre", children: JSON.stringify(confirming.draft, null, 2) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-modal-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-ghost", onClick: () => setConfirming(null), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void commitDraft(), children: "\u786E\u8BA4\u5199\u5165" })
      ] })
    ] }) }) : null
  ] });
}
function ModelPicker(props) {
  const current = props.catalog.find((item) => item.id === props.provider);
  const hint = props.emptyHint ?? "\u7559\u7A7A = \u6CBF\u7528 DSH \u9ED8\u8BA4";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        props.label,
        " \xB7 provider"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "select",
        {
          className: "ha-input",
          value: props.provider,
          onChange: (event) => props.onChange(event.target.value, ""),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: hint }),
            props.catalog.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: item.id, children: item.name }, item.id))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "ha-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        props.label,
        " \xB7 model"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "select",
        {
          className: "ha-input",
          value: props.model,
          onChange: (event) => props.onChange(props.provider, event.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: hint }),
            (current?.models ?? []).map((model) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: model.id, children: model.name || model.id }, model.id))
          ]
        }
      )
    ] })
  ] });
}
function PartsBreakdown({ overview }) {
  if (!overview) return null;
  const score = overview.score;
  const scores = score.scores;
  const parts = scores?.body_required?.parts ?? {};
  const execution = scores?.psych_required?.execution ?? null;
  const classification = scores?.psych_required?.classification ?? null;
  const bodyOptional = scores;
  const psychOptional = scores;
  const rows = [];
  for (const key of ["\u86CB\u767D\u8D28", "\u6297\u963B", "\u8D85\u8D1F\u8377"]) {
    const value = parts[key];
    if (typeof value === "number") rows.push({ label: key, value });
  }
  if (typeof execution === "number") rows.push({ label: "\u81EA\u8BC4\u5206", value: execution });
  if (typeof classification === "number") rows.push({ label: "\u8BC4\u4EF7\u5206\u7C7B", value: classification });
  const optionalItems = [
    ...bodyOptional.body_optional?.items ?? [],
    ...psychOptional.psych_optional?.items ?? []
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-parts", children: [
    rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ha-empty", children: "\u8FD8\u6CA1\u6709\u53EF\u8BC4\u5206\u7684\u5FC5\u586B\u3002" }) : null,
    rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-parts-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-parts-label", children: row.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ha-bar", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { style: { width: `${Math.min(100, row.value * 100)}%` } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "ha-parts-num", children: [
        Math.round(row.value * 100),
        "%"
      ] })
    ] }, row.label)),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ha-parts-sub", children: [
      "\u9009\u586B\u5F97\u5206\uFF1A\u8EAB\u4F53 ",
      bodyOptional.body_optional?.score ?? "\u65E0\u6CD5\u8BC4\u5206",
      " / \u5FC3\u7406 ",
      psychOptional.psych_optional?.score ?? "\u65E0\u6CD5\u8BC4\u5206",
      optionalItems.length > 0 ? ` \xB7 \u5DF2\u8BA1 ${optionalItems.length} \u9879` : " \xB7 \u672A\u5199\u9009\u586B"
    ] }),
    score.next_steps?.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "ha-steps", children: score.next_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: step }, step)) }) : null
  ] });
}
function HealthNavIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON.check, size: 16 });
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
.ha-switch { display: flex; gap: 2px; background: #1c1e22; border-radius: 8px; padding: 2px; }
.ha-switch button {
  border: 0; background: transparent; color: #9aa0a8; padding: 5px 10px;
  border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; white-space: nowrap;
}
.ha-switch button[data-active='true'] { background: #2a2d33; color: #e7e8ea; }
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

.ha-modal-wide { width: min(640px, 94vw); }
.ha-mini {
  font-size: 11px; padding: 3px 9px; border-radius: 999px; cursor: pointer;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
  color: #c9ced6; font: inherit; font-size: 11px;
}
.ha-mini:hover { background: rgba(255,255,255,.12); color: #fff; }
.ha-row.gap8 { gap: 8px; display: inline-flex; align-items: center; }
.ha-error-text { margin: 0; color: #e08b8b; font-size: 12px; }

/* \u9009\u586B\u624B\u98CE\u7434 */
.ha-acc { border-radius: 9px; background: #1f2226; overflow: hidden; }
.ha-acc-head {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px;
  background: transparent; border: 0; color: inherit; font: inherit; cursor: pointer; text-align: left;
}
.ha-acc-head:hover { background: rgba(255,255,255,.04); }
.ha-acc-head .ha-muted { margin-left: auto; }
.ha-acc-caret { display: inline-block; transition: transform .15s; color: #7f858d; }
.ha-acc-caret.open { transform: rotate(90deg); }
.ha-acc-body { padding: 4px 12px 10px; display: flex; flex-direction: column; gap: 4px; }
.ha-opt-row { display: flex; align-items: center; gap: 10px; padding: 3px 0; }
.ha-opt-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #c9ced6; }
.ha-levels { display: inline-flex; gap: 3px; flex: 0 0 auto; }
.ha-level {
  width: 24px; height: 24px; border-radius: 6px; cursor: pointer; font: inherit; font-size: 11px;
  background: #262a30; border: 1px solid rgba(255,255,255,.06); color: #9aa0a8;
}
.ha-level:hover { background: #2e333a; color: #fff; }
.ha-level[data-active='true'] { background: #3757c9; border-color: #4a6ae0; color: #fff; }
.ha-opt-hours { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; }
.ha-input-inline { width: 84px; padding: 4px 8px; }

/* \u660E\u7EC6 */
.ha-parts { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,.06); }
.ha-parts-row { display: flex; align-items: center; gap: 8px; }
.ha-parts-label { flex: 0 0 auto; width: 64px; color: #9aa0a8; font-size: 12px; white-space: nowrap; }
.ha-parts-num { flex: 0 0 auto; width: 42px; text-align: right; font-size: 12px; font-variant-numeric: tabular-nums; }
.ha-parts-sub { color: #7f858d; font-size: 11px; }

/* \u5386\u53F2\u884C\u53EF\u70B9 */
.ha-hrow-btn { width: 100%; background: transparent; border: 0; border-bottom: 1px solid rgba(255,255,255,.05); color: inherit; font: inherit; cursor: pointer; text-align: left; }
.ha-hrow-btn:hover { background: rgba(255,255,255,.04); }
.ha-hrow-btn:last-child { border-bottom: 0; }
.ha-detail { display: flex; flex-direction: column; gap: 2px; }
.ha-kv { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; padding: 3px 0; border-bottom: 1px dashed rgba(255,255,255,.05); }
.ha-kv:last-child { border-bottom: 0; }

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
