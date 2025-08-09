
'use server'

import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
})

type FormState = {
  message: string;
  errors?: {
    email?: string[];
  }
}

export async function handleForgotPassword(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return {
      message: 'Datos de formulario no válidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Aquí iría la lógica real para generar un token y enviar el correo.
  // Por ahora, siempre devolveremos un mensaje de éxito para no revelar si un correo electrónico está registrado o no.
  
  console.log('Solicitud de recuperación para:', validatedFields.data.email);
  return { message: 'success' };
}
