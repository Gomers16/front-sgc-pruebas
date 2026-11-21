<!-- src/components/layout/AppNavbar.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authSetStore } from '@/stores/AuthStore'
import { useRouter } from 'vue-router'
import { useDrawer } from '@/composables/useDrawer'
import { useDisplay } from 'vuetify'
import SelectorSede from '@/components/layout/SelectorSede.vue'

const authStore = authSetStore()
const router = useRouter()
const { toggleDrawer } = useDrawer()
const { smAndDown, xs } = useDisplay()

const showLogoutConfirm = ref(false)
const logoutLoading = ref(false)

onMounted(async () => {
  await authStore.checkAuth()
})

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  } finally {
    logoutLoading.value = false
    showLogoutConfirm.value = false
  }
}
</script>

<template>
  <v-toolbar class="app-navbar" flat>
    <!-- Botón hamburguesa solo en móvil -->
    <v-btn
      v-if="smAndDown"
      icon="mdi-menu"
      class="menu-btn"
      variant="text"
      size="small"
      @click="toggleDrawer"
    />

    <!-- Logo de texto (oculto en móvil) -->
    <div v-if="!smAndDown" class="logo-texto-contenedor">
      <span class="logo-texto">ACTIVA MARKETING</span>
    </div>

    <!-- Título - Ajustado para móvil -->
    <div class="titulo-contenedor" :class="{ 'titulo-movil': xs }">
      <span class="titulo-saludo">PANEL DE OPERACIÓN DIARIA</span>
      <span class="titulo-usuario">
        Bienvenido, <strong>{{ authStore.user?.nombres || 'Usuario' }}</strong>
      </span>
    </div>

    <v-spacer />

    <!-- Multi-sede: sede activa (solo SUPER_ADMIN y GERENCIA la ven y cambian) -->
    <SelectorSede :compacto="xs" />

    <!-- Botón logout -->
    <v-btn
      icon="mdi-export"
      class="logout-btn"
      variant="text"
      :size="xs ? 'small' : 'default'"
      @click="handleLogout"
    />

    <!-- Diálogo logout -->
    <v-dialog v-model="showLogoutConfirm" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6 font-weight-bold text-primary">
          Confirmar Cierre de Sesión
        </v-card-title>
        <v-card-text>
          ¿Estás seguro de que quieres cerrar tu sesión?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showLogoutConfirm = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="logoutLoading"
            @click="confirmLogout"
          >
            Sí, cerrar sesión
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-toolbar>
</template>

<style scoped>
.app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  background-color: #0052cc;
  color: #ffffff;

  min-height: 56px;
  height: 56px;

  border-bottom: 4px solid #ffca28;

  padding-inline: 8px;
  z-index: 1001;
}

@media (min-width: 600px) {
  .app-navbar {
    min-height: 64px;
    height: 64px;
    padding-inline: 20px;
  }
}

/* Botón menú hamburguesa */
.menu-btn {
  color: #ffffff !important;
  margin-right: 8px;
}
.menu-btn:hover {
  background-color: rgba(255, 255, 255, 0.16);
}

/* Logo de texto */
.logo-texto-contenedor {
  display: flex;
  align-items: center;
  margin-left: 32px;
  margin-right: 24px;
}

.logo-texto {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@media (min-width: 960px) {
  .logo-texto {
    font-size: 1.5rem;
  }

  .logo-texto-contenedor {
    margin-left: 48px;
  }
}

/* Título - Versión móvil y desktop */
.titulo-contenedor {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
  flex: 1;
  min-width: 0; /* Importante para evitar overflow */
}

/* Móvil: título a la izquierda después del botón hamburguesa */
.titulo-movil {
  align-items: flex-start;
  text-align: left;
  margin-left: 8px;
}

.titulo-saludo {
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.titulo-usuario {
  font-size: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (min-width: 600px) {
  .titulo-contenedor {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .titulo-saludo {
    font-size: 0.8rem;
    letter-spacing: 0.16em;
  }

  .titulo-usuario {
    font-size: 0.9rem;
  }
}

/* Botón de logout */
.logout-btn {
  color: #ffffff !important;
  flex-shrink: 0;
}
.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.16);
}
</style>
