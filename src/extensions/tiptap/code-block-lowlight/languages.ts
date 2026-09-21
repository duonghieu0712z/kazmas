import type { LanguageFn } from 'highlight.js';

import HighlightJs from 'highlight.js/lib/core';
import { all } from 'lowlight';

export interface CodeBlockLanguageOption {
    value: string;
    label: string;
}

interface LowlightLike {
    listLanguages: () => string[];
}

const LANGUAGE_LABEL_OVERRIDES: Record<string, string> = {
    awk: 'AWK',
    cplusplus: 'C++',
    ini: 'INI/TOML',
    matlab: 'MATLAB',
    php: 'PHP',
    'python-repl': 'Python REPL',
    q: 'q',
    xml: 'HTML/XML',
};
const languageLabels = new Map<string, string>();
const grammars = all as Readonly<Record<string, LanguageFn>>;

export function isLowlightLike(value: unknown): value is LowlightLike {
    return Boolean(
        value &&
        typeof value === 'object' &&
        'listLanguages' in value &&
        typeof value.listLanguages === 'function',
    );
}

export function formatCodeBlockLanguage(language: string) {
    const override = LANGUAGE_LABEL_OVERRIDES[language];
    if (override) {
        return override;
    }

    const cachedLabel = languageLabels.get(language);
    if (cachedLabel) {
        return cachedLabel;
    }

    const label = grammars[language]?.(HighlightJs).name ?? language;
    languageLabels.set(language, label);

    return label;
}

export function getCodeBlockLanguageOptions(lowlight: unknown) {
    const languages = isLowlightLike(lowlight) ? lowlight.listLanguages() : [];

    return [...new Set(languages)]
        .map((language) => ({
            value: language,
            label: formatCodeBlockLanguage(language),
        }))
        .sort((left, right) => {
            if (left.value === 'plaintext') {
                return -1;
            }
            if (right.value === 'plaintext') {
                return 1;
            }
            return left.label.localeCompare(right.label);
        });
}
