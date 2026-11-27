/**
 * 独立界面：由宿主直接渲染的一页式健康中心。
 *
 * 为什么不复用浏览器插件：DSH 的 client 插件要走 `__ModuleLoader__` + boot 图，
 * 一旦那条链没接上，用户就只剩插件页里的 README 可看。这里改成宿主路由直接吐
 * 一页自包含 HTML（内联样式与脚本、只调同源 API），打开 URL 就能用，不依赖任何
 * 前端加载协议。
 *
 * 页面里只有「展示与提交」，所有计算仍走 `/api` 背后的计分器。
 *
 * @module dsh-health-assessment/src/host/ui-page
 */

/** 页面用到的路由前缀，与 api.ts 保持一致。 */
import { API_PREFIX } from './api.js'

/** 生成独立界面 HTML。 */
export function renderUiPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>健康评估</title>
<style>
  :root {
    --bg: #17181b; --panel: #1e2024; --line: #2c2f35; --text: #e8e8ea;
    --muted: #9a9ea7; --accent: #6f8cff; --good: #4fbf87; --warn: #d99a3a; --bad: #e06c6c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.5 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  .app { display: grid; grid-template-columns: 208px 1fr; height: 100vh; }
  .nav { border-right: 1px solid var(--line); padding: 14px 10px; display: flex; flex-direction: column; gap: 4px; }
  .brand { font-size: 15px; font-weight: 600; padding: 4px 10px 12px; }
  .brand small { display: block; font-weight: 400; color: var(--muted); font-size: 11px; margin-top: 2px; }
  .nav button {
    display: flex; align-items: center; gap: 9px; width: 100%; border: 0; cursor: pointer;
    background: transparent; color: var(--muted); padding: 9px 10px; border-radius: 8px;
    font: inherit; text-align: left;
  }
  .nav button:hover { background: #22252a; color: var(--text); }
  .nav button.active { background: #262a31; color: var(--text); }
  .nav .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); opacity: 0; }
  .nav button.active .dot { opacity: 1; }
  .nav .spacer { flex: 1; }
  .nav .foot { color: var(--muted); font-size: 11px; padding: 8px 10px; border-top: 1px solid var(--line); }
  .main { overflow: auto; padding: 22px 26px 40px; }
  h1 { font-size: 19px; margin: 0 0 4px; }
  .sub { color: var(--muted); font-size: 12px; margin-bottom: 18px; }
  .grid { display: grid; gap: 14px; }
  .cols-2 { grid-template-columns: 1fr 1fr; }
  .cols-3 { grid-template-columns: repeat(3, 1fr); }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
  .card h2 { font-size: 13px; margin: 0 0 10px; color: var(--muted); font-weight: 500; }
  .big { font-size: 30px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .unit { color: var(--muted); font-size: 12px; }
  .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .between { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .chip { border-radius: 999px; padding: 2px 9px; font-size: 11px; background: #2a2e35; color: var(--muted); }
  .chip.good { background: rgba(79,191,135,.16); color: var(--good); }
  .chip.warn { background: rgba(217,154,58,.16); color: var(--warn); }
  .chip.bad { background: rgba(224,108,108,.16); color: var(--bad); }
  input, textarea, select {
    width: 100%; background: #23262c; border: 1px solid var(--line); color: var(--text);
    border-radius: 9px; padding: 9px 11px; font: inherit;
  }
  textarea { min-height: 92px; resize: vertical; }
  label { display: block; color: var(--muted); font-size: 12px; margin: 10px 0 5px; }
  button.primary, button.ghost {
    border-radius: 9px; padding: 8px 15px; font: inherit; cursor: pointer; border: 1px solid var(--line);
    background: #272b32; color: var(--text);
  }
  button.primary { background: rgba(111,140,255,.22); border-color: rgba(111,140,255,.45); }
  button:disabled { opacity: .5; cursor: default; }
  .list { display: flex; flex-direction: column; gap: 7px; }
  .item { display: flex; justify-content: space-between; gap: 12px; padding: 8px 10px; background: #23262c; border-radius: 9px; font-variant-numeric: tabular-nums; }
  .msg { font-size: 12px; white-space: pre-wrap; margin-top: 10px; }
  .msg.err { color: var(--bad); }
  .msg.ok { color: var(--good); }
  .bars { display: flex; align-items: flex-end; gap: 6px; height: 118px; }
  .bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .bar span { display: block; width: 100%; background: linear-gradient(180deg, #6f8cff, #4356b8); border-radius: 4px 4px 2px 2px; min-height: 2px; }
  .bar small { color: var(--muted); font-size: 10px; }
  .mono { font-variant-numeric: tabular-nums; }
  .muted { color: var(--muted); }
  .hint { color: var(--muted); font-size: 12px; margin-top: 6px; }
  .hide { display: none !important; }
  @media (max-width: 820px) {
    .app { grid-template-columns: 1fr; }
    .nav { flex-direction: row; overflow: auto; border-right: 0; border-bottom: 1px solid var(--line); }
    .brand, .nav .foot, .nav .spacer { display: none; }
    .cols-2, .cols-3 { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="app">
  <nav class="nav">
    <div class="brand">健康评估<small>七天内确定性评分</small></div>
    <button data-view="today" class="active"><span class="dot"></span>今日</button>
    <button data-view="checkin"><span class="dot"></span>打卡</button>
    <button data-view="profile"><span class="dot"></span>档案</button>
    <button data-view="score"><span class="dot"></span>评分</button>
    <button data-view="monitor"><span class="dot"></span>监测</button>
    <button data-view="history"><span class="dot"></span>历史</button>
    <div class="spacer"></div>
    <button data-view="settings"><span class="dot"></span>设置</button>
    <div class="foot" id="foot">库：读取中…</div>
  </nav>
  <main class="main" id="main"></main>
</div>
<script>
(function(){
  var API = ${JSON.stringify(API_PREFIX)};
  var state = { overview: null, sessions: [], settings: {}, view: 'today', msg: '', msgKind: '' };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function pct(v){ return Math.round((Number(v) || 0) * 100) + '%'; }
  function num(v){ return (v === null || v === undefined || isNaN(v)) ? '—' : v; }

  function request(path, init){
    return fetch(API + path, Object.assign({ credentials: 'same-origin',
      headers: init && init.body ? {'Content-Type':'application/json'} : undefined }, init || {}))
      .then(function(r){ return r.text().then(function(t){
        var data = t ? JSON.parse(t) : {};
        if (!r.ok) throw new Error(data.error || ('请求失败 ' + r.status));
        return data;
      }); });
  }

  function flash(text, kind){
    state.msg = text || ''; state.msgKind = kind || '';
    var el = document.getElementById('flash');
    if (el) { el.className = 'msg ' + (kind || ''); el.textContent = state.msg; }
  }

  function load(){
    return Promise.all([request('/overview'), request('/sessions?limit=60')]).then(function(res){
      state.overview = res[0]; state.sessions = res[1]; state.settings = res[0].settings || {};
      var foot = document.getElementById('foot');
      if (foot) foot.textContent = '累计 ' + (state.overview.distinctDates || 0) + '/7 天 · 今日 ' + pct(state.overview.daily && state.overview.daily.required_completion_ratio);
      render();
    }).catch(function(e){ flash(e.message, 'err'); });
  }

  function viewToday(){
    var o = state.overview; if (!o) return '';
    var missing = (o.daily && o.daily.missing_required_fields) || [];
    var flags = o.redFlags || [];
    var s = o.score || {};
    var scores = s.scores || {};
    var head = '<h1>今日</h1><div class="sub">' + esc(o.date) + ' · 累计 ' + (o.distinctDates||0) + '/7 天</div>';
    var cards = '<div class="grid cols-2">';
    cards += '<div class="card"><h2>今日完成度</h2><div class="big">' + pct(o.daily && o.daily.required_completion_ratio) + '</div>'
      + '<div class="hint">' + (missing.length ? '还差 ' + missing.length + ' 项必填' : '必填已齐') + '</div></div>';
    cards += '<div class="card"><h2>当前评估</h2><div class="big">' + (scores.total && scores.total.score != null ? scores.total.score : '—') + ' <span class="unit">/ 200</span></div>'
      + '<div class="hint">身体 ' + num(scores.body && scores.body.score) + ' / 心理 ' + num(scores.psych && scores.psych.score) + ' · 模式 ' + esc(s.mode || '') + '</div></div>';
    cards += '</div>';
    if (flags.length) cards += '<div class="card" style="margin-top:14px"><h2>红旗</h2><div class="row">' + flags.map(function(f){ return '<span class="chip bad">' + esc(f) + '</span>'; }).join('') + '</div><div class="hint">先联系医疗或当地紧急帮助，本轮不打分。</div></div>';
    cards += '<div class="card" style="margin-top:14px"><h2>今天还差</h2>';
    cards += missing.length ? '<div class="list">' + missing.map(function(m){ return '<div class="item"><span>' + esc(m) + '</span><span class="chip warn">待补</span></div>'; }).join('') + '</div>'
      : '<div class="muted">五项必填都齐了。</div>';
    cards += '</div>';
    return head + cards;
  }

  function viewCheckin(){
    return '<h1>打卡</h1><div class="sub">一句话记录，规则先解析；没写全时才请模型补</div>'
      + '<div class="card"><label>今天的情况</label>'
      + '<textarea id="text" placeholder="今天抗阻45分钟加了卧推重量，蛋白质140g，状态5分，不内耗"></textarea>'
      + '<div class="row" style="margin-top:10px"><input type="date" id="date" style="max-width:180px" /><button class="primary" id="send">记录</button></div>'
      + '<div id="flash" class="msg ' + state.msgKind + '">' + esc(state.msg) + '</div></div>'
      + '<div class="card" style="margin-top:14px"><label>导入 CSV（含表头）</label>'
      + '<textarea id="csv" style="min-height:70px" placeholder="日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类"></textarea>'
      + '<div class="row" style="margin-top:10px"><button id="sendcsv">导入</button>'
      + '<span class="hint">支持 日期/蛋白质/抗阻/步数/静息心率/睡眠时长/自评/评价分类</span></div></div>';
  }

  function viewProfile(){
    var p = (state.overview && state.overview.profile) || {};
    var miss = (state.overview && state.overview.profileMissing) || [];
    function f(k, label, type){
      return '<label>' + label + '</label><input id="p_' + k + '" type="' + (type||'text') + '" value="' + esc(p[k] == null ? '' : p[k]) + '" />';
    }
    return '<h1>档案</h1><div class="sub">' + (miss.length ? '还缺：' + esc(miss.join('、')) : '六项必填已齐') + '</div>'
      + '<div class="card"><div class="grid cols-2">'
      + '<div>' + f('height_cm','身高 cm','number') + f('weight_kg','体重 kg','number') + f('age','年龄','number') + '</div>'
      + '<div>' + f('sex','性别 female/male/other') + f('training_years','训练年限','number')
      + '<label style="margin-top:18px"><input type="checkbox" id="p_injury" style="width:auto" ' + (p.injury ? 'checked' : '') + ' /> 有伤病（只作备注）</label></div>'
      + '</div><div class="row" style="margin-top:14px"><button class="primary" id="saveprofile">保存档案</button><span id="flash" class="msg ' + state.msgKind + '">' + esc(state.msg) + '</span></div></div>';
  }

  function viewScore(){
    var s = (state.overview && state.overview.score) || {};
    if (s.mode !== 'scored') {
      return '<h1>评分</h1><div class="sub">当前不出分</div><div class="card"><div class="muted">'
        + (s.mode === 'blocked_profile' ? '档案缺字段，先补档案。' : s.mode === 'redflag' ? '有红旗信号，本轮不打分。' : esc(s.label || '未满 7 天，先继续记。'))
        + '</div></div>';
    }
    var sc = s.scores || {};
    var parts = (sc.body_required && sc.body_required.parts) || {};
    var rows = Object.keys(parts).map(function(k){ return '<div class="item"><span>' + esc(k) + '</span><span>' + pct(parts[k]) + '</span></div>'; }).join('');
    var steps = (s.next_steps || []).map(function(t){ return '<div class="item"><span>' + esc(t) + '</span></div>'; }).join('');
    var c = s.conclusion || {};
    return '<h1>评分</h1><div class="sub">窗口 ' + esc(s.distinct_dates) + ' 天 / 跨度 ' + esc(s.calendar_span_days) + ' 天</div>'
      + '<div class="grid cols-3"><div class="card"><h2>合计</h2><div class="big">' + num(sc.total && sc.total.score) + '</div></div>'
      + '<div class="card"><h2>身体</h2><div class="big">' + num(sc.body && sc.body.score) + '</div></div>'
      + '<div class="card"><h2>心理</h2><div class="big">' + num(sc.psych && sc.psych.score) + '</div></div></div>'
      + '<div class="card" style="margin-top:14px"><h2>必填明细</h2><div class="list">' + rows + '</div>'
      + '<div class="hint">自评 ' + pct(sc.psych_required && sc.psych_required.execution) + ' · 分类 ' + pct(sc.psych_required && sc.psych_required.classification) + '</div></div>'
      + '<div class="card" style="margin-top:14px"><h2>结论</h2><div>' + esc(c['薄肌'] || '') + '</div><div>' + esc(c['黄毛'] || '') + '</div></div>'
      + '<div class="card" style="margin-top:14px"><h2>下一步</h2><div class="list">' + steps + '</div></div>';
  }

  function viewMonitor(){
    var days = 14, map = {};
    (state.sessions || []).forEach(function(s){ map[s.date] = s; });
    var dates = [], today = new Date();
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000);
      dates.push(d.toISOString().slice(0,10));
    }
    var bars = dates.map(function(day){
      var s = map[day]; var score = 0;
      if (s) {
        var b = s.body_required || {}, p = s.psych_required || {};
        if (b.protein_g) score += 1;
        if (b.resistance_done) score += 1;
        if (b.progressive_overload) score += 1;
        if (p.self_rating_1_to_5 || p.execution_likert) score += 1;
        if (p.classification) score += 1;
      }
      var h = Math.round(score / 5 * 100);
      return '<div class="bar" title="' + day + ' 必填 ' + score + '/5"><span style="height:' + Math.max(h,2) + '%"></span><small>' + day.slice(5) + '</small></div>';
    }).join('');
    var recorded = Object.keys(map).length;
    var flags = (state.overview && state.overview.redFlags) || [];
    return '<h1>监测</h1><div class="sub">最近 14 天必填完成度</div>'
      + '<div class="card"><div class="bars">' + bars + '</div></div>'
      + '<div class="grid cols-3" style="margin-top:14px">'
      + '<div class="card"><h2>有记录的天数</h2><div class="big">' + recorded + '</div></div>'
      + '<div class="card"><h2>距满 7 天</h2><div class="big">' + Math.max(0, 7 - (state.overview && state.overview.distinctDates || 0)) + ' <span class="unit">天</span></div></div>'
      + '<div class="card"><h2>红旗</h2><div class="big">' + flags.length + '</div></div></div>';
  }

  function viewHistory(){
    var rows = (state.sessions || []).map(function(s){
      var b = s.body_required || {}, p = s.psych_required || {};
      var chips = [];
      if (b.protein_g) chips.push('蛋白 ' + b.protein_g + 'g');
      if (b.resistance_done || b.resistance_minutes) chips.push('抗阻');
      if (b.progressive_overload) chips.push('超负荷');
      if (p.self_rating_1_to_5 || p.execution_likert) chips.push('自评 ' + (p.self_rating_1_to_5 || p.execution_likert));
      if (p.classification || p.feedback_category) chips.push(p.classification || p.feedback_category);
      return '<div class="item"><span>' + esc(s.date) + '</span><span class="row">'
        + (chips.length ? chips.map(function(c){ return '<span class="chip good">' + esc(c) + '</span>'; }).join('') : '<span class="muted">无必填</span>')
        + '</span></div>';
    }).join('');
    return '<h1>历史</h1><div class="sub">最近 ' + (state.sessions || []).length + ' 天</div><div class="card"><div class="list">'
      + (rows || '<div class="muted">还没有记录。</div>') + '</div></div>';
  }

  function viewSettings(){
    var s = state.settings || {};
    function field(k, label, type){
      if (type === 'checkbox') {
        return '<label style="margin-top:12px"><input type="checkbox" id="s_' + k + '" style="width:auto" ' + (s[k] ? 'checked' : '') + ' /> ' + label + '</label>';
      }
      return '<label>' + label + '</label><input id="s_' + k + '" type="' + (type || 'text') + '" value="' + esc(s[k] == null ? '' : s[k]) + '" />';
    }
    return '<h1>设置</h1><div class="sub">模型、追问、桌宠与数据</div>'
      + '<div class="card"><h2>抽取模型</h2><div class="hint">留空表示沿用 DSH 当前默认模型；图片识别需要具备视觉能力的模型。</div>'
      + field('extractionProvider', 'provider') + field('extractionModel', 'model') + '</div>'
      + '<div class="card" style="margin-top:14px"><h2>每日追问</h2>'
      + field('dailyAskEnabled', '每天首次打开时自动追问', 'checkbox')
      + field('dailyAskTime', '定时追问时刻 HH:MM（留空=只在打开时）')
      + field('dailyAskWorkspace', '追问会话的工作区路径')
      + field('escalateHours', '未回复多久后升级再问（小时）', 'number') + '</div>'
      + '<div class="card" style="margin-top:14px"><h2>桌宠与隐私</h2>'
      + field('petEnabled', '出分时让桌宠播报一次', 'checkbox')
      + field('confirmImageUpload', '图片发送前需要确认', 'checkbox') + '</div>'
      + '<div class="card" style="margin-top:14px"><h2>数据</h2>'
      + '<label>从旧记忆库导入（只读旧库）</label><input id="importPath" placeholder="/path/to/old-memory-store" />'
      + '<div class="row" style="margin-top:10px"><button id="doimport">导入</button></div></div>'
      + '<div class="row" style="margin-top:16px"><button class="primary" id="savesettings">保存设置</button>'
      + '<span id="flash" class="msg ' + state.msgKind + '">' + esc(state.msg) + '</span></div>';
  }

  function render(){
    var map = { today: viewToday, checkin: viewCheckin, profile: viewProfile, score: viewScore, monitor: viewMonitor, history: viewHistory, settings: viewSettings };
    var main = document.getElementById('main');
    main.innerHTML = (map[state.view] || viewToday)();
    Array.prototype.forEach.call(document.querySelectorAll('.nav button'), function(b){
      b.classList.toggle('active', b.getAttribute('data-view') === state.view);
    });
    wire();
  }

  function wire(){
    var send = document.getElementById('send');
    if (send) send.onclick = function(){
      var text = (document.getElementById('text') || {}).value || '';
      var date = (document.getElementById('date') || {}).value || '';
      if (!text.trim()) return;
      send.disabled = true;
      request('/checkin/text', { method: 'POST', body: JSON.stringify({ text: text, date: date || undefined }) })
        .then(function(r){ flash('已写入 ' + r.session.date + '（' + (r.source === 'model' ? '规则+模型' : '本地规则') + '）' + (r.warning ? '\\n' + r.warning : ''), 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ send.disabled = false; });
    };
    var sendcsv = document.getElementById('sendcsv');
    if (sendcsv) sendcsv.onclick = function(){
      var csv = (document.getElementById('csv') || {}).value || '';
      if (!csv.trim()) return;
      sendcsv.disabled = true;
      request('/checkin/table', { method: 'POST', body: JSON.stringify({ csv: csv }) })
        .then(function(r){ flash('已导入 ' + r.imported + ' 天' + (r.redFlags && r.redFlags.length ? '；红旗：' + r.redFlags.join('、') : ''), 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ sendcsv.disabled = false; });
    };
    var saveprofile = document.getElementById('saveprofile');
    if (saveprofile) saveprofile.onclick = function(){
      function v(id){ var el = document.getElementById(id); return el ? el.value : ''; }
      var body = {
        height_cm: Number(v('p_height_cm')) || null, weight_kg: Number(v('p_weight_kg')) || null,
        age: Number(v('p_age')) || null, sex: v('p_sex') || null,
        training_years: v('p_training_years') === '' ? null : Number(v('p_training_years')),
        injury: !!(document.getElementById('p_injury') || {}).checked
      };
      saveprofile.disabled = true;
      request('/profile', { method: 'POST', body: JSON.stringify(body) })
        .then(function(){ flash('档案已保存。', 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ saveprofile.disabled = false; });
    };
    var savesettings = document.getElementById('savesettings');
    if (savesettings) savesettings.onclick = function(){
      function v(id){ var el = document.getElementById(id); return el ? el.value : ''; }
      function c(id){ var el = document.getElementById(id); return !!(el && el.checked); }
      var body = {
        extractionProvider: v('s_extractionProvider'), extractionModel: v('s_extractionModel'),
        dailyAskEnabled: c('s_dailyAskEnabled'), dailyAskTime: v('s_dailyAskTime'),
        dailyAskWorkspace: v('s_dailyAskWorkspace'),
        escalateHours: Number(v('s_escalateHours')) || 5,
        petEnabled: c('s_petEnabled'), confirmImageUpload: c('s_confirmImageUpload')
      };
      savesettings.disabled = true;
      request('/settings', { method: 'POST', body: JSON.stringify(body) })
        .then(function(){ flash('设置已保存。', 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ savesettings.disabled = false; });
    };
    var doimport = document.getElementById('doimport');
    if (doimport) doimport.onclick = function(){
      var path = (document.getElementById('importPath') || {}).value || '';
      if (!path.trim()) return;
      doimport.disabled = true;
      request('/import', { method: 'POST', body: JSON.stringify({ sourceRoot: path }) })
        .then(function(r){ flash('导入 ' + r.imported + ' 个文件，跳过 ' + r.skipped + ' 个。', 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ doimport.disabled = false; });
    };
  }

  Array.prototype.forEach.call(document.querySelectorAll('.nav button'), function(b){
    b.onclick = function(){ state.view = b.getAttribute('data-view'); state.msg = ''; render(); };
  });

  load();
  setInterval(load, 60000);
})();
</script>
</body>
</html>`
}
