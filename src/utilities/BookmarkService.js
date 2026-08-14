// The classic bookmark endpoint (POST /api/pdf/bookmark/{bookId}/{page})
// only toggles a bookmark on/off - there's no way to update just the note
// on one that's already bookmarked without removing and re-adding it. The
// sync endpoint (built for the Flutter app's offline sync) does support a
// plain upsert of an existing bookmark's fields, so this reuses that -
// same online-only, no-local-caching approach as ShelfService.js/
// PinnedAuthorService.js.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  return {
    authorization: 'bearer ' + userInfo.token,
    'content-type': 'application/json'
  }
}

export async function updateBookmarkNote(userInfo, bookId, pageNumber, note) {
  const res = await fetch(`${API_ROOT}/api/pdf/sync/bookmarks`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify([
      {
        bookId,
        pageNumber,
        note,
        clientModifiedAt: new Date().toISOString(),
        isDeleted: false
      }
    ])
  })
  return res.ok
}
