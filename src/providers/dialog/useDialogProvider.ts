type DialogComponent = new (...args: any[]) => { $props: any };

type DialogProps<TComponent> = TComponent extends new (...args: any[]) => { $props: infer TProps }
    ? TProps
    : never;

type DialogPayload<TComponent> =
    DialogProps<TComponent> extends { payload: infer TPayload }
        ? { payload: TPayload }
        : DialogProps<TComponent> extends { payload?: infer TPayload }
          ? { payload?: TPayload }
          : { payload?: never };

type DialogResult<TComponent> =
    DialogProps<TComponent> extends { onResolveDialog?: (result: infer TResult) => void }
        ? TResult
        : never;

type DialogProviderBase<TComponent extends DialogComponent> = {
    component: TComponent;
    type?: 'dialog' | 'alert';
    key?: string;
    resolve?: (result?: DialogResult<TComponent>) => void;
};

export type DialogProviderEntry<TComponent extends DialogComponent = DialogComponent> =
    DialogProviderBase<TComponent> & DialogPayload<TComponent>;

type DialogProviderOpenEntry<TComponent extends DialogComponent> = Omit<
    DialogProviderBase<TComponent>,
    'resolve'
> &
    DialogPayload<TComponent>;

type ActiveDialogEntry = DialogProviderEntry;

const activeDialog = shallowRef<ActiveDialogEntry | null>(null);

function dismissActiveDialog() {
    const currentDialog = activeDialog.value;

    if (!currentDialog) {
        return;
    }

    activeDialog.value = null;
    currentDialog.resolve?.(undefined);
}

export function useDialogProvider() {
    function openDialog<TComponent extends DialogComponent>(
        entry: DialogProviderOpenEntry<TComponent>,
    ) {
        dismissActiveDialog();

        return new Promise<DialogResult<TComponent> | undefined>((resolve) => {
            const nextEntry: DialogProviderEntry<TComponent> = {
                ...entry,
                component: markRaw(entry.component),
                resolve,
            };

            activeDialog.value = nextEntry as ActiveDialogEntry;
        });
    }

    function closeDialog() {
        dismissActiveDialog();
    }

    function resolveDialog<TResult = never>(result: TResult) {
        const currentDialog = activeDialog.value;

        if (!currentDialog) {
            return;
        }

        activeDialog.value = null;
        currentDialog.resolve?.(result);
    }

    return {
        activeDialog: readonly(activeDialog),
        openDialog,
        closeDialog,
        resolveDialog,
    };
}
