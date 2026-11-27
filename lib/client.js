/* dsh-health-assessment 浏览器半侧：由 scripts/wrap-client.mjs 生成，请勿手改 */
(function () {
  var loader = window.__ModuleLoader__;
  if (!loader || typeof loader.load !== 'function') {
    console.warn('[dsh-health-assessment] 没有 __ModuleLoader__，面板无法加载');
    return;
  }
  /** 模块本体：只导出 makeFactory，不含任何副作用。 */
  var bundle = (function () {
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

// src/client/panel.tsx
var import_react = require("react");

// src/client/api.ts
var PREFIX = "/health-assessment-8221";
async function request(path, init) {
  const response = await fetch(`${PREFIX}${path}`, {
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json" } : void 0,
    ...init
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload.error || `\u8BF7\u6C42\u5931\u8D25\uFF1A${response.status}`);
  }
  return payload;
}
var api = {
  overview: () => request("/overview"),
  score: () => request("/score"),
  sessions: () => request("/sessions?limit=60"),
  profile: () => request("/profile"),
  saveProfile: (profile) => request("/profile", {
    method: "POST",
    body: JSON.stringify(profile)
  }),
  checkinText: (text, date) => request("/checkin/text", {
    method: "POST",
    body: JSON.stringify({ text, date })
  }),
  checkinTable: (payload) => request("/checkin/table", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  checkinImage: (payload) => request("/checkin/image", {
    method: "POST",
    body: JSON.stringify({ ...payload, confirmed: true })
  }),
  settings: () => request("/settings"),
  saveSettings: (patch) => request("/settings", { method: "POST", body: JSON.stringify(patch) }),
  importLibrary: (sourceRoot) => request("/import", {
    method: "POST",
    body: JSON.stringify({ sourceRoot })
  }),
  followUp: () => request("/followup"),
  markReply: () => request("/followup/reply", { method: "POST", body: "{}" }),
  ackPet: () => request("/pet/ack", { method: "POST", body: "{}" }),
  say: (text) => request("/pet/say", { method: "POST", body: JSON.stringify({ text }) })
};

// src/client/styles.ts
var STYLE_ID = "dsh-health-assessment-styles";
var CSS = `
.ha-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 13px;
  color: var(--dsh-text, #e6e6e6);
  background: var(--dsh-bg, transparent);
}
.ha-head {
  display: flex;
  gap: 4px;
  padding: 8px 10px 6px;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(127, 127, 127, 0.18);
}
.ha-tab {
  border: 0;
  background: transparent;
  color: inherit;
  opacity: 0.6;
  padding: 4px 9px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
}
.ha-tab[data-active='true'] {
  opacity: 1;
  background: rgba(127, 127, 127, 0.18);
}
.ha-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ha-card {
  border: 1px solid rgba(127, 127, 127, 0.18);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ha-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.ha-row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.ha-muted {
  opacity: 0.6;
  font-size: 12px;
}
.ha-big {
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ha-ring {
  width: 84px;
  height: 84px;
  flex: 0 0 auto;
}
.ha-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  background: rgba(127, 127, 127, 0.16);
}
.ha-chip[data-tone='warn'] {
  background: rgba(220, 140, 40, 0.2);
}
.ha-chip[data-tone='bad'] {
  background: rgba(220, 70, 70, 0.2);
}
.ha-chip[data-tone='good'] {
  background: rgba(70, 180, 120, 0.2);
}
.ha-input,
.ha-textarea,
.ha-select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  background: rgba(127, 127, 127, 0.08);
  color: inherit;
  padding: 7px 9px;
  font: inherit;
}
.ha-textarea {
  min-height: 82px;
  resize: vertical;
}
.ha-button {
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.3);
  background: rgba(127, 127, 127, 0.16);
  color: inherit;
  padding: 6px 12px;
  cursor: pointer;
  font: inherit;
}
.ha-button:disabled {
  opacity: 0.5;
  cursor: default;
}
.ha-button[data-primary='true'] {
  background: rgba(90, 140, 240, 0.28);
  border-color: rgba(90, 140, 240, 0.5);
}
.ha-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ha-list-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(127, 127, 127, 0.08);
  font-variant-numeric: tabular-nums;
}
.ha-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ha-error {
  color: #e06c6c;
  font-size: 12px;
  white-space: pre-wrap;
}
.ha-ok {
  color: #5fbf8a;
  font-size: 12px;
  white-space: pre-wrap;
}
.ha-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
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

// src/client/panel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var TABS = [
  { id: "today", label: "\u4ECA\u65E5" },
  { id: "checkin", label: "\u6253\u5361" },
  { id: "profile", label: "\u6863\u6848" },
  { id: "score", label: "\u8BC4\u5206" },
  { id: "history", label: "\u5386\u53F2" },
  { id: "settings", label: "\u8BBE\u7F6E" }
];
var PROFILE_FIELDS = [
  { key: "height_cm", label: "\u8EAB\u9AD8\uFF08cm\uFF09", type: "number" },
  { key: "weight_kg", label: "\u4F53\u91CD\uFF08kg\uFF09", type: "number" },
  { key: "age", label: "\u5E74\u9F84", type: "number" },
  { key: "sex", label: "\u6027\u522B\uFF08female/male/other\uFF09", type: "text" },
  { key: "training_years", label: "\u8BAD\u7EC3\u5E74\u9650", type: "number" }
];
function percent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}
function Ring({ ratio }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "ha-ring", viewBox: "0 0 84 84", role: "img", "aria-label": `\u5B8C\u6210\u5EA6 ${percent(clamped)}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "42", cy: "42", r: radius, fill: "none", stroke: "rgba(127,127,127,0.22)", strokeWidth: "8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "circle",
      {
        cx: "42",
        cy: "42",
        r: radius,
        fill: "none",
        stroke: "rgba(90,140,240,0.85)",
        strokeWidth: "8",
        strokeLinecap: "round",
        strokeDasharray: `${dash} ${circumference - dash}`,
        transform: "rotate(-90 42 42)"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: "42", y: "46", textAnchor: "middle", fontSize: "15", fill: "currentColor", children: percent(clamped) })
  ] });
}
function TodayView({ overview, onRefresh }) {
  const missing = overview.daily.missing_required_fields;
  const flags = overview.redFlags;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: overview.date }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-muted", children: [
            "\u7D2F\u8BA1 ",
            overview.distinctDates,
            "/7 \u5929"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ring, { ratio: overview.daily.required_completion_ratio })
      ] }),
      flags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-chip", "data-tone": "bad", children: "\u7EA2\u65D7" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          flags.join("\u3001"),
          "\uFF1A\u5148\u8054\u7CFB\u533B\u7597\u6216\u5F53\u5730\u7D27\u6025\u5E2E\u52A9\uFF0C\u672C\u8F6E\u4E0D\u6253\u5206\u3002"
        ] })
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u4ECA\u5929\u8FD8\u5DEE" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", onClick: onRefresh, children: "\u5237\u65B0" })
      ] }),
      missing.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u5FC5\u586B\u4E94\u9879\u90FD\u9F50\u4E86\u3002\u53EF\u4EE5\u8865\u4E00\u6761\u9009\u586B\uFF0C\u6216\u53BB\u770B\u8BC4\u5206\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list", children: missing.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-list-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-chip", "data-tone": "warn", children: "\u5F85\u8865" })
      ] }, item)) }),
      overview.daily.recorded_optional_fields.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-muted", children: [
        "\u5DF2\u5199\u9009\u586B\uFF1A",
        overview.daily.recorded_optional_fields.join("\u3001")
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5F53\u524D\u8BC4\u4F30" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-chip", children: String(overview.score.mode ?? "") })
      ] }),
      overview.score.mode === "scored" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row", style: { gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: String(overview.score.scores?.total?.score ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u5408\u8BA1 /200" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: String(overview.score.scores?.body?.score ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u8EAB\u4F53 /100" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: String(overview.score.scores?.psych?.score ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u5FC3\u7406 /100" })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: overview.score.mode === "blocked_profile" ? `\u6863\u6848\u7F3A ${(overview.profileMissing ?? []).join("\u3001")}\uFF0C\u8865\u9F50\u540E\u624D\u51FA\u5206\u3002` : overview.score.mode === "redflag" ? "\u8BB0\u5F55\u91CC\u6709\u7EA2\u65D7\uFF0C\u672C\u8F6E\u505C\u5206\u3002" : `\u672A\u6EE1 7 \u5929\uFF08\u5F53\u524D ${overview.distinctDates} \u5929\uFF09\uFF0C\u5148\u7EE7\u7EED\u8BB0\u3002` })
    ] })
  ] });
}
function CheckinView({ onDone }) {
  const [text, setText] = (0, import_react.useState)("");
  const [date, setDate] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [message, setMessage] = (0, import_react.useState)("");
  const [error, setError] = (0, import_react.useState)("");
  const [csv, setCsv] = (0, import_react.useState)("");
  const [imageNote, setImageNote] = (0, import_react.useState)("");
  const [pendingImage, setPendingImage] = (0, import_react.useState)(null);
  const submitText = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.checkinText(text, date || void 0);
      setMessage(`\u5DF2\u5199\u5165 ${result.session.date}\uFF08\u6765\u6E90\uFF1A${result.source === "model" ? "\u89C4\u5219+\u6A21\u578B" : "\u672C\u5730\u89C4\u5219"}\uFF09${result.warning ? `
${result.warning}` : ""}`);
      setText("");
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const submitCsv = async () => {
    if (!csv.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.checkinTable({ csv, filename: "paste.csv" });
      setMessage(`\u5DF2\u5BFC\u5165 ${result.imported} \u5929${result.redFlags.length ? `\uFF1B\u7EA2\u65D7\uFF1A${result.redFlags.join("\u3001")}` : ""}`);
      setCsv("");
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const pickImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;
      setPendingImage({ base64, mediaType: file.type || "image/jpeg", name: file.name });
    };
    reader.readAsDataURL(file);
  };
  const submitImage = async () => {
    if (!pendingImage) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.checkinImage({
        base64: pendingImage.base64,
        mediaType: pendingImage.mediaType,
        name: pendingImage.name,
        date: date || void 0,
        note: imageNote || void 0
      });
      setMessage(`\u56FE\u7247\u5DF2\u8BC6\u522B\u5E76\u5199\u5165 ${result.session.date}\u3002`);
      setPendingImage(null);
      setImageNote("");
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u4E00\u53E5\u8BDD\u6253\u5361" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          className: "ha-textarea",
          placeholder: "\u4ECA\u5929\u6297\u963B45\u5206\u949F\u52A0\u4E86\u5367\u63A8\u91CD\u91CF\uFF0C\u86CB\u767D\u8D28140g\uFF0C\u72B6\u60015\u5206\uFF0C\u4E0D\u5185\u8017",
          value: text,
          onChange: (event) => setText(event.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "ha-input", type: "date", value: date, onChange: (event) => setDate(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", "data-primary": "true", disabled: busy, onClick: submitText, children: "\u8BB0\u5F55" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u7559\u7A7A\u65E5\u671F\u8868\u793A\u4ECA\u5929\u3002\u89C4\u5219\u5148\u89E3\u6790\uFF0C\u6CA1\u5199\u5168\u65F6\u624D\u4F1A\u8BF7\u6A21\u578B\u8865\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5BFC\u5165\u8868\u683C" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          className: "ha-textarea",
          style: { minHeight: 64 },
          placeholder: "\u628A CSV \u5185\u5BB9\u7C98\u5728\u8FD9\u91CC\uFF08\u542B\u8868\u5934\uFF09",
          value: csv,
          onChange: (event) => setCsv(event.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", disabled: busy, onClick: submitCsv, children: "\u5BFC\u5165 CSV" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u5217\u540D\u652F\u6301\uFF1A\u65E5\u671F\u3001\u86CB\u767D\u8D28\u3001\u6297\u963B\u3001\u6B65\u6570\u3001\u9759\u606F\u5FC3\u7387\u3001\u7761\u7720\u65F6\u957F\u7B49" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5BFC\u5165\u56FE\u7247" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "file",
          accept: "image/png,image/jpeg,image/webp",
          onChange: (event) => {
            const file = event.target.files?.[0];
            if (file) pickImage(file);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "ha-input",
          placeholder: "\u8865\u5145\u4E00\u53E5\u8BF4\u660E\uFF08\u53EF\u9009\uFF09",
          value: imageNote,
          onChange: (event) => setImageNote(event.target.value)
        }
      ),
      pendingImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u56FE\u7247\u4F1A\u53D1\u7ED9\u4F60\u5728\u8BBE\u7F6E\u91CC\u6307\u5B9A\u7684\u6A21\u578B\uFF0C\u786E\u8BA4\u540E\u624D\u4F1A\u53D1\u9001\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", "data-primary": "true", disabled: busy, onClick: submitImage, children: "\u786E\u8BA4\u53D1\u9001" })
      ] }) : null
    ] }),
    message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-ok", children: message }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-error", children: error }) : null
  ] });
}
function ProfileView({ overview, onSaved }) {
  const [draft, setDraft] = (0, import_react.useState)(overview.profile ?? {});
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [message, setMessage] = (0, import_react.useState)("");
  const [error, setError] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    setDraft(overview.profile ?? {});
  }, [overview.profile]);
  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.saveProfile(draft);
      setMessage("\u6863\u6848\u5DF2\u4FDD\u5B58\u3002");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u57FA\u7840\u6863\u6848" }),
    overview.profileMissing.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-error", children: [
      "\u8FD8\u7F3A\uFF1A",
      overview.profileMissing.join("\u3001")
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u516D\u9879\u5FC5\u586B\u5DF2\u9F50\uFF0C\u53EF\u4EE5\u51FA\u5206\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-grid2", children: PROFILE_FIELDS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: field.label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "ha-input",
          type: field.type,
          value: String(draft[field.key] ?? ""),
          onChange: (event) => {
            const value = event.target.value;
            setDraft((current) => ({
              ...current,
              [field.key]: field.type === "number" ? value === "" ? null : Number(value) : value
            }));
          }
        }
      )
    ] }, field.key)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "checkbox",
          checked: draft.injury === true,
          onChange: (event) => setDraft((current) => ({ ...current, injury: event.target.checked }))
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6709\u4F24\u75C5\uFF08\u53EA\u4F5C\u5907\u6CE8\uFF0C\u4E0D\u56E0\u6B64\u505C\u5206\uFF09" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u7F3A\u5B57\u6BB5\u4E0D\u80FD\u4F30\u7B97\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", "data-primary": "true", disabled: busy, onClick: save, children: "\u4FDD\u5B58" })
    ] }),
    message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-ok", children: message }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-error", children: error }) : null
  ] });
}
function ScoreView({ overview }) {
  const score = overview.score;
  const scores = score.scores;
  const conclusion = score.conclusion;
  const steps = score.next_steps ?? [];
  if (score.mode !== "scored") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u8BC4\u5206" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: score.mode === "blocked_profile" ? "\u6863\u6848\u7F3A\u5B57\u6BB5\uFF0C\u5148\u8865\u6863\u6848\u3002" : score.mode === "redflag" ? "\u6709\u7EA2\u65D7\u4FE1\u53F7\uFF0C\u672C\u8F6E\u4E0D\u6253\u5206\u3002" : `${String(score.label ?? "\u672A\u6EE1 7 \u5929")}\uFF0C\u5148\u7EE7\u7EED\u8BB0\u3002` })
    ] });
  }
  const parts = scores?.body_required?.parts ?? {};
  const optionalBody = scores?.body_optional?.items ?? [];
  const optionalPsych = scores?.psych_optional?.items ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row", style: { gap: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: String(scores?.total?.score ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u5408\u8BA1 /200" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: String(scores?.body?.score ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u8EAB\u4F53 /100" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-big", children: String(scores?.psych?.score ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u5FC3\u7406 /100" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-muted", children: [
        "\u7A97\u53E3 ",
        String(score.distinct_dates),
        " \u5929 / \u8DE8\u5EA6 ",
        String(score.calendar_span_days),
        " \u5929"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5FC5\u586B\u660E\u7EC6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list", children: Object.entries(parts).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-list-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: key }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: percent(value) })
      ] }, key)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-muted", children: [
        "\u81EA\u8BC4\u5206 ",
        percent(scores?.psych_required?.execution),
        " \xB7 \u8BC4\u4EF7\u5206\u7C7B ",
        percent(scores?.psych_required?.classification)
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u9009\u586B" }),
      optionalBody.length === 0 && optionalPsych.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u6CA1\u5199\u9009\u586B\uFF0C\u8FD9\u90E8\u5206\u8BB0\u300C\u65E0\u6CD5\u8BC4\u5206\u300D\uFF0C\u4E0D\u8BB0 0\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list", children: [...optionalBody, ...optionalPsych].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-list-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.item }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.points })
      ] }, `${item.item}`)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u7ED3\u8BBA" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: conclusion?.["\u8584\u808C"] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: conclusion?.["\u9EC4\u6BDB"] }),
      steps.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list", children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list-item", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step }) }, step)) }) : null
    ] })
  ] });
}
function HistoryView({ sessions }) {
  if (sessions.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-card ha-muted", children: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
      "\u6700\u8FD1 ",
      sessions.length,
      " \u5929"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-list", children: sessions.map((session) => {
      const body = session.body_required ?? {};
      const psych = session.psych_required ?? {};
      const chips = [];
      if (body.protein_g !== void 0 && body.protein_g !== null) chips.push({ label: `\u86CB\u767D ${String(body.protein_g)}g`, tone: "good" });
      if (body.resistance_done === true || body.resistance_minutes) chips.push({ label: "\u6297\u963B", tone: "good" });
      if (body.progressive_overload === true) chips.push({ label: "\u8D85\u8D1F\u8377", tone: "good" });
      if (psych.self_rating_1_to_5 !== void 0 && psych.self_rating_1_to_5 !== null) chips.push({ label: `\u81EA\u8BC4 ${String(psych.self_rating_1_to_5)}`, tone: "good" });
      if (psych.classification) chips.push({ label: String(psych.classification), tone: "good" });
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-list-item", style: { flexDirection: "column", alignItems: "flex-start", gap: 4 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row", style: { gap: 6, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: session.date }),
          (session.sources ?? []).map((source) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-chip", children: source === "self_report" ? "\u81EA\u8FF0" : source }, source))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-row", style: { gap: 4, flexWrap: "wrap" }, children: chips.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u65E0\u5FC5\u586B" }) : chips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-chip", "data-tone": chip.tone, children: chip.label }, chip.label)) })
      ] }, session.date);
    }) })
  ] });
}
function SettingsView({ settings, onSaved }) {
  const [draft, setDraft] = (0, import_react.useState)(settings ?? {});
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [message, setMessage] = (0, import_react.useState)("");
  const [error, setError] = (0, import_react.useState)("");
  const [importPath, setImportPath] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    setDraft(settings ?? {});
  }, [settings]);
  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.saveSettings(draft);
      setMessage("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const runImport = async () => {
    if (!importPath.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.importLibrary(importPath.trim());
      setMessage(`\u5BFC\u5165 ${result.imported} \u4E2A\u6587\u4EF6\uFF0C\u8DF3\u8FC7 ${result.skipped} \u4E2A\u3002`);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const field = (key, label, kind = "text") => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: label }),
    kind === "checkbox" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "checkbox",
        checked: draft[key] === true,
        onChange: (event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        className: "ha-input",
        type: kind,
        value: String(draft[key] ?? ""),
        onChange: (event) => setDraft((current) => ({
          ...current,
          [key]: kind === "number" ? Number(event.target.value) : event.target.value
        }))
      }
    )
  ] }, key);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u62BD\u53D6\u6A21\u578B" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u7559\u7A7A\u8868\u793A\u6CBF\u7528 DSH \u5F53\u524D\u9ED8\u8BA4\u6A21\u578B\u3002\u56FE\u7247\u8BC6\u522B\u9700\u8981\u5177\u5907\u89C6\u89C9\u80FD\u529B\u7684\u6A21\u578B\u3002" }),
      field("extractionProvider", "provider"),
      field("extractionModel", "model")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u6BCF\u65E5\u8FFD\u95EE" }),
      field("dailyAskEnabled", "\u6BCF\u5929\u9996\u6B21\u6253\u5F00\u65F6\u81EA\u52A8\u5F00\u65B0\u4F1A\u8BDD\u8FFD\u95EE", "checkbox"),
      field("dailyAskTime", "\u5B9A\u65F6\u8FFD\u95EE\u65F6\u523B\uFF08HH:MM\uFF0C\u7559\u7A7A\u8868\u793A\u53EA\u5728\u6253\u5F00\u65F6\uFF09", "time"),
      field("dailyAskWorkspace", "\u8FFD\u95EE\u4F1A\u8BDD\u7684\u5DE5\u4F5C\u533A\u8DEF\u5F84\uFF08\u7559\u7A7A\u7528\u5F53\u524D\uFF09"),
      field("escalateHours", "\u672A\u56DE\u590D\u591A\u4E45\u540E\u5347\u7EA7\u518D\u95EE\uFF08\u5C0F\u65F6\uFF09", "number")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u684C\u5BA0\u4E0E\u9690\u79C1" }),
      field("petEnabled", "\u51FA\u5206\u65F6\u8BA9\u684C\u5BA0\u64AD\u62A5\u4E00\u6B21", "checkbox"),
      field("confirmImageUpload", "\u56FE\u7247\u53D1\u9001\u524D\u9700\u8981\u786E\u8BA4", "checkbox")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u4ECE\u65E7\u8BB0\u5FC6\u5E93\u5BFC\u5165" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u53EA\u8BFB\u65E7\u5E93\u3001\u5199\u5165\u5F53\u524D\u5E93\uFF1B\u4E0D\u4F1A\u6539\u52A8\u65E7\u6587\u4EF6\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "ha-input",
          placeholder: "/path/to/old-memory-store",
          value: importPath,
          onChange: (event) => setImportPath(event.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", disabled: busy, onClick: runImport, children: "\u5BFC\u5165" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-row-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u8BBE\u7F6E\u5199\u5728\u5F53\u524D\u8BB0\u5FC6\u5E93\u91CC\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-button", "data-primary": "true", disabled: busy, onClick: save, children: "\u4FDD\u5B58\u8BBE\u7F6E" })
    ] }),
    message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-ok", children: message }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-error", children: error }) : null
  ] });
}
function HealthPanel() {
  const [tab, setTab] = (0, import_react.useState)("today");
  const [overview, setOverview] = (0, import_react.useState)(null);
  const [sessions, setSessions] = (0, import_react.useState)([]);
  const [error, setError] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(true);
  const refresh = (0, import_react.useCallback)(async () => {
    setLoading(true);
    try {
      const [next, history] = await Promise.all([api.overview(), api.sessions()]);
      setOverview(next);
      setSessions(history);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    injectStyles();
    void refresh();
  }, [refresh]);
  const markReply = (0, import_react.useCallback)(() => {
    void api.markReply().catch(() => void 0);
  }, []);
  const body = (0, import_react.useMemo)(() => {
    if (!overview) return null;
    if (tab === "today") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayView, { overview, onRefresh: () => void refresh() });
    if (tab === "checkin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckinView, { onDone: () => {
      markReply();
      void refresh();
    } });
    if (tab === "profile") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileView, { overview, onSaved: () => void refresh() });
    if (tab === "score") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreView, { overview });
    if (tab === "history") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryView, { sessions });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsView, { settings: overview.settings, onSaved: () => void refresh() });
  }, [tab, overview, sessions, refresh, markReply]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-panel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-head", children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        className: "ha-tab",
        "data-active": tab === item.id,
        onClick: () => setTab(item.id),
        children: item.label
      },
      item.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-body", children: [
      loading && !overview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-muted", children: "\u8BFB\u53D6\u4E2D\u2026" }) : null,
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-error", children: error }) : null,
      body
    ] })
  ] });
}

// src/client/app.ts
var TAB_ID = "health-assessment";
var TAB_KIND = "health";
function makeFactory() {
  return (require2) => {
    const module2 = { exports: {} };
    const runtime = require2("react/jsx-runtime");
    function registerTab(ctx) {
      const disposers = [];
      const tabs = ctx.get?.("sidebarRightTabs");
      if (tabs && typeof tabs.register === "function") {
        disposers.push(tabs.register({
          id: TAB_ID,
          kind: TAB_KIND,
          priority: "extension",
          title: () => "\u5065\u5EB7",
          guide: [{
            id: TAB_KIND,
            order: 520,
            title: () => "\u5065\u5EB7\u8BC4\u4F30",
            description: () => "\u6253\u5361\u3001\u6863\u6848\u4E0E 7 \u5929\u8BC4\u5206"
          }]
        }));
      } else {
        console.warn("[dsh-health-assessment] \u53F3\u4FA7\u680F\u4E0D\u53EF\u7528\uFF1A\u6CA1\u6709 sidebarRightTabs \u670D\u52A1\uFF0C\u5065\u5EB7\u9875\u7B7E\u672A\u6CE8\u518C");
      }
      ctx.slots.inject("sidebar.right.pane.tab", function* registerPane() {
        yield ctx.slots.register(
          { name: "sidebar.right.pane.tab", key: TAB_ID, order: 520 },
          () => runtime.jsx(HealthPanel, {})
        );
      });
      return () => {
        for (const dispose of disposers.reverse()) dispose();
      };
    }
    const name = "health-assessment";
    const inject = ["slots"];
    function apply(ctx) {
      injectStyles();
      const dispose = registerTab(ctx);
      ctx.effect?.(() => () => dispose(), "dsh-health-assessment: sidebar tab");
    }
    module2.exports = { name, inject, apply };
    return module2.exports;
  };
}

    })(module, exports, require);
    return module.exports;
  })();
  loader.load({
    id: 'dsh-health-assessment',
    factory: function (require) {
      return bundle.makeFactory()(require);
    }
  });
})();
