import {
    AlertDialogButtons,
    AlertDialogKind,
    AlertDialogResult,
    openAlertDialog,
} from '@/providers/dialog';

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
