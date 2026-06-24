import { createPinia } from 'pinia';

import { loadWorld } from '@/actions/world';
import App from '@/App.vue';
import { useMenu } from '@/composables/useMenu';

import '@/styles/globals.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

await useMenu().initMenu();
await loadWorld();
