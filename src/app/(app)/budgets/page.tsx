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
                <h1 className="text-3xl font-bold tracking-tight">Smart Budget Tool</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Event Budget</CardTitle>
                    <CardDescription>
                        Follow the steps to generate a detailed budget for your clients' events. Use our AI assistant to get service suggestions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BudgetWizard />
                </CardContent>
            </Card>
        </div>
    );
}
