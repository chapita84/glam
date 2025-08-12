
'use server'

import { auth } from '@/lib/firebase/config'
import { signInWithEmailAndPassword } from 'firebase/auth'

export async function signInWithEmail(email: string, password: string):Promise<void> {
    await signInWithEmailAndPassword(auth, email, password)
}
