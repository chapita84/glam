

'use client'

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { handleLogin } from "@/app/login/actions"
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
import { Terminal, Loader2, Sparkles } from "lucide-react"
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

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

const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
        </Button>
    )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(handleLogin, {
    message: "",
  });

  useEffect(() => {
    if (state.message === 'success') {
      redirect('/dashboard');
    }
  }, [state.message]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-wider mt-2">Glam&Beauty <span className="text-accent">Dash</span></h1>
            <p className="text-muted-foreground">¡Bienvenido de nuevo! Por favor, inicia sesión en tu cuenta.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico a continuación para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4">
              {state.message && state.message !== 'success' && (
                  <Alert variant="destructive">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Error de inicio de sesión</AlertTitle>
                      <AlertDescription>
                          {state.message}
                      </AlertDescription>
                  </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  required
                />
                 {state.errors?.email && <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
                {state.errors?.password && <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>}
              </div>
              <SubmitButton />
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  O continuar con
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline"><GoogleIcon className="mr-2 h-4 w-4"/>Google</Button>
                <Button variant="outline"><FacebookIcon className="mr-2 h-4 w-4"/>Facebook</Button>
            </div>
            <div className="mt-6 text-center text-sm">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="underline">
                Regístrate
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
