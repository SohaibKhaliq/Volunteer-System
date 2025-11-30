import { z } from 'zod'

export const createResourceSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().default('Other'),
  description: z.string().nullable().optional(),
  quantityTotal: z.number().int().nonnegative().optional().default(0),
  quantityAvailable: z.number().int().nonnegative().optional().default(0),
  status: z
    .enum(['available', 'maintenance', 'reserved', 'in_use', 'retired'])
    .optional()
    .default('available'),
  location: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  maintenanceDue: z.string().nullable().optional(),
  attributes: z.any().optional(),
  organizationId: z.number().int().optional()
})

export const updateResourceSchema = createResourceSchema.partial()

export type CreateResource = z.infer<typeof createResourceSchema>
export type UpdateResource = z.infer<typeof updateResourceSchema>
