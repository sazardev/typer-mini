window.TyperMini = window.TyperMini || {}

TyperMini.Keyboard = (function () {
  var FINGER_MAP = {
    '`': { hand: 'left', finger: 0 }, '1': { hand: 'left', finger: 0 },
    '2': { hand: 'left', finger: 1 }, '3': { hand: 'left', finger: 2 },
    '4': { hand: 'left', finger: 3 }, '5': { hand: 'left', finger: 3 },
    '6': { hand: 'right', finger: 3 }, '7': { hand: 'right', finger: 3 },
    '8': { hand: 'right', finger: 2 }, '9': { hand: 'right', finger: 1 },
    '0': { hand: 'right', finger: 0 },
    'q': { hand: 'left', finger: 0 }, 'a': { hand: 'left', finger: 0 }, 'z': { hand: 'left', finger: 0 },
    'w': { hand: 'left', finger: 1 }, 's': { hand: 'left', finger: 1 }, 'x': { hand: 'left', finger: 1 },
    'e': { hand: 'left', finger: 2 }, 'd': { hand: 'left', finger: 2 }, 'c': { hand: 'left', finger: 2 },
    'r': { hand: 'left', finger: 3 }, 'f': { hand: 'left', finger: 3 }, 'v': { hand: 'left', finger: 3 },
    't': { hand: 'left', finger: 3 }, 'g': { hand: 'left', finger: 3 }, 'b': { hand: 'left', finger: 3 },
    'y': { hand: 'right', finger: 3 }, 'h': { hand: 'right', finger: 3 }, 'n': { hand: 'right', finger: 3 },
    'u': { hand: 'right', finger: 3 }, 'j': { hand: 'right', finger: 3 }, 'm': { hand: 'right', finger: 3 },
    'i': { hand: 'right', finger: 2 }, 'k': { hand: 'right', finger: 2 },
    'o': { hand: 'right', finger: 1 }, 'l': { hand: 'right', finger: 1 },
    'p': { hand: 'right', finger: 0 }, ';': { hand: 'right', finger: 0 },
    ',': { hand: 'right', finger: 1 }, '.': { hand: 'right', finger: 2 }, '/': { hand: 'right', finger: 0 }
  }

  var HOME_ROW = { a: true, s: true, d: true, f: true, j: true, k: true, l: true, ';': true }

  var ROWS = [
    {
      offset: 0,
      keys: [
        { k: '`', w: 1, type: 'key' }, { k: '1', w: 1, type: 'key' }, { k: '2', w: 1, type: 'key' },
        { k: '3', w: 1, type: 'key' }, { k: '4', w: 1, type: 'key' }, { k: '5', w: 1, type: 'key' },
        { k: '6', w: 1, type: 'key' }, { k: '7', w: 1, type: 'key' }, { k: '8', w: 1, type: 'key' },
        { k: '9', w: 1, type: 'key' }, { k: '0', w: 1, type: 'key' }, { k: '-', w: 1, type: 'key' },
        { k: '=', w: 1, type: 'key' }, { k: '⌫', w: 2, type: 'mod' }
      ]
    },
    {
      offset: 20,
      keys: [
        { k: '⇥', w: 1.5, type: 'mod' }, { k: 'q', w: 1, type: 'key' }, { k: 'w', w: 1, type: 'key' },
        { k: 'e', w: 1, type: 'key' }, { k: 'r', w: 1, type: 'key' }, { k: 't', w: 1, type: 'key' },
        { k: 'y', w: 1, type: 'key' }, { k: 'u', w: 1, type: 'key' }, { k: 'i', w: 1, type: 'key' },
        { k: 'o', w: 1, type: 'key' }, { k: 'p', w: 1, type: 'key' }, { k: '[', w: 1, type: 'key' },
        { k: ']', w: 1, type: 'key' }, { k: '\\', w: 1.5, type: 'mod' }
      ]
    },
    {
      offset: 34,
      keys: [
        { k: '⇪', w: 1.75, type: 'mod' }, { k: 'a', w: 1, type: 'key' }, { k: 's', w: 1, type: 'key' },
        { k: 'd', w: 1, type: 'key' }, { k: 'f', w: 1, type: 'key' }, { k: 'g', w: 1, type: 'key' },
        { k: 'h', w: 1, type: 'key' }, { k: 'j', w: 1, type: 'key' }, { k: 'k', w: 1, type: 'key' },
        { k: 'l', w: 1, type: 'key' }, { k: ';', w: 1, type: 'key' }, { k: "'", w: 1, type: 'key' },
        { k: '⏎', w: 2.25, type: 'mod' }
      ]
    },
    {
      offset: 46,
      keys: [
        { k: '⇧', w: 2.25, type: 'mod' }, { k: 'z', w: 1, type: 'key' }, { k: 'x', w: 1, type: 'key' },
        { k: 'c', w: 1, type: 'key' }, { k: 'v', w: 1, type: 'key' }, { k: 'b', w: 1, type: 'key' },
        { k: 'n', w: 1, type: 'key' }, { k: 'm', w: 1, type: 'key' }, { k: ',', w: 1, type: 'key' },
        { k: '.', w: 1, type: 'key' }, { k: '/', w: 1, type: 'key' }, { k: '⇧', w: 2.75, type: 'mod' }
      ]
    },
    {
      offset: 0,
      keys: [
        { k: '', w: 15, type: 'space' }
      ]
    }
  ]

  var FINGER_NAMES = ['pinky', 'ring', 'mid', 'idx']

  function getKeyHand(key) {
    var f = FINGER_MAP[key]
    return f ? f.hand : null
  }

  function getKeyFinger(key) {
    var f = FINGER_MAP[key]
    return f !== undefined ? f.finger : null
  }

  function isHomeRow(key) {
    return !!HOME_ROW[key]
  }

  function getFingerName(finger, hand) {
    if (finger === null || !hand) return ''
    var prefix = hand === 'left' ? 'L ' : 'R '
    return prefix + (FINGER_NAMES[finger] || '')
  }

  return {
    ROWS: ROWS,
    FINGER_MAP: FINGER_MAP,
    HOME_ROW: HOME_ROW,
    getKeyHand: getKeyHand,
    getKeyFinger: getKeyFinger,
    isHomeRow: isHomeRow,
    getFingerName: getFingerName
  }
})()
