import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    await adminAuth.setCustomUserClaims(uid, { globalRole: 'superAdmin' });

    return NextResponse.json({ message: `User ${uid} has been made a super admin.` });
  } catch (error) {
    console.error('Error setting custom claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
