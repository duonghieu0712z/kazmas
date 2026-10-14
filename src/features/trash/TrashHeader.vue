<script setup lang="ts">
import { RotateCcwIcon, SearchIcon, Trash2Icon } from '@lucide/vue';

const props = defineProps<{ canModify: boolean }>();
const emits = defineEmits<{
    'restore:all': [];
    'empty:trash': [];
}>();
const query = defineModel<string>({ default: '' });

const actions = computed(() => [
    {
        label: 'Restore All',
        icon: RotateCcwIcon,
        disabled: !props.canModify,
        execute: () => emits('restore:all'),
    },
    {
        label: 'Empty Trash',
        icon: Trash2Icon,
        disabled: !props.canModify,
        execute: () => emits('empty:trash'),
    },
]);
</script>

<template>
    <SidebarHeader
        class="shrink-0 gap-0 border-b border-sidebar-border bg-tree-header-background p-0"
    >
        <div class="flex h-7 items-center justify-between gap-2 px-2">
            <span class="truncate text-xs font-medium text-tree-header-foreground">Trash</span>
            <ButtonGroup aria-label="Trash actions" class="shrink-0" spacing="spaced">
                <Tooltip v-for="action in actions" :key="action.label">
                    <TooltipTrigger>
                        <Button
                            :aria-label="action.label"
                            class="size-5 text-muted-foreground"
                            :disabled="action.disabled"
                            size="icon"
                            variant="ghost"
                            @click="action.execute"
                        >
                            <component :is="action.icon" class="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{{ action.label }}</TooltipContent>
                </Tooltip>
            </ButtonGroup>
        </div>

        <div class="px-2 pb-1">
            <InputGroup class="h-6 bg-muted/50 shadow-none">
                <InputGroupAddon><SearchIcon class="size-3" /></InputGroupAddon>
                <InputGroupInput
                    v-model="query"
                    aria-label="Filter trash"
                    class="h-6 text-xs md:text-xs"
                    placeholder="Filter..."
                    @keydown.esc.stop="query = ''"
                />
            </InputGroup>
        </div>
    </SidebarHeader>
</template>
