// Submitting, editing, deleting, listing, and voting on book reviews -
// see the Flutter client's own PDFBookReviewService for the same shape,
// and the server's PDFLibraryService-BookReview.cs for the full design
// reasoning. Unlike PDFPageCommentService this is plain JSON throughout
// (no highlight image to attach), so every write here is a normal
// fetch with a JSON body, not FormData.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  const h = { 'content-type': 'application/json' }
  if (userInfo != null) {
    h.authorization = 'bearer ' + userInfo.token
  }
  return h
}

// POST api/pdf/{bookId}/review - any authenticated user, one per
// (book, user); rejected server-side if the caller already has one for
// this book (edit instead, via editReview below).
export async function submitReview(userInfo, bookId, text, rating) {
  const res = await fetch(`${API_ROOT}/api/pdf/${bookId}/review`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify({ text, rating })
  })
  if (res.ok) return await res.json() // the new review's id
  throw new Error(await res.json())
}

// PUT api/pdf/review/{reviewId} - own author only, no moderator
// override.
export async function editReview(userInfo, reviewId, text, rating) {
  const res = await fetch(`${API_ROOT}/api/pdf/review/${reviewId}`, {
    method: 'PUT',
    headers: headers(userInfo),
    body: JSON.stringify({ text, rating })
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// DELETE api/pdf/review/{reviewId} - own review always allowed;
// someone else's requires pdfbookreview:moderate server-side.
export async function deleteReview(userInfo, reviewId) {
  const res = await fetch(`${API_ROOT}/api/pdf/review/${reviewId}`, {
    method: 'DELETE',
    headers: headers(userInfo)
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// GET api/pdf/{bookId}/reviews - one specific book's own reviews,
// paginated, public, no login required; a logged-in caller's own
// review/votes still come back correctly shaped. [sort] is 'Newest'
// (default), 'HighestRated', or 'MostLiked'.
export async function getReviewsForBook(userInfo, bookId, sort = 'Newest', pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/${bookId}/reviews?sort=${sort}&PageNumber=${pageNumber}&PageSize=${pageSize}`,
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

// GET api/pdf/reviews/recent - the site-wide "latest reviews" hub,
// across every book. Public, no login required.
export async function getRecentReviews(userInfo, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/reviews/recent?PageNumber=${pageNumber}&PageSize=${pageSize}`,
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

// GET api/pdf/reviews/mine - every review the caller has ever posted,
// across every book. Requires login.
export async function getMyReviews(userInfo, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/reviews/mine?PageNumber=${pageNumber}&PageSize=${pageSize}`,
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

// GET api/pdf/reviews/by/{userId} - every review a specific user has
// ever posted, across every book. Public, no login required - same
// reasoning as getCommentsByUser: [userInfo] is passed through purely
// so the caller's own reviews come back editable/deletable if they
// happen to be viewing their own history through this same endpoint.
export async function getReviewsByUser(userInfo, userId, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/reviews/by/${userId}?PageNumber=${pageNumber}&PageSize=${pageSize}`,
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

// POST api/pdf/review/{reviewId}/vote - can't vote on your own review
// (rejected server-side). Casting an identical or opposite vote both
// go through this same call - the server upserts.
export async function castVote(userInfo, reviewId, isLike) {
  const res = await fetch(`${API_ROOT}/api/pdf/review/${reviewId}/vote`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify({ isLike })
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// DELETE api/pdf/review/{reviewId}/vote - removes the caller's own
// vote, if any.
export async function removeVote(userInfo, reviewId) {
  const res = await fetch(`${API_ROOT}/api/pdf/review/${reviewId}/vote`, {
    method: 'DELETE',
    headers: headers(userInfo)
  })
  if (res.ok) return true
  throw new Error(await res.json())
}
