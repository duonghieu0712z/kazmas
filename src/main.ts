import App from '@/App.vue';
import { events } from '@/generated/bindings';

import '@/styles/globals.css';

events.menuEvents.listen((event) => {
    console.log('event ne:', event);
});

const app = createApp(App);

app.mount('#app');
