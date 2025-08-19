import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserRecord } from 'firebase-admin/auth';

// Helper function to check if the user is a Super Admin
async function isSuperAdmin(uid: string): Promise<boolean> {
    try {
        const user = await adminAuth.getUser(uid);
        return user.customClaims?.globalRole === 'superAdmin';
    } catch (error) {
        console.error('Error checking admin claims:', error);
        return false;
    }
}

// GET /api/admin/users - List all users (Super Admin only)
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const idToken = authHeader?.split('Bearer ')[1];

        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        if (!await isSuperAdmin(uid)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // List all users from Firebase Auth
        const listUsersResult = await adminAuth.listUsers(1000); // Adjust batch size as needed
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            globalRole: userRecord.customClaims?.globalRole || 'customer', // Default to customer
            disabled: userRecord.disabled,
        }));

        // Optionally, fetch additional data from Firestore 'users' collection if needed
        // const usersCollectionRef = collection(adminDb, 'users');
        // const querySnapshot = await getDocs(usersCollectionRef);
        // const firestoreUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Merge or use firestoreUsers data as required

        return NextResponse.json(users);

    } catch (error: any) {
        console.error('Error listing users:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/users - Create a new user (Super Admin only)
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const idToken = authHeader?.split('Bearer ')[1];

        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const adminUid = decodedToken.uid;

        if (!await isSuperAdmin(adminUid)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { email, password, displayName, globalRole } = await request.json();

        if (!email || !password || !globalRole) {
            return NextResponse.json({ error: 'Email, password, and globalRole are required' }, { status: 400 });
        }

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName,
        });

        // Set custom claims for global role
        await adminAuth.setCustomUserClaims(userRecord.uid, { globalRole });

        // Optionally, save additional data to Firestore 'users' collection
        // await setDoc(doc(adminDb, 'users', userRecord.uid), {
        //     email,
        //     displayName,
        //     globalRole,
        //     createdAt: serverTimestamp(),
        // });

        return NextResponse.json({ message: 'User created successfully', uid: userRecord.uid });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/admin/users/[uid] - Update a user (Super Admin only)
// This route would typically be /api/admin/users/<uid> but for simplicity using a single file
// In a real app, you'd use dynamic routes: app/api/admin/users/[uid]/route.ts
// This example shows how to handle update logic within a single route file for demonstration
export async function PUT(request: Request) {
     try {
        const authHeader = request.headers.get('Authorization');
        const idToken = authHeader?.split('Bearer ')[1];

        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const adminUid = decodedToken.uid;

        if (!await isSuperAdmin(adminUid)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { uid, globalRole, displayName, disabled } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: 'User UID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (disabled !== undefined) updateData.disabled = disabled;

        // Update user in Firebase Auth
        if (Object.keys(updateData).length > 0) {
             await adminAuth.updateUser(uid, updateData);
        }

        // Update custom claims for global role if provided
        if (globalRole !== undefined) {
             await adminAuth.setCustomUserClaims(uid, { globalRole });
        }

        // Optionally, update data in Firestore 'users' collection
        // if (Object.keys(updateData).length > 0 || globalRole !== undefined) {
        //      await updateDoc(doc(adminDb, 'users', uid), { ...updateData, globalRole });
        // }

        return NextResponse.json({ message: `User ${uid} updated successfully` });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}


// DELETE /api/admin/users/[uid] - Delete a user (Super Admin only)
// Similar to PUT, in a real app, you'd use dynamic routes
export async function DELETE(request: Request) {
     try {
        const authHeader = request.headers.get('Authorization');
        const idToken = authHeader?.split('Bearer ')[1];

        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const adminUid = decodedToken.uid;

        if (!await isSuperAdmin(adminUid)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: 'User UID is required' }, { status: 400 });
        }

        // Delete user from Firebase Auth
        await adminAuth.deleteUser(uid);

        // Optionally, delete user document from Firestore 'users' collection
        // await deleteDoc(doc(adminDb, 'users', uid));

        return NextResponse.json({ message: `User ${uid} deleted successfully` });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
