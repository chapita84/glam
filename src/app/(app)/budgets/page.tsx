import { BudgetWizard } from "@/components/budget-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function BudgetsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Herramienta de Presupuesto Inteligente</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Crear un Nuevo Presupuesto de Evento</CardTitle>
                    <CardDescription>
                        Sigue los pasos para generar un presupuesto detallado para los eventos de tus clientes. Usa nuestro asistente de IA para obtener sugerencias de servicios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BudgetWizard />
                </CardContent>
            </Card>
        </div>
    );
}
