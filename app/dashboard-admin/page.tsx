'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import PizzeriaManager from '@/components/admin/PizzeriaManager'
import PizzaManager from '@/components/admin/PizzaManager'

export default function DashboardAdmin() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (!session) {
        router.push('/login')
        return
      }

      // Vérifier si l'utilisateur est admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError

      if (profile.role !== 'admin') {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
          variant: "destructive",
        })
        router.push('/')
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification de vos droits.",
        variant: "destructive",
      })
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ac1f1f]"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrateur</h1>
      
      <Tabs defaultValue="pizzerias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pizzerias">Pizzerias</TabsTrigger>
          <TabsTrigger value="pizzas">Pizzas</TabsTrigger>
        </TabsList>

        <TabsContent value="pizzerias">
          <PizzeriaManager />
        </TabsContent>

        <TabsContent value="pizzas">
          <PizzaManager />
        </TabsContent>
      </Tabs>
    </div>
  )
} 