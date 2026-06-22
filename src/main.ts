import App from '@/App.vue';
import { useMenu } from '@/composables/useMenu';

import '@/styles/globals.css';

const app = createApp(App);

app.mount('#app');

await useMenu().initMenu();
