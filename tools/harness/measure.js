/**
 * 界面几何验收脚本（跑在 headless Chrome 里）。
 *
 * 只做测量：把关键布局数据写进 `<pre id="metrics">`，由 `--dump-dom` 读出。
 * 强约束断言（bottomGap / 折行 / 图标尺寸 / Modal 居中）都在这里量化。
 */

(function () {
  var result = { steps: [] }

  function px(value) {
    return Math.round(value)
  }
  function rect(el) {
    return el ? el.getBoundingClientRect() : null
  }
  function findByText(selector, pattern) {
    return Array.prototype.find.call(document.querySelectorAll(selector), function (el) {
      return pattern.test(el.textContent || '')
    })
  }

  /** 等一帧，让 React 渲染落地。 */
  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms)
    })
  }

  /** 采一次主界面指标。 */
  function measureMain() {
    var root = rect(document.querySelector('.ha-root'))
    var icons = Array.prototype.map.call(document.querySelectorAll('.ha-icon'), function (button) {
      var box = button.getBoundingClientRect()
      var svg = button.querySelector('svg')
      return {
        w: px(box.width),
        h: px(box.height),
        svgSize: svg ? px(svg.getBoundingClientRect().width) : 0,
        title: button.getAttribute('title') || '',
      }
    })
    var labels = Array.prototype.map.call(
      document.querySelectorAll('.ha-row-label, .ha-bar-label, .ha-title, .ha-pill, .ha-switch button'),
      function (el) {
        // 用行盒数量判断折行：多行文本会产生多个 client rect。
        var range = document.createRange()
        range.selectNodeContents(el)
        var lines = range.getClientRects().length
        var box = el.getBoundingClientRect()
        return { text: el.textContent, h: px(box.height), lines: lines, wrapped: lines > 1 }
      },
    )
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      root: root ? { w: px(root.width), h: px(root.height), bottom: px(root.bottom) } : null,
      bottomGap: root ? px(window.innerHeight - root.bottom) : null,
      icons: icons,
      iconSizes: Array.from(new Set(icons.map(function (i) { return i.w + 'x' + i.h }))),
      wrappedLabels: labels.filter(function (l) { return l.wrapped }),
      viewTabs: Array.prototype.map.call(document.querySelectorAll('.ha-switch button'), function (b) {
        return b.textContent
      }),
      checklistRows: document.querySelectorAll('.ha-row').length,
      heatCells: document.querySelectorAll('.ha-cell').length,
      profileCta: !!document.querySelector('.ha-profile-cta'),
      optionalButton: findByText('.ha-mini', /选填/) ? findByText('.ha-mini', /选填/).textContent : null,
      detailButton: !!findByText('.ha-mini', /明细/),
      ringText: (document.querySelector('.ha-ring-num') || {}).textContent || null,
    }
  }

  /** 切到历史视图后采一次。 */
  function measureHistory() {
    return {
      historyRows: document.querySelectorAll('.ha-hrow-btn').length,
      exportButtons: Array.prototype.filter.call(document.querySelectorAll('.ha-mini'), function (b) {
        return /导出/.test(b.textContent || '')
      }).length,
      importButton: !!findByText('.ha-primary', /导入/),
      csvBox: !!document.querySelector('.ha-textarea'),
    }
  }

  /** 打开设置 Modal 后采一次。 */
  function measureModal() {
    var modal = rect(document.querySelector('.ha-modal'))
    var scrim = document.querySelector('.ha-scrim')
    var scrimStyle = scrim ? getComputedStyle(scrim) : null
    var modalStyle = document.querySelector('.ha-modal') ? getComputedStyle(document.querySelector('.ha-modal')) : null
    return {
      modal: modal
        ? {
            w: px(modal.width),
            h: px(modal.height),
            centerX: px(modal.left + modal.width / 2),
            centerY: px(modal.top + modal.height / 2),
            radius: modalStyle ? modalStyle.borderRadius : null,
          }
        : null,
      viewportCenter: { x: px(window.innerWidth / 2), y: px(window.innerHeight / 2) },
      scrim: scrimStyle ? { display: scrimStyle.display, backdrop: scrimStyle.backdropFilter } : null,
      groups: document.querySelectorAll('.ha-modal .ha-group').length,
      footerButtons: Array.prototype.map.call(document.querySelectorAll('.ha-modal-foot button'), function (b) {
        return b.textContent
      }),
      hasVisionPicker: !!findByText('.ha-field span', /识图通道/),
      hasTargets: !!findByText('.ha-group-title', /计分标准/),
      hasLibraries: !!findByText('.ha-group-title', /记忆库/),
      hasDiagnostics: !!findByText('.ha-group-title', /诊断/),
    }
  }

  /** 打开选填弹窗后采一次。 */
  function measureOptional() {
    return {
      groups: document.querySelectorAll('.ha-acc').length,
      openRows: document.querySelectorAll('.ha-opt-row').length,
      levels: document.querySelectorAll('.ha-level').length,
    }
  }

  async function run() {
    try {
      await wait(1400)
      result.main = measureMain()

      // 历史视图
      var historyTab = findByText('.ha-switch button', /历史/)
      if (historyTab) {
        historyTab.click()
        await wait(500)
        result.history = measureHistory()
      }

      // 选填弹窗
      var mainTab = findByText('.ha-switch button', /打卡与评估/)
      if (mainTab) {
        mainTab.click()
        await wait(400)
      }
      var optionalBtn = findByText('.ha-mini', /选填/)
      if (optionalBtn) {
        optionalBtn.click()
        await wait(700)
        // 单开折叠：只量默认展开的一组，15 组结构由 groups 计数确认。
        result.optional = measureOptional()
        var closeBtn = document.querySelector('.ha-modal-head .ha-icon')
        if (closeBtn) closeBtn.click()
        await wait(300)
      }

      // 设置 Modal
      var gear = document.querySelectorAll('.ha-icon')[1]
      if (gear) {
        gear.click()
        await wait(900)
        result.modal = measureModal()
      }

      result.ok = true
    } catch (error) {
      result.ok = false
      result.error = String((error && error.stack) || error)
    }
    var pre = document.createElement('pre')
    pre.id = 'metrics'
    pre.textContent = 'METRICS_JSON=' + JSON.stringify(result)
    document.body.appendChild(pre)
  }

  run()
})()
