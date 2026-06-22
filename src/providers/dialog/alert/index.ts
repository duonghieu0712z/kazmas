import type { AlertDialogPayload, AlertDialogResult } from './alert-dialog';

import { useDialogProvider } from '../useDialogProvider';
import AlertDialog from './AlertDialog.vue';

export { AlertDialogButtons, AlertDialogKind, AlertDialogResult } from './alert-dialog';
export type { AlertDialogPayload } from './alert-dialog';

export function openAlertDialog(payload: AlertDialogPayload) {
    const { openDialog } = useDialogProvider();

    return openDialog<typeof AlertDialog>({
        component: AlertDialog,
        type: 'alert',
        payload,
    }) as Promise<AlertDialogResult | null>;
}
