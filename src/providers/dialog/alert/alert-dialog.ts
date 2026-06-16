export enum AlertDialogKind {
    Default = 'default',
    Info = 'info',
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

export enum AlertDialogButtons {
    Ok = 'ok',
    OkCancel = 'ok-cancel',
    YesNo = 'yes-no',
    YesNoCancel = 'yes-no-cancel',
}

export enum AlertDialogResult {
    Ok = 'ok',
    Cancel = 'cancel',
    Yes = 'yes',
    No = 'no',
}

export const ALERT_DIALOG_DEFAULT_LABELS: Record<AlertDialogResult, string> = {
    [AlertDialogResult.Ok]: 'OK',
    [AlertDialogResult.Cancel]: 'Cancel',
    [AlertDialogResult.Yes]: 'Yes',
    [AlertDialogResult.No]: 'No',
};

export type AlertDialogButtonLabels = Partial<Record<AlertDialogResult, string>>;

export type AlertDialogPayload = {
    title: string;
    content: string;
    kind?: AlertDialogKind;
    buttons?: AlertDialogButtons;
    buttonLabels?: AlertDialogButtonLabels;
};
