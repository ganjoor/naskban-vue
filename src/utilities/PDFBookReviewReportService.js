// Submitting, listing, and resolving book review reports - see the
// Flutter client's own PDFBookReviewReportService for the same shape,
// and the server's PDFLibraryService-BookReviewReport.cs for the full
// design reasoning.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  const h = { 'content-type': 'application/json' }
  if (userInfo != null) {
    h.authorization = 'bearer ' + userInfo.token
  }
  return h
}

// POST api/pdf/review/{reviewId}/report - any authenticated user other
// than the review's own author.
export async function submitReport(userInfo, reviewId, category, description) {
  const res = await fetch(`${API_ROOT}/api/pdf/review/${reviewId}/report`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify({ category, description })
  })
  if (res.ok) return true
  throw new Error(await res.json())
}

// GET api/pdf/reviewreports/open - requires the
// pdfbookreviewreport:moderate permission server-side.
export async function getOpenReports(userInfo, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/pdf/reviewreports/open?PageNumber=${pageNumber}&PageSize=${pageSize}`,
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

// PUT api/pdf/reviewreport/{id}/resolve - requires the
// pdfbookreviewreport:moderate permission server-side. [approved] true
// deletes the reported review as part of resolving; false leaves it
// alone. [response] is optional.
export async function resolveReport(userInfo, reportId, approved, response) {
  const res = await fetch(`${API_ROOT}/api/pdf/reviewreport/${reportId}/resolve`, {
    method: 'PUT',
    headers: headers(userInfo),
    body: JSON.stringify({ approved, response })
  })
  if (res.ok) return true
  throw new Error(await res.json())
}
