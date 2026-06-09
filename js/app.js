window.TyperMini = window.TyperMini || {}

TyperMini.App = (function () {
  var E = TyperMini.Engine
  var A = TyperMini.Analyzer
  var S = TyperMini.Storage
  var UI = TyperMini.UI
  var K = TyperMini.Keyboard

  var state = {
    words: [],
    wordIdx: 0,
    charIdx: 0,
    charStates: [],
    flatIdx: 0,
    letterConfidence: {},
    unlockedLevel: 1,
    saved: null,
    paused: false,
    sessionSaved: true
  }

  var analyzer
  var saveTimer = null
  var statsInterval = null
  var lastSavedChars = 0
  var lastSavedErrors = 0
  var lastSavedTime = 0
  var historyRecorded = false

  function init() {
    UI.cache()
    state.saved = S.load()
    state.unlockedLevel = state.saved.unlockedLevel
    state.letterConfidence = state.saved.letterConfidence || {}
    analyzer = A.create()
    analyzer.letterStats = buildLetterStatsFromSaved()
    window._typerAnalyzer = analyzer

    UI.applyTheme(state.saved.theme)
    UI.buildKeyboard()
    refreshLesson()

    UI.renderLetterConfidence(state.letterConfidence, getActiveLetters())
    UI.renderLevel(state.unlockedLevel, state.letterConfidence)
    UI.updateStats(0, 100, 0, 0)

    setupEvents()
    TyperMini.Profile.init()
  }

  function buildLetterStatsFromSaved() {
    var stats = {}
    var all = E.getAllLetters()
    for (var i = 0; i < all.length; i++) {
      var letter = all[i]
      stats[letter] = { speeds: [], errors: 0, total: 0 }
    }
    return stats
  }

  function getActiveLetters() {
    return E.getActiveLetters(state.unlockedLevel)
  }

  function refreshLesson() {
    var letters = getActiveLetters()
    state.words = E.generateWords(letters, E.WORDS_AHEAD)
    state.wordIdx = 0
    state.charIdx = 0
    state.flatIdx = 0
    state.charStates = []
    for (var i = 0; i < state.words.length; i++) {
      for (var j = 0; j < state.words[i].length; j++) {
        state.charStates.push('upcoming')
      }
    }
    state.charStates[0] = 'current'
    UI.renderWords(state.words, state.wordIdx, state.charIdx, state.charStates)
    UI.highlightKeyboard(state.words[0][0])
    UI.highlightFinger(state.words[0][0])
  }

  function ensureWords() {
    var remaining = state.words.length - state.wordIdx
    if (remaining < 8) {
      var letters = getActiveLetters()
      var newWords = E.generateWords(letters, E.WORDS_AHEAD)
      for (var i = 0; i < newWords.length; i++) {
        state.words.push(newWords[i])
        for (var j = 0; j < newWords[i].length; j++) {
          state.charStates.push('upcoming')
        }
      }
    }
  }

  function getExpectedChar() {
    if (state.wordIdx >= state.words.length) return null
    var word = state.words[state.wordIdx]
    if (state.charIdx >= word.length) return null
    return word[state.charIdx]
  }

  function advancePosition() {
    state.flatIdx++
    state.charIdx++

    var word = state.words[state.wordIdx]
    if (state.charIdx >= word.length) {
      state.wordIdx++
      state.charIdx = 0
    }

    ensureWords()

    if (state.flatIdx < state.charStates.length) {
      state.charStates[state.flatIdx] = 'current'
    }

    var nextChar = getExpectedChar()
    UI.highlightKeyboard(nextChar)
    UI.highlightFinger(nextChar)
  }

  function retreatPosition() {
    if (state.flatIdx <= 0) return

    if (state.charIdx === 0) {
      state.wordIdx--
      state.charIdx = state.words[state.wordIdx].length - 1
    } else {
      state.charIdx--
    }
    state.flatIdx--

    if (state.flatIdx < state.charStates.length) {
      state.charStates[state.flatIdx] = 'current'
    }
    if (state.flatIdx + 1 < state.charStates.length) {
      state.charStates[state.flatIdx + 1] = 'upcoming'
    }

    ensureWords()

    var nextChar = getExpectedChar()
    UI.highlightKeyboard(nextChar)
    UI.highlightFinger(nextChar)
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      if (TyperMini.Profile.isOpen()) return
      togglePause()
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      retreatPosition()
      UI.renderWords(state.words, state.wordIdx, state.charIdx, state.charStates)
      return
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      var expected = getExpectedChar()
      if (!expected) return

      var key = e.key.toLowerCase()
      var isCorrect = key === expected.toLowerCase()
      var timestamp = Date.now()

      if (!analyzer.session.startTime) {
        analyzer.session.startTime = timestamp
      }

      A.recordKeystroke(analyzer, expected, key, timestamp)

      if (state.flatIdx < state.charStates.length) {
        state.charStates[state.flatIdx] = isCorrect ? 'correct' : 'incorrect'
      }
      UI.updateCharState(state.flatIdx, state.charStates[state.flatIdx])

      if (!isCorrect) {
        UI.flashError()
      }

      advancePosition()
      UI.renderWords(state.words, state.wordIdx, state.charIdx, state.charStates)

      scheduleSave()
    }
  }

  function resumeTyping() {
    state.paused = false
    state.sessionSaved = false
    analyzer.session.startTime = analyzer.session.startTime || Date.now()
    UI.hidePause()
  }

  function togglePause() {
    state.paused = !state.paused
    if (state.paused) {
      UI.showPause('Paused — press any key to continue')
    } else {
      resumeTyping()
    }
  }

  function scheduleSave() {
    state.sessionSaved = false
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveProgress, 2000)
  }

  function saveProgress() {
    if (state.sessionSaved) return
    state.sessionSaved = true

    var deltaChars = analyzer.session.totalChars - lastSavedChars
    var deltaErrors = analyzer.session.errors - lastSavedErrors
    var deltaTime = A.getElapsed(analyzer) - lastSavedTime

    lastSavedChars = analyzer.session.totalChars
    lastSavedErrors = analyzer.session.errors
    lastSavedTime = A.getElapsed(analyzer)

    state.letterConfidence = getCurrentConfidence()
    state.saved.unlockedLevel = state.unlockedLevel
    state.saved.letterConfidence = state.letterConfidence
    state.saved.totalChars += deltaChars
    state.saved.totalErrors += deltaErrors
    state.saved.totalTime += deltaTime

    var curWpm = A.getWPM(analyzer)
    var curAcc = A.getAccuracy(analyzer)
    var streak = analyzer.session.bestStreak
    if (curWpm > state.saved.bestWpm) state.saved.bestWpm = curWpm
    if (streak > state.saved.bestStreak) state.saved.bestStreak = streak

    if (deltaChars > 0) state.saved.sessionsCompleted++

    if (!historyRecorded && analyzer.session.totalChars > 10) {
      historyRecorded = true
      if (!state.saved.sessionHistory) state.saved.sessionHistory = []
      state.saved.sessionHistory.push({
        date: Date.now(),
        wpm: curWpm,
        acc: curAcc,
        chars: analyzer.session.totalChars,
        time: A.getElapsed(analyzer),
        errors: analyzer.session.errors
      })
      if (state.saved.sessionHistory.length > 100) state.saved.sessionHistory.shift()
    }

    S.save(state.saved)

    UI.renderLetterConfidence(state.letterConfidence, getActiveLetters())
    UI.renderLevel(state.unlockedLevel, state.letterConfidence)

    checkLevelUp()
  }

  function getCurrentConfidence() {
    var conf = {}
    var all = E.getAllLetters()
    for (var i = 0; i < all.length; i++) {
      var letter = all[i]
      conf[letter] = A.getLetterConfidence(analyzer.letterStats, letter)
      if (state.letterConfidence[letter] && conf[letter] < state.letterConfidence[letter]) {
        conf[letter] = state.letterConfidence[letter]
      }
    }
    return conf
  }

  function checkLevelUp() {
    if (state.unlockedLevel > E.LEVELS.length) return
    if (E.canUnlockLevel(state.letterConfidence, state.unlockedLevel - 1)) {
      state.unlockedLevel++
      refreshLesson()
      UI.renderLetterConfidence(state.letterConfidence, getActiveLetters())
      UI.renderLevel(state.unlockedLevel, state.letterConfidence)
    }
  }

  function startStatsLoop() {
    statsInterval = setInterval(function () {
      if (!state.paused && analyzer.session.startTime) {
        UI.updateStats(
          A.getWPM(analyzer),
          A.getAccuracy(analyzer),
          A.getElapsed(analyzer),
          analyzer.session.currentStreak
        )
      }
    }, 250)
  }

  function setupEvents() {
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('beforeunload', saveProgress)

    UI.els.themeBtn.addEventListener('click', function () {
      var current = document.documentElement.classList.contains('theme-light') ? 'light' : 'dark'
      var next = current === 'dark' ? 'light' : 'dark'
      UI.applyTheme(next)
      state.saved.theme = next
      S.save(state.saved)
    })

    UI.els.resetBtn.addEventListener('click', function () {
      if (confirm('Reset all progress?')) {
        state.saved = S.reset()
        state.unlockedLevel = state.saved.unlockedLevel
        state.letterConfidence = {}
        analyzer = A.create()
        analyzer.letterStats = buildLetterStatsFromSaved()
        lastSavedChars = 0
        lastSavedErrors = 0
        lastSavedTime = 0
        historyRecorded = false
        state.sessionSaved = true
        refreshLesson()
        UI.renderLetterConfidence(state.letterConfidence, getActiveLetters())
        UI.renderLevel(state.unlockedLevel, state.letterConfidence)
        UI.updateStats(0, 100, 0, 0)
      }
    })
  }

  return {
    init: init,
    startStatsLoop: startStatsLoop
  }
})()
