<template>
  <header class="hidden max-md:flex fixed top-0 left-0 right-0 z-[60] items-center gap-3 px-4 h-14 bg-slate-800 text-white">
    <button class="bg-transparent border-none text-white text-[22px] cursor-pointer p-1 px-2 rounded hover:bg-white/10 leading-none" @click="emit('toggle-sidebar')" aria-label="Toggle sidebar">
      &#9776;
    </button>
    <span class="text-lg font-bold tracking-wide">MatchSoccer</span>
  </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{ 'toggle-sidebar': [] }>()
</script>
