'use client';

import { useState } from 'react';
import { collection, addDoc, getDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';

export default function TestFirestoreComponent() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const runFirestoreTest = async () => {
    setIsLoading(true);
    setTestResult('🔧 Iniciando test de Firestore...\n');
    
    try {
      if (!currentUser) {
        setTestResult(prev => prev + '❌ No hay usuario autenticado\n');
        return;
      }

      setTestResult(prev => prev + `👤 Usuario autenticado: ${currentUser.uid}\n`);

      // Datos de prueba que imitan exactamente la estructura de un presupuesto
      const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';
      const testData = {
        budgetName: "TEST - Casamiento - Santiago Perez",
        clientName: "Santiago Perez",
        eventInfo: {
          type: "Casamiento",
          date: "2025-12-30",
          time: "12:00",
          location: "chile 1234"
        },
        items: [
          {
            description: "Maquillaje TEST",
            category: "General",
            quantity: 1,
            unitCost: {
              amount: 15,
              currency: "USD"
            },
            duration: 15
          }
        ],
        summary: {
          subtotal: 15,
          logistics: 50,
          totalUSD: 65,
          exchangeRate: 1000,
          totalARS: 65000
        },
        status: "draft",
        createdAt: new Date().toISOString(),
        userId: currentUser.uid
      };

      setTestResult(prev => prev + '📝 Intentando escribir en Firestore...\n');
      setTestResult(prev => prev + `📍 Ruta: studios/${studioId}/budgets\n`);
      setTestResult(prev => prev + `📦 Datos: ${JSON.stringify(testData, null, 2)}\n`);

      // Crear referencia a la colección
      const budgetsRef = collection(db, 'studios', studioId, 'budgets');
      
      // Intentar escribir
      const docRef = await addDoc(budgetsRef, testData);
      setTestResult(prev => prev + `✅ ¡ÉXITO! Documento creado con ID: ${docRef.id}\n`);

      // Leer el documento para confirmar
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        setTestResult(prev => prev + `✅ Documento leído correctamente: ${JSON.stringify(docSnapshot.data(), null, 2)}\n`);
      } else {
        setTestResult(prev => prev + '❌ No se pudo leer el documento\n');
      }

      // Limpiar - eliminar documento de prueba
      await deleteDoc(docRef);
      setTestResult(prev => prev + '🧹 Documento de prueba eliminado\n');

      setTestResult(prev => prev + '🎉 ¡TEST COMPLETADO CON ÉXITO!\n');
      setTestResult(prev => prev + '💡 Conclusión: Firestore funciona perfectamente\n');
      setTestResult(prev => prev + '🔍 El problema debe estar en el código de la aplicación, no en los permisos de Firebase\n');

    } catch (error: any) {
      setTestResult(prev => prev + `❌ ERROR en el test: ${error.message}\n`);
      setTestResult(prev => prev + `📋 Información del error:\n`);
      setTestResult(prev => prev + `- Código: ${error.code}\n`);
      setTestResult(prev => prev + `- Mensaje: ${error.message}\n`);
      setTestResult(prev => prev + `- Stack: ${error.stack}\n`);
      
      if (error.code === 'permission-denied') {
        setTestResult(prev => prev + '🚫 Error de permisos - revisar Firestore Rules\n');
      } else if (error.message.includes('offline')) {
        setTestResult(prev => prev + '📡 Error de conectividad\n');
      } else if (error.message.includes('not-found')) {
        setTestResult(prev => prev + '🔍 El documento o colección no existe\n');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test de Firestore</h1>
      <div className="mb-4">
        <button
          onClick={runFirestoreTest}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Ejecutando test...' : 'Ejecutar Test de Firestore'}
        </button>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Resultados del Test:</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {testResult || 'Haz clic en el botón para ejecutar el test'}
        </pre>
      </div>
    </div>
  );
}
