"use client"

import React from "react"

import { useState } from "react"
import { Search, Filter, Clock, CheckCircle2, CookingPot, Package, Truck, XCircle, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PizzeriaHeader } from "@/components/pizzeria/header"
import { PizzeriaSidebar } from "@/components/pizzeria/sidebar"
import { orders } from "@/lib/mock-data"

export default function PizzeriaOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")

  // Filter orders for this pizzeria (using p1 as example)
  const pizzeriaId = "p1"
  const pizzeriaName = "Pizza Napoli"

  const pizzeriaOrders = orders.filter((order) => order.pizzeriaId === pizzeriaId)

  // Filter orders based on search query and current tab
  const filteredOrders = pizzeriaOrders.filter(
    (order) =>
      (order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (currentTab === "all" ||
        (currentTab === "active" &&
          ["pending", "confirmed", "preparing", "ready", "delivering"].includes(order.status)) ||
        (currentTab === "delivered" && order.status === "delivered") ||
        (currentTab === "cancelled" && order.status === "cancelled") ||
        currentTab === order.status),
  )

  // Sort orders based on selected sort option
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === "date-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy === "total-desc") {
      return b.total - a.total
    } else if (sortBy === "total-asc") {
      return a.total - b.total
    }
    return 0
  })

  // Status badge and icon mapping
  const statusConfig = {
    pending: {
      label: "En attente",
      variant: "outline" as const,
      icon: Clock,
    },
    confirmed: {
      label: "Confirmée",
      variant: "default" as const,
      icon: CheckCircle2,
    },
    preparing: {
      label: "En préparation",
      variant: "secondary" as const,
      icon: CookingPot,
    },
    ready: {
      label: "Prête",
      variant: "secondary" as const,
      icon: Package,
    },
    delivering: {
      label: "En livraison",
      variant: "default" as const,
      icon: Truck,
    },
    delivered: {
      label: "Livrée",
      variant: "success" as const,
      icon: CheckCircle2,
    },
    cancelled: {
      label: "Annulée",
      variant: "destructive" as const,
      icon: XCircle,
    },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PizzeriaHeader pizzeriaName={pizzeriaName} />
      <div className="flex flex-1">
        <PizzeriaSidebar />
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Gestion des commandes</h1>
              <Button variant="outline">Exporter les commandes</Button>
            </div>

            {/* Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmées</TabsTrigger>
                <TabsTrigger value="preparing">En préparation</TabsTrigger>
                <TabsTrigger value="ready">Prêtes</TabsTrigger>
                <TabsTrigger value="delivering">En livraison</TabsTrigger>
                <TabsTrigger value="delivered">Livrées</TabsTrigger>
                <TabsTrigger value="cancelled">Annulées</TabsTrigger>
              </TabsList>

              <TabsContent value={currentTab}>
                {/* Search and Filter */}
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une commande..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (récent)</SelectItem>
                      <SelectItem value="date-asc">Date (ancien)</SelectItem>
                      <SelectItem value="total-desc">Total (élevé)</SelectItem>
                      <SelectItem value="total-asc">Total (bas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Orders Table */}
                <div className="mt-6 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Articles</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>Utilisateur #{order.userId}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {order.deliveryAddress}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {order.items.map((item, index) => (
                                <span key={index} className="text-sm">
                                  {item.quantity}x {item.name} ({item.size})
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={statusConfig[order.status].variant}>
                                {React.createElement(statusConfig[order.status].icon, { className: "mr-1 h-3 w-3" })}
                                {statusConfig[order.status].label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{order.total.toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                Détails
                              </Button>
                              {order.status === "pending" && (
                                <Button variant="default" size="sm">
                                  Accepter
                                </Button>
                              )}
                              {order.status === "confirmed" && (
                                <Button variant="default" size="sm">
                                  Préparer
                                </Button>
                              )}
                              {order.status === "preparing" && (
                                <Button variant="default" size="sm">
                                  Prête
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {sortedOrders.length === 0 && (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                    <div className="rounded-full bg-muted p-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Aucune commande trouvée</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Aucune commande ne correspond à votre recherche. Essayez de modifier vos critères.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
