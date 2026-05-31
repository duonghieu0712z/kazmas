<script setup lang="ts">
import { commands } from '@/generated/bindings';

const name = ref('');
const message = ref('');

async function greet() {
    message.value = await commands.greet(name.value);
}
</script>

<template>
    <div class="h-screen w-screen overflow-hidden bg-[#2f2f2f] text-base text-[#f6f6f6]">
        <div class="flex h-full flex-col items-center justify-center">
            <h1 class="my-5.5 text-3xl font-semibold">Welcome to Tauri + Vue</h1>

            <div class="flex justify-center">
                <a
                    class="text-[#646cff] hover:text-[#24c8db]"
                    href="https://vite.dev"
                    target="_blank"
                >
                    <img
                        alt="Vite logo"
                        class="box-content h-24 p-6 duration-750 will-change-[filter] hover:drop-shadow-[0_0_2rem_#747bff]"
                        src="@/assets/images/vite.svg"
                    />
                </a>
                <a
                    class="text-[#646cff] hover:text-[#24c8db]"
                    href="https://tauri.app"
                    target="_blank"
                >
                    <img
                        alt="Tauri logo"
                        class="box-content h-24 p-6 duration-750 will-change-[filter] hover:drop-shadow-[0_0_2rem_#24c8db]"
                        src="@/assets/images/tauri.svg"
                    />
                </a>
                <a
                    class="text-[#646cff] hover:text-[#24c8db]"
                    href="https://vuejs.org/"
                    target="_blank"
                >
                    <img
                        alt="Vue logo"
                        class="box-content h-24 p-6 duration-750 will-change-[filter] hover:drop-shadow-[0_0_2rem_#249b73]"
                        src="@/assets/images/vue.svg"
                    />
                </a>
            </div>
            <p class="my-4">Click on the Tauri, Vite, and Vue logos to learn more.</p>

            <form class="flex justify-center" @submit.prevent="greet">
                <input
                    id="greet-input"
                    v-model="name"
                    class="mr-1.25 rounded-lg border border-transparent bg-[#0f0f0f98] px-[1.2rem] py-[0.6rem] text-white shadow-[0_2px_2px_rgba(0,0,0,0.2)] transition-[border-color] duration-250 outline-none placeholder:text-[#a9a9a9]"
                    placeholder="Enter a name..."
                />
                <button
                    class="rounded-lg border border-transparent bg-[#0f0f0f98] px-[1.2rem] py-[0.6rem] text-white shadow-[0_2px_2px_rgba(0,0,0,0.2)] transition-[border-color] duration-250 outline-none hover:border-[#396cd8] active:border-[#396cd8] active:bg-[#0f0f0f69]"
                    type="submit"
                >
                    Greet
                </button>
            </form>
            <p class="my-4 h-6">{{ message }}</p>
        </div>
    </div>
</template>
