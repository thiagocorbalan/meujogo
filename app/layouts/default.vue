<template>
  <div class="flex min-h-screen">
    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <main class="flex-1 ml-60 bg-muted/40 min-h-screen max-md:ml-0 max-md:pt-14">
      <slot />
    </main>
  </div>
</template>

<script setup>
const sidebarOpen = ref(false)
</script>
