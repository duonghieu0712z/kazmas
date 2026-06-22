import { useDialogProvider } from '@/providers/dialog';

import AboutDialog from './AboutDialog.vue';

export async function openAboutDialog() {
    const { openDialog } = useDialogProvider();

    await openDialog({
        component: AboutDialog,
    });
}
