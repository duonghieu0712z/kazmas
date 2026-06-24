import {
    AlertDialogButtons,
    AlertDialogKind,
    AlertDialogResult,
    openAlertDialog,
    useDialogProvider,
} from '@/providers/dialog';

import AboutDialog from './AboutDialog.vue';
import NewWorldDialog from './NewWorldDialog.vue';

export async function openAboutDialog() {
    const { openDialog } = useDialogProvider();

    await openDialog({
        component: AboutDialog,
    });
}

export function openNewWorldDialog() {
    const { openDialog } = useDialogProvider();

    return openDialog({
        component: NewWorldDialog,
    });
}

export function openSaveWorldDialog(worldName?: string) {
    return openAlertDialog({
        title: 'Unsaved Changes',
        content: worldName
            ? `Save changes to ${worldName} before continuing?`
            : 'Save changes before continuing?',
        kind: AlertDialogKind.Warning,
        buttons: AlertDialogButtons.YesNoCancel,
        buttonLabels: {
            [AlertDialogResult.Yes]: 'Save',
            [AlertDialogResult.No]: "Don't Save",
            [AlertDialogResult.Cancel]: 'Cancel',
        },
    });
}

export function openWindowPlacementDialog() {
    return openAlertDialog({
        title: 'Window Placement',
        content: 'Use a new window for this world?',
        kind: AlertDialogKind.Info,
        buttons: AlertDialogButtons.YesNoCancel,
        buttonLabels: {
            [AlertDialogResult.Yes]: 'New Window',
            [AlertDialogResult.No]: 'Current Window',
            [AlertDialogResult.Cancel]: 'Cancel',
        },
    });
}
