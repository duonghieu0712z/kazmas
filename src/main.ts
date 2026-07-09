import { createPinia } from 'pinia';

import App from '@/App.vue';
import { listenNativeMenuCommands } from '@/menus/menuCommands';
import { useWorldStore } from '@/stores/world';

import '@/styles/globals.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

await listenNativeMenuCommands();
await useWorldStore().initWorld();
