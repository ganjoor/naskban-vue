<script setup>
import { ref, onMounted } from 'vue'
import * as UserRoleService from '../utilities/UserRoleService'
import PermissionChecker from '../utilities/PermissionChecker'

const userInfo = ref(null)
const canView = ref(false)

const loading = ref(true)
const users = ref([])
const expanded = ref([])
const filterByEmail = ref('')
const pagination = ref({ page: 1, rowsPerPage: 15, rowsNumber: 0 })

const allRoleNames = ref([])
const userRolesCache = ref({}) // userId -> array of role name strings, loaded on expand
const loadingRolesFor = ref(null)

const roleDialogOpen = ref(false)
const roleDialogUserId = ref(null)
const roleDialogSelection = ref(null)
const roleDialogOptions = ref([])

const columns = [
  { name: 'email', label: 'پست الکترونیکی', field: 'email', align: 'right' },
  { name: 'firstName', label: 'نام', field: 'firstName', align: 'right' },
  { name: 'surName', label: 'نام خانوادگی', field: 'surName', align: 'right' },
  { name: 'status', label: 'وضعیت', field: 'status', align: 'center' }
]

function goTo(url) {
  window.location.href = url
}

async function loadUsers() {
  if (userInfo.value == null) return
  loading.value = true
  const res = await UserRoleService.getUsers(
    userInfo.value,
    pagination.value.page,
    pagination.value.rowsPerPage,
    filterByEmail.value
  )
  loading.value = false
  if (res == null) return
  users.value = res.items
  pagination.value.rowsNumber = res.totalCount
}

function onTableRequest(request) {
  pagination.value.page = request.pagination.page
  pagination.value.rowsPerPage = request.pagination.rowsPerPage
  loadUsers()
}

async function ensureRolesLoaded(user) {
  if (userRolesCache.value[user.id]) return
  loadingRolesFor.value = user.id
  const roles = await UserRoleService.getUserRoles(userInfo.value, user.id)
  loadingRolesFor.value = null
  userRolesCache.value = { ...userRolesCache.value, [user.id]: roles || [] }
}

async function removeRole(user, roleName) {
  const success = await UserRoleService.removeUserFromRole(userInfo.value, user.id, roleName)
  if (!success) return
  userRolesCache.value = {
    ...userRolesCache.value,
    [user.id]: userRolesCache.value[user.id].filter((r) => r !== roleName)
  }
}

function openAddRoleDialog(user) {
  const current = userRolesCache.value[user.id] || []
  roleDialogOptions.value = allRoleNames.value.filter((r) => !current.includes(r))
  if (roleDialogOptions.value.length === 0) return
  roleDialogSelection.value = roleDialogOptions.value[0]
  roleDialogUserId.value = user.id
  roleDialogOpen.value = true
}

async function confirmAddRole() {
  const success = await UserRoleService.addUserToRole(
    userInfo.value,
    roleDialogUserId.value,
    roleDialogSelection.value
  )
  roleDialogOpen.value = false
  if (!success) return
  userRolesCache.value = {
    ...userRolesCache.value,
    [roleDialogUserId.value]: [
      ...(userRolesCache.value[roleDialogUserId.value] || []),
      roleDialogSelection.value
    ]
  }
}

async function toggleActive(user, active) {
  const success = await UserRoleService.updateUser(userInfo.value, { ...user, status: active ? 1 : 0 })
  if (success) {
    user.status = active ? 1 : 0
  }
}

onMounted(() => {
  document.title = 'نسکبان - مدیریت کاربران'
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  if (userInfo.value == null) {
    loading.value = false
    return
  }
  canView.value = PermissionChecker.check(userInfo.value, 'user', 'view')
  if (!canView.value) {
    loading.value = false
    return
  }
  UserRoleService.getRoles(userInfo.value).then((roles) => {
    allRoleNames.value = (roles || []).map((r) => r.name)
  })
  loadUsers()
})
</script>

<template>
  <q-bar class="flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo('/')">
        <q-tooltip class="bg-green text-white">بازگشت به خانه</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <div class="row justify-center items-center q-pa-sm">
    <h3 class="q-my-none">مدیریت کاربران</h3>
  </div>

  <div v-if="!loading && userInfo == null" class="text-center q-pa-lg">
    برای مشاهدهٔ این صفحه باید وارد حساب کاربری‌تان شوید.
  </div>
  <div v-else-if="!loading && !canView" class="text-center q-pa-lg">
    شما اجازهٔ دسترسی به این صفحه را ندارید.
  </div>

  <div v-else class="q-pa-md q-mx-auto" style="max-width: 900px">
    <q-table
      :rows="users"
      :columns="columns"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      v-model:expanded="expanded"
      :rows-per-page-options="[15, 50, 100]"
      @request="onTableRequest"
    >
      <template v-slot:top>
        <div class="text-h6">کاربران</div>
        <q-space />
        <q-input
          dense
          v-model="filterByEmail"
          label="جستجوی ایمیل"
          @keyup.enter="loadUsers"
          class="q-mr-sm"
        />
        <q-btn dense flat icon="search" @click="loadUsers" />
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" style="cursor: pointer" @click="props.expand = !props.expand; ensureRolesLoaded(props.row)">
          <q-td key="email" :props="props">{{ props.row.email }}</q-td>
          <q-td key="firstName" :props="props">{{ props.row.firstName }}</q-td>
          <q-td key="surName" :props="props">{{ props.row.surName }}</q-td>
          <q-td key="status" :props="props">
            <q-badge :color="props.row.status === 1 ? 'green' : 'grey'">
              {{ props.row.status === 1 ? 'فعال' : 'غیرفعال' }}
            </q-badge>
          </q-td>
        </q-tr>
        <q-tr v-if="props.expand" :props="props">
          <q-td colspan="100%">
            <div class="q-pa-sm">
              <q-spinner-hourglass v-if="loadingRolesFor === props.row.id" color="green" size="1.5em" />
              <template v-else>
                <q-chip
                  v-for="role in userRolesCache[props.row.id] || []"
                  :key="role"
                  removable
                  color="green"
                  text-color="white"
                  @remove="removeRole(props.row, role)"
                >
                  {{ role }}
                </q-chip>
                <q-btn
                  dense
                  round
                  flat
                  icon="add"
                  color="indigo"
                  @click="openAddRoleDialog(props.row)"
                >
                  <q-tooltip>افزودن نقش</q-tooltip>
                </q-btn>
                <div class="q-mt-sm">
                  <q-checkbox
                    :model-value="props.row.status === 1"
                    label="فعال"
                    @update:model-value="(v) => toggleActive(props.row, v)"
                  />
                </div>
              </template>
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>

  <q-dialog v-model="roleDialogOpen">
    <q-card style="min-width: 300px">
      <q-card-section class="text-h6">افزودن نقش</q-card-section>
      <q-card-section>
        <q-select v-model="roleDialogSelection" :options="roleDialogOptions" label="نقش" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="انصراف" @click="roleDialogOpen = false" />
        <q-btn color="primary" label="تأیید" @click="confirmAddRole" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
