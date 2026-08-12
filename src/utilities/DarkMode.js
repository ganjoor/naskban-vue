const STORAGE_KEY = 'darkMode'

export function getStoredDarkMode() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setStoredDarkMode(value) {
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
}
