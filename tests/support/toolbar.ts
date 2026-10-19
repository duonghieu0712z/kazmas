export function getToolbarNavigationState(name: string) {
    const toolbar = document.querySelector('[data-slot="toolbar"]');
    const viewport = toolbar?.querySelector<HTMLElement>(':scope > div');
    const control = Array.from(toolbar?.querySelectorAll('button') ?? []).find(
        (button) => button.getAttribute('aria-label') === name,
    );

    if (!viewport || !control) {
        throw new Error(`Toolbar control ${name} is unavailable.`);
    }

    const groups = Array.from(
        viewport.querySelectorAll<HTMLElement>(
            ':scope > div > [data-slot="button-group"] > [data-slot="button-group"]',
        ),
    );
    const group = groups.find((element) => element.contains(control));

    if (!group) {
        throw new Error(`Toolbar group for ${name} is unavailable.`);
    }

    const viewportRect = viewport.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    const targetRect =
        groupRect.width > viewportRect.width + 1 ? control.getBoundingClientRect() : groupRect;
    let direction: 'Previous' | 'Next' | null = null;

    if (targetRect.left < viewportRect.left - 1) {
        direction = 'Previous';
    } else if (targetRect.right > viewportRect.right + 1) {
        direction = 'Next';
    }

    return {
        direction,
        scrollLeft: viewport.scrollLeft,
        controlCount: viewport.querySelectorAll('button').length,
    };
}
