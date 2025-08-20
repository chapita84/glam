'use client';

import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { BudgetItem } from '@/lib/types';

// Registrar la fuente Alegreya.
// Nota: La ruta de la fuente es relativa y puede necesitar ajustes dependiendo de la configuración del proyecto.
// En este entorno, asumimos que podemos acceder a Google Fonts directamente.
// react-pdf no puede cargar fuentes remotas directamente en el `src` por razones de seguridad.
// En un proyecto real, descargaríamos el TTF y lo alojaríamos localmente.
// Por ahora, usaremos las fuentes estándar.

/*
Font.register({
  family: 'Alegreya',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/alegreya/v35/taiOGmRtCJ62-O0HhVczs-wC.ttf' }, // regular
    { src: 'https://fonts.gstatic.com/s/alegreya/v35/taiRGmRtCJ62-O0HhVefs-wPwlQ.ttf', fontWeight: 'bold' }, // bold
  ]
});
*/

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Usar fuente estándar como fallback
    fontSize: 11,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
    backgroundColor: '#f3f4f6',
    padding: 5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    padding: 5,
  },
   tableColWide: {
    width: "50%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    padding: 5,
  },
  text: {
    fontSize: 10,
  },
  textBold: {
      fontFamily: 'Helvetica-Bold',
  },
  totalSection: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 2,
      borderTopColor: '#333333'
  },
  totalRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     paddingVertical: 3,
  },
  totalLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
  },
  footer: {
      position: 'absolute',
      bottom: 30,
      left: 35,
      right: 35,
      textAlign: 'center',
      color: 'grey',
      fontSize: 10
  }
});

interface BudgetPDFProps {
    data?: {
        eventType: string;
        eventDate: string;
        eventLocation: string;
        services: BudgetItem[];
        servicesTotal: number;
        logisticsCost: number;
        totalUSD: number;
        totalARS: number;
        usdRate: number;
    }
}

export const BudgetPDF = ({ data }: BudgetPDFProps) => {
    if (!data) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <Text>No hay datos para generar el presupuesto.</Text>
                </Page>
            </Document>
        )
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Glam&Beauty Dash</Text>
                <Text style={styles.subtitle}>Presupuesto de Servicios</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles del Evento</Text>
                <View style={styles.row}>
                    <Text>Tipo de Evento:</Text>
                    <Text style={styles.textBold}>{data.eventType || 'No especificado'}</Text>
                </View>
                <View style={styles.row}>
                    <Text>Fecha:</Text>
                    <Text style={styles.textBold}>{data.eventDate ? new Date(data.eventDate).toLocaleDateString('es-AR') : 'No especificada'}</Text>
                </View>
                <View style={styles.row}>
                    <Text>Ubicación:</Text>
                    <Text style={styles.textBold}>{data.eventLocation || 'No especificada'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Servicios Cotizados</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableColHeader}><Text style={styles.text}>Servicio</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.text}>Cantidad</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.text}>Precio (USD)</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.text}>Subtotal (USD)</Text></View>
                    </View>
                    {data.services.map((service, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableCol}><Text style={styles.text}>{service.description}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.text}>{service.quantity || 0}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.text}>${(service.unitCost.amount || 0).toFixed(2)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.text}>${((service.quantity || 0) * (service.unitCost.amount || 0)).toFixed(2)}</Text></View>
                        </View>
                    ))}
                </View>
            </View>
            
            <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text>Subtotal Servicios:</Text>
                        <Text>${(data.servicesTotal || 0).toFixed(2)} USD</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>Logística y Viáticos:</Text>
                        <Text>${(data.logisticsCost || 0).toFixed(2)} USD</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL (USD):</Text>
                        <Text style={styles.totalValue}>${(data.totalUSD || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL (ARS):</Text>
                        <Text style={styles.totalValue}>${(data.totalARS || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={{fontSize: 9, color: 'grey'}}>Tasa de cambio utilizada: 1 USD = {data.usdRate || 0} ARS</Text>
                    </View>
            </View>
            
            <Text style={styles.footer}>
                Presupuesto generado con Glam&Beauty Dash. Válido por 15 días.
            </Text>
            </Page>
        </Document>
    )
};
