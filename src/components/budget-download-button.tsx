
"use client"

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { BudgetPDF } from "./budget-pdf";
import type { BudgetItem } from "@/app/(app)/budgets/actions";

interface BudgetDownloadButtonProps {
    data: {
        eventType: string;
        eventDate: string;
        eventLocation: string;
        services: BudgetItem[];
        servicesTotal: number;
        logisticsCost: number;
        totalUSD: number;
        totalARS: number;
        usdRate: number;
    };
    fileName: string;
}

export function BudgetDownloadButton({ data, fileName }: BudgetDownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const blob = await pdf(<BudgetPDF data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // You might want to show an error toast to the user here
        } finally {
            setLoading(false);
        }
    };
    
    return (
         <Button onClick={handleDownload} className="w-full" disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando PDF...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a PDF
                </>
            )}
        </Button>
    );
}
