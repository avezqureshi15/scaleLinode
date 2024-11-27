import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/views/LoginPage.vue';
import HomePage from '@/views/HomePage.vue';
import CredentialsPage from '@/views/CredentialsPage.vue';
import EnvironmentsPage from '@/views/EnvironmentsPage.vue';
import EnvironmentManagementPage from '@/views/EnvironmentManagementPage.vue';
import LaunchTemplatesPage from '@/views/LaunchTemplatesPage.vue';
import AutoScalingGroupPage from '@/views/AutoScalingGroupPage.vue';
import AutoScalingGroupManagementPage from '@/views/AutoScalingGroupManagementPage.vue';
import ObjectStoragePage from '@/views/ObjectStoragePage.vue';
import LogPage from '@/views/LogPage.vue';
import SettingPage from '@/views/SettingPage.vue';
import SwaggerPage from '@/views/SwaggerPage.vue';

const routes = [
    { 
        path: '/login',
        name: 'Login',
        component: LoginPage
    },
    { 
        path: '/swagger',
        name: 'Swagger',
        component: SwaggerPage
    },
    { 
        path: '/',
        name: 'Home',
        component: HomePage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/credentials',
        name: 'Credentials',
        component: CredentialsPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/environments',
        name: 'Environments',
        component: EnvironmentsPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/environments/:envId/manage',
        name: 'EnvironmentManagement',
        component: EnvironmentManagementPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/launch-templates',
        name: 'LaunchTemplates',
        component: LaunchTemplatesPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/auto-scaling-groups',
        name: 'AutoScalingGroup',
        component: AutoScalingGroupPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/auto-scaling-groups/:asgId/manage',
        name: 'AutoScalingGroupManagement',
        component: AutoScalingGroupManagementPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/object-storage',
        name: 'ObjectStorage',
        component: ObjectStoragePage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/logs',
        name: 'Log',
        component: LogPage,
        meta: { requiresAuth: true }
    },
    { 
        path: '/settings',
        name: 'SettingPage',
        component: SettingPage,
        meta: { requiresAuth: true }
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    // Check if the route requires authentication and user is not logged in
    if (to.matched.some(record => record.meta.requiresAuth) && !localStorage.getItem('token')) {
        next('/login');  // Redirect to login if not logged in
    } else if (to.path === '/login' && localStorage.getItem('token')) {
        next('/');  // Redirect to home if trying to access login while logged in
    } else {
        next();  // Proceed to the requested route
    }
});

export default router;