import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import router from './router'
import mixin from './mixin/index';
import { useStore } from './stores/index';

const app = createApp(App)

// Register Element Plus components
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

// Use Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Provide the Pinia store globally
app.provide('mainStore', useStore()); // Provide the store instance globally

// Use Element Plus, router, and mixin
app.use(ElementPlus);
app.use(router);
app.mixin(mixin);

// Mount the app
app.mount('#app');