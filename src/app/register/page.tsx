
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle, Loader2, Sparkles } from "lucide-react"
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { z } from 'zod'

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 17.5a2.5 2.5 0 0 1-5 0" />
      <path d="M22 10.5v3c0 1.25-.75 4.5-4.5 4.5H6.5c-3.75 0-4.5-3.25-4.5-4.5v-3c0-1.25.75-4.5 4.5-4.5h11c3.75 0 4.5 3.25 4.5 4.5Z" />
      <path d="M8 11h.01" />
      <path d="M16 11h.01" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const registerSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
})

export default function RegisterPage() {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [firebaseError, setFirebaseError] = useState('');
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setFirebaseError('');
        setErrors({});

        const validatedFields = registerSchema.safeParse(formData);

        if (!validatedFields.success) {
            setErrors(validatedFields.error.flatten().fieldErrors);
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, validatedFields.data.email, validatedFields.data.password);
            const user = userCredential.user;
            await updateProfile(user, {
                displayName: validatedFields.data.fullName,
            });
            router.push('/onboarding/create-studio');
        } catch (error: any) {
            let errorMessage = 'Error al registrar el usuario. Por favor, inténtalo de nuevo.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo electrónico ya está registrado.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El formato del correo electrónico no es válido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es demasiado débil.';
                    break;
            }
            setFirebaseError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-4">
                <div className="text-center mb-8">
                    <Sparkles className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-4xl font-bold tracking-wider mt-2">Glam&Beauty <span className="text-accent">Dash</span></h1>
                    <p className="text-muted-foreground">Crea una cuenta para empezar a gestionar tu estudio o reservar servicios.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
                        <CardDescription>
                            Ingresa tus datos a continuación para crear tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            {firebaseError && (
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Error de Registro</AlertTitle>
                                    <AlertDescription>
                                        {firebaseError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Nombre Completo</Label>
                                <Input id="fullName" name="fullName" placeholder="Tu Nombre" required onChange={handleChange} />
                                {errors.fullName && <p className="text-sm font-medium text-destructive">{errors.fullName[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="nombre@ejemplo.com"
                                    required
                                    onChange={handleChange}
                                />
                                {errors.email && <p className="text-sm font-medium text-destructive">{errors.email[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input id="password" name="password" type="password" required onChange={handleChange} />
                                {errors.password && <p className="text-sm font-medium text-destructive">{errors.password[0]}</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Cuenta"}
                            </Button>
                        </form>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    O registrarse con
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline"><GoogleIcon className="mr-2 h-4 w-4" /> Google</Button>
                            <Button variant="outline"><FacebookIcon className="mr-2 h-4 w-4" /> Facebook</Button>
                        </div>
                        <div className="mt-6 text-center text-sm">
                            ¿Ya tienes una cuenta?{" "}
                            <Link href="/login" className="underline">
                                Iniciar Sesión
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
