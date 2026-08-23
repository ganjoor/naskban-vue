// Submitting, listing, and deleting page comments - Phase 1 (plain text,
// threaded replies) plus Phase 2 (an optional highlighted-region image +
// fractional coordinates). See the Flutter client's own
// PDFPageCommentService for the same shape.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  const h = { 'content-type': 'application/json' }
  if (userInfo != null) {
    h.authorization = 'bearer ' + userInfo.token
  }
  return h
}

// GET api/pdf/{bookId}/page/{pageNumber}/comments - public, no login
// required; a logged-in caller's own comments come back with myComment
// set. Keyed by (bookId, pageNumber), not an internal page id - the
// server moved to this shape so a caller never needs a separate
// round-trip just to resolve an id first (see the Flutter client's own
// PDFPageCommentService for the identical change, made at the same
// time this should have been - this file was missed then).
export async function getComments(userInfo, bookId, pageNumber) {
  const res = await fetch(`${API_ROOT}/api/pdf/${bookId}/page/${pageNumber}/comments`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return null
  return await res.json()
}

// POST api/pdf/{bookId}/page/{pageNumber}/comment - any authenticated
// user. Sent as multipart form data, not JSON, even for a plain comment
// with no image - the server endpoint moved to Request.Form-based
// binding entirely once it needed to also accept a file (matching the
// sibling Ganjoor project's own mixed file+field upload convention).
// Keyed by (bookId, pageNumber), same reasoning as getComments above.
// [highlight], if given, is { x, y, width, height, imageBlob } - all
// four coordinates plus the cropped image, or omit it entirely for a
// plain comment.
//
// Content-Type is deliberately NOT set here (unlike every other call in
// this file) - the browser sets multipart/form-data with the correct
// boundary itself when the body is a FormData object, and setting it
// manually would override that with the wrong value.
export async function submitComment(userInfo, bookId, pageNumber, text, inReplyToId, highlight) {
  const form = new FormData()
  form.append('text', text)
  if (inReplyToId) form.append('inReplyToId', inReplyToId)
  if (highlight) {
    form.append('highlightX', highlight.x)
    form.append('highlightY', highlight.y)
    form.append('highlightWidth', highlight.width)
    form.append('highlightHeight', highlight.height)
    form.append('image', highlight.imageBlob, 'highlight.png')
  }
  const res = await fetch(`${API_ROOT}/api/pdf/${bookId}/page/${pageNumber}/comment`, {
    method: 'POST',
    headers: { authorization: 'bearer ' + userInfo.token },
    body: form
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// DELETE api/pdf/comment/{commentId} - own comment always allowed;
// someone else's requires pdfcomment:moderate server-side.
export async function deleteComment(userInfo, commentId) {
  const res = await fetch(`${API_ROOT}/api/pdf/comment/${commentId}`, {
    method: 'DELETE',
    headers: headers(userInfo)
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// PUT api/pdf/comment/{commentId} - own comment's author only, no
// moderator override even with pdfcomment:moderate (see the server's
// own EditPDFPageCommentAsync doc comment on why this differs from
// delete). Only the text can change - no highlight/image editing.
export async function editComment(userInfo, commentId, text) {
  const res = await fetch(`${API_ROOT}/api/pdf/comment/${commentId}`, {
    method: 'PUT',
    headers: headers(userInfo),
    body: JSON.stringify({ text })
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// GET api/pdf/{bookId}/page/{pageNumber}/comments/count - public, no
// login required. Meant to be called silently in the background as
// someone pages through a book, so failures of every kind (no network,
// server error) are swallowed and just return null - this never
// throws, unlike every other function in this file, since a background
// prefetch has no business interrupting the reading experience with an
// error the person never asked to see. See the Flutter client's own
// getCommentCount for the identical reasoning.
export async function getCommentCount(bookId, pageNumber) {
  try {
    const res = await fetch(`${API_ROOT}/api/pdf/${bookId}/page/${pageNumber}/comments/count`)
    if (!res.ok) return null
    const count = await res.json()
    return typeof count === 'number' ? count : null
  } catch {
    return null
  }
}

// GET api/pdf/{bookId}/comments - one specific book's own comment hub,
// paginated, public, no login required (MyComment isn't populated by
// this endpoint - there's no delete action in a hub - so nothing here
// depends on who's asking).
export async function getBookComments(bookId, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/${bookId}/comments?PageNumber=${pageNumber}&PageSize=${pageSize}`
  )
  if (!res.ok) return null
  const items = await res.json()
  let pageCount = 1
  for (const pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      pageCount = JSON.parse(pair[1]).totalPages
    }
  }
  return { items, pageCount }
}

// GET api/pdf/comments/recent - the site-wide comment hub, across every
// book. Same shape as getBookComments above (same server-side query,
// just without a book filter), public, no login required.
export async function getRecentComments(pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/comments/recent?PageNumber=${pageNumber}&PageSize=${pageSize}`
  )
  if (!res.ok) return null
  const items = await res.json()
  let pageCount = 1
  for (const pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      pageCount = JSON.parse(pair[1]).totalPages
    }
  }
  return { items, pageCount }
}

// GET api/pdf/comments/mine - every comment the caller has ever posted,
// across every book. Requires login (the server derives the filter from
// the caller's own JWT claim, never a client-supplied id - see the
// server's own GetMyPDFPageCommentsAsync doc comment).
export async function getMyComments(userInfo, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/comments/mine?PageNumber=${pageNumber}&PageSize=${pageSize}`,
    { headers: headers(userInfo) }
  )
  if (!res.ok) return null
  const items = await res.json()
  let pageCount = 1
  for (const pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      pageCount = JSON.parse(pair[1]).totalPages
    }
  }
  return { items, pageCount }
}

// GET api/pdf/comments/by/{userId} - every comment a specific user has
// ever posted, across every book. Public, no login required - lets
// anyone see "all of this person's comments" from tapping a name
// anywhere a comment appears. [userInfo] is still passed through
// (sending the caller's own token if logged in, not tied to [userId] at
// all) purely so the caller's own comments come back editable/deletable
// if they happen to be viewing their own history through this same
// endpoint.
export async function getCommentsByUser(userInfo, userId, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/comments/by/${userId}?PageNumber=${pageNumber}&PageSize=${pageSize}`,
    { headers: headers(userInfo) }
  )
  if (!res.ok) return null
  const items = await res.json()
  let pageCount = 1
  for (const pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      pageCount = JSON.parse(pair[1]).totalPages
    }
  }
  return { items, pageCount }
}
