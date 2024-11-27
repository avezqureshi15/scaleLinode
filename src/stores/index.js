import { defineStore } from 'pinia';

export const useStore = defineStore({
    id: 'mainStore',
    state: () => ({
        pageTitle: '',
        environment: localStorage.getItem('environment') || 'uat',
        isCollapse: localStorage.getItem('isCollapse') !== null ? JSON.parse(localStorage.getItem('isCollapse')) : false,
        profile: {
            name: "User"
        }
    }),
    getters: {
        getPageTitle() {
            return this.pageTitle;
        },
        getIsCollapse() {
            return this.isCollapse;
        },
        getProfile() {
            return this.profile;
        },
        getToken() {
            return localStorage.getItem('token') || '';
        },
        getEnvironment() {
            return localStorage.getItem('environment') || 'uat';
        },
    },
    actions: {
        setPageTitle(title) {
            this.pageTitle = title;
            this.saveState();
        },
        setIsCollapse(collapse) {
            this.isCollapse = collapse;
            localStorage.setItem('isCollapse', collapse);
            this.saveState();
        },
        setProfile(profile) {
            this.profile = profile;
            this.saveState();
        },
        setEnvironment(env) {
            this.environment = env;
            localStorage.setItem('environment', env);
            this.saveState();
        },
        loadState() {
            // Load state from localStorage
            const storedState = JSON.parse(localStorage.getItem('mainStore')) || {};
            Object.assign(this, storedState);
        },
        saveState() {
            // Save state to localStorage
            localStorage.setItem('mainStore', JSON.stringify(this.$state));
        },
    },
    // Initialize store with persisted state
    setup() {
        this.loadState();
    },
});