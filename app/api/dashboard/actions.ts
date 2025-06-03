"use server"

import { createClient } from "@/utils/supabase/server"
import type { DashboardStats } from "@/types/dashboard"
import type { OrderStatus } from "@/types/order"
import type { TicketStatus } from "@/types/support"
import { cookies } from "next/headers"

// Récupérer les statistiques pour le tableau de bord
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  try {
    console.log("Début de getDashboardStats")

    // Commandes récentes - Test simple d'abord
    console.log("Récupération des commandes récentes...")
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, status, created_at, customer_id, pizzeria_id")
      .order("created_at", { ascending: false })
      .limit(5)

    if (ordersError) {
      console.error("Erreur lors de la récupération des commandes:", ordersError)
      throw ordersError
    }

    console.log("Commandes récupérées:", orders)

    // Récupérer les pizzerias associées
    console.log("Récupération des pizzerias...")
    const pizzeriaIds = orders.map(order => order.pizzeria_id)
    const { data: pizzerias, error: pizzeriasError } = await supabase
      .from("pizzerias")
      .select("id, name")
      .in("id", pizzeriaIds)

    if (pizzeriasError) {
      console.error("Erreur lors de la récupération des pizzerias:", pizzeriasError)
      throw pizzeriasError
    }

    console.log("Pizzerias récupérées:", pizzerias)

    // Map des pizzerias
    const pizzeriasMap = new Map(
      pizzerias.map(pizzeria => [pizzeria.id, pizzeria])
    )

    // Formater les commandes récentes
    const formattedOrders = orders.map(order => ({
      id: order.id,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      customer_name: "Utilisateur", // Valeur par défaut pour le moment
      customer_email: "email@example.com", // Valeur par défaut pour le moment
      pizzeria_name: pizzeriasMap.get(order.pizzeria_id)?.name || "Pizzeria inconnue"
    }))

    // Pour le moment, retournons des données minimales pour tester
    return {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      total_pizzerias: pizzerias.length,
      total_users: 0,
      orders_by_status: {
        confirmed: 0,
        preparing: 0,
        delivering: 0,
        delivered: 0,
        cancelled: 0
      },
      tickets_by_status: {
        open: 0,
        pending: 0,
        closed: 0
      },
      recent_orders: formattedOrders,
      recent_tickets: [],
      top_pizzerias: pizzerias.map(p => ({
        id: p.id,
        name: p.name,
        address: "",
        status: "active"
      }))
    }

  } catch (error) {
    console.error("Erreur dans getDashboardStats:", error)
    throw error
  }
}

// Fonction RPC pour obtenir les top pizzerias
// À exécuter dans l'éditeur SQL de Supabase
/*
CREATE OR REPLACE FUNCTION get_top_pizzerias(limit_num integer)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  status text,
  orders_count bigint,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.address,
    p.status,
    COUNT(o.id) as orders_count,
    SUM(o.total) as total_revenue
  FROM 
    pizzerias p
  LEFT JOIN 
    orders o ON p.id = o.pizzeria_id
  GROUP BY 
    p.id, p.name, p.address, p.status
  ORDER BY 
    orders_count DESC, total_revenue DESC
  LIMIT limit_num;
END;
$$ LANGUAGE plpgsql;
*/
