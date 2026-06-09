window.TyperMini = window.TyperMini || {}

TyperMini.UI = (function () {
  var E = TyperMini.Engine
  var K = TyperMini.Keyboard

  var els = {}

  function cache() {
    els.wordDisplay = document.getElementById('word-display')
    els.kbEl = document.getElementById('keyboard')
    els.letterBar = document.getElementById('letter-bar')
    els.levelName = document.getElementById('level-name')
    els.levelProgress = document.getElementById('level-progress')
    els.statWpm = document.getElementById('stat-wpm')
    els.statAcc = document.getElementById('stat-acc')
    els.statTime = document.getElementById('stat-time')
    els.statStreak = document.getElementById('stat-streak')
    els.themeBtn = document.getElementById('btn-theme')
    els.resetBtn = document.getElementById('btn-reset')
    els.pauseOverlay = document.getElementById('pause-overlay')
    els.pauseMsg = document.getElementById('pause-msg')
    els.cursorEl = document.getElementById('cursor-element')
  }

  function renderWords(words, wordIdx, charIdx, charStates) {
    if (!els.wordDisplay) return
    var html = ''
    var flatIdx = 0
    for (var wi = 0; wi < words.length; wi++) {
      html += '<div class="word" data-wi="' + wi + '">'
      var word = words[wi]
      for (var ci = 0; ci < word.length; ci++) {
        var state = charStates[flatIdx] || 'upcoming'
        html += '<span class="char ' + state + '" data-flat="' + flatIdx + '">' + word[ci] + '</span>'
        flatIdx++
      }
      html += '</div>'
    }
    els.wordDisplay.innerHTML = html

    positionCursor(wordIdx, charIdx, words)
  }

  function updateCharState(flatIdx, state) {
    var span = els.wordDisplay.querySelector('.char[data-flat="' + flatIdx + '"]')
    if (span) {
      span.className = 'char ' + state
    }
  }

  function updateCharRange(startFlat, endFlat, charStates) {
    for (var i = startFlat; i <= endFlat && i < charStates.length; i++) {
      updateCharState(i, charStates[i])
    }
  }

  function positionCursor(wordIdx, charIdx, words) {
    if (!els.cursorEl) return

    var wordEl = els.wordDisplay.querySelector('.word[data-wi="' + wordIdx + '"]')
    if (!wordEl) {
      els.cursorEl.style.display = 'none'
      return
    }

    var charSpan = wordEl.querySelector('.char[data-flat]')
    if (!charSpan) {
      els.cursorEl.style.display = 'none'
      return
    }

    var targetSpan = wordEl.querySelector('.char[data-flat]')
    var flatIdx = 0
    for (var wi = 0; wi < wordIdx; wi++) {
      flatIdx += words[wi].length
    }
    flatIdx += charIdx

    targetSpan = els.wordDisplay.querySelector('.char[data-flat="' + flatIdx + '"]')
    if (targetSpan) {
      var rect = targetSpan.getBoundingClientRect()
      var wrapperRect = els.wordDisplay.parentElement.getBoundingClientRect()
      els.cursorEl.style.display = 'block'
      els.cursorEl.style.left = (rect.left - wrapperRect.left) + 'px'
      els.cursorEl.style.top = (rect.bottom - wrapperRect.top) + 'px'
      els.cursorEl.style.width = rect.width + 'px'
    } else {
      els.cursorEl.style.display = 'none'
    }
  }

  function buildKeyboard() {
    if (!els.kbEl) return
    var html = '<div class="kb-hands"><span class="kb-hand-label">LEFT HAND</span><span class="kb-hand-label">RIGHT HAND</span></div>'
    var unit = 40
    for (var r = 0; r < K.ROWS.length; r++) {
      var row = K.ROWS[r]
      html += '<div class="kb-row" style="padding-left:' + row.offset + 'px">'
      for (var c = 0; c < row.keys.length; c++) {
        var kd = row.keys[c]
        var key = kd.k
        var width = kd.w
        var type = kd.type
        var lower = key.toLowerCase()
        var finger = K.getKeyFinger(lower)
        var hand = K.getKeyHand(lower)
        var isHome = K.isHomeRow(lower)
        var handGap = lower === 'y' || key === '6' ? ' hand-gap' : ''

        var cls = 'kb-key kb-' + type
        if (isHome) cls += ' home-row'
        if (handGap) cls += handGap
        if (type === 'space') cls += ' kb-space'
        if (finger === null || !hand) cls += ' kb-unmapped'

        var fingerName = K.getFingerName(finger, hand)

        html += '<div class="' + cls + '" data-key="' + lower + '" data-hand="' + (hand || '') + '" data-finger="' + (finger !== null ? finger : '') + '" data-type="' + type + '" style="width:' + (width * unit) + 'px" title="' + (fingerName || '') + '">'
        html += '<span class="kb-key-label">' + key + '</span>'
        if (type === 'key' && finger !== null && hand) {
          html += '<span class="kb-key-dot" data-finger-dot="' + hand + '-' + finger + '"></span>'
        }
        if (isHome) {
          html += '<span class="kb-home-mark"></span>'
        }
        html += '</div>'
      }
      html += '</div>'
    }
    els.kbEl.innerHTML = html
  }

  function highlightKeyboard(targetKey) {
    if (!els.kbEl) return
    var allKeys = els.kbEl.querySelectorAll('.kb-key[data-type="key"]')
    for (var i = 0; i < allKeys.length; i++) {
      allKeys[i].classList.remove('target')
    }
    if (targetKey) {
      var keyEl = els.kbEl.querySelector('.kb-key[data-key="' + targetKey + '"]')
      if (keyEl) keyEl.classList.add('target')
    }
  }

  function highlightFinger(targetKey) {
    if (!els.kbEl) return
    var allKeys = els.kbEl.querySelectorAll('.kb-key')
    for (var i = 0; i < allKeys.length; i++) {
      allKeys[i].classList.remove('finger-group')
    }
    if (targetKey) {
      var finger = K.getKeyFinger(targetKey)
      var hand = K.getKeyHand(targetKey)
      if (finger !== null && hand) {
        var group = els.kbEl.querySelectorAll('.kb-key[data-finger="' + finger + '"][data-hand="' + hand + '"]')
        for (var j = 0; j < group.length; j++) {
          group[j].classList.add('finger-group')
        }
      }
    }
  }

  function renderLetterConfidence(letterConfidence, activeLetters) {
    if (!els.letterBar) return
    var all = E.getAllLetters()
    var html = ''
    for (var i = 0; i < all.length; i++) {
      var letter = all[i]
      var conf = letterConfidence[letter] || 0
      var isActive = activeLetters.indexOf(letter) !== -1
      var cls = 'letter-dot'
      if (!isActive) cls += ' locked'
      if (conf >= E.CONFIDENCE_THRESHOLD) cls += ' mastered'
      html += '<span class="' + cls + '" data-letter="' + letter + '" title="' + letter + ': ' + Math.round(conf * 100) + '%">'
      html += '<span class="letter-dot-label">' + letter + '</span>'
      html += '<span class="letter-dot-fill" style="width:' + Math.round(conf * 100) + '%"></span>'
      html += '</span>'
    }
    els.letterBar.innerHTML = html
  }

  function renderLevel(unlockedLevel, letterConfidence) {
    if (!els.levelName || !els.levelProgress) return
    if (unlockedLevel > E.LEVELS.length) {
      els.levelName.textContent = 'All levels mastered'
      els.levelProgress.textContent = ''
      return
    }
    var level = E.LEVELS[unlockedLevel - 1]
    els.levelName.textContent = 'Level ' + level.id + ': ' + level.name
    var mastered = 0
    var letters = level.letters
    for (var i = 0; i < letters.length; i++) {
      if ((letterConfidence[letters[i]] || 0) >= E.CONFIDENCE_THRESHOLD) mastered++
    }
    els.levelProgress.textContent = mastered + '/' + letters.length + ' letters mastered'
  }

  function updateStats(wpm, acc, elapsed, streak) {
    if (els.statWpm) els.statWpm.textContent = wpm
    if (els.statAcc) els.statAcc.textContent = acc
    if (els.statTime) {
      var m = Math.floor(elapsed / 60)
      var s = elapsed % 60
      els.statTime.textContent = m + ':' + (s < 10 ? '0' : '') + s
    }
    if (els.statStreak) els.statStreak.textContent = streak
  }

  function showPause(message) {
    if (els.pauseOverlay && els.pauseMsg) {
      els.pauseMsg.textContent = message || 'Paused'
      els.pauseOverlay.classList.add('visible')
    }
  }

  function hidePause() {
    if (els.pauseOverlay) els.pauseOverlay.classList.remove('visible')
  }

  function flashError() {
    if (els.wordDisplay) {
      els.wordDisplay.classList.add('shake')
      setTimeout(function () { els.wordDisplay.classList.remove('shake') }, 200)
    }
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
  }

  function scrollWordsIntoView(wordIdx) {
    if (!els.wordDisplay) return
    var words = els.wordDisplay.querySelectorAll('.word')
    if (wordIdx < words.length) {
      var wordEl = words[wordIdx]
      wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return {
    cache: cache,
    renderWords: renderWords,
    updateCharState: updateCharState,
    updateCharRange: updateCharRange,
    positionCursor: positionCursor,
    buildKeyboard: buildKeyboard,
    highlightKeyboard: highlightKeyboard,
    highlightFinger: highlightFinger,
    renderLetterConfidence: renderLetterConfidence,
    renderLevel: renderLevel,
    updateStats: updateStats,
    showPause: showPause,
    hidePause: hidePause,
    flashError: flashError,
    applyTheme: applyTheme,
    scrollWordsIntoView: scrollWordsIntoView,
    els: els
  }
})()
