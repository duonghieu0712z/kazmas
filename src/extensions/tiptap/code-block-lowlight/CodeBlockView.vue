<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { cn } from '@/lib/utils';

import CopyButton from './CopyButton.vue';
import { getCodeBlockLanguageOptions } from './languages';
import LanguageSelect from './LanguageSelect.vue';

const props = defineProps(nodeViewProps);

const { isEditable } = useTiptapEditor();

const codeBlockAttributes = computed(() => ({
    ...props.extension.options.HTMLAttributes,
    ...props.HTMLAttributes,
    class: cn(
        props.extension.options.HTMLAttributes.class,
        props.HTMLAttributes.class,
        'my-0 px-2 pt-8 pb-2',
    ),
}));

const languages = computed(() => getCodeBlockLanguageOptions(props.extension.options.lowlight));
const currentLanguage = computed(() => {
    const language: unknown = props.node.attrs.language;
    if (typeof language === 'string' && language) {
        return language;
    }

    const defaultLanguage: unknown = props.extension.options.defaultLanguage;
    return typeof defaultLanguage === 'string' && defaultLanguage ? defaultLanguage : 'plaintext';
});

function selectLanguage(language: string) {
    props.updateAttributes({ language });
    props.editor.commands.focus();
}
</script>

<template>
    <NodeViewWrapper
        as="div"
        :class="[
            'group relative my-6',
            'before:absolute before:top-8.25 before:left-2.25 before:font-code before:text-sm before:leading-6',
        ]"
    >
        <div class="absolute top-1 right-2 z-10 flex items-center gap-1" contenteditable="false">
            <LanguageSelect
                :current-language="currentLanguage"
                :disabled="!isEditable"
                :languages="languages"
                @update:selected="selectLanguage"
            />
            <CopyButton :text="node.textContent" />
        </div>

        <pre
            v-bind="codeBlockAttributes"
            :data-language="currentLanguage"
        ><NodeViewContent as="code" class="block min-h-5" /></pre>
    </NodeViewWrapper>
</template>
