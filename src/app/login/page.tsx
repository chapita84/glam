
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  console.log("DEBUG: Renderizando /login page");

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, currentUser, loading: authLoading } = useAuth();
  
  if (authLoading || currentUser) {
    console.log("DEBUG: Auth loading or user already logged in, showing loader...");
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }
  
  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    console.log(`DEBUG: [handleLogin] Intentando iniciar sesión para: ${email}`);
    try {
      await login(email, password);
      console.log(`DEBUG: [handleLogin] La función login() del AuthContext se completó.`);
    } catch (error: any) {
      console.error("DEBUG: [handleLogin] Error en el inicio de sesión:", error);
      let errorMessage = "Ocurrió un error al iniciar sesión.";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Credenciales incorrectas. Por favor, verifica tu email y contraseña.";
      }
      setError(errorMessage);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="grid gap-2"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoggingIn}>{isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Iniciar Sesión</Button>
            <Link href="/forgot-password" passHref><Button variant="link" size="sm">¿Olvidaste tu contraseña?</Button></Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
