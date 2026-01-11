export interface Message {
  id: number
  roomId: number
  senderId: number
  content: string
  type: 'text' | 'system' | 'return_request'
  metadata: any
  readAt: string | null
  createdAt: string
  updatedAt: string
  sender?: {
     id: number
     firstName: string
     lastName: string
     profileImageUrl?: string
  }
}

export interface ChatRoom {
  id: number
  organizationId: number
  volunteerId: number
  resourceId: number | null
  messages: Message[]
  organization?: {
     id: number
     name: string
     logoUrl: string
  }
  volunteer?: {
     id: number
     firstName: string
     lastName: string
     email?: string
     profileImageUrl?: string
  }
  resource?: {
     id: number
     name: string
  }
  teamId?: number
  team?: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}
