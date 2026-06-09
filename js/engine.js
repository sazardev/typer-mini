window.TyperMini = window.TyperMini || {}

TyperMini.Engine = (function () {
  var VOWELS = { a: true, e: true, i: true, o: true, u: true }

  var LEVELS = [
    { id: 1, name: 'Home Row Core',   letters: ['e', 't', 'a', 'i', 'o', 'n'] },
    { id: 2, name: 'Common Flow',      letters: ['s', 'h', 'r'] },
    { id: 3, name: 'Middle Row',       letters: ['d', 'l', 'c', 'u'] },
    { id: 4, name: 'Expanding Range',  letters: ['m', 'w', 'f', 'g'] },
    { id: 5, name: 'Upper Reach',      letters: ['y', 'p', 'b', 'v'] },
    { id: 6, name: 'Full Keyboard',    letters: ['k', 'j', 'x', 'q', 'z'] }
  ]

  var PATTERNS = ['CVC', 'CVCV', 'VCVC', 'CVCC', 'CVCVC', 'VCV', 'CVC']

  var CONFIDENCE_THRESHOLD = 0.85
  var WORDS_AHEAD = 15
  var MAX_WORD_LEN = 7
  var MIN_WORD_LEN = 3

  function getActiveLetters(unlockedLevel) {
    var letters = []
    for (var i = 0; i < unlockedLevel; i++) {
      letters = letters.concat(LEVELS[i].letters)
    }
    return letters
  }

  function isVowel(ch) { return !!VOWELS[ch] }
  function isConsonant(ch) { return !VOWELS[ch] }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

  function generateWord(letters) {
    var vowels = letters.filter(isVowel)
    var consonants = letters.filter(isConsonant)

    if (!vowels.length || !consonants.length) {
      var len = MIN_WORD_LEN + Math.floor(Math.random() * (MAX_WORD_LEN - MIN_WORD_LEN + 1))
      var w = ''
      for (var i = 0; i < len; i++) w += pick(letters)
      return w
    }

    var pattern = pick(PATTERNS)
    var word = ''
    for (var i = 0; i < pattern.length; i++) {
      word += pattern[i] === 'C' ? pick(consonants) : pick(vowels)
    }

    while (word.length < MIN_WORD_LEN) {
      word += pick(Math.random() > 0.5 ? vowels : consonants)
    }
    if (word.length > MAX_WORD_LEN) word = word.substring(0, MAX_WORD_LEN)

    return word
  }

  function generateWords(letters, count) {
    var words = []
    var seen = {}
    for (var i = 0; i < count; i++) {
      var word
      var tries = 0
      do {
        word = generateWord(letters)
        tries++
      } while (seen[word] && tries < 30)
      seen[word] = true
      words.push(word)
    }
    return words
  }

  function calculateConfidence(stats) {
    if (!stats || stats.total < 5) return 0
    var accuracy = 1 - (stats.errors / stats.total)
    var avgSpeed = 0
    if (stats.speeds.length > 0) {
      for (var i = 0; i < stats.speeds.length; i++) avgSpeed += stats.speeds[i]
      avgSpeed /= stats.speeds.length
    }
    var speedFactor = Math.min(1, 400 / Math.max(avgSpeed, 1))
    return accuracy * 0.6 + speedFactor * 0.4
  }

  function canUnlockLevel(letterConfidence, levelIndex) {
    var letters = LEVELS[levelIndex].letters
    for (var i = 0; i < letters.length; i++) {
      if ((letterConfidence[letters[i]] || 0) < CONFIDENCE_THRESHOLD) return false
    }
    return true
  }

  function getAllLetters() {
    var all = []
    for (var i = 0; i < LEVELS.length; i++) {
      all = all.concat(LEVELS[i].letters)
    }
    return all
  }

  return {
    LEVELS: LEVELS,
    WORDS_AHEAD: WORDS_AHEAD,
    CONFIDENCE_THRESHOLD: CONFIDENCE_THRESHOLD,
    getActiveLetters: getActiveLetters,
    generateWord: generateWord,
    generateWords: generateWords,
    calculateConfidence: calculateConfidence,
    canUnlockLevel: canUnlockLevel,
    getAllLetters: getAllLetters,
    isVowel: isVowel,
    isConsonant: isConsonant
  }
})()
