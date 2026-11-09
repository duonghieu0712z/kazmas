export function getColorHex(color: string, element: HTMLElement): string {
    const styles = getComputedStyle(element);
    const variable = /^var\((--[\w-]+)\)$/.exec(color);
    let resolvedColor = color;

    if (variable?.[1]) {
        resolvedColor = styles.getPropertyValue(variable[1]).trim();
    } else if (color === 'currentColor' || color === 'inherit') {
        resolvedColor = styles.color;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const context = canvas.getContext('2d');

    if (!context) {
        return '#000000';
    }

    context.fillStyle = resolvedColor;
    context.fillRect(0, 0, 1, 1);

    const channels = context.getImageData(0, 0, 1, 1).data;

    return `#${[channels[0], channels[1], channels[2]]
        .map((channel) => channel!.toString(16).padStart(2, '0'))
        .join('')}`;
}
