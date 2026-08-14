<script setup lang="ts">
import type { RubyTextPopoverProps } from '.';

import { CornerDownLeftIcon, Trash2Icon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

import { useRubyText } from './use-ruby-text';

const props = withDefaults(defineProps<RubyTextPopoverProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:set': [];
    'update:removed': [];
}>();

const open = ref(false);
const {
    annotation,
    canSet,
    isActive,
    isVisible,
    label,
    icon,
    handleSetRubyText,
    handleRemoveRubyText,
} = useRubyText({
    editor: props.editor,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onSetRubyText: () => emits('update:set'),
});

const delegatedProps = reactiveOmit(props, 'editor', 'hideWhenUnavailable', 'showTooltip');

watch(isActive, (active) => {
    if (active) {
        open.value = true;
    }
});

function handleSetRubyTextAndClose() {
    if (handleSetRubyText()) {
        open.value = false;
    }
}

function handleRemoveRubyTextAndEmit() {
    if (handleRemoveRubyText()) {
        emits('update:removed');
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
                    v-model="annotation"
                    autocapitalize="off"
                    autocomplete="off"
                    autocorrect="off"
                    placeholder="Enter ruby text"
                    @keydown.enter.prevent="handleSetRubyTextAndClose"
                />
            </InputGroup>

            <ButtonGroup class="gap-0.5" spacing="spaced">
                <TooltipWrapper>
                    <Button
                        aria-label="Apply ruby text"
                        :disabled="!annotation"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="handleSetRubyTextAndClose"
                    >
                        <CornerDownLeftIcon />
                    </Button>

                    <template #tooltip>Apply ruby text</template>
                </TooltipWrapper>

                <ButtonGroupSeparator class="my-1" />

                <TooltipWrapper>
                    <Button
                        aria-label="Remove ruby text"
                        :disabled="!isActive"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="handleRemoveRubyTextAndEmit"
                    >
                        <Trash2Icon />
                    </Button>

                    <template #tooltip>Remove ruby text</template>
                </TooltipWrapper>
            </ButtonGroup>
        </PopoverContent>
    </Popover>
</template>
