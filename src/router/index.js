import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';
import Backup from '../views/Backup.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    
    {
        path: '/backup',
        name: 'Backup',
        component: Backup,
        props: true
    }
    
];


const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes: routes
});

export default router;