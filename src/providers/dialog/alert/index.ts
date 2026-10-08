import type { AlertDialogPayload, AlertDialogResult } from './alert-dialog';

import { useDialogProvider } from '../use-dialog-provider';
import AlertDialog from './AlertDialog.vue';

type AlertDialogComponent = new () => {
    $props: {
        payload: AlertDialogPayload;
        'onResolve:dialog'?: (result: AlertDialogResult) => void;
    };
};

export { AlertDialogButtons, AlertDialogKind, AlertDialogResult } from './alert-dialog';
export type { AlertDialogPayload } from './alert-dialog';

export function openAlertDialog(payload: AlertDialogPayload) {
    const { openDialog } = useDialogProvider();

    return openDialog<AlertDialogComponent>({
        component: AlertDialog as unknown as AlertDialogComponent,
        type: 'alert',
        payload,
    });
}
