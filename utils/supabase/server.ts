// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"

const getCookieValue = async (name: string) => {
  const cookieStore = await cookies()
  return cookieStore.get(name)?.value
}

const setCookieValue = async (name: string, value: string, options: CookieOptions) => {
  const cookieStore = await cookies()
  cookieStore.set({ name, value, ...options })
}

export const createClient = async () => {
  try {
    console.log("Création du client Supabase...")
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("Anon Key existe:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Les variables d'environnement Supabase ne sont pas configurées")
    }

    const cookieStore = await cookies()
    console.log("Cookie store créé")

    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          async get(name: string) {
            const cookie = await cookieStore.get(name)
            return cookie?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            await cookieStore.set({ name, value, ...options })
          },
          async remove(name: string, options: CookieOptions) {
            await cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    console.log("Client Supabase créé avec succès")
    return client
  } catch (error) {
    console.error("Erreur lors de la création du client Supabase:", error)
    throw error
  }
}

// Nouvelle fonction pour créer un client avec le service role key
export const createAdminClient = async () => {
  try {
    console.log("Création du client Supabase Admin...")
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Les variables d'environnement Supabase ne sont pas configurées")
    }

    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get: () => "",
          set: () => {},
          remove: () => {},
        },
      }
    )

    console.log("Client Supabase Admin créé avec succès")
    return client
  } catch (error) {
    console.error("Erreur lors de la création du client Supabase Admin:", error)
    throw error
  }
}

export const updateSession = async (request: Request) => {
  try {
    console.log("Mise à jour de la session...")
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Les variables d'environnement Supabase ne sont pas configurées")
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          async get(name: string) {
            const cookie = await cookieStore.get(name)
            return cookie?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            await cookieStore.set({ name, value, ...options })
          },
          async remove(name: string, options: CookieOptions) {
            await cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    const { data: session, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Erreur lors de la récupération de la session:", error)
      throw error
    }

    console.log("Session mise à jour avec succès")
    return supabase
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la session:", error)
    throw error
  }
}