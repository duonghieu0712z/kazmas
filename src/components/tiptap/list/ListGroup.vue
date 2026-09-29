<script setup lang="ts">
import type { ListGroupProps, ListType } from '.';

import { reactiveOmit } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';

import ListButton from './ListButton.vue';

const props = withDefaults(defineProps<ListGroupProps>(), {
    types: () => ['bulletList', 'orderedList', 'taskList'],
    orientation: 'horizontal',
    spacing: 'spaced',
});

const emits = defineEmits<{
    'update:toggled': [type: ListType];
}>();

const delegatedProps = reactiveOmit(props, 'editor', 'types');

function handleToggled(type: ListType) {
    emits('update:toggled', type);
}
</script>

<template>
    <ButtonGroup v-bind="delegatedProps">
        <ListButton
            v-for="type in types"
            :key="type"
            :editor="editor"
            :type="type"
            @update:toggled="handleToggled(type)"
        />
    </ButtonGroup>
</template>
