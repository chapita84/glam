
'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fingerprint, Sparkles, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function CreateStudioPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        // Aquí iría la lógica para crear el tenant en Firestore
        // y luego redirigir a la pasarela de pago de Stripe.
        // Por ahora, simulamos el proceso y redirigimos al dashboard.
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
    }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
            <Fingerprint className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-wider mt-2">GlamDash</h1>
        </div>
        <Card>
          <CardHeader className="text-center">
            <Sparkles className="mx-auto h-10 w-10 text-yellow-400" />
            <CardTitle className="text-2xl mt-4">¡Bienvenido! Vamos a empezar.</CardTitle>
            <CardDescription>
              Para comenzar, dale un nombre a tu espacio de trabajo. Este será el nombre de tu estudio o salón.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tenantName">Nombre del Estudio</Label>
                <Input
                  id="tenantName"
                  name="tenantName"
                  placeholder="Ej: Estudio Belleza Total"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                 {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear mi Estudio"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
