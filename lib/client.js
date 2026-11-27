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
function today() {
  const now = /* @__PURE__ */ new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
function modeText(overview) {
  if (!overview) return "";
  const mode = overview.score.mode;
  const missing = overview.checklist.filter((item) => !item.done).length;
  const days = overview.distinctDates;
  if (mode === "redflag") return "\u8BB0\u5F55\u91CC\u6709\u9700\u8981\u9A6C\u4E0A\u5904\u7406\u7684\u4FE1\u53F7\uFF0C\u672C\u8F6E\u4E0D\u6253\u5206\uFF0C\u5148\u8054\u7CFB\u533B\u7597\u6216\u5F53\u5730\u7D27\u6025\u5E2E\u52A9\u3002";
  if (mode === "blocked_profile") return "\u6863\u6848\u8FD8\u6CA1\u586B\u5B8C\uFF0C\u8865\u9F50\u8EAB\u9AD8\u4F53\u91CD\u7B49\u516D\u9879\u540E\u624D\u4F1A\u751F\u6210\u8BC4\u5206\u3002";
  if (mode === "under7" || days < 7) return `\u5DF2\u8BB0\u5F55 ${days}/7 \u5929\uFF0C\u4ECA\u5929\u8FD8\u5DEE ${missing} \u9879\u5FC5\u586B\uFF0C\u8865\u9F50\u540E\u751F\u6210\u8BC4\u5206\u3002`;
  return `\u4E03\u5929\u7A97\u53E3\u5DF2\u6EE1\uFF0C\u8BC4\u5206\u89C1\u53F3\u4FA7\u6307\u6807\u3002`;
}
function heatLevel(hits) {
  if (hits <= 0) return 0;
  if (hits >= 5) return 4;
  if (hits >= 3) return 3;
  if (hits >= 2) return 2;
  return 1;
}
function HealthView() {
  const [date, setDate] = (0, import_react.useState)(today());
  const [view, setView] = (0, import_react.useState)("main");
  const [overview, setOverview] = (0, import_react.useState)(null);
  const [sessions, setSessions] = (0, import_react.useState)([]);
  const [text, setText] = (0, import_react.useState)("");
  const [csv, setCsv] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [notice, setNotice] = (0, import_react.useState)("");
  const [drawer, setDrawer] = (0, import_react.useState)(false);
  const [settings, setSettings] = (0, import_react.useState)({});
  const [connected, setConnected] = (0, import_react.useState)(false);
  const load = (0, import_react.useCallback)(async () => {
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
    }
  }, [date]);
  (0, import_react.useEffect)(() => {
    void load();
  }, [load]);
  (0, import_react.useEffect)(() => {
    if (!drawer) return;
    const onKey = (event) => {
      if (event.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);
  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3600);
  };
  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const result = await request("/checkin/text", {
        method: "POST",
        body: JSON.stringify({ text, date })
      });
      setText("");
      flash(`\u5DF2\u8BB0\u5165 ${result.session.date}${result.warning ? "\uFF08" + result.warning + "\uFF09" : ""}`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const fill = (item) => {
    if (item.done) return;
    const snippet = {
      protein: "\u86CB\u767D\u8D28120g",
      resistance: "\u6297\u963B45\u5206\u949F",
      overload: "\u52A0\u4E86\u91CD\u91CF",
      rating: "\u72B6\u60014\u5206",
      feedback: "\u542C\u53D6\u5EFA\u8BAE"
    };
    const piece = snippet[item.key] ?? item.label;
    setText((current) => current.includes(piece) ? current : `${current}${current ? "\uFF0C" : ""}${piece}`);
  };
  const importCsv = async () => {
    if (!csv.trim() || busy) return;
    setBusy(true);
    try {
      const result = await request("/checkin/table", {
        method: "POST",
        body: JSON.stringify({ csv, date })
      });
      setCsv("");
      flash(`\u5DF2\u5BFC\u5165 ${result.imported} \u5929`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const saveSettings = async () => {
    setBusy(true);
    try {
      await request("/settings", { method: "POST", body: JSON.stringify(settings) });
      flash("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
      setDrawer(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  const checklist = overview?.checklist ?? [];
  const doneCount = checklist.filter((item) => item.done).length;
  const ratio = checklist.length > 0 ? doneCount / checklist.length : 0;
  const scores = overview?.score.scores;
  const metric = (value) => value === null || value === void 0 ? "\u2014" : String(Math.round(value));
  const heat = (0, import_react.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const session of sessions) {
      let hits = 0;
      const body = session.body_required ?? {};
      const psych = session.psych_required ?? {};
      if (body.protein_g !== void 0 && body.protein_g !== null) hits += 1;
      if (body.resistance_done === true) hits += 1;
      if (body.progressive_overload === true) hits += 1;
      if (psych.self_rating_1_to_5 !== void 0 || psych.execution_likert !== void 0) hits += 1;
      if (psych.classification || psych.feedback_category) hits += 1;
      map.set(session.date, hits);
    }
    const days = [];
    const todayDate = /* @__PURE__ */ new Date();
    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date(todayDate.getTime() - i * 864e5);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      days.push({ date: key, hits: map.get(key) ?? 0 });
    }
    return days;
  }, [sessions]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "ha-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-title", children: "\u5065\u5EB7\u8BC4\u4F30" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "ha-date",
          type: "date",
          value: date,
          max: today(),
          onChange: (event) => setDate(event.target.value || today())
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-switch", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { "data-active": view === "main", onClick: () => setView("main"), children: "\u6253\u5361\u4E0E\u8BC4\u4F30" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { "data-active": view === "history", onClick: () => setView("history"), children: "\u5386\u53F2\u4E0E\u5BFC\u5165" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-grow" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `ha-dot${connected ? " ok" : ""}`, title: connected ? "\u5DF2\u8FDE\u63A5" : "\u672A\u8FDE\u63A5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u5237\u65B0", onClick: () => void load(), children: "\u27F3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", title: "\u8BBE\u7F6E", onClick: () => setDrawer(true), children: "\u2699" })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-banner err", children: error }) : null,
    notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-banner ok", children: notice }) : null,
    view === "main" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "ha-col ha-col-left", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4ECA\u5929\u7684\u60C5\u51B5" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: date })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "textarea",
            {
              className: "ha-input",
              placeholder: "\u4F8B\u5982\uFF1A\u6297\u963B 45 \u5206\u949F\u52A0\u4E86\u5367\u63A8\u91CD\u91CF\uFF0C\u86CB\u767D\u8D28 140g\uFF0C\u72B6\u6001 5 \u5206\uFF0C\u542C\u53D6\u5EFA\u8BAE\u4E0D\u5185\u8017",
              value: text,
              onChange: (event) => setText(event.target.value),
              onKeyDown: (event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submit();
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy || !text.trim(), onClick: () => void submit(), children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u8BB0\u5F55\u8FD9\u4E00\u6761" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u2318 + Enter \u5FEB\u901F\u63D0\u4EA4" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
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
              onClick: () => fill(item),
              title: item.done ? "" : item.hint,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-row-icon", children: item.done ? "\u2713" : "\u25CB" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-row-label", children: item.label }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-row-hint", children: item.done ? "" : item.hint }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `ha-pill${item.done ? " ok" : ""}`, children: item.done ? "\u5DF2\u5B8C\u6210" : "\u5F85\u8865" })
              ]
            },
            item.key
          )) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "ha-col ha-col-right", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-block-head", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4E03\u5929\u8BC4\u4F30" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-metrics", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-metric", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5408\u8BA1" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metric(scores?.total?.score) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "/200" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-metric", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8EAB\u4F53" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metric(scores?.body?.score) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "/100" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-metric", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5FC3\u7406" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metric(scores?.psych?.score) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "/100" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-status", children: modeText(overview) }),
          overview?.score.next_steps?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "ha-steps", children: overview.score.next_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: step }, step)) }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6700\u8FD1 14 \u5929" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u6DF1\u8272\u8D8A\u6EE1\u8868\u793A\u5FC5\u586B\u8D8A\u9F50" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-heat", children: heat.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `ha-cell lv${heatLevel(day.hits)}`, title: `${day.date}\uFF1A${day.hits}/5 \u9879\u5FC5\u586B` }, day.date)) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-legend", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv0" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv1" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv2" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv3" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "lv4" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "5 \u9879" })
          ] }),
          heat.every((day) => day.hits === 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-empty", children: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002\u5148\u5728\u5DE6\u8FB9\u5199\u4E00\u6761\uFF0C\u8FD9\u91CC\u5C31\u4F1A\u51FA\u73B0\u6BCF\u5929\u7684\u5B8C\u6210\u60C5\u51B5\u3002" }) : null
        ] })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: "ha-col ha-col-left", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5BFC\u5165\u8868\u683C" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "CSV\uFF0C\u542B\u8868\u5934" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            className: "ha-input ha-mono",
            placeholder: "\u65E5\u671F,\u86CB\u767D\u8D28(g),\u65E0\u6C27\u8BAD\u7EC3(\u5206\u949F),\u6267\u884C\u529B\u81EA\u8BC4,\u8BC4\u4EF7\u5206\u7C7B\n2026-11-28,140,45,5,kept_and_changed",
            value: csv,
            onChange: (event) => setCsv(event.target.value)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy || !csv.trim(), onClick: () => void importCsv(), children: "\u5BFC\u5165" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u540C\u4E00\u5929\u591A\u6765\u6E90\u4F1A\u5408\u5E76\uFF0C\u7A7F\u6234\u8BB0\u5F55\u4F18\u5148" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: "ha-col ha-col-right", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-block-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6700\u8FD1\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ha-muted", children: [
            sessions.length,
            " \u5929"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-history", children: [
          sessions.slice(0, 30).map((session) => {
            const body = session.body_required ?? {};
            const psych = session.psych_required ?? {};
            const tags = [];
            if (body.protein_g !== void 0 && body.protein_g !== null) tags.push("\u86CB\u767D\u8D28");
            if (body.resistance_done === true) tags.push("\u6297\u963B");
            if (body.progressive_overload === true) tags.push("\u8D85\u8D1F\u8377");
            if (psych.self_rating_1_to_5 !== void 0 || psych.execution_likert !== void 0) tags.push("\u81EA\u8BC4");
            if (psych.classification || psych.feedback_category) tags.push("\u8BC4\u4EF7\u5904\u7406");
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-hrow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-mono", children: session.date }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-tags", children: tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-tag", children: tag }, tag)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ha-muted", children: "\u65E0\u5FC5\u586B" }) })
            ] }, session.date);
          }),
          sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "ha-empty", children: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002" }) : null
        ] })
      ] }) })
    ] }),
    drawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-scrim", onClick: () => setDrawer(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { className: "ha-drawer", onClick: (event) => event.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-drawer-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BBE\u7F6E" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-icon", onClick: () => setDrawer(false), children: "\u2715" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ha-drawer-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u62BD\u53D6\u6A21\u578B provider" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "ha-input",
              value: String(settings.extractionProvider ?? ""),
              placeholder: "\u7559\u7A7A\u6CBF\u7528 DSH \u5F53\u524D\u9ED8\u8BA4\u6A21\u578B",
              onChange: (event) => setSettings((current) => ({ ...current, extractionProvider: event.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6A21\u578B model" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "ha-input",
              value: String(settings.extractionModel ?? ""),
              placeholder: "\u8BFB\u56FE\u9700\u8981\u89C6\u89C9\u6A21\u578B",
              onChange: (event) => setSettings((current) => ({ ...current, extractionModel: event.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-divider" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: settings.dailyAskEnabled !== false,
              onChange: (event) => setSettings((current) => ({ ...current, dailyAskEnabled: event.target.checked }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6BCF\u5929\u9996\u6B21\u6253\u5F00\u65F6\u8FFD\u95EE\u4ECA\u65E5\u7F3A\u9879" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5B9A\u65F6\u8FFD\u95EE\u65F6\u523B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "ha-input",
              value: String(settings.dailyAskTime ?? ""),
              placeholder: "HH:MM\uFF0C\u7559\u7A7A\u8868\u793A\u53EA\u5728\u6253\u5F00\u65F6",
              onChange: (event) => setSettings((current) => ({ ...current, dailyAskTime: event.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8FFD\u95EE\u5DE5\u4F5C\u533A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "ha-input",
              value: String(settings.dailyAskWorkspace ?? ""),
              placeholder: "\u8DEF\u5F84\uFF0C\u7559\u7A7A\u7528\u5F53\u524D\u4F1A\u8BDD",
              onChange: (event) => setSettings((current) => ({ ...current, dailyAskWorkspace: event.target.value }))
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
              onChange: (event) => setSettings((current) => ({ ...current, escalateHours: Number(event.target.value) || 5 }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-divider" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "ha-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: settings.petEnabled !== false,
              onChange: (event) => setSettings((current) => ({ ...current, petEnabled: event.target.checked }))
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
              onChange: (event) => setSettings((current) => ({ ...current, confirmImageUpload: event.target.checked }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u56FE\u7247\u53D1\u9001\u524D\u9700\u8981\u786E\u8BA4" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ha-drawer-foot", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ha-primary", disabled: busy, onClick: () => void saveSettings(), children: "\u4FDD\u5B58\u8BBE\u7F6E" }) })
    ] }) }) : null
  ] });
}
function HealthNavIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "path",
    {
      d: "M8 13.2S2.6 10 2.6 6.5A2.9 2.9 0 0 1 8 4.9a2.9 2.9 0 0 1 5.4 1.6C13.4 10 8 13.2 8 13.2Z",
      stroke: "currentColor",
      strokeWidth: "1.2",
      strokeLinejoin: "round"
    }
  ) });
}

// src/client/styles.ts
var STYLE_ID = "dsh-health-assessment-styles";
var CSS = `
.ha-root {
  display: flex; flex-direction: column; height: 100%; min-height: 0;
  background: transparent; color: inherit; font-size: 13px; line-height: 1.5;
}
.ha-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px; flex: 0 0 auto;
  border-bottom: 1px solid rgba(255, 255, 255, .07);
}
.ha-title { font-weight: 600; font-size: 13px; }
.ha-date {
  background: #1f2125; border: 1px solid rgba(255, 255, 255, .08); border-radius: 8px;
  color: inherit; padding: 5px 8px; font: inherit; font-size: 12px; color-scheme: dark;
}
.ha-switch { display: flex; gap: 2px; background: #1c1e22; border-radius: 8px; padding: 2px; }
.ha-switch button {
  border: 0; background: transparent; color: #9aa0a8; padding: 5px 10px;
  border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px;
}
.ha-switch button[data-active='true'] { background: #2a2d33; color: #e7e8ea; }
.ha-grow { flex: 1; }
.ha-dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7078; flex: 0 0 auto; }
.ha-dot.ok { background: #4faa80; }
.ha-icon {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255, 255, 255, .08);
  background: #1f2125; color: #c9ced6; cursor: pointer; font: inherit; font-size: 13px;
  display: inline-flex; align-items: center; justify-content: center;
}
.ha-icon:hover { background: #262a30; }
.ha-banner { padding: 8px 16px; font-size: 12px; }
.ha-banner.err { background: rgba(210, 102, 102, .12); color: #e08b8b; }
.ha-banner.ok { background: rgba(79, 170, 128, .12); color: #6cc79a; }
.ha-main {
  flex: 1; min-height: 0; display: grid; grid-template-columns: 65fr 35fr;
  gap: 16px; padding: 16px; overflow: auto;
}
.ha-col { display: flex; flex-direction: column; gap: 16px; min-height: 0; }
.ha-block {
  background: #1c1e22; border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.ha-block-head { display: flex; justify-content: space-between; align-items: center; color: #9aa0a8; font-size: 12px; }
.ha-muted { color: #7f858d; font-size: 12px; }
.ha-mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.ha-input {
  background: #22252a; border: 1px solid rgba(255, 255, 255, .06); border-radius: 9px;
  color: inherit; font: inherit; padding: 10px 12px; min-height: 96px; resize: vertical;
}
.ha-input:focus { outline: none; border-color: rgba(255, 255, 255, .18); }
.ha-actions { display: flex; align-items: center; gap: 10px; }
.ha-primary {
  background: #3757c9; border: 0; color: #fff; border-radius: 9px;
  padding: 9px 18px; font: inherit; cursor: pointer;
}
.ha-primary:hover { background: #3d5fdb; }
.ha-primary:disabled { opacity: .5; cursor: default; }
.ha-progress { height: 4px; background: rgba(255, 255, 255, .08); border-radius: 2px; overflow: hidden; }
.ha-progress i { display: block; height: 100%; background: #4faa80; border-radius: 2px; transition: width .25s; }
.ha-list { display: flex; flex-direction: column; gap: 2px; }
.ha-row {
  display: flex; align-items: center; gap: 10px; padding: 9px 8px; width: 100%;
  background: transparent; border: 0; border-radius: 8px; color: inherit;
  font: inherit; text-align: left; cursor: pointer;
}
.ha-row:hover { background: rgba(255, 255, 255, .04); }
.ha-row[data-done='true'] { cursor: default; }
.ha-row[data-done='true']:hover { background: transparent; }
.ha-row-icon { width: 16px; flex: 0 0 auto; color: #8b9099; }
.ha-row[data-done='true'] .ha-row-icon { color: #4faa80; }
.ha-row-label { min-width: 128px; flex: 0 0 auto; }
.ha-row-hint { flex: 1; color: #7f858d; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ha-pill {
  flex: 0 0 auto; font-size: 11px; padding: 2px 8px; border-radius: 999px;
  background: rgba(255, 255, 255, .06); color: #9aa0a8;
}
.ha-pill.ok { background: rgba(79, 170, 128, .16); color: #6cc79a; }
.ha-metrics { display: flex; gap: 10px; }
.ha-metric {
  flex: 1; background: #22252a; border-radius: 10px; padding: 12px 14px;
  display: flex; align-items: baseline; gap: 4px;
}
.ha-metric span { color: #9aa0a8; font-size: 12px; }
.ha-metric strong { font-size: 20px; font-variant-numeric: tabular-nums; font-weight: 600; }
.ha-metric em { color: #7f858d; font-style: normal; font-size: 11px; }
.ha-status { margin: 0; color: #9aa0a8; font-size: 12px; }
.ha-steps { margin: 0; padding-left: 16px; color: #c9ced6; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
.ha-heat { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; margin-top: 4px; }
.ha-cell { aspect-ratio: 1; border-radius: 3px; background: #22252a; }
.ha-cell.lv1 { background: #2f4a3f; }
.ha-cell.lv2 { background: #33604c; }
.ha-cell.lv3 { background: #3d7d61; }
.ha-cell.lv4 { background: #4faa80; }
.ha-legend { display: flex; align-items: center; gap: 4px; color: #7f858d; font-size: 11px; margin-top: 6px; }
.ha-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; background: #22252a; }
.ha-legend i.lv1 { background: #2f4a3f; }
.ha-legend i.lv2 { background: #33604c; }
.ha-legend i.lv3 { background: #3d7d61; }
.ha-legend i.lv4 { background: #4faa80; }
.ha-empty { margin: 0; color: #7f858d; font-size: 12px; }
.ha-history { display: flex; flex-direction: column; }
.ha-hrow {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 7px 0; border-bottom: 1px solid rgba(255, 255, 255, .05); font-size: 12px;
}
.ha-hrow:last-child { border-bottom: 0; }
.ha-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.ha-tag { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(79, 170, 128, .14); color: #6cc79a; }
.ha-divider { height: 1px; background: rgba(255, 255, 255, .07); margin: 4px 0; }
.ha-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #9aa0a8; }
.ha-field .ha-input { min-height: 0; padding: 8px 10px; }
.ha-check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #c9ced6; }
.ha-check input { width: auto; }
.ha-scrim {
  position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, .5);
  display: flex; justify-content: flex-end;
}
.ha-drawer {
  width: 380px; max-width: 92vw; height: 100%; background: #1b1d21;
  border-left: 1px solid rgba(255, 255, 255, .08);
  display: flex; flex-direction: column; box-shadow: -16px 0 40px rgba(0, 0, 0, .35);
}
.ha-drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, .07); font-weight: 600;
}
.ha-drawer-body { flex: 1; overflow: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.ha-drawer-foot { padding: 14px 18px; border-top: 1px solid rgba(255, 255, 255, .07); display: flex; justify-content: flex-end; }
@media (max-width: 980px) {
  .ha-main { grid-template-columns: 1fr; }
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
