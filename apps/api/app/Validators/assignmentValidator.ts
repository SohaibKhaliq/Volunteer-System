import { z } from 'zod'

export const createAssignmentSchema = z.object({
  shift_id: z.number(),
  task_id: z.number().optional(),
  user_id: z.number(),
  assigned_by: z.number().optional()
})

export const bulkAssignSchema = z.object({
  shift_id: z.number(),
  task_id: z.number().optional(),
  user_ids: z.array(z.number()),
  assigned_by: z.number().optional()
})

export const assignResourceSchema = z
  .object({
    // resourceId may be provided in body or inferred from URL params
    resourceId: z.number().int().optional(),
    quantity: z.number().int().min(1).optional().default(1),
    // assignmentType is required (frontend must supply it)
    assignmentType: z.enum(['event', 'volunteer', 'maintenance']),
    relatedId: z.number().int().optional(),
    expectedReturnAt: z.string().nullable().optional(),
    notes: z.string().nullable().optional()
  })
  .superRefine((val, ctx) => {
    // For event or volunteer assignments, a relatedId must be provided
    if ((val.assignmentType === 'event' || val.assignmentType === 'volunteer') && !val.relatedId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'relatedId is required for event or volunteer assignments',
        path: ['relatedId']
      })
    }
  })

export const returnResourceSchema = z.object({
  condition: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  returnedAt: z.string().nullable().optional()
})

export type AssignResource = z.infer<typeof assignResourceSchema>
export type ReturnResource = z.infer<typeof returnResourceSchema>
