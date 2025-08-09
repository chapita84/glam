
"use client"

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
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
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <Button className="w-full" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando PDF...
            </Button>
        );
    }
    
    return (
        <PDFDownloadLink
            document={<BudgetPDF data={data} />}
            fileName={fileName}
        >
            {({ loading }) =>
                loading ? (
                    <Button className="w-full" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando PDF...
                    </Button>
                ) : (
                    <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar a PDF
                    </Button>
                )
            }
        </PDFDownloadLink>
    );
}
