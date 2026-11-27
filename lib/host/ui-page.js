/**
 * 插件界面：一页铺满的四个区块——输入、输出、评估、设置。
 *
 * 刻意不做侧边栏、不做大字号层级：整页是一张仪表盘，所有内容同屏，
 * 字号统一在 13px 一档，数字用等宽，靠间距与分隔线分区而不是靠大小对比。
 *
 * 页面由宿主直接渲染（`GET /health-assessment-8221/ui`），不依赖 DSH 的浏览器
 * 插件加载链，也不会另起一个应用窗口。
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
    --bg: #16171a; --panel: #1c1e22; --line: #2a2d33; --text: #e6e7ea; --muted: #8d919a;
    --accent: #5f7cf0; --good: #4faa80; --warn: #c9922f; --bad: #d26666; --fs: 13px;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--text); font-size: var(--fs); line-height: 1.45;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    display: flex; flex-direction: column; overflow: hidden;
  }
  header {
    display: flex; align-items: center; gap: 10px; padding: 0 14px; height: 42px;
    border-bottom: 1px solid var(--line); flex: 0 0 auto;
  }
  header .title { font-weight: 600; }
  header .meta { color: var(--muted); }
  header .grow { flex: 1; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); display: inline-block; }
  .dot.ok { background: var(--good); }
  .dot.err { background: var(--bad); }
  button {
    font: inherit; font-size: var(--fs); color: var(--text); background: #23262c;
    border: 1px solid var(--line); border-radius: 7px; padding: 5px 11px; cursor: pointer;
  }
  button:hover { background: #2a2e35; }
  button.primary { background: rgba(95,124,240,.22); border-color: rgba(95,124,240,.45); }
  button:disabled { opacity: .5; cursor: default; }
  main {
    flex: 1; min-height: 0; display: grid; gap: 10px; padding: 10px;
    grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
  }
  .panel {
    background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
    display: flex; flex-direction: column; min-height: 0; overflow: hidden;
  }
  .panel > .head {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    border-bottom: 1px solid var(--line); color: var(--muted); flex: 0 0 auto;
  }
  .panel > .head .name { color: var(--text); font-weight: 600; }
  .panel > .body { padding: 10px 12px 12px; overflow: auto; min-height: 0; flex: 1; }
  .field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .field label { color: var(--muted); flex: 0 0 auto; min-width: 52px; }
  input, textarea, select {
    font: inherit; font-size: var(--fs); color: var(--text); background: #23262c;
    border: 1px solid var(--line); border-radius: 7px; padding: 6px 9px; width: 100%;
  }
  textarea { resize: vertical; min-height: 64px; line-height: 1.5; }
  .row { display: flex; align-items: center; gap: 8px; }
  .row.wrap { flex-wrap: wrap; }
  .muted { color: var(--muted); }
  .mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: var(--fs); }
  .sep { height: 1px; background: var(--line); margin: 10px 0; }
  .kv { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; }
  .kv .k { color: var(--muted); }
  .tag { border-radius: 4px; padding: 1px 6px; background: #262a31; color: var(--muted); font-size: 12px; }
  .tag.good { background: rgba(79,170,128,.16); color: var(--good); }
  .tag.warn { background: rgba(201,146,47,.16); color: var(--warn); }
  .tag.bad { background: rgba(210,102,102,.16); color: var(--bad); }
  .bar { height: 6px; background: #262a31; border-radius: 3px; overflow: hidden; flex: 1; }
  .bar > i { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
  .bar.good > i { background: var(--good); }
  .bars { display: flex; align-items: flex-end; gap: 4px; height: 86px; margin-top: 6px; }
  .bars .col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; gap: 3px; }
  .bars .col i { display: block; background: #333842; border-radius: 2px; min-height: 2px; }
  .bars .col i.hit { background: var(--accent); }
  .bars .col i.full { background: var(--good); }
  .bars .col em { font-style: normal; color: var(--muted); font-size: 10px; text-align: center; }
  .log { display: flex; flex-direction: column; gap: 4px; }
  .log .line { display: flex; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px dashed #24272d; }
  .log .line:last-child { border-bottom: 0; }
  .status { margin-top: 8px; min-height: 18px; }
  .status.err { color: var(--bad); }
  .status.ok { color: var(--good); }
  .hide { display: none !important; }
  @media (max-width: 900px) {
    main { grid-template-columns: 1fr; grid-template-rows: repeat(4, minmax(220px, auto)); overflow: auto; }
  }
</style>
</head>
<body>
<header>
  <span class="title">健康评估</span>
  <span class="meta" id="meta">读取中…</span>
  <span class="grow"></span>
  <span class="dot" id="dot"></span>
  <span class="meta" id="status"></span>
  <button id="reload">刷新</button>
</header>
<main>
  <section class="panel">
    <div class="head"><span class="name">输入</span><span>一句话打卡 / CSV 导入</span></div>
    <div class="body">
      <textarea id="text" placeholder="今天抗阻45分钟加了卧推重量，蛋白质140g，状态5分，不内耗"></textarea>
      <div class="row" style="margin-top:8px">
        <input id="date" type="date" style="max-width:150px" />
        <button class="primary" id="send">记录</button>
        <span class="muted" id="inputHint">规则先解析，缺项才请模型</span>
      </div>
      <div class="sep"></div>
      <div class="field"><label>CSV</label><input id="csvPath" placeholder="粘贴表格内容（含表头）" /></div>
      <textarea id="csv" placeholder="日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类" style="min-height:52px"></textarea>
      <div class="row" style="margin-top:8px"><button id="sendcsv">导入表格</button></div>
      <div class="status" id="s_input"></div>
    </div>
  </section>

  <section class="panel">
    <div class="head"><span class="name">输出</span><span>今日缺项 / 最近记录</span></div>
    <div class="body">
      <div id="flags"></div>
      <div class="kv"><span class="k">今日必填</span><span class="mono" id="todayDone">—</span></div>
      <div id="missing" class="log" style="margin-top:6px"></div>
      <div class="sep"></div>
      <div class="kv"><span class="k">最近记录</span><span class="mono" id="recentCount">—</span></div>
      <div id="recent" class="log" style="margin-top:6px"></div>
      <div class="status" id="s_output"></div>
    </div>
  </section>

  <section class="panel">
    <div class="head"><span class="name">评估</span><span>七天窗口</span></div>
    <div class="body">
      <div class="kv"><span class="k">合计 / 200</span><span class="mono" id="total">—</span></div>
      <div class="kv"><span class="k">身体 / 100</span><span class="mono" id="body">—</span></div>
      <div class="kv"><span class="k">心理 / 100</span><span class="mono" id="psych">—</span></div>
      <div class="kv"><span class="k">模式</span><span class="mono" id="mode">—</span></div>
      <div class="sep"></div>
      <div id="parts"></div>
      <div class="sep"></div>
      <div class="kv"><span class="k">最近 14 天必填完成度</span><span class="mono" id="windowInfo">—</span></div>
      <div class="bars" id="bars"></div>
      <div class="status" id="s_eval"></div>
    </div>
  </section>

  <section class="panel">
    <div class="head"><span class="name">设置</span><span>模型 / 追问 / 数据</span></div>
    <div class="body">
      <div class="field"><label>provider</label><input id="provider" placeholder="留空沿用 DSH 默认模型" /></div>
      <div class="field"><label>model</label><input id="model" placeholder="视觉模型才能读图" /></div>
      <div class="field"><label>追问</label><input id="askTime" placeholder="HH:MM，留空=只在打开时" /></div>
      <div class="field"><label>工作区</label><input id="workspace" placeholder="追问会话的工作区路径" /></div>
      <div class="field"><label>升级</label><input id="escalate" type="number" step="1" min="1" placeholder="5" /><span class="muted">小时未回复再问</span></div>
      <div class="row wrap" style="margin:8px 0">
        <label class="row" style="gap:6px"><input type="checkbox" id="pet" style="width:auto" /> 桌宠播报</label>
        <label class="row" style="gap:6px"><input type="checkbox" id="askEnabled" style="width:auto" /> 每日追问</label>
        <label class="row" style="gap:6px"><input type="checkbox" id="confirmImage" style="width:auto" /> 图片需确认</label>
      </div>
      <div class="row"><button class="primary" id="savesettings">保存设置</button></div>
      <div class="sep"></div>
      <div class="field"><label>导入</label><input id="importPath" placeholder="旧记忆库目录，只读不写" /></div>
      <div class="row"><button id="doimport">从旧库导入</button></div>
      <div class="status" id="s_settings"></div>
    </div>
  </section>
</main>
<script>
(function(){
  var API = ${JSON.stringify(API_PREFIX)};
  var state = { overview: null, sessions: [], settings: {} };

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function pct(v){ return Math.round((Number(v) || 0) * 100) + '%'; }
  function val(v){ return (v === null || v === undefined || v === '' || isNaN(v)) ? '—' : v; }

  function request(path, init){
    return fetch(API + path, Object.assign({ credentials: 'same-origin',
      headers: init && init.body ? {'Content-Type':'application/json'} : undefined }, init || {}))
      .then(function(r){ return r.text().then(function(t){
        var d = t ? JSON.parse(t) : {};
        if (!r.ok) throw new Error(d.error || ('请求失败 ' + r.status));
        return d;
      }); });
  }

  function setStatus(id, text, kind){
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'status ' + (kind || '');
    el.textContent = text || '';
    if (kind) setTimeout(function(){ if (el.textContent === text) { el.textContent=''; el.className='status'; } }, 4000);
  }

  function load(){
    return Promise.all([request('/overview'), request('/sessions?limit=14')])
      .then(function(res){
        state.overview = res[0]; state.sessions = res[1]; state.settings = res[0].settings || {};
        document.getElementById('dot').className = 'dot ok';
        document.getElementById('status').textContent = '已连接';
        render();
      })
      .catch(function(e){
        document.getElementById('dot').className = 'dot err';
        document.getElementById('status').textContent = '未连接';
        setStatus('s_output', e.message, 'err');
      });
  }

  function render(){
    var o = state.overview || {};
    var daily = o.daily || {}, score = o.score || {}, scores = score.scores || {};
    document.getElementById('meta').textContent = (o.date || '') + ' · 累计 ' + (o.distinctDates || 0) + '/7 天';

    // 输出：红旗 + 缺项 + 最近记录
    var flags = o.redFlags || [];
    document.getElementById('flags').innerHTML = flags.length
      ? '<div class="row" style="gap:6px;margin-bottom:6px"><span class="tag bad">红旗</span><span>' + flags.map(esc).join('、') + '</span></div>'
        + '<div class="muted" style="margin-bottom:6px">先联系医疗或当地紧急帮助，本轮不打分。</div>'
      : '';
    var missing = daily.missing_required_fields || [];
    document.getElementById('todayDone').textContent = missing.length ? ('还差 ' + missing.length + ' 项') : '已齐';
    document.getElementById('missing').innerHTML = missing.length
      ? missing.map(function(m){ return '<div class="line"><span>' + esc(m) + '</span><span class="tag warn">待补</span></div>'; }).join('')
      : '<div class="muted">五项必填都齐了。</div>';
    document.getElementById('recentCount').textContent = (state.sessions.length || 0) + ' 天';
    document.getElementById('recent').innerHTML = (state.sessions.slice(0, 6).map(function(s){
      var b = s.body_required || {}, p = s.psych_required || {}, tags = [];
      if (b.protein_g) tags.push('蛋白 ' + b.protein_g + 'g');
      if (b.resistance_done || b.resistance_minutes) tags.push('抗阻');
      if (b.progressive_overload) tags.push('超负荷');
      if (p.self_rating_1_to_5 || p.execution_likert) tags.push('自评 ' + (p.self_rating_1_to_5 || p.execution_likert));
      if (p.classification || p.feedback_category) tags.push(p.classification || p.feedback_category);
      return '<div class="line"><span class="mono">' + esc(s.date) + '</span><span class="row" style="gap:4px">'
        + (tags.length ? tags.map(function(t){ return '<span class="tag good">' + esc(t) + '</span>'; }).join('') : '<span class="muted">无必填</span>')
        + '</span></div>';
    }).join('') || '<div class="muted">还没有记录。</div>');

    // 评估
    document.getElementById('total').textContent = val(scores.total && scores.total.score);
    document.getElementById('body').textContent = val(scores.body && scores.body.score);
    document.getElementById('psych').textContent = val(scores.psych && scores.psych.score);
    document.getElementById('mode').textContent = score.mode || '—';
    var parts = (scores.body_required && scores.body_required.parts) || {};
    var exec = (scores.psych_required && scores.psych_required.execution);
    var cls = (scores.psych_required && scores.psych_required.classification);
    var rows = [];
    ['蛋白质','抗阻','超负荷'].forEach(function(k){
      var v = Number(parts[k]);
      if (!isNaN(v)) rows.push(barRow(k, v));
    });
    if (exec !== undefined && exec !== null) rows.push(barRow('自评分', Number(exec)));
    if (cls !== undefined && cls !== null) rows.push(barRow('评价分类', Number(cls)));
    document.getElementById('parts').innerHTML = rows.join('') || '<div class="muted">还没有可评分的必填。</div>';

    // 14 天柱状图
    var map = {};
    (state.sessions || []).forEach(function(s){ map[s.date] = s; });
    var today = new Date(), cols = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000), key = d.toISOString().slice(0, 10);
      var s = map[key], hits = 0;
      if (s) {
        var b = s.body_required || {}, p = s.psych_required || {};
        if (b.protein_g) hits++;
        if (b.resistance_done) hits++;
        if (b.progressive_overload) hits++;
        if (p.self_rating_1_to_5 || p.execution_likert) hits++;
        if (p.classification || p.feedback_category) hits++;
      }
      var h = Math.max(2, Math.round(hits / 5 * 100));
      var cls2 = hits === 5 ? 'full' : (hits > 0 ? 'hit' : '');
      cols.push('<div class="col" title="' + key + ' 必填 ' + hits + '/5"><i class="' + cls2 + '" style="height:' + h + '%"></i><em>' + key.slice(5) + '</em></div>');
    }
    document.getElementById('bars').innerHTML = cols.join('');
    document.getElementById('windowInfo').textContent = '跨度 ' + val(score.calendar_span_days) + ' 天';

    // 设置
    var st = state.settings || {};
    document.getElementById('provider').value = st.extractionProvider || '';
    document.getElementById('model').value = st.extractionModel || '';
    document.getElementById('askTime').value = st.dailyAskTime || '';
    document.getElementById('workspace').value = st.dailyAskWorkspace || '';
    document.getElementById('escalate').value = st.escalateHours || 5;
    document.getElementById('pet').checked = st.petEnabled !== false;
    document.getElementById('askEnabled').checked = st.dailyAskEnabled !== false;
    document.getElementById('confirmImage').checked = st.confirmImageUpload !== false;
  }

  function barRow(label, ratio){
    return '<div class="row" style="margin:4px 0"><span class="muted" style="min-width:64px">' + label + '</span>'
      + '<span class="bar' + (ratio >= 1 ? ' good' : '') + '"><i style="width:' + pct(ratio) + '"></i></span>'
      + '<span class="mono" style="min-width:42px;text-align:right">' + pct(ratio) + '</span></div>';
  }

  function bind(){
    var dateEl = document.getElementById('date');
    dateEl.value = new Date().toISOString().slice(0, 10);

    document.getElementById('send').onclick = function(){
      var text = document.getElementById('text').value;
      if (!text.trim()) return;
      this.disabled = true;
      request('/checkin/text', { method:'POST', body: JSON.stringify({ text: text, date: dateEl.value || undefined }) })
        .then(function(r){ setStatus('s_input', '已写入 ' + r.session.date + (r.warning ? ' · ' + r.warning : ''), 'ok'); document.getElementById('text').value=''; return load(); })
        .catch(function(e){ setStatus('s_input', e.message, 'err'); })
        .then(function(){ document.getElementById('send').disabled = false; });
    };

    document.getElementById('sendcsv').onclick = function(){
      var csv = document.getElementById('csv').value;
      if (!csv.trim()) return;
      this.disabled = true;
      request('/checkin/table', { method:'POST', body: JSON.stringify({ csv: csv }) })
        .then(function(r){ setStatus('s_input', '已导入 ' + r.imported + ' 天', 'ok'); document.getElementById('csv').value=''; return load(); })
        .catch(function(e){ setStatus('s_input', e.message, 'err'); })
        .then(function(){ document.getElementById('sendcsv').disabled = false; });
    };

    document.getElementById('savesettings').onclick = function(){
      var body = {
        extractionProvider: document.getElementById('provider').value,
        extractionModel: document.getElementById('model').value,
        dailyAskTime: document.getElementById('askTime').value,
        dailyAskWorkspace: document.getElementById('workspace').value,
        escalateHours: Number(document.getElementById('escalate').value) || 5,
        petEnabled: document.getElementById('pet').checked,
        dailyAskEnabled: document.getElementById('askEnabled').checked,
        confirmImageUpload: document.getElementById('confirmImage').checked
      };
      var btn = this; btn.disabled = true;
      request('/settings', { method:'POST', body: JSON.stringify(body) })
        .then(function(){ setStatus('s_settings', '设置已保存', 'ok'); return load(); })
        .catch(function(e){ setStatus('s_settings', e.message, 'err'); })
        .then(function(){ btn.disabled = false; });
    };

    document.getElementById('doimport').onclick = function(){
      var path = document.getElementById('importPath').value;
      if (!path.trim()) return;
      var btn = this; btn.disabled = true;
      request('/import', { method:'POST', body: JSON.stringify({ sourceRoot: path }) })
        .then(function(r){ setStatus('s_settings', '导入 ' + r.imported + ' 个文件，跳过 ' + r.skipped + ' 个', 'ok'); return load(); })
        .catch(function(e){ setStatus('s_settings', e.message, 'err'); })
        .then(function(){ btn.disabled = false; });
    };

    document.getElementById('reload').onclick = function(){ load(); };
  }

  bind();
  load();
  setInterval(load, 60000);
})();
</script>
</body>
</html>`;
}
/**
 * 兜底入口脚本：在 DSH 页面左下角放一个固定按钮，点开全屏面板。
 *
 * 与 client 插件的 `sidebar.footer.action` 并行：那条走 Cordis 槽位，这条只依赖
 * 一次 index 注入，用来保证「一定有入口可见」。
 */
export function renderEntryScript() {
    return `(function(){
  var BTN='ha-entry', OVERLAY='ha-entry-overlay', API=${JSON.stringify(API_PREFIX)};
  function openPanel(){
    if (document.getElementById(OVERLAY)) return;
    var wrap=document.createElement('div');
    wrap.id=OVERLAY;
    wrap.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px';
    var frame=document.createElement('iframe');
    frame.src=API+'/ui';
    frame.style.cssText='width:min(1440px,96vw);height:min(920px,92vh);border:1px solid #2a2d33;border-radius:12px;background:#16171a';
    wrap.appendChild(frame);
    wrap.addEventListener('click',function(event){ if(event.target===wrap) wrap.remove(); });
    document.addEventListener('keydown',function onKey(event){
      if(event.key==='Escape'){ wrap.remove(); document.removeEventListener('keydown',onKey); }
    });
    document.body.appendChild(wrap);
  }
  function mount(){
    if(!document.body || document.getElementById(BTN)) return;
    var button=document.createElement('button');
    button.id=BTN;
    button.type='button';
    button.textContent='♥ 健康评估';
    button.title='打开健康评估面板';
    button.style.cssText=[
      'position:fixed','left:12px','bottom:14px','z-index:99999',
      'font:13px -apple-system,"PingFang SC",sans-serif','color:#e6e7ea',
      'background:rgba(95,124,240,.22)','border:1px solid rgba(95,124,240,.5)',
      'border-radius:8px','padding:7px 12px','cursor:pointer','box-shadow:0 4px 14px rgba(0,0,0,.35)'
    ].join(';');
    button.addEventListener('click',openPanel);
    document.body.appendChild(button);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  try { new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true}); } catch (e) {}
})();`;
}
