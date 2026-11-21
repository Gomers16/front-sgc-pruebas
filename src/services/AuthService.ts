// src/services/AuthService.ts

import { get, post } from './http'

export interface LoginResponse {
  type: string           // 'bearer'
  token: string          // Token directo
  user: {
    id: number
    agenteId?: number | null
    nombres: string
    apellidos: string
    correo: string
    rol: {
      id: number
      nombre: string
    }
    profilePictureUrl?: string
  }
}

export interface MeResponse {
  // Multi-sede (Fase 6): sede propia, sedes elegibles y si puede cambiar.
  sede?: { id: number; nombre: string } | null
  sedesPermitidas?: { id: number; nombre: string }[]
  puedeCambiarSede?: boolean
  user: {
    id: number
    agenteId?: number | null
    nombres: string
    apellidos: string
    correo: string
    rol: {
      id: number
      nombre: string
    }
  }
}

export default class AuthService {
  /**
   * Iniciar sesión de un usuario.
   * POST /api/login
   */
  async login(correo: string, password: string): Promise<LoginResponse> {
    try {
      return await post<LoginResponse, { correo: string; password: string }>(
        '/api/login',  // ✅ CAMBIADO: ahora incluye /api
        { correo, password },
        { credentials: 'omit' }
      )
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error en AuthService.login:', error.message)
      }
      throw error
    }
  }

  /**
   * Obtener la sesión del usuario autenticado.
   * GET /api/auth/me
   */
  async me(): Promise<MeResponse> {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('No hay token de autenticación disponible')
    }

    try {
      // ⚠️ NO se envían headers manuales
      // http.ts ya adjunta Authorization automáticamente
       return await get<MeResponse>('/api/auth/me')  // ✅ Correcto
    } catch (error) {
      console.error('Error en AuthService.me():', error)
      throw error
    }
  }
}
