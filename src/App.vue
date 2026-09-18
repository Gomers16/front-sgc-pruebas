<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'

import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

type LayoutKey = 'AuthLayout' | 'MainLayout' | 'BlankLayout'
const layouts: Record<LayoutKey, Component> = {
  AuthLayout,
  MainLayout,
  BlankLayout,
}

const layout = computed(() => {
  const layoutKey = route.meta.layout as LayoutKey | undefined
  return layoutKey && layoutKey in layouts ? layouts[layoutKey] : MainLayout
})
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>

<style>
/* Estilos globales (sin scoped) para controlar el ancho de las vistas */

/* Por defecto, limita los containers (excepto fluid) a un ancho más delgado */
.v-application .v-main .v-container:not(.fluid) {
  max-width: 1250px;  /* puedes jugar con 900 / 960 / 1000 / 1100 según tu gusto */
  margin-left: auto;
  margin-right: auto;
}

/* Reseteo básico */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
