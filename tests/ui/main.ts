import { initializeUiTest } from './harness';

if (new URLSearchParams(location.search).get('scenario') === 'typography-controls') {
    const { createApp } = await import('vue');
    const { default: TypographyControls } = await import('./TypographyControls.vue');
    createApp(TypographyControls).mount('#app');
} else {
    await import('@/main');
    await initializeUiTest();
}
