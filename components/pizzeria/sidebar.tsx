"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, Users, Pizza, Settings, HelpCircle, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function PizzeriaSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <Link
            href="/pizzeria/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive("/pizzeria/dashboard") ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Tableau de bord</span>
          </Link>
          <Link
            href="/pizzeria/orders"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive("/pizzeria/orders") ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Commandes</span>
          </Link>
          <Link
            href="/pizzeria/customers"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive("/pizzeria/customers") ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            <Users className="h-4 w-4" />
            <span>Clients</span>
          </Link>
          <Link
            href="/pizzeria/menu"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive("/pizzeria/menu") ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            <Pizza className="h-4 w-4" />
            <span>Menu</span>
          </Link>

          <div className="my-2 h-px bg-muted-foreground/20" />

          <Link
            href="/pizzeria/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive("/pizzeria/settings") ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </Link>
          <Link
            href="/pizzeria/help"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive("/pizzeria/help") ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Aide</span>
          </Link>
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted">
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold">P</div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Gérant Pizzeria</p>
            <p className="text-xs text-muted-foreground">gerant@pizzanapoli.com</p>
          </div>
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Se déconnecter</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
