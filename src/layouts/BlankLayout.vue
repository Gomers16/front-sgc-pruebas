<!--
📌 BlankLayout.vue
Layout de pantalla completa sin sidebar ni navbar, para pantallas de
exhibición/kiosco (ej. /turnero). Sin header, sin footer, sin restricción de
ancho: el contenido controla el 100% del viewport.

💡 Ubicación: src/layouts/BlankLayout.vue
-->

<template>
  <v-app>
    <v-main class="pa-0">
      <router-view />
    </v-main>
  </v-app>
</template>
