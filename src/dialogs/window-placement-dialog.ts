import {
    AlertDialogButtons,
    AlertDialogKind,
    AlertDialogResult,
    openAlertDialog,
} from '@/providers/dialog';

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
