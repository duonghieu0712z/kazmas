import { createPinia } from 'pinia';

import '@/styles/globals.css';

const uiTest = import.meta.env.MODE === 'test-ui' ? await import('../tests/ui/harness') : undefined;

if (import.meta.env.VITE_DESKTOP_TESTS === 'true') {
    await import('@wdio/tauri-plugin');
}

const [{ default: App }, { listenNativeMenuCommands }, { useWorldStore }] = await Promise.all([
    import('@/App.vue'),
    import('@/menus'),
    import('@/stores/world'),
]);

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

await listenNativeMenuCommands();
await useWorldStore().initWorld();

await uiTest?.initializeUiTest();

if (import.meta.env.VITE_DESKTOP_TESTS === 'true') {
    await import('@/testing/desktop');
}
