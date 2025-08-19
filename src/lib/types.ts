
import { z } from "zod";

// --- Service & Category ---
export const ServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  duration: z.number().min(1, "La duración debe ser mayor a 0"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  categoryId: z.string().optional(),
});
export type Service = z.infer<typeof ServiceSchema>;

export interface Category {
  id: string;
  name: string;
}

// --- User, Roles & Studios (New Data Model) ---
export type GlobalRole = 'superAdmin' | 'owner' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  globalRole: GlobalRole;
}

export interface StudioRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface StudioMember {
  userId: string;
  studioId: string;
  roleId: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
}

// --- Appointments, TimeBlocks & Staff ---
export interface Appointment {
  id: string;
  start: Date;
  end: Date;
  serviceId: string;
  staffId: string;
  clientId: string;
  clientName?: string;
  serviceName?: string;
  staffName?: string;
  notes?: string;
}

export interface TimeBlock {
  id: string;
  start: Date;
  end: Date;
  reason: string;
  isAllDay: boolean;
  createdAt?: any;
}


// --- Budget ---
export const BudgetItemSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria."),
  category: z.string().min(1, "La categoría es obligatoria."),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1."),
  unitCost: z.object({
      amount: z.number().min(0, "El costo unitario no puede ser negativo."),
      currency: z.enum(['USD', 'ARS']),
  }),
  duration: z.number().optional(),
});
export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export const BudgetSchema = z.object({
  id: z.string().optional(),
  budgetName: z.string().min(3, "El nombre del presupuesto es obligatorio."),
  clientName: z.string().min(1, "El nombre del cliente es obligatorio."),
  eventInfo: z.object({
    type: z.string().min(1, "El tipo de evento es obligatorio."),
    date: z.string().min(1, "La fecha es obligatoria."),
    time: z.string().min(1, "La hora es obligatoria."),
    location: z.string().min(1, "La ubicación es obligatoria."),
  }),
  items: z.array(BudgetItemSchema),
  summary: z.object({
      subtotal: z.number(),
      logistics: z.number(),
      totalUSD: z.number(),
      exchangeRate: z.number(),
      totalARS: z.number(),
  }),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});
export type Budget = z.infer<typeof BudgetSchema>;
