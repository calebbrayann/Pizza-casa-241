"use client"

import { useState } from "react"
import { Search, Filter, Mail, Phone, MapPin, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PizzeriaHeader } from "@/components/pizzeria/header"
import { PizzeriaSidebar } from "@/components/pizzeria/sidebar"
import { orders, users } from "@/lib/mock-data"

export default function PizzeriaCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("orders-desc")

  // Filter orders for this pizzeria (using p1 as example)
  const pizzeriaId = "p1"
  const pizzeriaName = "Pizza Napoli"

  const pizzeriaOrders = orders.filter((order) => order.pizzeriaId === pizzeriaId)

  // Get unique customer IDs who ordered from this pizzeria
  const customerIds = [...new Set(pizzeriaOrders.map((order) => order.userId))]

  // Get customer details
  const customers = users.filter((user) => customerIds.includes(user.id))

  // Calculate customer statistics
  const customerStats = customerIds.map((customerId) => {
    const customerOrders = pizzeriaOrders.filter((order) => order.userId === customerId)
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0)
    const orderCount = customerOrders.length
    const lastOrderDate = new Date(Math.max(...customerOrders.map((o) => new Date(o.createdAt).getTime())))
    const customer = users.find((user) => user.id === customerId)

    return {
      id: customerId,
      name: customer?.name || `Client #${customerId}`,
      email: customer?.email || "N/A",
      phone: customer?.phone || "N/A",
      address: customer?.addresses?.[0]?.address || "N/A",
      totalSpent,
      orderCount,
      lastOrderDate,
      avatar: customer?.avatar || "/placeholder.svg",
    }
  })

  // Filter customers based on search query
  const filteredCustomers = customerStats.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort customers based on selected sort option
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "orders-desc") {
      return b.orderCount - a.orderCount
    } else if (sortBy === "orders-asc") {
      return a.orderCount - b.orderCount
    } else if (sortBy === "spent-desc") {
      return b.totalSpent - a.totalSpent
    } else if (sortBy === "spent-asc") {
      return a.totalSpent - b.totalSpent
    } else if (sortBy === "recent") {
      return b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
    }
    return 0
  })

  return (
    <div className="flex min-h-screen flex-col">
      <PizzeriaHeader pizzeriaName={pizzeriaName} />
      <div className="flex flex-1">
        <PizzeriaSidebar />
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Clients</h1>
              <Button variant="outline">Exporter les données</Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[220px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orders-desc">Commandes (élevé à bas)</SelectItem>
                  <SelectItem value="orders-asc">Commandes (bas à élevé)</SelectItem>
                  <SelectItem value="spent-desc">Montant dépensé (élevé à bas)</SelectItem>
                  <SelectItem value="spent-asc">Montant dépensé (bas à élevé)</SelectItem>
                  <SelectItem value="recent">Commande la plus récente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customers Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Montant total</TableHead>
                    <TableHead>Dernière commande</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full">
                            <img
                              src={customer.avatar || "/placeholder.svg"}
                              alt={customer.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">Client #{customer.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{customer.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.orderCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.totalSpent.toLocaleString()} FCFA</TableCell>
                      <TableCell>{customer.lastOrderDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          Voir les commandes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {sortedCustomers.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Aucun client trouvé</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun client ne correspond à votre recherche. Essayez de modifier vos critères.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
