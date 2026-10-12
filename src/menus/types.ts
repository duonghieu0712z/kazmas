import type { MenuCommand as RustMenuCommand } from '@/generated/bindings';
import type { Component } from 'vue';

export type FrontendMenuCommand = {
    type: 'frontend';
    id: string;
    execute: () => void | Promise<void>;
};

export type MenuCommand = RustMenuCommand | FrontendMenuCommand;

type MenuItemContent = {
    id: string;
    text: string;
    enabled?: boolean;
    icon?: Component;
    inset?: boolean;
    shortcut?: string | null;
};

export type MenuActionItem = MenuItemContent & {
    type: 'item';
    command: MenuCommand;
    variant?: 'default' | 'destructive';
};

export type MenuCheckItem = MenuItemContent & {
    type: 'check';
    command: MenuCommand;
    checked: boolean | 'indeterminate';
};

export type MenuRadioItem = MenuItemContent & {
    type: 'radio';
    command: MenuCommand;
    value: string;
};

export type MenuItem =
    | MenuActionItem
    | MenuCheckItem
    | (MenuItemContent & { type: 'submenu'; items: readonly MenuItem[] })
    | { type: 'radio-group'; id: string; value: string; items: readonly MenuRadioItem[] }
    | { type: 'label'; id: string; text: string; inset?: boolean }
    | { type: 'separator'; id: string };

export type MenuSection = {
    id: string;
    text: string;
    items: MenuItem[];
};

export type MenuItemIndex = Map<
    string,
    MenuActionItem | MenuCheckItem | MenuRadioItem | Extract<MenuItem, { type: 'submenu' }>
>;
