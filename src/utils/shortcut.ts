import { isMac } from '@/utils/platform';

const MAC_SYMBOLS: Record<string, string> = {
    mod: '⌘',
    command: '⌘',
    meta: '⌘',
    ctrl: '⌃',
    control: '⌃',
    alt: '⌥',
    option: '⌥',
    shift: '⇧',
    backspace: '⌫',
    delete: '⌦',
    enter: '⏎',
    escape: '⎋',
    capslock: '⇪',
} as const;

export function formatShortcutKey(key: string, isMac: boolean, capitalize = true) {
    if (isMac) {
        const lowerKey = key.toLowerCase();
        return MAC_SYMBOLS[lowerKey] || (capitalize ? key.toUpperCase() : key);
    }

    switch (key) {
        case 'mod':
        case 'meta':
        case 'command':
            key = 'ctrl';
            break;
        case 'option':
            key = 'alt';
            break;
    }
    return capitalize ? key.replace(/^./, (c) => c.toUpperCase()) : key;
}

export function parseShortcutKeys(shortcutKeys: string, delimiter = '+', capitalize = true) {
    const mac = isMac();
    return shortcutKeys
        .split(delimiter)
        .map((key) => formatShortcutKey(key.trim(), mac, capitalize));
}
