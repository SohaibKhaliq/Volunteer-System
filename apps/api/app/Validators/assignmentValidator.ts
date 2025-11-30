import { z } from 'zod'

export const assignResourceSchema = z.object({
  resourceId: z.number().int(),
  quantity: z.number().int().min(1).optional().default(1),
  assignmentType: z.enum(['event', 'volunteer', 'maintenance']),
  relatedId: z.number().int().optional(),
  expectedReturnAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
})

export const returnResourceSchema = z.object({
  condition: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  returnedAt: z.string().nullable().optional()
})

export type AssignResource = z.infer<typeof assignResourceSchema>
export type ReturnResource = z.infer<typeof returnResourceSchema>
