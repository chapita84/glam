
'use server'

import { z } from 'zod'

const registerSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
})

type FormState = {
  message: string;
  errors?: {
    fullName?: string[];
    email?: string[];
    password?: string[];
  }
}

export async function handleRegister(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      message: 'Datos de formulario no válidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Aquí iría la lógica de registro real con una base de datos.
  // Por ahora, simularemos un error si el email ya existe.
  if (validatedFields.data.email === 'test@example.com') {
      return { 
          message: 'Este correo electrónico ya está registrado.',
          errors: {
              email: ['Este correo electrónico ya está registrado.']
          }
      };
  }
  
  // Simulación de registro exitoso
  console.log('Usuario registrado:', validatedFields.data);
  return { message: 'success' };
}
