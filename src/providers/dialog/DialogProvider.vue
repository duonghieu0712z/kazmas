<script setup lang="ts">
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Dialog } from '@/components/ui/dialog';

import { useDialogProvider } from './useDialogProvider';

const { activeDialog, closeDialog, resolveDialog } = useDialogProvider();

const rootComponent = computed(() => (activeDialog.value?.type === 'alert' ? AlertDialog : Dialog));

const isOpen = computed(() => activeDialog.value !== null);

function updateOpen(open: boolean) {
    if (!open) {
        closeDialog();
    }
}
</script>

<template>
    <component :is="rootComponent" :open="isOpen" @update:open="updateOpen">
        <component
            :is="activeDialog.component"
            v-if="activeDialog"
            :key="activeDialog.key"
            :payload="activeDialog.payload"
            @close:dialog="closeDialog"
            @resolve:dialog="resolveDialog"
        />
    </component>
</template>
