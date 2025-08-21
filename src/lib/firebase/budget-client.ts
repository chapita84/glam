'use client';

import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { type Budget, type BudgetStatusHistory } from '@/lib/types';

export async function saveBudgetClient(
  studioId: string, 
  budgetData: Omit<Budget, 'id'> & { id?: string },
  userInfo: { uid: string; email: string; displayName?: string }
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    console.log('=== saveBudgetClient DEBUG ===');
    console.log('studioId:', studioId);
    console.log('budgetData:', JSON.stringify(budgetData, null, 2));
    console.log('userInfo:', userInfo);
    
    const { id, ...dataToSave } = budgetData;
    console.log('Data to save (without id):', JSON.stringify(dataToSave, null, 2));
    
    const budgetsCollection = collection(db, 'studios', studioId, 'budgets');
    
    if (id) {
      // EDITAR presupuesto existente - verificar si cambió el estado
      console.log('Updating existing budget with ID:', id);
      const budgetDoc = doc(budgetsCollection, id);
      
      // Obtener el presupuesto actual para comparar estados
      const currentBudgetSnap = await getDoc(budgetDoc);
      const currentBudget = currentBudgetSnap.data() as Budget;
      
      let statusHistory = budgetData.statusHistory || currentBudget?.statusHistory || [];
      
      // Si el estado cambió, agregar entrada al historial
      if (currentBudget && currentBudget.status !== budgetData.status) {
        const statusEntry: BudgetStatusHistory = {
          status: budgetData.status,
          timestamp: new Date(),
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.displayName || userInfo.email || 'Usuario',
          notes: `Estado cambiado de ${currentBudget.status} a ${budgetData.status}`
        };
        
        statusHistory = [...statusHistory, statusEntry];
        console.log('Status changed, adding to history:', statusEntry);
      }
      
      await updateDoc(budgetDoc, {
        ...dataToSave,
        statusHistory,
        updatedAt: new Date()
      });
      
      console.log('Budget updated successfully with ID:', id);
      return { 
        success: true, 
        message: 'Presupuesto actualizado exitosamente.', 
        id: id 
      };
    } else {
      // CREAR nuevo presupuesto
      console.log('Creating new budget document');
      
      // Crear entrada inicial en el historial
      const initialStatusEntry: BudgetStatusHistory = {
        status: budgetData.status,
        timestamp: new Date(),
        userId: userInfo.uid,
        userEmail: userInfo.email,
        userName: userInfo.displayName || userInfo.email || 'Usuario',
        notes: 'Presupuesto creado'
      };
      
      const docRef = await addDoc(budgetsCollection, {
        ...dataToSave,
        statusHistory: [initialStatusEntry],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Budget created successfully with ID:', docRef.id);
      return { 
        success: true, 
        message: 'Presupuesto guardado exitosamente.', 
        id: docRef.id 
      };
    }
  } catch (error: any) {
    console.error('Error in saveBudgetClient:', error);
    return { 
      success: false, 
      message: `Error al guardar el presupuesto: ${error?.message || 'Error desconocido'}` 
    };
  }
}
