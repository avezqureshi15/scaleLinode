<template>
  <el-container class="h-screen">
    <el-header v-if="isLoggedIn" class="flex justify-between items-center border-b p-4 bg-white">
      <div class="flex flex-row items-center space-x-4 cursor-pointer" @click="toggleCollapse()">
        <el-icon v-if="isCollapse"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
        <router-link to="/">
          <div class="text-xl hidden sm:flex">{{ appName }}</div>
        </router-link>
      </div>
      <div class="flex flex-row items-center space-x-4">
        <el-select
          v-model="env"
          placeholder="Environment"
          size="large"
          style="width: 240px"
          disabled
        >
          <el-option label="UAT" value="uat" />
        </el-select>
        <el-button type="danger" icon="SwitchButton" @click="logout">Logout</el-button>
      </div>
    </el-header>
    <el-container v-if="isLoggedIn">
      <el-aside class="bg-[#545c64]" :style="{ width: this.isCollapse ? '4rem' : '14rem' }">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :router="true"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/credentials">
            <el-icon><SetUp /></el-icon>
            <template #title>Credentials</template>
          </el-menu-item>
          <el-menu-item index="/environments">
            <el-icon><List /></el-icon>
            <template #title>Environments</template>
          </el-menu-item>
          <el-menu-item index="/launch-templates">
            <el-icon><Document /></el-icon>
            <template #title>Launch Templates</template>
          </el-menu-item>
          <el-menu-item index="/auto-scaling-groups">
            <el-icon><Monitor /></el-icon>
            <template #title>Auto Scaling Groups</template>
          </el-menu-item>
          <el-menu-item index="/logs">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>Logs</template>
          </el-menu-item>
          <el-menu-item index="/object-storage">
            <el-icon><TakeawayBox /></el-icon>
            <template #title>Object Storage</template>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Tools /></el-icon>
            <template #title>Settings</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-main class="">
          <router-view />
        </el-main>
        <el-footer class="border-t p-4 flex flex-row justify-between items-center bg-gray-50">
          <span class="text-xs">{{ appVersion }} {{ appName }}</span>
          <span class="text-xs">&copy; 2024 Candela Labs</span>
        </el-footer>
      </el-container>
    </el-container>
    <router-view v-else />
  </el-container>
</template>

<script>
import { useStore } from '@/stores'

export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false, // Initially not logged in
      activeMenu: '1',
      env: ''
    }
  },
  methods: {
    toggleCollapse() {
      const store = useStore()
      store.setIsCollapse(!this.isCollapse)
    },
    toggleEnvironment() {
      const store = useStore()
      store.setEnvironment(this.env)
    }
  },
  created() {
    // Check if user is logged in based on token presence in localStorage
    this.isLoggedIn = !!localStorage.getItem('token')
    this.env = localStorage.getItem('environment') || 'uat'
  }
}
</script>
