window.TyperMini = window.TyperMini || {}

TyperMini.Analyzer = (function () {
  var MAX_SPEED_SAMPLES = 60

  function create() {
    return {
      letterStats: {},
      session: {
        startTime: null,
        totalChars: 0,
        correctChars: 0,
        errors: 0,
        currentStreak: 0,
        bestStreak: 0,
        paused: true
      },
      history: [],
      transitions: {},
      wordHistory: []
    }
  }

  function recordKeystroke(state, expected, actual, timestamp) {
    var stats = state.letterStats
    if (!stats[expected]) {
      stats[expected] = { speeds: [], errors: 0, total: 0 }
    }

    var isCorrect = expected === actual
    var timeSinceLast = 0
    if (state.history.length > 0) {
      timeSinceLast = timestamp - state.history[state.history.length - 1].timestamp
    }

    var entry = { expected: expected, actual: actual, correct: isCorrect, time: timeSinceLast, timestamp: timestamp }
    state.history.push(entry)

    stats[expected].total++
    if (!isCorrect) stats[expected].errors++

    if (timeSinceLast > 0 && timeSinceLast < 3000) {
      stats[expected].speeds.push(timeSinceLast)
      if (stats[expected].speeds.length > MAX_SPEED_SAMPLES) {
        stats[expected].speeds.splice(0, stats[expected].speeds.length - MAX_SPEED_SAMPLES)
      }
    }

    var ses = state.session
    ses.totalChars++
    if (isCorrect) {
      ses.correctChars++
      ses.currentStreak++
      if (ses.currentStreak > ses.bestStreak) ses.bestStreak = ses.currentStreak
    } else {
      ses.errors++
      ses.currentStreak = 0
    }

    if (state.history.length >= 2) {
      var prev = state.history[state.history.length - 2]
      var key = prev.expected + '\u2192' + expected
      if (!state.transitions[key]) state.transitions[key] = { count: 0, totalTime: 0 }
      state.transitions[key].count++
      state.transitions[key].totalTime += timeSinceLast
    }

    return entry
  }

  function getWPM(state) {
    if (!state.session.startTime) return 0
    var elapsed = (Date.now() - state.session.startTime) / 1000 / 60
    if (elapsed < 0.01) return 0
    return Math.round((state.session.correctChars / 5) / elapsed)
  }

  function getAccuracy(state) {
    if (state.session.totalChars === 0) return 100
    return Math.round((state.session.correctChars / state.session.totalChars) * 100)
  }

  function getElapsed(state) {
    if (!state.session.startTime) return 0
    return Math.floor((Date.now() - state.session.startTime) / 1000)
  }

  function getLetterConfidence(stats, letter) {
    var data = stats[letter]
    if (!data || data.total < 3) return 0
    var accuracy = 1 - (data.errors / data.total)
    var avgSpeed = 0
    if (data.speeds.length > 0) {
      for (var i = 0; i < data.speeds.length; i++) avgSpeed += data.speeds[i]
      avgSpeed /= data.speeds.length
    }
    var speedFactor = Math.min(1, 400 / Math.max(avgSpeed, 1))
    return Math.round((accuracy * 0.6 + speedFactor * 0.4) * 100) / 100
  }

  function getLetterSpeedMs(stats, letter) {
    var data = stats[letter]
    if (!data || data.speeds.length === 0) return null
    var sum = 0
    for (var i = 0; i < data.speeds.length; i++) sum += data.speeds[i]
    return Math.round(sum / data.speeds.length)
  }

  function getSlowestLetters(stats, count) {
    var list = []
    for (var key in stats) {
      if (!stats.hasOwnProperty(key)) continue
      var s = getLetterSpeedMs(stats, key)
      if (s !== null) list.push({ letter: key, speed: s })
    }
    list.sort(function (a, b) { return b.speed - a.speed })
    return list.slice(0, count)
  }

  return {
    create: create,
    recordKeystroke: recordKeystroke,
    getWPM: getWPM,
    getAccuracy: getAccuracy,
    getElapsed: getElapsed,
    getLetterConfidence: getLetterConfidence,
    getLetterSpeedMs: getLetterSpeedMs,
    getSlowestLetters: getSlowestLetters
  }
})()
