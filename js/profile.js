window.TyperMini = window.TyperMini || {}

TyperMini.Profile = (function () {
  var E = TyperMini.Engine
  var K = TyperMini.Keyboard
  var A = TyperMini.Analyzer
  var S = TyperMini.Storage

  var panelEl = null
  var open = false

  function init() {
    panelEl = document.getElementById('profile-panel')
    document.getElementById('btn-profile').addEventListener('click', toggle)
    document.getElementById('profile-close').addEventListener('click', close)
    document.getElementById('profile-overlay').addEventListener('click', close)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { close(); e.stopPropagation() }
    })
  }

  function toggle() {
    open ? close() : show()
  }

  function show() {
    open = true
    panelEl.classList.add('open')
    document.getElementById('profile-overlay').classList.add('open')
    render()
  }

  function close() {
    open = false
    panelEl.classList.remove('open')
    document.getElementById('profile-overlay').classList.remove('open')
  }

  function render() {
    var saved = S.load()
    var analyzer = window._typerAnalyzer || null
    buildOverview(saved, analyzer)
    buildLetters(saved, analyzer)
    buildFingers(saved, analyzer)
    buildTransitions(analyzer)
    buildHistory(saved)
  }

  function buildOverview(saved, analyzer) {
    var totalChars = saved.totalChars
    var totalErrors = saved.totalErrors
    var totalTime = saved.totalTime
    var sessions = saved.sessionsCompleted
    var bestWpm = saved.bestWpm || 0
    var bestStreak = saved.bestStreak || 0
    var overallAcc = totalChars > 0 ? Math.round((1 - totalErrors / totalChars) * 100) : 0
    var hours = Math.floor(totalTime / 3600)
    var mins = Math.floor((totalTime % 3600) / 60)

    var curWpm = analyzer ? A.getWPM(analyzer) : 0
    var curAcc = analyzer ? A.getAccuracy(analyzer) : 0
    var curStreak = analyzer ? analyzer.session.currentStreak : 0

    setHTML('prof-total-chars', formatNum(totalChars))
    setHTML('prof-total-errors', formatNum(totalErrors))
    setHTML('prof-total-time', hours + 'h ' + mins + 'm')
    setHTML('prof-sessions', sessions)
    setHTML('prof-best-wpm', bestWpm)
    setHTML('prof-best-streak', bestStreak)
    setHTML('prof-overall-acc', overallAcc + '%')

    setHTML('prof-cur-wpm', curWpm)
    setHTML('prof-cur-acc', curAcc + '%')
    setHTML('prof-cur-streak', curStreak)
  }

  function buildLetters(saved, analyzer) {
    var container = document.getElementById('prof-letters')
    if (!container) return
    var all = E.getAllLetters()
    var rows = []

    for (var i = 0; i < all.length; i++) {
      var letter = all[i]
      var conf = saved.letterConfidence[letter] || 0
      var speed = null
      var acc = null
      var total = 0
      var errors = 0

      if (analyzer && analyzer.letterStats[letter]) {
        speed = A.getLetterSpeedMs(analyzer.letterStats, letter)
        var ls = analyzer.letterStats[letter]
        total = ls.total
        errors = ls.errors
        acc = total > 0 ? Math.round((1 - errors / total) * 100) : null
      }

      var hand = K.getKeyHand(letter)
      var finger = K.getKeyFinger(letter)

      rows.push({
        letter: letter,
        conf: conf,
        speed: speed,
        acc: acc,
        total: total,
        errors: errors,
        hand: hand,
        finger: finger
      })
    }

    rows.sort(function (a, b) { return b.conf - a.conf })

    var html = '<div class="prof-table">'
    html += '<div class="prof-table-h"><span>key</span><span>speed</span><span>acc</span><span>conf</span><span>finger</span></div>'
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]
      var confClass = r.conf >= 0.85 ? 'mastered' : (r.conf >= 0.5 ? 'learning' : '')
      var fingerName = r.finger !== null ? ['pinky', 'ring', 'mid', 'idx'][r.finger] : '-'
      var handSide = r.hand === 'left' ? 'L' : (r.hand === 'right' ? 'R' : '')
      html += '<div class="prof-table-r ' + confClass + '">'
      html += '<span class="p-key">' + r.letter.toUpperCase() + '</span>'
      html += '<span class="p-mono">' + (r.speed !== null ? r.speed + 'ms' : '—') + '</span>'
      html += '<span class="p-mono">' + (r.acc !== null ? r.acc + '%' : '—') + '</span>'
      html += '<span><span class="prof-bar" style="width:' + Math.round(r.conf * 100) + '%"></span></span>'
      html += '<span class="p-finger">' + handSide + fingerName + '</span>'
      html += '</div>'
    }
    html += '</div>'
    container.innerHTML = html
  }

  function buildFingers(saved, analyzer) {
    var container = document.getElementById('prof-fingers')
    if (!container) return

    var fingers = [
      { name: 'L pinky', hand: 'left', finger: 0 },
      { name: 'L ring',  hand: 'left', finger: 1 },
      { name: 'L mid',   hand: 'left', finger: 2 },
      { name: 'L idx',   hand: 'left', finger: 3 },
      { name: 'R idx',   hand: 'right', finger: 3 },
      { name: 'R mid',   hand: 'right', finger: 2 },
      { name: 'R ring',  hand: 'right', finger: 1 },
      { name: 'R pinky', hand: 'right', finger: 0 }
    ]

    var all = E.getAllLetters()
    var data = []

    for (var f = 0; f < fingers.length; f++) {
      var fg = fingers[f]
      var totalSpeed = 0
      var speedCount = 0
      var totalChars = 0
      var totalErrors = 0

      for (var i = 0; i < all.length; i++) {
        var letter = all[i]
        var hand = K.getKeyHand(letter)
        var finger = K.getKeyFinger(letter)
        if (hand !== fg.hand || finger !== fg.finger) continue

        if (analyzer && analyzer.letterStats[letter]) {
          var s = A.getLetterSpeedMs(analyzer.letterStats, letter)
          if (s !== null) { totalSpeed += s; speedCount++ }
          totalChars += analyzer.letterStats[letter].total
          totalErrors += analyzer.letterStats[letter].errors
        }
      }

      var avgSpeed = speedCount > 0 ? Math.round(totalSpeed / speedCount) : null
      var acc = totalChars > 0 ? Math.round((1 - totalErrors / totalChars) * 100) : null

      data.push({ name: fg.name, speed: avgSpeed, acc: acc, chars: totalChars, errors: totalErrors })
    }

    var html = '<div class="prof-finger-grid">'
    for (var i = 0; i < data.length; i++) {
      var d = data[i]
      html += '<div class="prof-finger-card">'
      html += '<span class="prof-finger-name">' + d.name + '</span>'
      html += '<span class="p-mono">' + (d.speed !== null ? d.speed + 'ms' : '—') + '</span>'
      html += '<span class="p-mono">' + (d.acc !== null ? d.acc + '%' : '—') + '</span>'
      html += '<span class="p-mono p-sub">' + d.chars + ' chars</span>'
      html += '</div>'
    }
    html += '</div>'
    container.innerHTML = html
  }

  function buildTransitions(analyzer) {
    var container = document.getElementById('prof-transitions')
    if (!container) return

    if (!analyzer || !analyzer.transitions) {
      container.innerHTML = '<span class="p-empty">Start typing to see transition data</span>'
      return
    }

    var list = []
    for (var key in analyzer.transitions) {
      if (!analyzer.transitions.hasOwnProperty(key)) continue
      var t = analyzer.transitions[key]
      list.push({ pair: key, count: t.count, avgTime: Math.round(t.totalTime / t.count) })
    }

    if (list.length === 0) {
      container.innerHTML = '<span class="p-empty">Not enough data yet</span>'
      return
    }

    list.sort(function (a, b) { return b.avgTime - a.avgTime })
    var top = list.slice(0, 15)

    var html = '<div class="prof-table">'
    html += '<div class="prof-table-h"><span>transition</span><span>avg time</span><span>count</span></div>'
    for (var i = 0; i < top.length; i++) {
      var item = top[i]
      html += '<div class="prof-table-r">'
      html += '<span class="p-key">' + item.pair + '</span>'
      html += '<span class="p-mono">' + item.avgTime + 'ms</span>'
      html += '<span class="p-mono">' + item.count + '</span>'
      html += '</div>'
    }
    html += '</div>'
    container.innerHTML = html
  }

  function buildHistory(saved) {
    var container = document.getElementById('prof-history')
    if (!container) return

    var history = saved.sessionHistory || []
    if (history.length === 0) {
      container.innerHTML = '<span class="p-empty">No sessions completed yet</span>'
      return
    }

    var recent = history.slice(-20).reverse()
    var html = '<div class="prof-table">'
    html += '<div class="prof-table-h"><span>date</span><span>wpm</span><span>acc</span><span>chars</span><span>time</span></div>'
    for (var i = 0; i < recent.length; i++) {
      var s = recent[i]
      var d = new Date(s.date)
      var dateStr = d.getMonth() + 1 + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
      html += '<div class="prof-table-r">'
      html += '<span class="p-mono">' + dateStr + '</span>'
      html += '<span class="p-mono">' + s.wpm + '</span>'
      html += '<span class="p-mono">' + s.acc + '%</span>'
      html += '<span class="p-mono">' + s.chars + '</span>'
      html += '<span class="p-mono">' + formatTime(s.time) + '</span>'
      html += '</div>'
    }
    html += '</div>'
    container.innerHTML = html
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n }

  function formatTime(sec) {
    var m = Math.floor(sec / 60)
    var s = sec % 60
    return m + ':' + (s < 10 ? '0' : '') + s
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return '' + n
  }

  function setHTML(id, val) {
    var el = document.getElementById(id)
    if (el) el.textContent = val
  }

  return { init: init, show: show, close: close, toggle: toggle, isOpen: function () { return open } }
})()
