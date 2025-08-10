
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, CreditCard, Star } from "lucide-react"

const plans = [
    {
        name: "Esencial",
        price: "$49",
        features: [
            "Gestión de Calendario",
            "Hasta 5 Miembros del Equipo",
            "Gestión de Servicios Básica",
            "Módulo de Presupuestos",
        ],
        current: false,
    },
    {
        name: "Profesional",
        price: "$99",
        features: [
            "Todo en Esencial",
            "Miembros del Equipo Ilimitados",
            "Notificaciones por Email/SMS",
            "Reportes Avanzados",
            "Integración con API",
        ],
        current: true,
    },
    {
        name: "Empresarial",
        price: "Contacto",
        features: [
            "Todo en Profesional",
            "Soporte Prioritario",
            "Gestor de Cuenta Dedicado",
            "Marca Blanca",
            "Soluciones a Medida",
        ],
        current: false,
    }
]


export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Suscripción</h1>
        <Card>
            <CardHeader>
                <CardTitle>Tu Plan Actual</CardTitle>
                <CardDescription>
                    Gestiona tu suscripción y revisa tu historial de facturación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <Card key={plan.name} className={`relative ${plan.current ? 'border-primary ring-2 ring-primary' : ''}`}>
                            {plan.current && (
                                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">PLAN ACTUAL</div>
                            )}
                            <CardHeader className="text-center">
                                <h3 className="text-2xl font-bold">{plan.name}</h3>
                                {plan.name === "Profesional" && <Star className="w-6 h-6 mx-auto text-yellow-400 fill-yellow-400"/>}
                            </CardHeader>
                            <CardContent className="flex flex-col h-full">
                                <div className="text-center mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.price !== "Contacto" && <span className="text-muted-foreground">/mes</span>}
                                </div>
                                <ul className="space-y-3 mb-8 flex-grow">
                                    {plan.features.map(feature => (
                                         <li key={feature} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button className="w-full mt-auto" disabled={plan.current || plan.price === "Contacto"}>
                                    {plan.current ? "Estás en este plan" : (plan.price === "Contacto" ? "Contactar Ventas" : "Actualizar Plan")}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
                 <CardDescription>Actualiza tu información de facturación.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8"/>
                    <div>
                        <p className="font-medium">Visa terminada en 4242</p>
                        <p className="text-sm text-muted-foreground">Expira 12/2026</p>
                    </div>
                </div>
                 <Button variant="outline">Actualizar</Button>
            </CardContent>
        </Card>

    </div>
  )
}
