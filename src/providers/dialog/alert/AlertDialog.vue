<script setup lang="ts">
import type { AlertDialogPayload } from './alert-dialog';

import { Button } from '@/components/ui/button';

import { ALERT_DIALOG_DEFAULT_LABELS, AlertDialogButtons, AlertDialogResult } from './alert-dialog';

const props = withDefaults(
    defineProps<{
        payload: AlertDialogPayload;
    }>(),
    {},
);

const emit = defineEmits<{
    'resolve:dialog': [result: AlertDialogResult];
}>();

const buttons = computed(() => props.payload.buttons ?? AlertDialogButtons.Ok);

function buttonLabel(result: AlertDialogResult) {
    return props.payload.buttonLabels?.[result] ?? ALERT_DIALOG_DEFAULT_LABELS[result];
}

const actions = computed(() => {
    switch (buttons.value) {
        case AlertDialogButtons.OkCancel:
            return [
                {
                    label: buttonLabel(AlertDialogResult.Cancel),
                    result: AlertDialogResult.Cancel,
                    variant: 'outline',
                },
                {
                    label: buttonLabel(AlertDialogResult.Ok),
                    result: AlertDialogResult.Ok,
                    variant: 'default',
                },
            ] as const;
        case AlertDialogButtons.YesNo:
            return [
                {
                    label: buttonLabel(AlertDialogResult.No),
                    result: AlertDialogResult.No,
                    variant: 'secondary',
                },
                {
                    label: buttonLabel(AlertDialogResult.Yes),
                    result: AlertDialogResult.Yes,
                    variant: 'default',
                },
            ] as const;
        case AlertDialogButtons.YesNoCancel:
            return [
                {
                    label: buttonLabel(AlertDialogResult.Cancel),
                    result: AlertDialogResult.Cancel,
                    variant: 'outline',
                },
                {
                    label: buttonLabel(AlertDialogResult.No),
                    result: AlertDialogResult.No,
                    variant: 'secondary',
                },
                {
                    label: buttonLabel(AlertDialogResult.Yes),
                    result: AlertDialogResult.Yes,
                    variant: 'default',
                },
            ] as const;
        default:
            return [
                {
                    label: buttonLabel(AlertDialogResult.Ok),
                    result: AlertDialogResult.Ok,
                    variant: 'default',
                },
            ] as const;
    }
});
</script>

<template>
    <AlertDialogContent class="sm:max-w-md">
        <AlertDialogHeader>
            <AlertDialogTitle>{{ payload.title }}</AlertDialogTitle>
            <AlertDialogDescription class="text-sm leading-6 whitespace-pre-line">
                {{ payload.content }}
            </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
            <Button
                v-for="action in actions"
                :key="action.result"
                :variant="action.variant"
                @click="emit('resolve:dialog', action.result)"
            >
                {{ action.label }}
            </Button>
        </AlertDialogFooter>
    </AlertDialogContent>
</template>
