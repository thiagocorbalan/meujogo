export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', 'shadcn-nuxt', '@sentry/nuxt/module'],

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },

  runtimeConfig: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    public: {
      apiBaseUrl: process.env.PUBLIC_API_BASE_URL || 'http://localhost:3000',
    },
  },

  devServer: {
    port: 4000,
  },
});
