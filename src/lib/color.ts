import type { Rgb } from 'culori';

import { converter } from 'culori';

export const toRgb = converter('rgb');

function toByte(channel: number) {
    return Math.round(Math.min(1, Math.max(0, channel)) * 255);
}

export function matchesRgb(color: Rgb, other: Rgb) {
    return (
        toByte(color.r) === toByte(other.r) &&
        toByte(color.g) === toByte(other.g) &&
        toByte(color.b) === toByte(other.b) &&
        toByte(color.alpha ?? 1) === toByte(other.alpha ?? 1)
    );
}
