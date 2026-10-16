export interface LineHeightPresetValue {
    label: string;
    value: number;
}

export const DEFAULT_LINE_HEIGHT = 1.15;

export const LINE_HEIGHT_PRESETS: LineHeightPresetValue[] = [
    { label: '1.0', value: 1 },
    { label: '1.15', value: DEFAULT_LINE_HEIGHT },
    { label: '1.5', value: 1.5 },
    { label: '2.0', value: 2 },
];
