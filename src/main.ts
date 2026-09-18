import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia' // Importa createPinia

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/AuthStore'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css' // Importa los íconos de Material Design

// Ya no es necesario importar 'aliases' y 'mdi' directamente de 'vuetify/iconsets/mdi'
// si ya estás importando '@mdi/font/css/materialdesignicons.css' y usando 'defaultSet: 'mdi''.
// Vuetify 3 maneja esto de forma más integrada.
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi', // Configura el set de íconos por defecto a Material Design Icons
    // No es necesario 'aliases' ni 'sets' aquí si ya importaste el CSS de MDI
    // y solo usas el set por defecto.
  },
})

const app = createApp(App)

app.use(createPinia()) // Usa Pinia en tu aplicación
app.use(router)
app.use(vuetify) // Usa Vuetify

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login')
    return
  }

  // El rol TURNERO queda encerrado en /turnero: sin sidebar, sin acceso a
  // ninguna otra vista aunque la escriba directo en la URL (la mayoría de
  // rutas no declara `roles`, así que el chequeo genérico de abajo no
  // alcanza para bloquearlo).
  if (auth.isAuthenticated && auth.userRole === 'TURNERO' && to.name !== 'Turnero') {
    next({ name: 'Turnero' })
    return
  }

  const roles = to.meta.roles
  if (roles?.length && !auth.hasAnyRole(roles)) {
    next('/dashboard')
    return
  }
  next()
})

app.mount('#app')
