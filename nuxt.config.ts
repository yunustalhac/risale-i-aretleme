// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss']     ,
  devServer: {
    host: '0.0.0.0', // Tüm ağlardan erişime izin ver
  },
})