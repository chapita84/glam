
'use server'

import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
})

type FormState = {
  message: string;
  errors?: {
    email?: string[];
    password?: string[];
  }
}

export async function handleLogin(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      message: 'Datos de formulario no válidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Aquí iría la lógica de autenticación real con una base de datos o un proveedor de autenticación.
  // Por ahora, simularemos un inicio de sesión exitoso si el email no es "error@example.com"
  if (validatedFields.data.email === 'error@example.com') {
      return { message: 'Correo electrónico o contraseña incorrectos.' };
  }
  
  // Simulación de inicio de sesión exitoso
  return { message: 'success' };
}
