// Script para limpiar estudio específico
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function cleanSpecificStudio(studioId: string = 'XLaNivC7I1jU8w0ZrLGn') {
  try {
    console.log(`Limpiando estudio específico: ${studioId}`);
    
    const studioRef = doc(db, 'studios', studioId);
    const studioDoc = await getDoc(studioRef);
    
    if (studioDoc.exists()) {
      const data = studioDoc.data();
      console.log('Datos actuales del estudio:', data);
      
      // Verificar si tiene problemas en el nombre
      if (data.name && typeof data.name === 'string') {
        const cleanName = data.name.trim();
        if (data.name !== cleanName || data.name.includes('  ')) {
          console.log(`Corrigiendo nombre: "${data.name}" -> "${cleanName}"`);
          
          // Opción 1: Actualizar el estudio
          await updateDoc(studioRef, {
            name: cleanName,
            // Asegurar campos requeridos
            rating: data.rating || 4.5,
            reviewCount: data.reviewCount || 0,
            services: data.services || [],
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
            categories: data.categories || ['general'],
            priceTier: data.priceTier || 2,
            location: data.location || 'Buenos Aires'
          });
          
          console.log('Estudio actualizado exitosamente');
        }
      }
    } else {
      console.log('El estudio no existe, eliminándolo de referencias...');
    }
    
    return true;
  } catch (error) {
    console.error('Error limpiando estudio específico:', error);
    return false;
  }
}

export async function deleteProblematicStudio(studioId: string = 'XLaNivC7I1jU8w0ZrLGn') {
  try {
    console.log(`Eliminando estudio problemático: ${studioId}`);
    
    const studioRef = doc(db, 'studios', studioId);
    await deleteDoc(studioRef);
    
    console.log('Estudio eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('Error eliminando estudio:', error);
    return false;
  }
}
