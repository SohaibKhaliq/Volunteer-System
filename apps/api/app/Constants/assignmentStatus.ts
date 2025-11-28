export const AssignmentStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Completed: 'completed',
  Cancelled: 'cancelled'
} as const

export const ALL_ASSIGNMENT_STATUSES = Object.values(AssignmentStatus) as string[]

export default AssignmentStatus
