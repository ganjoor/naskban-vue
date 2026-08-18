// Talks to the generic notification API this project inherits from the
// external RSecurityBackend package. See NotificationService (Flutter
// client)'s own doc comment for the full explanation - the short version:
// the method names/parameters/response shape below (Id, DateTime, Status,
// Subject, HtmlText) are confirmed directly from the package's own XML
// docs, but the exact route *paths* were not directly verifiable (routes
// live in C# attributes, not XML doc comments, and the live Swagger
// endpoint - confirmed enabled server-side - couldn't be reached from
// here). These are a best-effort guess following this project's own
// naming conventions elsewhere. Check them against this server's own
// Swagger UI (/swagger/index.html) and correct here if wrong.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  return {
    authorization: 'bearer ' + userInfo.token,
    'content-type': 'application/json'
  }
}

export const NotificationStatus = {
  unread: 0,
  read: 1,
  archived: 2,
  deleted: 3
}

export async function getNotifications(userInfo, pageNumber = 1, pageSize = 20) {
  const res = await fetch(
    `${API_ROOT}/api/notifications?PageNumber=${pageNumber}&PageSize=${pageSize}&notificationType=All`,
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

export async function getUnreadCount(userInfo) {
  if (!userInfo) return null
  const res = await fetch(`${API_ROOT}/api/notifications/unread/count?notificationType=All`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return null
  const decoded = await res.json()
  if (typeof decoded === 'number') return decoded
  if (decoded && decoded.count != null) return decoded.count
  return null
}

export async function switchStatus(userInfo, notificationId) {
  const res = await fetch(`${API_ROOT}/api/notifications/${notificationId}`, {
    method: 'PUT',
    headers: headers(userInfo)
  })
  return res.ok
}

export async function markAllRead(userInfo) {
  const res = await fetch(`${API_ROOT}/api/notifications/read/all`, {
    method: 'PUT',
    headers: headers(userInfo)
  })
  return res.ok
}
