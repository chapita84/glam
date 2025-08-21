// Script de prueba SIMPLE para Firestore
// Ejecutar en las Developer Tools del navegador PASO A PASO

console.log('🔧 Iniciando test simple de Firestore...');

// PASO 1: Verificar que hay un usuario autenticado
console.log('👤 Verificando usuario...');

// PASO 2: Test directo con la configuración conocida
(async function simpleFirestoreTest() {
    try {
        console.log('📊 Estado inicial:');
        console.log('- URL actual:', window.location.href);
        console.log('- Usuario logueado:', !!window.localStorage.getItem('firebase:authUser:AIzaSyAW8yejnIrZbO4MqYmCNbGmAAhlRkwQh90:[DEFAULT]'));
        
        // Configuración Firebase conocida
        const firebaseConfig = {
            apiKey: "AIzaSyAW8yejnIrZbO4MqYmCNbGmAAhlRkwQh90",
            authDomain: "glamdash-v2.firebaseapp.com",
            projectId: "glamdash-v2",
            storageBucket: "glamdash-v2.appspot.com",
            messagingSenderId: "728543552523",
            appId: "1:728543552523:web:0b9ce3020049134101130e"
        };

        // Importar módulos Firebase usando dynamic import
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore, collection, addDoc, getDoc, deleteDoc, doc } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        console.log('📱 Módulos Firebase importados exitosamente');

        // Obtener o inicializar la app
        let app;
        const apps = getApps();
        if (apps.length > 0) {
            app = apps[0];
            console.log('✅ Usando app Firebase existente:', app.name);
        } else {
            app = initializeApp(firebaseConfig);
            console.log('🆕 Nueva app Firebase inicializada');
        }

        // Obtener instancias
        const auth = getAuth(app);
        const db = getFirestore(app);

        console.log('🔍 Estado de autenticación:', {
            currentUser: !!auth.currentUser,
            uid: auth.currentUser?.uid || 'No hay usuario'
        });

        if (!auth.currentUser) {
            console.log('❌ No hay usuario autenticado. Asegúrate de estar logueado en la aplicación.');
            return;
        }

        const user = auth.currentUser;
        console.log('👤 Usuario autenticado:', user.uid);

        // Datos de prueba
        const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';
        const testData = {
            testMessage: 'Prueba de escritura directa',
            timestamp: new Date(),
            userId: user.uid,
            testId: Math.random().toString(36).substr(2, 9)
        };

        console.log('📝 Intentando escribir en Firestore...');
        console.log('📍 Ruta:', `studios/${studioId}/budgets`);
        console.log('📦 Datos:', testData);

        // Crear referencia a la colección
        const budgetsRef = collection(db, 'studios', studioId, 'budgets');
        
        // Intentar escribir
        const docRef = await addDoc(budgetsRef, testData);
        console.log('✅ ¡ÉXITO! Documento creado con ID:', docRef.id);

        // Leer el documento para confirmar
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            console.log('✅ Documento leído correctamente:', docSnapshot.data());
        } else {
            console.log('❌ No se pudo leer el documento');
        }

        // Limpiar - eliminar documento de prueba
        await deleteDoc(docRef);
        console.log('🧹 Documento de prueba eliminado');

        console.log('🎉 ¡TEST COMPLETADO CON ÉXITO!');
        console.log('💡 Conclusión: Firestore funciona perfectamente');
        console.log('🔍 El problema debe estar en el código de la aplicación, no en los permisos de Firebase');

    } catch (error) {
        console.error('❌ ERROR en el test:', error);
        console.log('� Información del error:');
        console.log('- Código:', error.code);
        console.log('- Mensaje:', error.message);
        console.log('- Stack:', error.stack);
        
        if (error.code === 'permission-denied') {
            console.log('🚫 Error de permisos - revisar Firestore Rules');
        } else if (error.message.includes('offline')) {
            console.log('� Error de conectividad');
        } else if (error.message.includes('not-found')) {
            console.log('🔍 El documento o colección no existe');
        }
    }
})();

console.log('⏳ Test en progreso...');
