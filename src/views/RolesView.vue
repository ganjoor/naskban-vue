<script setup>
import { ref, onMounted } from 'vue'
import * as UserRoleService from '../utilities/UserRoleService'
import PermissionChecker from '../utilities/PermissionChecker'

const userInfo = ref(null)
const canView = ref(false)

const loading = ref(true)
const roles = ref([])
const expanded = ref([])
const securableItems = ref(null) // GET api/roles/securableitems, loaded once
const treeNodes = ref([])
const tickedByRole = ref({}) // roleName -> array of "shortName:opShortName" strings
const savingRole = ref(null)
const saveMessage = ref('')

const addingRole = ref(false)
const newRoleName = ref('')

const columns = [
  { name: 'name', label: 'نام', field: 'name', align: 'right' },
  { name: 'description', label: 'توضیحات', field: 'description', align: 'right' }
]

function goTo(url) {
  window.location.href = url
}

async function loadRoles() {
  loading.value = true
  const res = await UserRoleService.getRoles(userInfo.value)
  loading.value = false
  if (res) roles.value = res
}

async function loadSecurableItems() {
  const res = await UserRoleService.getSecurableItems(userInfo.value)
  if (!res) return
  securableItems.value = res
  treeNodes.value = res.map((item) => ({
    id: item.shortName,
    label: item.description,
    children: item.operations.map((op) => ({
      id: item.shortName + ':' + op.shortName,
      label: op.description
    }))
  }))
}

function onRowClick(role) {
  if (!tickedByRole.value[role.name]) {
    tickedByRole.value = {
      ...tickedByRole.value,
      [role.name]: (role.permissions || []).map(
        (p) => p.securableItemShortName + ':' + p.operationShortName
      )
    }
  }
}

function tickedFor(roleName) {
  return tickedByRole.value[roleName] || []
}

function setTickedFor(roleName, ticked) {
  tickedByRole.value = { ...tickedByRole.value, [roleName]: ticked }
}

async function savePermissions(roleName) {
  savingRole.value = roleName
  saveMessage.value = ''
  const ticked = tickedFor(roleName)
  // only entries actually being granted go in at all - see
  // UserRoleService.saveRolePermissions' own doc comment on why
  const payload = securableItems.value.map((item) => ({
    shortName: item.shortName,
    description: null,
    operations: item.operations
      .filter((op) => ticked.includes(item.shortName + ':' + op.shortName))
      .map((op) => ({ shortName: op.shortName, description: null, status: true }))
  }))
  const success = await UserRoleService.saveRolePermissions(userInfo.value, roleName, payload)
  savingRole.value = null
  saveMessage.value = success ? 'دسترسی‌های نقش ذخیره شد.' : 'ذخیرهٔ دسترسی‌ها موفق نبود.'
}

async function confirmAddRole() {
  const name = newRoleName.value.trim()
  if (!name) return
  const success = await UserRoleService.createRole(userInfo.value, name)
  if (success) {
    newRoleName.value = ''
    addingRole.value = false
    await loadRoles()
  }
}

onMounted(() => {
  document.title = 'نسکبان - مدیریت نقش‌ها'
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
  loadSecurableItems()
  loadRoles()
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
    <h3 class="q-my-none">مدیریت نقش‌ها</h3>
  </div>

  <div v-if="!loading && userInfo == null" class="text-center q-pa-lg">
    برای مشاهدهٔ این صفحه باید وارد حساب کاربری‌تان شوید.
  </div>
  <div v-else-if="!loading && !canView" class="text-center q-pa-lg">
    شما اجازهٔ دسترسی به این صفحه را ندارید.
  </div>

  <div v-else class="q-pa-md q-mx-auto" style="max-width: 900px">
    <q-table :rows="roles" :columns="columns" row-key="name" :loading="loading" v-model:expanded="expanded">
      <template v-slot:top>
        <div class="text-h6">نقش‌ها</div>
        <q-space />
        <q-input v-if="addingRole" dense v-model="newRoleName" label="نام نقش جدید" class="q-mr-sm" />
        <q-btn v-if="addingRole" dense flat icon="save" color="indigo" @click="confirmAddRole" />
        <q-btn v-if="addingRole" dense flat icon="cancel" @click="addingRole = false" />
        <q-btn v-else dense flat round icon="add" color="indigo" @click="addingRole = true">
          <q-tooltip>نقش جدید</q-tooltip>
        </q-btn>
      </template>

      <template v-slot:body="props">
        <q-tr
          :props="props"
          style="cursor: pointer"
          @click="props.expand = !props.expand; onRowClick(props.row)"
        >
          <q-td key="name" :props="props">{{ props.row.name }}</q-td>
          <q-td key="description" :props="props">{{ props.row.description }}</q-td>
        </q-tr>
        <q-tr v-if="props.expand" :props="props">
          <q-td colspan="100%">
            <div class="q-pa-sm text-right">
              <q-tree
                :nodes="treeNodes"
                node-key="id"
                label-key="label"
                tick-strategy="leaf"
                default-expand-all
                :ticked="tickedFor(props.row.name)"
                @update:ticked="(v) => setTickedFor(props.row.name, v)"
              />
              <q-btn
                class="q-mt-sm"
                color="primary"
                label="ذخیره"
                :loading="savingRole === props.row.name"
                @click="savePermissions(props.row.name)"
              />
              <div v-if="saveMessage" class="q-mt-sm">{{ saveMessage }}</div>
            </div>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:pagination="scope">
        <q-btn
          dense
          flat
          round
          icon="skip_next"
          :disable="scope.isFirstPage"
          @click="scope.firstPage"
        >
          <q-tooltip>اولین صفحه</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          round
          icon="fast_forward"
          :disable="scope.isFirstPage"
          @click="scope.prevPage"
        >
          <q-tooltip>صفحهٔ قبل</q-tooltip>
        </q-btn>
        <div class="q-px-md">{{ scope.pagination.page }} / {{ scope.pagesNumber }}</div>
        <q-btn
          dense
          flat
          round
          icon="fast_rewind"
          :disable="scope.isLastPage"
          @click="scope.nextPage"
        >
          <q-tooltip>صفحهٔ بعد</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          round
          icon="skip_previous"
          :disable="scope.isLastPage"
          @click="scope.lastPage"
        >
          <q-tooltip>آخرین صفحه</q-tooltip>
        </q-btn>
      </template>
    </q-table>
  </div>
</template>
