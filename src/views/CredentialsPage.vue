<template>
  <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
    <div class="flex justify-between items-center">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/credentials' }">Credentials</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="flex flex-row space-x-2">
        <el-button type="primary" icon="Plus" @click="showAddCredentialDialog = true"
          >Add Credential</el-button
        >
        <el-button type="success" icon="Refresh" circle @click="fetchCredentials()"></el-button>
      </div>
    </div>
    <el-table :data="credentials" v-loading="loading" class="w-full" stripe>
      <el-table-column prop="id" label="ID" />
      <el-table-column prop="name" label="Name" />
      <!-- <el-table-column prop="value" label="Value" /> -->
      <el-table-column label="Actions" width="200">
        <template #default="scope">
          <el-button type="primary" icon="Edit" size="small" @click="editCredential(scope.row)"
            >Edit</el-button
          >
          <el-button
            type="danger"
            icon="Delete"
            size="small"
            @click="confirmDeleteCredential(scope.row.id)"
            >Delete</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="flex flex-row justify-end w-full">
        <el-pagination
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100, 200, 300]"
          v-model:page-size="pageSize"
          v-model:current-page="currentPage"
          :total="totalCredentials"
          @size-change="fetchCredentials"
          @current-change="fetchCredentials"
          class="flex justify-center"
        />
      </div>
    </template>
  </el-card>

  <!-- Add Dialog -->
  <el-dialog
    title="Add Credential"
    v-model="showAddCredentialDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-form :model="newCredential" label-position="top">
      <el-form-item label="Name">
        <el-input v-model="newCredential.name" />
      </el-form-item>
      <el-form-item label="Value">
        <el-input type="textarea" rows="5" v-model="newCredential.value" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddCredentialDialog = false">Cancel</el-button>
      <el-button type="primary" @click="createCredential">Create</el-button>
    </template>
  </el-dialog>

  <!-- Edit Dialog -->
  <el-dialog
    title="Edit Credential"
    v-model="showEditCredentialDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-form :model="editingCredential" label-position="top">
      <el-form-item label="Name">
        <el-input v-model="editingCredential.name" />
      </el-form-item>
      <el-form-item label="Value">
        <el-input type="textarea" rows="5" v-model="editingCredential.value" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditCredentialDialog = false">Cancel</el-button>
      <el-button type="primary" @click="updateCredential">Update</el-button>
    </template>
  </el-dialog>

  <!-- Delete Confirmation Dialog -->
  <el-dialog
    title="Delete Credential"
    v-model="showDeleteCredentialDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-checkbox v-model="deleteConfirmed"
      >Are you sure you want to delete this credential?</el-checkbox
    >
    <template #footer>
      <el-button @click="showDeleteCredentialDialog = false">Cancel</el-button>
      <el-button type="danger" :disabled="!deleteConfirmed" @click="deleteCredential"
        >Delete</el-button
      >
    </template>
  </el-dialog>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      loading: false,
      credentials: [],
      totalCredentials: 0,
      currentPage: 1,
      pageSize: 10,
      showAddCredentialDialog: false,
      showEditCredentialDialog: false,
      showDeleteCredentialDialog: false,
      credentialIdToDelete: null,
      newCredential: {
        name: '',
        value: ''
      },
      editingCredential: null,
      deleteConfirmed: false
    }
  },
  mounted() {
    this.fetchCredentials()
  },
  methods: {
    fetchCredentials() {
      this.loading = true
      this.makeRequest('post', 'artillery-service/v1/credential.list')
        .then((response) => {
          this.credentials = response.data.results
          this.totalCredentials = this.credentials.length
          const linodeToken = this.credentials.find(
            (credential) => credential.name === 'LINODE_TOKEN'
          )
          if (linodeToken) {
            this.linodeToken = linodeToken.value
            localStorage.setItem('linodeToken', this.linodeToken)
          } else {
            this.newCredential = {
              name: 'LINODE_TOKEN',
              value: '<your-linode-token>'
            }
            this.createCredential()
          }
        })
        .catch((error) => {
          console.error('Server responded with an error:', error.response.data)
          this.$message.error('Error fetching credentials: Server responded with an error')
        })
        .finally(() => {
          this.loading = false
        })
    },
    createCredential() {
      this.loading = true
      this.makeRequest('post', 'artillery-service/v1/credential.create', this.newCredential)
        .then(() => {
          this.showAddCredentialDialog = false
          this.newCredential = {
            name: '',
            value: ''
          }
          this.fetchCredentials()
          this.$message.success('Credential created successfully')
        })
        .catch((error) => {
          console.error('Error creating credential:', error)
          this.$message.error('Error creating credential')
        })
        .finally(() => {
          this.loading = false
        })
    },
    editCredential(credential) {
      this.editingCredential = { ...credential }
      this.showEditCredentialDialog = true
    },
    updateCredential() {
      this.loading = true
      this.makeRequest('post', 'artillery-service/v1/credential.update', this.editingCredential)
        .then(() => {
          this.showEditCredentialDialog = false
          this.fetchCredentials()
          this.$message.success('Credential updated successfully')
        })
        .catch((error) => {
          console.error('Error updating credential:', error)
          this.$message.error('Error updating credential')
        })
        .finally(() => {
          this.loading = false
        })
    },
    confirmDeleteCredential(id) {
      this.credentialIdToDelete = id
      this.deleteConfirmed = false
      this.showDeleteCredentialDialog = true
    },
    deleteCredential() {
      if (!this.deleteConfirmed) return
      this.loading = true
      this.makeRequest('post', 'artillery-service/v1/credential.delete', {
        id: this.credentialIdToDelete
      })
        .then(() => {
          this.showDeleteCredentialDialog = false
          this.fetchCredentials()
          this.$message.success('Credential deleted successfully')
        })
        .catch((error) => {
          console.error('Error deleting credential:', error)
          this.$message.error('Error deleting credential')
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>
