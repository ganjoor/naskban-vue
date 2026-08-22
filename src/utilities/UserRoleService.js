// User and role management - every endpoint here is inherited, unmodified,
// from RSecurityBackend's own AppUserControllerBase/RoleControllerBase
// (confirmed directly: AppUserController only overrides Login/ReLogin,
// RoleController overrides nothing at all), so this is a pure client-side
// feature - no server changes were needed. Ported from the sibling
// Ganjoor Museum project's own Users.vue/Roles.vue (Vue 2 + Vuetify +
// axios) into this project's conventions (Vue 3 + Quasar + fetch), not
// copied verbatim - the API calls themselves are the same shared backend
// either way.
const API_ROOT = 'https://api.naskban.ir'

function headers(userInfo) {
  return {
    authorization: 'bearer ' + userInfo.token,
    'content-type': 'application/json'
  }
}

// GET api/users?PageNumber&PageSize&filterByEmail&filterByNickName -
// requires user:view for anyone else's data (returns just your own
// otherwise, per the endpoint's own doc comment - not useful for this
// admin screen, which assumes the caller already has user:view).
export async function getUsers(userInfo, pageNumber = 1, pageSize = 15, filterByEmail = '') {
  const res = await fetch(
    `${API_ROOT}/api/users?PageNumber=${pageNumber}&PageSize=${pageSize}&filterByEmail=${encodeURIComponent(filterByEmail)}`,
    { headers: headers(userInfo) }
  )
  if (!res.ok) return null
  const items = await res.json()
  let totalCount = items.length
  for (const pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      totalCount = JSON.parse(pair[1]).totalCount
    }
  }
  return { items, totalCount }
}

// PUT api/users/{id} - a full replace, not a partial update (confirmed
// from the endpoint's own doc comment: "existingUserInfo.id could be
// passed empty and it is ignored completely, if password is sent empty
// it does not have effect" - everything else IS applied, so this must
// always be called with the user's full current data, not just the one
// field actually changing). [user] should be a full user object from
// getUsers' own results, with whichever fields the caller wants changed
// already applied to it.
export async function updateUser(userInfo, user) {
  const res = await fetch(`${API_ROOT}/api/users/${user.id}`, {
    method: 'PUT',
    headers: headers(userInfo),
    body: JSON.stringify({
      password: '',
      isAdmin: user.isAdmin,
      firstName: user.firstName,
      surName: user.surName,
      status: user.status,
      rImageId: user.rImageId,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      nickName: user.nickName,
      bio: user.bio,
      website: user.website,
      screenName: user.screenName
    })
  })
  return res.ok
}

// GET api/users/{id}/roles - array of role name strings
export async function getUserRoles(userInfo, userId) {
  const res = await fetch(`${API_ROOT}/api/users/${userId}/roles`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return null
  return await res.json()
}

// POST api/users/{id}/roles/{roleName}
export async function addUserToRole(userInfo, userId, roleName) {
  const res = await fetch(
    `${API_ROOT}/api/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    { method: 'POST', headers: headers(userInfo) }
  )
  return res.ok
}

// DELETE api/users/{id}/roles/{roleName}
export async function removeUserFromRole(userInfo, userId, roleName) {
  const res = await fetch(
    `${API_ROOT}/api/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    { method: 'DELETE', headers: headers(userInfo) }
  )
  return res.ok
}

// GET api/roles - each role includes its own permissions array
// ({securableItemShortName, operationShortName})
export async function getRoles(userInfo) {
  const res = await fetch(`${API_ROOT}/api/roles`, { headers: headers(userInfo) })
  if (!res.ok) return null
  return await res.json()
}

// GET api/roles/securableitems - the full permission tree every role's
// own permissions are checked against (public - no auth needed to see
// what permissions exist, only to grant them)
export async function getSecurableItems(userInfo) {
  const res = await fetch(`${API_ROOT}/api/roles/securableitems`, {
    headers: headers(userInfo)
  })
  if (!res.ok) return null
  return await res.json()
}

// POST api/roles
export async function createRole(userInfo, name) {
  const res = await fetch(`${API_ROOT}/api/roles`, {
    method: 'POST',
    headers: headers(userInfo),
    body: JSON.stringify({ name })
  })
  return res.ok
}

// PUT api/roles/permissions/{roleName} - a full replace of the role's
// permissions. Confirmed from the sibling Ganjoor Museum project's own
// working onPermissionsSave logic: only entries the caller is actually
// granting go in the array at all (each with status: true) - an
// operation left out entirely is what revokes it, not an explicit
// status: false. [securableItems] should already be built that way by
// the caller (only checked/ticked operations included).
export async function saveRolePermissions(userInfo, roleName, securableItems) {
  const res = await fetch(
    `${API_ROOT}/api/roles/permissions/${encodeURIComponent(roleName)}`,
    {
      method: 'PUT',
      headers: headers(userInfo),
      body: JSON.stringify(securableItems)
    }
  )
  return res.ok
}
