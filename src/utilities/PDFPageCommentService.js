// Submitting, listing, and deleting page comments (Phase 1 - plain text,
// threaded replies, no highlight/image yet). See the Flutter client's
// PDFPageCommentService for the same shape.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  const h = { 'content-type': 'application/json' }
  if (userInfo != null) {
    h.authorization = 'bearer ' + userInfo.token
  }
  return h
}

// GET api/pdf/page/{pdfPageId}/comments - public, no login required;
// a logged-in caller's own comments come back with myComment set.
export async function getComments(userInfo, pdfPageId) {
  const res = await fetch(`${API_ROOT}/api/pdf/page/${pdfPageId}/comments`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return null
  return await res.json()
}

// POST api/pdf/page/{pdfPageId}/comment - any authenticated user.
export async function submitComment(userInfo, pdfPageId, text, inReplyToId) {
  const res = await fetch(`${API_ROOT}/api/pdf/page/${pdfPageId}/comment`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify({ text, inReplyToId: inReplyToId || null })
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
