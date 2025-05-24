"use server"

import { createClient } from "@/utils/supabase/server"
import type { User, UserFilter, UserStatus } from "@/types/user"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from 'uuid'

// Récupérer tous les utilisateurs avec filtrage
export async function getUsers(filter?: UserFilter): Promise<User[]> {
  try {
    console.log("Début de la récupération des utilisateurs")
    const supabase = await createClient()
    console.log("Client Supabase créé")

    let query = supabase
      .from("users")
      .select(`
        *,
        addresses(*)
      `)
    console.log("Requête de base créée")

    // Appliquer les filtres
    if (filter) {
      console.log("Filtres appliqués:", filter)
      if (filter.status) {
        query = query.eq("status", filter.status)
      }

      if (filter.role) {
        query = query.eq("role", filter.role)
      }

      if (filter.search) {
        query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
      }
    }

    console.log("Exécution de la requête...")
    const { data, error } = await query

    if (error) {
      console.error("Erreur détaillée lors de la récupération des utilisateurs:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`)
    }

    if (!data) {
      console.log("Aucune donnée retournée")
      return []
    }

    console.log(`${data.length} utilisateurs trouvés`)

    // Formater les données pour correspondre à notre type User
    return data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      status: user.status,
      role: user.role,
      registered_date: new Date(user.created_at).toLocaleDateString("fr-FR"),
      orders_count: 0, // Valeur par défaut jusqu'à ce que la table orders soit créée
      total_spent: 0, // Valeur par défaut jusqu'à ce que la table orders soit créée
      last_login: user.last_login ? formatLastLogin(new Date(user.last_login)) : "Jamais",
      addresses: user.addresses || [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    }))
  } catch (error) {
    console.error("Erreur complète:", error)
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`)
    }
    throw new Error("Une erreur inattendue s'est produite")
  }
}

// Récupérer un utilisateur par ID
export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      addresses(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar_url,
    status: data.status,
    role: data.role,
    registered_date: new Date(data.created_at).toLocaleDateString("fr-FR"),
    orders_count: 0, // Valeur par défaut jusqu'à ce que la table orders soit créée
    total_spent: 0, // Valeur par défaut jusqu'à ce que la table orders soit créée
    last_login: data.last_login ? formatLastLogin(new Date(data.last_login)) : "Jamais",
    addresses: data.addresses || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

// Créer un nouvel utilisateur
export async function createUser(userData: Partial<User>): Promise<User | null> {
  try {
    console.log("Début de la création d'un utilisateur avec les données:", userData)
    const supabase = await createClient()
    console.log("Client Supabase créé")

    // Extraire les adresses pour les insérer séparément
    const { addresses, ...userDataWithoutAddresses } = userData
    console.log("Données utilisateur préparées:", userDataWithoutAddresses)

    // Vérifier les données requises
    if (!userDataWithoutAddresses.name || !userDataWithoutAddresses.email) {
      throw new Error("Le nom et l'email sont requis")
    }

    // Générer un ID unique
    const userId = uuidv4()

    // Insérer l'utilisateur
    console.log("Tentative d'insertion de l'utilisateur...")
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          name: userDataWithoutAddresses.name,
          email: userDataWithoutAddresses.email,
          avatar_url: userDataWithoutAddresses.avatar_url || null,
          status: userDataWithoutAddresses.status || "active",
          role: userDataWithoutAddresses.role || "user",
          last_login: userDataWithoutAddresses.last_login || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erreur détaillée lors de la création de l'utilisateur:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`)
    }

    console.log("Utilisateur créé avec succès:", newUser)

    // Si des adresses ont été fournies, les insérer
    if (addresses && addresses.length > 0 && newUser) {
      console.log("Tentative d'insertion des adresses...")
      const addressesWithUserId = addresses.map((address) => ({
        id: uuidv4(),
        ...address,
        user_id: newUser.id,
      }))

      const { error: addressError } = await supabase.from("addresses").insert(addressesWithUserId)

      if (addressError) {
        console.error("Erreur lors de l'ajout des adresses:", addressError)
      } else {
        console.log("Adresses ajoutées avec succès")
      }
    }

    revalidatePath("/utilisateurs")

    // Récupérer l'utilisateur complet avec ses adresses
    console.log("Récupération de l'utilisateur complet...")
    return await getUserById(newUser.id)
  } catch (error) {
    console.error("Erreur complète lors de la création de l'utilisateur:", error)
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`)
    }
    throw new Error("Une erreur inattendue s'est produite lors de la création de l'utilisateur")
  }
}

// Mettre à jour un utilisateur existant
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    console.log("Début de la mise à jour de l'utilisateur:", { id, userData })
    const supabase = await createClient()
    console.log("Client Supabase créé")

    // Extraire les adresses pour les traiter séparément
    const { addresses, ...userDataWithoutAddresses } = userData
    console.log("Données utilisateur préparées:", userDataWithoutAddresses)

    // Préparer les données de mise à jour
    const updateData = {
      name: userDataWithoutAddresses.name,
      email: userDataWithoutAddresses.email,
      avatar_url: userDataWithoutAddresses.avatar_url,
      status: userDataWithoutAddresses.status,
      role: userDataWithoutAddresses.role,
      // Ne pas mettre à jour last_login s'il est "Jamais"
      ...(userDataWithoutAddresses.last_login !== "Jamais" && {
        last_login: userDataWithoutAddresses.last_login
      }),
      updated_at: new Date().toISOString(),
    }

    console.log("Données de mise à jour préparées:", updateData)

    // Mettre à jour l'utilisateur
    console.log("Tentative de mise à jour de l'utilisateur...")
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erreur détaillée lors de la mise à jour de l'utilisateur:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`)
    }

    console.log("Utilisateur mis à jour avec succès:", updatedUser)

    // Si des adresses ont été fournies, les mettre à jour
    if (addresses && addresses.length > 0) {
      console.log("Tentative de mise à jour des adresses...")
      // Supprimer les anciennes adresses
      const { error: deleteError } = await supabase.from("addresses").delete().eq("user_id", id)
      
      if (deleteError) {
        console.error("Erreur lors de la suppression des anciennes adresses:", deleteError)
      }

      // Ajouter les nouvelles adresses
      const addressesWithUserId = addresses.map((address) => ({
        id: address.id || uuidv4(),
        ...address,
        user_id: id,
      }))

      const { error: addressError } = await supabase.from("addresses").insert(addressesWithUserId)

      if (addressError) {
        console.error("Erreur lors de l'ajout des nouvelles adresses:", addressError)
      } else {
        console.log("Adresses mises à jour avec succès")
      }
    }

    revalidatePath("/utilisateurs")

    // Récupérer l'utilisateur mis à jour
    console.log("Récupération de l'utilisateur mis à jour...")
    return await getUserById(id)
  } catch (error) {
    console.error("Erreur complète lors de la mise à jour de l'utilisateur:", error)
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`)
    }
    throw new Error("Une erreur inattendue s'est produite lors de la mise à jour de l'utilisateur")
  }
}

// Changer le statut d'un utilisateur (bloquer/débloquer)
export async function updateUserStatus(id: string, status: UserStatus): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("users")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    throw new Error("Impossible de mettre à jour le statut de l'utilisateur")
  }

  revalidatePath("/utilisateurs")
}

// Supprimer un utilisateur
export async function deleteUser(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    throw new Error("Impossible de supprimer l'utilisateur")
  }

  revalidatePath("/utilisateurs")
}

// Fonction utilitaire pour formater la date de dernière connexion
function formatLastLogin(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return "Aujourd'hui"
  } else if (days === 1) {
    return "Hier"
  } else if (days < 7) {
    return `Il y a ${days} jours`
  } else {
    return date.toLocaleDateString("fr-FR")
  }
}
