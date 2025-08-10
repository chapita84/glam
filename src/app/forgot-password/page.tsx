

'use client'

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { handleForgotPassword } from "@/app/forgot-password/actions"
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

const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
             {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar enlace de recuperación"}
        </Button>
    )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(handleForgotPassword, {
    message: "",
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-wider mt-2">Glam&Beauty <span className="text-accent">Dash</span></h1>
            <p className="text-muted-foreground">Recupera el acceso a tu cuenta.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.message === 'success' ? (
                 <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>¡Revisa tu correo!</AlertTitle>
                    <AlertDescription>
                        Si existe una cuenta con ese correo, hemos enviado un enlace para restablecer tu contraseña.
                    </AlertDescription>
                </Alert>
            ) : (
                <form action={formAction} className="grid gap-4">
                    {state.message && state.message !== 'success' && (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
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
                    <SubmitButton />
                </form>
            )}
            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="underline">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
