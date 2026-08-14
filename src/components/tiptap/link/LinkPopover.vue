<script setup lang="ts">
import type { LinkPopoverProps } from '.';

import { CornerDownLeftIcon, ExternalLinkIcon, Trash2Icon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

import { useLink } from './use-link';

const props = withDefaults(defineProps<LinkPopoverProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:set': [];
    'update:removed': [];
    'update:opened': [];
}>();

const open = ref(false);
const {
    url,
    canSet,
    isActive,
    isVisible,
    label,
    icon,
    handleSetLink,
    handleRemoveLink,
    handleOpenLink,
} = useLink({
    editor: props.editor,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onSetLink: () => emits('update:set'),
});

const delegatedProps = reactiveOmit(props, 'editor', 'hideWhenUnavailable', 'showTooltip');

watch(isActive, (active) => {
    if (active) {
        open.value = true;
    }
});

function handleSetLinkAndClose() {
    if (handleSetLink()) {
        open.value = false;
    }
}

function handleRemoveLinkAndEmit() {
    if (handleRemoveLink()) {
        emits('update:removed');
    }
}

async function handleOpenLinkAndEmit() {
    if (await handleOpenLink()) {
        emits('update:opened');
    }
}

function handleOpenAutoFocus(event: Event) {
    if (isActive.value) {
        event.preventDefault();
    }
}
</script>

<template>
    <Popover v-if="isVisible" v-model:open="open">
        <PopoverTrigger>
            <TooltipWrapper :show-tooltip="showTooltip">
                <Toggle
                    v-bind="delegatedProps"
                    :aria-label="label"
                    :disabled="!canSet"
                    :model-value="isActive || open"
                    size="icon"
                >
                    <slot>
                        <component :is="icon" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </PopoverTrigger>

        <PopoverContent class="flex w-auto gap-0.5 p-1" @open-auto-focus="handleOpenAutoFocus">
            <InputGroup class="w-64">
                <InputGroupInput
                    v-model="url"
                    autocapitalize="off"
                    autocomplete="off"
                    autocorrect="off"
                    placeholder="Paste a link"
                    type="url"
                    @keydown.enter.prevent="handleSetLinkAndClose"
                />
            </InputGroup>

            <ButtonGroup class="gap-0.5" spacing="spaced">
                <TooltipWrapper>
                    <Button
                        aria-label="Apply link"
                        :disabled="!url"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="handleSetLinkAndClose"
                    >
                        <CornerDownLeftIcon />
                    </Button>

                    <template #tooltip>Apply link</template>
                </TooltipWrapper>

                <ButtonGroupSeparator class="my-1" />

                <TooltipWrapper>
                    <Button
                        aria-label="Open link"
                        :disabled="!url"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="handleOpenLinkAndEmit"
                    >
                        <ExternalLinkIcon />
                    </Button>

                    <template #tooltip>Open link</template>
                </TooltipWrapper>

                <TooltipWrapper>
                    <Button
                        aria-label="Remove link"
                        :disabled="!isActive"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="handleRemoveLinkAndEmit"
                    >
                        <Trash2Icon />
                    </Button>

                    <template #tooltip>Remove link</template>
                </TooltipWrapper>
            </ButtonGroup>
        </PopoverContent>
    </Popover>
</template>
