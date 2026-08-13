// Online-only pinned-author access - same approach as ShelfService.js:
// talks straight to the sync endpoints the Flutter app also uses for
// offline sync, but this client never caches anything locally.
const API_ROOT = 'https://api.naskban.ir'
const BEGINNING_OF_TIME = '0001-01-01T00:00:00.000Z'

function headers(userInfo) {
  return {
    authorization: 'bearer ' + userInfo.token,
    'content-type': 'application/json'
  }
}

export async function getAllPinnedAuthors(userInfo) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/sync/pinnedauthors?since=${BEGINNING_OF_TIME}`,
    { headers: headers(userInfo) }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.items || [])
    .filter((a) => !a.isDeleted)
    .sort((a, b) => new Date(b.clientModifiedAt) - new Date(a.clientModifiedAt))
}

export async function isPinned(userInfo, authorId) {
  const all = await getAllPinnedAuthors(userInfo)
  return all.some((a) => String(a.authorId) === String(authorId))
}

async function pushPinnedAuthors(userInfo, items) {
  const res = await fetch(`${API_ROOT}/api/pdf/sync/pinnedauthors`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify(items)
  })
  return res.ok
}

export async function pinAuthor(userInfo, authorId) {
  return pushPinnedAuthors(userInfo, [
    { authorId, clientModifiedAt: new Date().toISOString(), isDeleted: false }
  ])
}

export async function unpinAuthor(userInfo, authorId) {
  return pushPinnedAuthors(userInfo, [
    { authorId, clientModifiedAt: new Date().toISOString(), isDeleted: true }
  ])
}
