export function useWorkspaceTabs<T extends { id: string }>(initialTabs: T[] = []) {
    const tabs = shallowRef<T[]>([...initialTabs]);
    const activeTab = ref(initialTabs[0]?.id ?? '');
    let recentTabIds: string[] = [];

    watch(
        activeTab,
        (id) => {
            if (tabs.value.some((tab) => tab.id === id)) {
                recentTabIds = [...recentTabIds.filter((tabId) => tabId !== id), id];
            }
        },
        { immediate: true, flush: 'sync' },
    );

    const openTab = (tab: T) => {
        const index = tabs.value.findIndex((item) => item.id === tab.id);
        tabs.value =
            index < 0
                ? [...tabs.value, tab]
                : tabs.value.map((item) => (item.id === tab.id ? tab : item));
        activeTab.value = tab.id;
    };

    const closeTab = (id: string) => {
        const index = tabs.value.findIndex((tab) => tab.id === id);
        tabs.value = tabs.value.filter((tab) => tab.id !== id);
        recentTabIds = recentTabIds.filter((tabId) => tabId !== id);
        if (activeTab.value === id) {
            activeTab.value =
                recentTabIds.at(-1) ?? tabs.value[index]?.id ?? tabs.value[index - 1]?.id ?? '';
        }
    };

    const clearTabs = () => {
        tabs.value = [];
        recentTabIds = [];
        activeTab.value = '';
    };

    return { tabs, activeTab, openTab, closeTab, clearTabs };
}
