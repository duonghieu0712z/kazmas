import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginOxlint from 'eslint-plugin-oxlint';
import pluginVue from 'eslint-plugin-vue';
import { globalIgnores } from 'eslint/config';

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
    },

    globalIgnores(['dist/**', 'src/generated/**', 'src-tauri/target/**']),

    ...pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,

    ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

    skipFormatting,

    {
        rules: {
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',

            'vue/attributes-order': ['error', { alphabetical: true }],
            'vue/multi-word-component-names': 'off',
            'vue/require-default-prop': 'off',
        },
    },
);
