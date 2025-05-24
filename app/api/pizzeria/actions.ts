"use server"

import { createClient } from "@/utils/supabase/server"
import type { Pizzeria, PizzeriaFilter, PizzeriaStatus } from "@/types/pizzeria"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Récupérer toutes les pizzerias avec filtrage
export async function getPizzerias(filter?: PizzeriaFilter): Promise<Pizzeria[]> {
  const supabase = await createClient()

  // Utiliser une sous-requête pour compter les commandes
  let query = supabase
    .from("pizzerias")
    .select(`
      *,
      orders_count:orders(count)
    `)
    .order("name")

  // Appliquer les filtres
  if (filter) {
    if (filter.status) {
      query = query.eq("status", filter.status)
    }

    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,address.ilike.%${filter.search}%`)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error("Erreur lors de la récupération des pizzerias:", error)
    throw new Error("Impossible de récupérer les pizzerias")
  }

  // Dédupliquer les pizzerias en utilisant un Map
  const uniquePizzerias = new Map()
  data.forEach((pizzeria) => {
    if (!uniquePizzerias.has(pizzeria.id)) {
      uniquePizzerias.set(pizzeria.id, {
        id: pizzeria.id,
        name: pizzeria.name,
        image: pizzeria.image || "/placeholder.svg?height=200&width=300",
        rating: pizzeria.rating,
        address: pizzeria.address,
        phone: pizzeria.phone,
        opening_hours: pizzeria.opening_hours,
        tags: pizzeria.tags || [],
        status: pizzeria.status,
        orders_count: pizzeria.orders_count?.[0]?.count || 0,
        revenue: pizzeria.revenue || 0,
        description: pizzeria.description,
        created_at: pizzeria.created_at,
        updated_at: pizzeria.updated_at,
      })
    }
  })

  return Array.from(uniquePizzerias.values())
}

// Récupérer une pizzeria par ID
export async function getPizzeriaById(id: string): Promise<Pizzeria | null> {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase.from("pizzerias").select("*").eq("id", id).single()

  if (error) {
    console.error("Erreur lors de la récupération de la pizzeria:", error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    image: data.image || "/placeholder.svg?height=200&width=300",
    rating: data.rating,
    address: data.address,
    phone: data.phone,
    opening_hours: data.opening_hours,
    tags: data.tags || [],
    status: data.status,
    orders_count: data.orders_count || 0,
    revenue: data.revenue || 0,
    description: data.description,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

// Créer une nouvelle pizzeria
export async function createPizzeria(pizzeriaData: Partial<Pizzeria>): Promise<Pizzeria | null> {
  try {
    const supabase = await createClient()

    // Préparer les tags si c'est une chaîne de caractères
    let tags = pizzeriaData.tags
    if (typeof pizzeriaData.tags === "string") {
      tags = (pizzeriaData.tags as string).split(",").map((tag) => tag.trim())
    }

    // Préparer les données pour l'insertion
    const newPizzeriaData = {
      name: pizzeriaData.name,
      image: pizzeriaData.image || "/placeholder.svg?height=200&width=300",
      rating: pizzeriaData.rating || 0,
      address: pizzeriaData.address,
      phone: pizzeriaData.phone,
      opening_hours: pizzeriaData.opening_hours,
      tags: tags,
      status: pizzeriaData.status || "active",
      orders_count: 0,
      revenue: 0,
      description: pizzeriaData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Données de la pizzeria à créer:", newPizzeriaData)

    // Insérer la pizzeria
    const { data: newPizzeria, error } = await supabase
      .from("pizzerias")
      .insert([newPizzeriaData])
      .select()
      .single()

    if (error) {
      console.error("Erreur lors de la création de la pizzeria:", error)
      throw new Error(`Impossible de créer la pizzeria: ${error.message}`)
    }

    console.log("Pizzeria créée avec succès:", newPizzeria)

    // Revalider le chemin pour mettre à jour l'interface
    revalidatePath("/admin/pizzerias")

    // Récupérer la pizzeria créée pour s'assurer que tout est correct
    const createdPizzeria = await getPizzeriaById(newPizzeria.id)
    if (!createdPizzeria) {
      throw new Error("La pizzeria a été créée mais n'a pas pu être récupérée")
    }

    return createdPizzeria
  } catch (error) {
    console.error("Erreur complète lors de la création de la pizzeria:", error)
    throw error
  }
}

// Mettre à jour une pizzeria existante
export async function updatePizzeria(id: string, pizzeriaData: Partial<Pizzeria>): Promise<Pizzeria | null> {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  // Préparer les tags si c'est une chaîne de caractères
  let tags = pizzeriaData.tags
  if (typeof pizzeriaData.tags === "string") {
    tags = (pizzeriaData.tags as string).split(",").map((tag) => tag.trim())
  }

  // Mettre à jour la pizzeria
  const { error } = await supabase
    .from("pizzerias")
    .update({
      name: pizzeriaData.name,
      image: pizzeriaData.image,
      rating: pizzeriaData.rating,
      address: pizzeriaData.address,
      phone: pizzeriaData.phone,
      opening_hours: pizzeriaData.opening_hours,
      tags: tags,
      status: pizzeriaData.status,
      orders_count: pizzeriaData.orders_count,
      revenue: pizzeriaData.revenue,
      description: pizzeriaData.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Erreur lors de la mise à jour de la pizzeria:", error)
    throw new Error("Impossible de mettre à jour la pizzeria")
  }

  revalidatePath("/pizzerias")

  // Récupérer la pizzeria mise à jour
  return await getPizzeriaById(id)
}

// Changer le statut d'une pizzeria (activer/désactiver)
export async function updatePizzeriaStatus(id: string, status: PizzeriaStatus): Promise<void> {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase
    .from("pizzerias")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    throw new Error("Impossible de mettre à jour le statut de la pizzeria")
  }

  revalidatePath("/pizzerias")
}

// Supprimer une pizzeria
export async function deletePizzeria(id: string): Promise<void> {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase.from("pizzerias").delete().eq("id", id)

  if (error) {
    console.error("Erreur lors de la suppression de la pizzeria:", error)
    throw new Error("Impossible de supprimer la pizzeria")
  }

  revalidatePath("/pizzerias")
}
