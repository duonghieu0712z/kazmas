<template>
    <Sidebar
        class="bg-background text-foreground w-[calc(var(--sidebar-width-icon)+1px)] items-center border-r"
        collapsible="none"
    >
        <SidebarHeader>
            <SidebarTrigger />
        </SidebarHeader>
        <div class="[writing-mode:vertical-rl]">Activity Bar</div>
    </Sidebar>
</template>
