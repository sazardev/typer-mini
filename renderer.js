const editor = document.getElementById('editor')
const wordCount = document.getElementById('word-count')
const charCount = document.getElementById('char-count')

const themeKey = 'typer-mini-theme'

function applyTheme(theme) {
  document.documentElement.classList.toggle('theme-light', theme === 'light')
  localStorage.setItem(themeKey, theme)
}

function toggleTheme() {
  const current = document.documentElement.classList.contains('theme-light') ? 'light' : 'dark'
  applyTheme(current === 'dark' ? 'light' : 'dark')
}

function updateStats() {
  const text = editor.value
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  charCount.textContent = `${chars} chars`
  wordCount.textContent = `${words} words`
}

function setupTitlebar() {
  document.getElementById('btn-minimize').addEventListener('click', () => window.windowAPI.minimize())
  document.getElementById('btn-maximize').addEventListener('click', () => window.windowAPI.maximize())
  document.getElementById('btn-close').addEventListener('click', () => window.windowAPI.close())
  document.getElementById('btn-theme').addEventListener('click', toggleTheme)

  window.windowAPI.onStateChange((state) => {
    const btn = document.getElementById('btn-maximize')
    btn.textContent = state === 'maximized' ? '❐' : '□'
  })
}

function setupEditor() {
  editor.addEventListener('input', updateStats)
  editor.focus()
}

function restoreTheme() {
  const saved = localStorage.getItem(themeKey)
  applyTheme(saved || 'dark')
}

restoreTheme()
setupTitlebar()
setupEditor()
updateStats()
