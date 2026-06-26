import { createPinia } from 'pinia';

import App from '@/App.vue';
import { useMenu } from '@/composables/useMenu';
import { useWorldStore } from '@/stores/world';

import '@/styles/globals.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

await useMenu().initMenu();
await useWorldStore().initWorld();
