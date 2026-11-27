/**
 * 宿主渲染的回退页面：与 React 主视图同一套信息架构。
 *
 * 结构一致：顶部单行 Header、65/35 主区、设置抽屉、CSV 收进「历史与导入」。
 * 只兜底「浏览器插件没挂上」的情况，不是主入口；因此不注入任何悬浮元素。
 *
 * @module dsh-health-assessment/src/host/ui-page
 */
import { API_PREFIX } from './api.js';
/** 生成整页 HTML。 */
export function renderUiPage() {
    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>健康评估</title>
<style>
  :root {
    --bg: #161719; --surface: #1c1e22; --surface-2: #22252a; --line: rgba(255,255,255,.07);
    --text: #e7e8ea; --muted: #9aa0a8; --muted-2: #7f858d; --ok: #4faa80; --bad: #d26666;
    --accent: #3757c9; --fs: 13px;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--text); font-size: var(--fs); line-height: 1.5;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    display: flex; flex-direction: column; overflow: hidden;
  }
  header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--line); flex: 0 0 auto; }
  .title { font-weight: 600; }
  input[type=date], .icon, .switch button, .input, textarea, .primary, .drawer-x {
    font: inherit; color: inherit;
  }
  input[type=date] { background: #1f2125; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; padding: 5px 8px; color-scheme: dark; }
  .switch { display: flex; gap: 2px; background: var(--surface); border-radius: 8px; padding: 2px; }
  .switch button { border: 0; background: transparent; color: var(--muted); padding: 5px 10px; border-radius: 6px; cursor: pointer; }
  .switch button.active { background: #2a2d33; color: var(--text); }
  .grow { flex: 1; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7078; }
  .dot.ok { background: var(--ok); }
  .icon { width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255,255,255,.08); background: #1f2125; color: #c9ced6; cursor: pointer; }
  main { flex: 1; min-height: 0; display: grid; grid-template-columns: 65fr 35fr; gap: 16px; padding: 16px; overflow: auto; }
  .col { display: flex; flex-direction: column; gap: 16px; min-height: 0; }
  .block { background: var(--surface); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
  .block-head { display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 12px; }
  .muted { color: var(--muted-2); font-size: 12px; }
  .mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  textarea.input { background: var(--surface-2); border: 1px solid rgba(255,255,255,.06); border-radius: 9px; padding: 10px 12px; min-height: 96px; resize: vertical; width: 100%; }
  .actions { display: flex; align-items: center; gap: 10px; }
  .primary { background: var(--accent); border: 0; color: #fff; border-radius: 9px; padding: 9px 18px; cursor: pointer; }
  .primary:disabled { opacity: .5; cursor: default; }
  .progress { height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden; }
  .progress i { display: block; height: 100%; background: var(--ok); }
  .list { display: flex; flex-direction: column; gap: 2px; }
  .row { display: flex; align-items: center; gap: 10px; padding: 9px 8px; border-radius: 8px; cursor: pointer; text-align: left; width: 100%; border: 0; background: transparent; color: inherit; font: inherit; }
  .row:hover { background: rgba(255,255,255,.04); }
  .row.done { cursor: default; }
  .row.done:hover { background: transparent; }
  .row .mark { width: 16px; color: var(--muted-2); }
  .row.done .mark { color: var(--ok); }
  .row .label { min-width: 128px; }
  .row .hint { flex: 1; color: var(--muted-2); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.06); color: var(--muted); }
  .pill.ok { background: rgba(79,170,128,.16); color: #6cc79a; }
  .metrics { display: flex; gap: 10px; }
  .metric { flex: 1; background: var(--surface-2); border-radius: 10px; padding: 12px 14px; display: flex; align-items: baseline; gap: 4px; }
  .metric span { color: var(--muted); font-size: 12px; }
  .metric strong { font-size: 20px; font-variant-numeric: tabular-nums; }
  .metric em { font-style: normal; color: var(--muted-2); font-size: 11px; }
  .status { margin: 0; color: var(--muted); font-size: 12px; }
  ul.steps { margin: 0; padding-left: 16px; color: #c9ced6; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
  .heat { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; margin-top: 4px; }
  .cell { aspect-ratio: 1; border-radius: 3px; background: var(--surface-2); }
  .cell.lv1 { background: #2f4a3f; } .cell.lv2 { background: #33604c; }
  .cell.lv3 { background: #3d7d61; } .cell.lv4 { background: var(--ok); }
  .legend { display: flex; align-items: center; gap: 4px; color: var(--muted-2); font-size: 11px; margin-top: 6px; }
  .legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; background: var(--surface-2); }
  .legend i.lv1 { background: #2f4a3f; } .legend i.lv2 { background: #33604c; }
  .legend i.lv3 { background: #3d7d61; } .legend i.lv4 { background: var(--ok); }
  .empty { margin: 0; color: var(--muted-2); font-size: 12px; }
  .hrow { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,.05); font-size: 12px; }
  .hrow:last-child { border-bottom: 0; }
  .tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
  .tag { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(79,170,128,.14); color: #6cc79a; }
  .scrim { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.5); display: none; justify-content: flex-end; }
  .scrim.open { display: flex; }
  .drawer { width: 380px; max-width: 92vw; height: 100%; background: #1b1d21; border-left: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; box-shadow: -16px 0 40px rgba(0,0,0,.35); }
  .drawer-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line); font-weight: 600; }
  .drawer-body { flex: 1; overflow: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
  .drawer-foot { padding: 14px 18px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; }
  .field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--muted); }
  .field input { background: var(--surface-2); border: 1px solid rgba(255,255,255,.06); border-radius: 9px; padding: 8px 10px; color: var(--text); font: inherit; }
  .check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #c9ced6; }
  .divider { height: 1px; background: var(--line); }
  .banner { padding: 8px 16px; font-size: 12px; }
  .banner.err { background: rgba(210,102,102,.12); color: #e08b8b; }
  .banner.ok { background: rgba(79,170,128,.12); color: #6cc79a; }
  .hide { display: none !important; }
  @media (max-width: 980px) { main { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header>
  <span class="title">健康评估</span>
  <input type="date" id="date" />
  <div class="switch">
    <button id="tabMain" class="active">打卡与评估</button>
    <button id="tabHistory">历史与导入</button>
  </div>
  <span class="grow"></span>
  <span class="dot" id="dot"></span>
  <button class="icon" id="reload" title="刷新">⟳</button>
  <button class="icon" id="gear" title="设置">⚙</button>
</header>
<div id="banner" class="banner hide"></div>
<main id="main"></main>
<div class="scrim" id="scrim">
  <aside class="drawer">
    <div class="drawer-head"><span>设置</span><button class="icon" id="drawerClose">✕</button></div>
    <div class="drawer-body" id="drawerBody"></div>
    <div class="drawer-foot"><button class="primary" id="saveSettings">保存设置</button></div>
  </aside>
</div>
<script>
(function(){
  var API = ${JSON.stringify(API_PREFIX)};
  var state = { date: localToday(), view: 'main', overview: null, sessions: [], settings: {}, msg: '', msgKind: '' };

  function localToday(){
    var d = new Date(), p = function(n){ return String(n).padStart(2,'0'); };
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate());
  }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function pct(v){ return Math.round((Number(v)||0)*100) + '%'; }
  function metric(v){ return (v === null || v === undefined) ? '—' : String(Math.round(v)); }

  function request(path, init){
    return fetch(API + path, Object.assign({ credentials: 'same-origin',
      headers: init && init.body ? {'Content-Type':'application/json'} : undefined }, init || {}))
      .then(function(r){ return r.text().then(function(t){
        var d = t ? JSON.parse(t) : {};
        if (!r.ok) throw new Error(d.error || ('请求失败 ' + r.status));
        return d;
      }); });
  }

  function flash(text, kind){
    var el = document.getElementById('banner');
    el.textContent = text || ''; el.className = 'banner ' + (kind || '');
    if (!text) el.className = 'banner hide';
    else setTimeout(function(){ el.className = 'banner hide'; }, 3600);
  }

  function load(){
    return Promise.all([request('/overview?date=' + encodeURIComponent(state.date)), request('/sessions?limit=60')])
      .then(function(res){
        state.overview = res[0]; state.sessions = res[1] || []; state.settings = res[0].settings || {};
        document.getElementById('dot').className = 'dot ok';
        render();
      })
      .catch(function(e){
        document.getElementById('dot').className = 'dot';
        flash(e.message, 'err');
      });
  }

  function modeText(o){
    if (!o) return '';
    var mode = o.score && o.score.mode;
    var missing = (o.checklist || []).filter(function(i){ return !i.done; }).length;
    var days = o.distinctDates || 0;
    if (mode === 'redflag') return '记录里有需要马上处理的信号，本轮不打分，先联系医疗或当地紧急帮助。';
    if (mode === 'blocked_profile') return '档案还没填完，补齐身高体重等六项后才会生成评分。';
    if (mode === 'under7' || days < 7) return '已记录 ' + days + '/7 天，今天还差 ' + missing + ' 项必填，补齐后生成评分。';
    return '七天窗口已满，评分见上方指标。';
  }

  function heatDays(){
    var map = {};
    (state.sessions || []).forEach(function(s){
      var b = s.body_required || {}, p = s.psych_required || {}, hits = 0;
      if (b.protein_g !== undefined && b.protein_g !== null) hits++;
      if (b.resistance_done === true) hits++;
      if (b.progressive_overload === true) hits++;
      if (p.self_rating_1_to_5 !== undefined || p.execution_likert !== undefined) hits++;
      if (p.classification || p.feedback_category) hits++;
      map[s.date] = hits;
    });
    var out = [], today = new Date();
    for (var i = 13; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000);
      var key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      out.push({ date: key, hits: map[key] || 0 });
    }
    return out;
  }

  function level(hits){ return hits <= 0 ? 0 : hits >= 5 ? 4 : hits >= 3 ? 3 : hits >= 2 ? 2 : 1; }

  function render(){
    var o = state.overview || {}, score = o.score || {}, scores = score.scores || {};
    var checklist = o.checklist || [];
    var done = checklist.filter(function(i){ return i.done; }).length;
    var ratio = checklist.length ? done / checklist.length : 0;
    var dateEl = document.getElementById('date');
    if (dateEl.value !== state.date) dateEl.value = state.date;
    document.getElementById('tabMain').className = state.view === 'main' ? 'active' : '';
    document.getElementById('tabHistory').className = state.view === 'history' ? 'active' : '';

    if (state.view === 'main') {
      var rows = checklist.map(function(item){
        return '<button class="row ' + (item.done ? 'done' : '') + '" data-fill="' + esc(item.key) + '">'
          + '<span class="mark">' + (item.done ? '✓' : '○') + '</span>'
          + '<span class="label">' + esc(item.label) + '</span>'
          + '<span class="hint">' + (item.done ? '' : esc(item.hint)) + '</span>'
          + '<span class="pill ' + (item.done ? 'ok' : '') + '">' + (item.done ? '已完成' : '待补') + '</span>'
          + '</button>';
      }).join('');
      var steps = (score.next_steps || []).map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('');
      var heat = heatDays().map(function(d){
        return '<div class="cell lv' + level(d.hits) + '" title="' + d.date + '：' + d.hits + '/5 项必填"></div>';
      }).join('');
      var emptyHeat = heatDays().every(function(d){ return d.hits === 0; })
        ? '<p class="empty">还没有记录。先在左边写一条，这里就会出现每天的完成情况。</p>' : '';

      document.getElementById('main').innerHTML =
        '<section class="col">'
        + '<div class="block"><div class="block-head"><span>今天的情况</span><span class="muted">' + esc(o.date || state.date) + '</span></div>'
        + '<textarea class="input" id="text" placeholder="例如：抗阻 45 分钟加了卧推重量，蛋白质 140g，状态 5 分，听取建议不内耗"></textarea>'
        + '<div class="actions"><button class="primary" id="send">记录这一条</button><span class="muted">⌘ + Enter 快速提交</span></div></div>'
        + '<div class="block"><div class="block-head"><span>今天的必填</span><span class="muted">' + done + '/' + checklist.length + ' 已完成</span></div>'
        + '<div class="progress"><i style="width:' + pct(ratio) + '"></i></div>'
        + '<div class="list">' + rows + '</div></div>'
        + '</section>'
        + '<section class="col">'
        + '<div class="block"><div class="block-head"><span>七天评估</span></div>'
        + '<div class="metrics">'
        + '<div class="metric"><span>合计</span><strong>' + metric(scores.total && scores.total.score) + '</strong><em>/200</em></div>'
        + '<div class="metric"><span>身体</span><strong>' + metric(scores.body && scores.body.score) + '</strong><em>/100</em></div>'
        + '<div class="metric"><span>心理</span><strong>' + metric(scores.psych && scores.psych.score) + '</strong><em>/100</em></div>'
        + '</div><p class="status">' + esc(modeText(o)) + '</p>'
        + (steps ? '<ul class="steps">' + steps + '</ul>' : '') + '</div>'
        + '<div class="block"><div class="block-head"><span>最近 14 天</span><span class="muted">越满表示必填越齐</span></div>'
        + '<div class="heat">' + heat + '</div>'
        + '<div class="legend"><span>0</span><i></i><i class="lv1"></i><i class="lv2"></i><i class="lv3"></i><i class="lv4"></i><span>5 项</span></div>'
        + emptyHeat + '</div>'
        + '</section>';
      wireMain();
    } else {
      var history = (state.sessions || []).slice(0, 30).map(function(s){
        var b = s.body_required || {}, p = s.psych_required || {}, tags = [];
        if (b.protein_g !== undefined && b.protein_g !== null) tags.push('蛋白质');
        if (b.resistance_done === true) tags.push('抗阻');
        if (b.progressive_overload === true) tags.push('超负荷');
        if (p.self_rating_1_to_5 !== undefined || p.execution_likert !== undefined) tags.push('自评');
        if (p.classification || p.feedback_category) tags.push('评价处理');
        return '<div class="hrow"><span class="mono">' + esc(s.date) + '</span><span class="tags">'
          + (tags.length ? tags.map(function(t){ return '<span class="tag">' + t + '</span>'; }).join('') : '<span class="muted">无必填</span>')
          + '</span></div>';
      }).join('');
      document.getElementById('main').innerHTML =
        '<section class="col"><div class="block"><div class="block-head"><span>导入表格</span><span class="muted">CSV，含表头</span></div>'
        + '<textarea class="input mono" id="csv" placeholder="日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类"></textarea>'
        + '<div class="actions"><button class="primary" id="sendcsv">导入</button><span class="muted">同一天多来源会合并，穿戴记录优先</span></div></div></section>'
        + '<section class="col"><div class="block"><div class="block-head"><span>最近记录</span><span class="muted">' + (state.sessions||[]).length + ' 天</span></div>'
        + '<div>' + (history || '<p class="empty">还没有记录。</p>') + '</div></div></section>';
      wireHistory();
    }
    renderDrawer();
  }

  function wireMain(){
    var dateEl = document.getElementById('date');
    var send = document.getElementById('send');
    if (send) send.onclick = function(){
      var text = document.getElementById('text').value;
      if (!text.trim()) return;
      send.disabled = true;
      request('/checkin/text', { method:'POST', body: JSON.stringify({ text: text, date: state.date }) })
        .then(function(r){ flash('已记入 ' + r.session.date, 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ send.disabled = false; });
    };
    var textEl = document.getElementById('text');
    if (textEl) textEl.onkeydown = function(event){
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && send) send.click();
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-fill]'), function(btn){
      btn.onclick = function(){
        if (btn.className.indexOf('done') >= 0) return;
        var map = { protein:'蛋白质120g', resistance:'抗阻45分钟', overload:'加了重量', rating:'状态4分', feedback:'听取建议' };
        var piece = map[btn.getAttribute('data-fill')] || '';
        if (!piece) return;
        var el = document.getElementById('text');
        if (el && el.value.indexOf(piece) < 0) el.value = (el.value ? el.value + '，' : '') + piece;
      };
    });
    void dateEl;
  }

  function wireHistory(){
    var sendcsv = document.getElementById('sendcsv');
    if (sendcsv) sendcsv.onclick = function(){
      var csv = document.getElementById('csv').value;
      if (!csv.trim()) return;
      sendcsv.disabled = true;
      request('/checkin/table', { method:'POST', body: JSON.stringify({ csv: csv, date: state.date }) })
        .then(function(r){ flash('已导入 ' + r.imported + ' 天', 'ok'); return load(); })
        .catch(function(e){ flash(e.message, 'err'); })
        .then(function(){ sendcsv.disabled = false; });
    };
  }

  function renderDrawer(){
    var s = state.settings || {};
    function field(key, label, placeholder, type){
      return '<label class="field"><span>' + label + '</span><input id="st_' + key + '" type="' + (type||'text') + '" value="'
        + esc(s[key] == null ? '' : s[key]) + '" placeholder="' + esc(placeholder||'') + '" /></label>';
    }
    function check(key, label){
      return '<label class="check"><input type="checkbox" id="st_' + key + '" ' + (s[key] !== false ? 'checked' : '') + ' /> ' + label + '</label>';
    }
    document.getElementById('drawerBody').innerHTML =
      field('extractionProvider','抽取模型 provider','留空沿用 DSH 当前默认模型')
      + field('extractionModel','模型 model','读图需要视觉模型')
      + '<div class="divider"></div>'
      + check('dailyAskEnabled','每天首次打开时追问今日缺项')
      + field('dailyAskTime','定时追问时刻','HH:MM，留空表示只在打开时')
      + field('dailyAskWorkspace','追问工作区','路径，留空用当前会话')
      + field('escalateHours','未回复多久后升级（小时）','5','number')
      + '<div class="divider"></div>'
      + check('petEnabled','出分时让桌宠播报一次')
      + check('confirmImageUpload','图片发送前需要确认');
  }

  function saveSettings(){
    function v(key){ var el = document.getElementById('st_' + key); return el ? el.value : ''; }
    function c(key){ var el = document.getElementById('st_' + key); return !!(el && el.checked); }
    var body = {
      extractionProvider: v('extractionProvider'), extractionModel: v('extractionModel'),
      dailyAskEnabled: c('dailyAskEnabled'), dailyAskTime: v('dailyAskTime'),
      dailyAskWorkspace: v('dailyAskWorkspace'),
      escalateHours: Number(v('escalateHours')) || 5,
      petEnabled: c('petEnabled'), confirmImageUpload: c('confirmImageUpload')
    };
    request('/settings', { method:'POST', body: JSON.stringify(body) })
      .then(function(){ flash('设置已保存', 'ok'); document.getElementById('scrim').classList.remove('open'); return load(); })
      .catch(function(e){ flash(e.message, 'err'); });
  }

  var dateInput = document.getElementById('date');
  dateInput.value = state.date;
  dateInput.max = localToday();
  dateInput.onchange = function(){ state.date = dateInput.value || localToday(); load(); };
  document.getElementById('tabMain').onclick = function(){ state.view = 'main'; render(); };
  document.getElementById('tabHistory').onclick = function(){ state.view = 'history'; render(); };
  document.getElementById('reload').onclick = function(){ load(); };
  document.getElementById('gear').onclick = function(){ document.getElementById('scrim').classList.add('open'); };
  document.getElementById('drawerClose').onclick = function(){ document.getElementById('scrim').classList.remove('open'); };
  document.getElementById('scrim').onclick = function(event){
    if (event.target.id === 'scrim') event.target.classList.remove('open');
  };
  document.getElementById('saveSettings').onclick = saveSettings;
  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape') document.getElementById('scrim').classList.remove('open');
  });

  load();
  setInterval(load, 60000);
})();
</script>
</body>
</html>`;
}
