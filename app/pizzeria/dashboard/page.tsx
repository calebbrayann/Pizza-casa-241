"use client"

import { useState } from "react"
import { DollarSign, Package, ShoppingBag, TrendingUp, Clock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PizzeriaHeader } from "@/components/pizzeria/header"
import { PizzeriaSidebar } from "@/components/pizzeria/sidebar"
import { orders, pizzas } from "@/lib/mock-data"

export default function PizzeriaDashboardPage() {
  const [timeRange, setTimeRange] = useState("today")

  // Filter orders for this pizzeria (using p1 as example)
  const pizzeriaId = "p1"
  const pizzeriaName = "Pizza Napoli"

  const pizzeriaOrders = orders.filter((order) => order.pizzeriaId === pizzeriaId)

  // Calculate statistics
  const todayOrders = pizzeriaOrders.filter(
    (order) => new Date(order.createdAt).toDateString() === new Date().toDateString(),
  )

  const pendingOrders = pizzeriaOrders.filter((order) => ["pending", "confirmed"].includes(order.status))

  const completedOrders = pizzeriaOrders.filter((order) => order.status === "delivered")

  // Calculate revenue
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0)
  const monthlyRevenue = pizzeriaOrders.reduce((sum, order) => sum + order.total, 0)

  // Get top selling pizzas
  const pizzeriaProducts = pizzas.filter((pizza) => pizza.pizzeriaId === pizzeriaId)

  // Mock data for charts
  const weeklyRevenueData = [
    { day: "Lun", amount: 45000 },
    { day: "Mar", amount: 52000 },
    { day: "Mer", amount: 48000 },
    { day: "Jeu", amount: 61000 },
    { day: "Ven", amount: 95000 },
    { day: "Sam", amount: 108000 },
    { day: "Dim", amount: 87000 },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <PizzeriaHeader pizzeriaName={pizzeriaName} />
      <div className="flex flex-1">
        <PizzeriaSidebar />
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Tableau de bord</h1>
                <p className="text-muted-foreground">Bienvenue sur votre espace pizzeria</p>
              </div>
              <Tabs value={timeRange} onValueChange={setTimeRange} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
                  <TabsTrigger value="week">Cette semaine</TabsTrigger>
                  <TabsTrigger value="month">Ce mois</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Key Statistics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Commandes du jour</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayOrders.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {todayOrders.length > 3 ? "+15% par rapport à hier" : "-5% par rapport à hier"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires du jour</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayRevenue.toLocaleString()} FCFA</div>
                  <p className="text-xs text-muted-foreground">
                    {todayRevenue > 20000 ? "+8% par rapport à hier" : "-3% par rapport à hier"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Commandes en attente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrders.length}</div>
                  <p className="text-xs text-muted-foreground">{pendingOrders.length} commandes à traiter</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires mensuel</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monthlyRevenue.toLocaleString()} FCFA</div>
                  <p className="text-xs text-muted-foreground">+12% par rapport au mois dernier</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              {/* Revenue Chart */}
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Chiffre d'affaires</CardTitle>
                  <CardDescription>Évolution du chiffre d'affaires sur la période</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* Simplified chart representation */}
                    <div className="flex h-[250px] items-end gap-2">
                      {weeklyRevenueData.map((item, index) => (
                        <div key={index} className="relative flex w-full flex-col items-center">
                          <div
                            className="w-full bg-primary"
                            style={{
                              height: `${(item.amount / 110000) * 100}%`,
                              opacity: timeRange === "today" ? (index === 6 ? 1 : 0.3) : 1,
                            }}
                          ></div>
                          <span className="mt-2 text-xs">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Commandes récentes</CardTitle>
                    <CardDescription>Les dernières commandes reçues</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir toutes
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pizzeriaOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Commande #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{order.total.toLocaleString()} FCFA</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Top Selling Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produits les plus vendus</CardTitle>
                  <CardDescription>Top 5 des pizzas les plus populaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pizzeriaProducts.slice(0, 5).map((pizza, i) => (
                      <div key={pizza.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pizza.name}</p>
                          <p className="text-xs text-muted-foreground">{pizza.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{pizza.price.toLocaleString()} FCFA</p>
                          <p className="text-xs text-muted-foreground">{150 - i * 20} ventes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Clients fidèles</CardTitle>
                  <CardDescription>Top 5 des clients les plus actifs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted">
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                            {String.fromCharCode(64 + i)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Client #{i}</p>
                          <p className="text-xs text-muted-foreground">{10 - i} commandes</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{(i * 25000).toLocaleString()} FCFA</p>
                          <p className="text-xs text-muted-foreground">Total dépensé</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Statut des commandes</CardTitle>
                  <CardDescription>Répartition des commandes par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">En attente</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {pizzeriaOrders.filter((o) => o.status === "pending").length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">En préparation</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {pizzeriaOrders.filter((o) => o.status === "preparing").length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Prêtes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {pizzeriaOrders.filter((o) => o.status === "ready").length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Livrées</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {pizzeriaOrders.filter((o) => o.status === "delivered").length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
