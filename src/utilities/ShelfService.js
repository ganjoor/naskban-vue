// Online-only shelf access - talks straight to the same sync endpoints
// the Flutter app uses for offline sync, but this client never caches
// anything locally: every call re-fetches from the server. That's a
// deliberate simplification, not an oversight - this app doesn't do
// offline, so there's no local state to keep in sync with the server in
// the first place.
//
// since=0001-01-01... is not a "since" in the incremental sense here -
// it's just how the pull endpoint spells "give me everything", matching
// .NET's DateTime.MinValue (see the service's own since-cursor handling
// for why that specific value, not year 0 or the Unix epoch).
const API_ROOT = 'https://api.naskban.ir'
const BEGINNING_OF_TIME = '0001-01-01T00:00:00.000Z'

function headers(userInfo) {
  return {
    authorization: 'bearer ' + userInfo.token,
    'content-type': 'application/json'
  }
}

export async function getAllShelves(userInfo) {
  const res = await fetch(`${API_ROOT}/api/pdf/sync/shelves?since=${BEGINNING_OF_TIME}`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items || [])
    .filter((s) => !s.isDeleted)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export async function getAllShelfBooks(userInfo) {
  const res = await fetch(`${API_ROOT}/api/pdf/sync/shelfbooks?since=${BEGINNING_OF_TIME}`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items || []).filter((sb) => !sb.isDeleted)
}

export async function getBooksInShelf(userInfo, shelfId) {
  const all = await getAllShelfBooks(userInfo)
  return all.filter((sb) => sb.shelfId === shelfId)
}

export async function getShelfIdsForBook(userInfo, bookId) {
  const all = await getAllShelfBooks(userInfo)
  return all.filter((sb) => String(sb.bookId) === String(bookId)).map((sb) => sb.shelfId)
}

async function pushShelves(userInfo, items) {
  const res = await fetch(`${API_ROOT}/api/pdf/sync/shelves`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify(items)
  })
  return res.ok
}

async function pushShelfBooks(userInfo, items) {
  const res = await fetch(`${API_ROOT}/api/pdf/sync/shelfbooks`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify(items)
  })
  return res.ok
}

export async function createShelf(userInfo, name) {
  const now = new Date().toISOString()
  const shelf = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    clientModifiedAt: now,
    isDeleted: false
  }
  const ok = await pushShelves(userInfo, [shelf])
  return ok ? shelf : null
}

export async function renameShelf(userInfo, shelf, newName) {
  return pushShelves(userInfo, [
    {
      id: shelf.id,
      name: newName,
      createdAt: shelf.createdAt,
      clientModifiedAt: new Date().toISOString(),
      isDeleted: false
    }
  ])
}

export async function deleteShelf(userInfo, shelf) {
  return pushShelves(userInfo, [
    {
      id: shelf.id,
      name: shelf.name,
      createdAt: shelf.createdAt,
      clientModifiedAt: new Date().toISOString(),
      isDeleted: true
    }
  ])
}

export async function addBookToShelf(userInfo, shelfId, bookId) {
  return pushShelfBooks(userInfo, [
    { shelfId, bookId, clientModifiedAt: new Date().toISOString(), isDeleted: false }
  ])
}

export async function removeBookFromShelf(userInfo, shelfId, bookId) {
  return pushShelfBooks(userInfo, [
    { shelfId, bookId, clientModifiedAt: new Date().toISOString(), isDeleted: true }
  ])
}
