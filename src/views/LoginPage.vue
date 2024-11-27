<template>
  <div class="bg-gray-100 flex justify-center items-center w-full">
    <div
      class="flex flex-col bg-white p-8 rounded shadow-lg justify-center items-center w-1/4 space-y-4"
    >
      <!-- <img src="https://www.svgrepo.com/show/219383/login.svg" class="h-9"> -->
      <img src="https://cf-cdn.newsbytesapp.com/assets/icons/2/favicon-96x96.png" class="h-9" />
      <!-- Login Form -->
      <el-form :model="loginForm" label-position="top" class="w-full">
        <el-form-item label="Email">
          <el-input v-model="loginForm.email" placeholder="email" required />
        </el-form-item>
        <el-form-item label="Password">
          <el-input v-model="loginForm.password" placeholder="password" type="password" required />
        </el-form-item>
        <el-form-item label="Environment">
          <el-select v-model="env" placeholder="Environment" disabled>
            <el-option label="UAT" value="uat" />
          </el-select>
        </el-form-item>
        <el-button
          type="primary"
          @click="handleLogin"
          :loading="loading"
          class="w-full flex justify-center bg-indigo-600 border border-transparent rounded-md py-2 px-4 inline-flex items-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white"
        >
          Login
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useStore } from '@/stores'

export default {
  data() {
    return {
      loginForm: {
        email: '',
        password: ''
      },
      env: '',
      loading: false
    }
  },
  methods: {
    toggleEnvironment() {
      const store = useStore()
      store.setEnvironment('uat')
    },
    handleLogin() {
      this.loading = true
      this.makeRequest('post', 'auth-service/v1/signin', {
        email: this.loginForm.email,
        password: this.loginForm.password
      })
        .then((response) => {
          localStorage.setItem('token', response.data.token)
          location.reload()
        })
        .catch((error) => {
          console.error('Login error:', error)
          this.$message.error('Invalid credentials')
        })
        .finally(() => {
          this.loading = false
        })
    }
  },
  created() {
    this.env = localStorage.getItem('environment') || 'uat'
  }
}
</script>
