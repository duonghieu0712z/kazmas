import { createGlobalState } from '@vueuse/core';

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
    DialogProps<TComponent> extends { 'onResolve:dialog'?: (result: infer TResult) => void }
        ? TResult
        : DialogProps<TComponent> extends { onResolveDialog?: (result: infer TResult) => void }
          ? TResult
          : never;

type DialogPromise<TComponent> = [DialogResult<TComponent>] extends [never]
    ? Promise<void>
    : Promise<DialogResult<TComponent> | null>;

type DialogProviderBase<TComponent extends DialogComponent> = {
    component: TComponent;
    type?: 'dialog' | 'alert';
    key?: string;
    resolve?: (result: DialogResult<TComponent> | null) => void;
};

export type DialogProviderEntry<TComponent extends DialogComponent = DialogComponent> =
    DialogProviderBase<TComponent> & DialogPayload<TComponent>;

type DialogProviderOpenEntry<TComponent extends DialogComponent> = Omit<
    DialogProviderBase<TComponent>,
    'resolve'
> &
    DialogPayload<TComponent>;

type ActiveDialogEntry = DialogProviderEntry;

function createDialogProvider() {
    const activeDialog = shallowRef<ActiveDialogEntry | null>(null);

    function dismissActiveDialog() {
        const currentDialog = activeDialog.value;

        if (!currentDialog) {
            return;
        }

        activeDialog.value = null;
        currentDialog.resolve?.(null);
    }

    function openDialog<TComponent extends DialogComponent>(
        entry: DialogProviderOpenEntry<TComponent>,
    ) {
        dismissActiveDialog();

        return new Promise<DialogResult<TComponent> | null>((resolve) => {
            const nextEntry: DialogProviderEntry<TComponent> = {
                ...entry,
                component: markRaw(entry.component),
                resolve,
            };

            activeDialog.value = nextEntry as ActiveDialogEntry;
        }) as DialogPromise<TComponent>;
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

export const useDialogProvider = createGlobalState(createDialogProvider);
