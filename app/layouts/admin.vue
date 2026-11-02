<script setup>
const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Skip to main content -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
    >
      Ir para o conteúdo principal
    </a>

    <AdminHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <main
      id="main-content"
      class="flex-1 ml-60 bg-muted/40 min-h-screen max-md:ml-0 max-md:pt-14"
    >
      <div class="max-w-7xl mx-auto p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
