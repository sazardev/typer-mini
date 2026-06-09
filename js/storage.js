window.TyperMini = window.TyperMini || {}

TyperMini.Storage = (function () {
  var KEY = 'typer-mini-progress'

  function defaults() {
    return {
      version: 2,
      unlockedLevel: 1,
      letterConfidence: {},
      totalChars: 0,
      totalErrors: 0,
      totalTime: 0,
      sessionsCompleted: 0,
      bestWpm: 0,
      bestStreak: 0,
      theme: 'dark',
      sessionHistory: []
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY)
      if (!raw) return defaults()
      var data = JSON.parse(raw)
      if (data.version !== 2) return defaults()
      for (var k in defaults()) {
        if (!defaults().hasOwnProperty(k)) continue
        if (!(k in data)) data[k] = defaults()[k]
      }
      return data
    } catch (e) {
      return defaults()
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch (e) {}
  }

  function reset() {
    localStorage.removeItem(KEY)
    return defaults()
  }

  return { load: load, save: save, reset: reset }
})()
