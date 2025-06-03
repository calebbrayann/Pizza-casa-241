"use server"

import { createClient, createAdminClient } from "@/utils/supabase/server"
import type { Order, OrderItem, OrderStatus, OrderFilter } from "@/types/order"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Récupérer toutes les commandes avec filtrage
export async function getOrders(filters?: {
  status?: OrderStatus
  startDate?: string
  endDate?: string
  pizzeriaId?: string
}): Promise<Order[]> {
  try {
    console.log("Début de getOrders...")
    const supabase = await createAdminClient()
    console.log("Client Supabase créé avec succès")

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    console.log("Requête construite")

    if (filters?.status) {
      query = query.eq("status", filters.status)
      console.log("Filtre status ajouté:", filters.status)
    }

    if (filters?.startDate) {
      query = query.gte("order_date", filters.startDate)
      console.log("Filtre startDate ajouté:", filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte("order_date", filters.endDate)
      console.log("Filtre endDate ajouté:", filters.endDate)
    }

    if (filters?.pizzeriaId) {
      query = query.eq("pizzeria_id", filters.pizzeriaId)
      console.log("Filtre pizzeriaId ajouté:", filters.pizzeriaId)
    }

    console.log("Exécution de la requête...")
    const { data: ordersData, error: ordersError } = await query

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      throw ordersError
    }

    console.log("Données reçues:", ordersData)

    if (!ordersData) {
      console.log("Aucune commande trouvée")
      return []
    }

    // Récupérer toutes les pizzerias en une seule requête
    const { data: pizzeriasData, error: pizzeriasError } = await supabase
      .from("pizzerias")
      .select("id, name")

    if (pizzeriasError) {
      console.error("Error fetching pizzerias:", pizzeriasError)
    }

    // Créer un map des pizzerias pour un accès rapide
    const pizzeriasMap = new Map(
      pizzeriasData?.map(p => [p.id, p.name]) || []
    )

    console.log("Récupération des items pour chaque commande...")
    // Récupérer les items pour chaque commande
    const ordersWithItems = await Promise.all(
      ordersData.map(async (orderData) => {
        console.log("Récupération des items pour la commande:", orderData.id)
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id)

        if (itemsError) {
          console.error("Error fetching order items:", itemsError)
          throw itemsError
        }

        // Récupérer les informations de l'utilisateur
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email, raw_user_meta_data')
          .eq('id', orderData.customer_id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
        }

        const userMetadata = userData?.raw_user_meta_data || {}

        return {
          id: orderData.id,
          customer_id: orderData.customer_id,
          customer_name: userMetadata.name || "Utilisateur inconnu",
          customer_email: userData?.email || "email inconnu",
          customer_avatar: userMetadata.avatar_url || null,
          pizzeria_id: orderData.pizzeria_id,
          pizzeria_name: pizzeriasMap.get(orderData.pizzeria_id) || "Pizzeria inconnue",
          total: orderData.total,
          status: orderData.status,
          date: orderData.order_date,
          time: orderData.order_time,
          delivery_fee: orderData.delivery_fee,
          payment_method: orderData.payment_method,
          items: itemsData ? itemsData.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })) : [],
        }
      })
    )

    console.log("Traitement terminé avec succès")
    return ordersWithItems
  } catch (error) {
    console.error("Error in getOrders:", error)
    throw error
  }
}

// Récupérer une commande par ID
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient()

  // REQUÊTE MODIFIÉE : Syntaxe de jointure mise à jour
  const { data: orderData, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:customer_id (
        name,
        email,
        avatar_url
      ),
      pizzerias:pizzeria_id (
        name
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erreur lors de la récupération de la commande:", error)
    return null
  }

  // Récupérer les articles de la commande
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderData.id)

  if (itemsError) {
    console.error("Erreur lors de la récupération des articles de commande:", itemsError)
    return null
  }

  // Formater la date pour l'affichage
  const orderDate = new Date(orderData.order_date)
  const formattedDate = format(orderDate, "dd/MM/yyyy", { locale: fr })

  // Formater l'heure pour l'affichage
  const timeParts = orderData.order_time.split(":")
  const formattedTime = `${timeParts[0]}:${timeParts[1]}`

  // ACCÈS SÉCURISÉ AUX DONNÉES DES RELATIONS
  return {
    id: orderData.id,
    customer_id: orderData.customer_id,
    customer_name: orderData.users?.name || "Nom inconnu",
    customer_email: orderData.users?.email || "Email inconnu",
    customer_avatar: orderData.users?.avatar_url || "",
    pizzeria_id: orderData.pizzeria_id,
    pizzeria_name: orderData.pizzerias?.name || "Pizzeria inconnue", // Correction ici
    total: orderData.total,
    status: orderData.status,
    date: formattedDate,
    time: formattedTime,
    items: orderItems as OrderItem[],
    delivery_fee: orderData.delivery_fee,
    payment_method: orderData.payment_method,
    created_at: orderData.created_at,
    updated_at: orderData.updated_at,
  }
}

// Les autres fonctions restent inchangées
// ... [createOrder, updateOrderStatus, deleteOrder, getOrderStats] ...

// Créer une nouvelle commande
export async function createOrder(orderData: {
  customer_id: string
  pizzeria_id: string
  items: { name: string; quantity: number; price: number }[]
  delivery_fee?: number
  payment_method?: string
}): Promise<Order | null> {
  const supabase = await createClient()

  // Calculer le total de la commande
  const itemsTotal = orderData.items.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = orderData.delivery_fee || 2.99
  const total = itemsTotal + deliveryFee

  // Insérer la commande
  const { data: newOrder, error } = await supabase
    .from("orders")
    .insert([
      {
        customer_id: orderData.customer_id,
        pizzeria_id: orderData.pizzeria_id,
        total,
        delivery_fee: deliveryFee,
        payment_method: orderData.payment_method || "card",
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Erreur lors de la création de la commande:", error)
    throw new Error("Impossible de créer la commande")
  }

  // Insérer les articles de la commande
  const orderItems = orderData.items.map((item) => ({
    order_id: newOrder.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) {
    console.error("Erreur lors de l'ajout des articles de commande:", itemsError)
    // Supprimer la commande si l'ajout des articles échoue
    await supabase.from("orders").delete().eq("id", newOrder.id)
    throw new Error("Impossible d'ajouter les articles à la commande")
  }

  revalidatePath("/commandes")

  // Récupérer la commande complète
  return await getOrderById(newOrder.id)
}

// Mettre à jour le statut d'une commande
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Erreur lors de la mise à jour du statut de la commande:", error)
    throw new Error("Impossible de mettre à jour le statut de la commande")
  }

  revalidatePath("/commandes")

  // Récupérer la commande mise à jour
  return await getOrderById(id)
}

// Supprimer une commande
export async function deleteOrder(id: string): Promise<void> {
  const supabase = await createClient()

  // Supprimer d'abord les articles de la commande (contrainte de clé étrangère)
  const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", id)

  if (itemsError) {
    console.error("Erreur lors de la suppression des articles de commande:", itemsError)
  }

  // Supprimer la commande
  const { error } = await supabase.from("orders").delete().eq("id", id)

  if (error) {
    console.error("Erreur lors de la suppression de la commande:", error)
    throw new Error("Impossible de supprimer la commande")
  }

  revalidatePath("/commandes")
}

// Obtenir des statistiques sur les commandes
export async function getOrderStats() {
  const supabase = await createClient()

  // Nombre total de commandes
  const { count: totalOrders, error: countError } = await supabase.from("orders").select("*", { count: "exact" })

  if (countError) {
    console.error("Erreur lors du comptage des commandes:", countError)
    throw new Error("Impossible de compter les commandes")
  }

  // Chiffre d'affaires total
  const { data: revenueData, error: revenueError } = await supabase.from("orders").select("total")

  if (revenueError) {
    console.error("Erreur lors du calcul du chiffre d'affaires:", revenueError)
    throw new Error("Impossible de calculer le chiffre d'affaires")
  }

  const totalRevenue = revenueData.reduce((sum, order) => sum + order.total, 0)

  // Nombre de commandes par statut
  const { data: statusData, error: statusError } = await supabase.from("orders").select("status")

  if (statusError) {
    console.error("Erreur lors du comptage des statuts:", statusError)
    throw new Error("Impossible de compter les statuts")
  }

  const statusCounts = {
    confirmed: 0,
    preparing: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0,
  }

  statusData.forEach((order) => {
    statusCounts[order.status as OrderStatus]++
  })

  return {
    totalOrders,
    totalRevenue,
    statusCounts,
  }
}