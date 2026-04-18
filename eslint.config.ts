import eslintConfigPrettier from '@vue/eslint-config-prettier';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import { globalIgnores } from 'eslint/config';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,tsx,vue}'],
    },

    globalIgnores(['**/node_modules', '**/dist', '**/src-tauri/target', 'src/bindings.ts']),

    pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommended,
    prettierRecommended,
    eslintConfigPrettier,

    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
            },
        },
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            curly: ['error'],

            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',

            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',

            'vue/attributes-order': ['error', { alphabetical: true }],
            'vue/multi-word-component-names': 'off',
            'vue/require-default-prop': 'off',
        },
    },
);
