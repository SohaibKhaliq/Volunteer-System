import { z } from 'zod'

export const createShiftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_id: z.number().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  capacity: z.number().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().optional(),
  template_name: z.string().optional(),
  locked: z.boolean().optional(),
  organization_id: z.number().optional()
})

export const updateShiftSchema = createShiftSchema.partial()
