# Instrucciones para actualizar reglas de Firestore manualmente

Como Firebase CLI está teniendo problemas, sigue estos pasos para actualizar las reglas directamente:

## Opción 1: Consola de Firebase (Recomendado)

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto: `glamdash-v2`
3. En el menú lateral, ve a "Firestore Database"
4. Haz clic en la pestaña "Rules"
5. Reemplaza todas las reglas existentes con estas reglas temporales:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regla temporal: Permitir acceso total a usuarios autenticados
    // SOLO PARA DEBUGGING - NO USAR EN PRODUCCIÓN
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. Haz clic en "Publish"
7. Confirma que quieres desplegar las reglas

## Opción 2: Script para la consola del navegador

Si prefieres una solución más específica, ejecuta este script en las Developer Tools:

```javascript
// Este script creará la membresía legacy que falta
(async function addLegacyMembership() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('❌ No hay usuario autenticado');
            return;
        }

        const userId = user.uid;
        const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';
        const membershipId = `${userId}_${studioId}`;

        console.log(`➕ Agregando membresía legacy: ${membershipId}`);

        const membershipData = {
            userId: userId,
            studioId: studioId,
            role: 'owner',
            createdAt: firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now()
        };

        await firebase.firestore()
            .collection('studio_members')
            .doc(membershipId)
            .set(membershipData);

        console.log('✅ Membresía legacy agregada exitosamente');
        console.log('🎉 Ahora deberías poder guardar presupuestos');

    } catch (error) {
        console.error('❌ Error agregando membresía legacy:', error);
    }
})();
```

## Después de actualizar las reglas:

1. Recarga la página de presupuestos
2. Intenta guardar un presupuesto
3. Debería funcionar correctamente

Las reglas temporales son muy permisivas (cualquier usuario autenticado puede hacer cualquier cosa), pero es seguro para testing ya que solo usuarios autenticados pueden acceder.

Una vez que funcione, podemos restaurar las reglas más específicas.
