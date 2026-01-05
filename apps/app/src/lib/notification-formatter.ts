/**
 * Notification Formatter
 * 
 * Helper utility to convert raw notification types and payloads into human-readable text.
 */

const TYPE_MAPPING: Record<string, string> = {
  'resource.assignment.overdue': 'Resource Assignment Overdue',
  'resource.assignment.event.overdue': 'Event Resource Overdue',
  'resource.low_stock': 'Low Stock Alert',
  'resource.maintenance_due': 'Maintenance Due',
  'shift.assignment.created': 'Shift Assigned',
  'shift.assignment.cancelled': 'Shift Cancelled',
  'compliance.document.expired': 'Compliance Document Expired',
  'compliance.document.rejected': 'Compliance Document Rejected',
  'application.received': 'New Application Received',
  'user.registered': 'New User Registration',
};

const PAYLOAD_KEY_MAPPING: Record<string, string> = {
  assignmentId: 'Assignment ID',
  resourceId: 'Resource ID',
  eventId: 'Event ID',
  userId: 'User ID',
  organizationId: 'Organization ID',
  shiftId: 'Shift ID',
  documentId: 'Document ID',
};

export const NotificationFormatter = {
  /**
   * Format a notification type key into a human-readable title
   */
  formatType: (type: string): string => {
    if (TYPE_MAPPING[type]) {
      return TYPE_MAPPING[type];
    }
    
    // Fallback: Replace dots/underscores with spaces and Title Case
    return type
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  },

  /**
   * Format a payload key into a human-readable label
   */
  formatKey: (key: string): string => {
    if (PAYLOAD_KEY_MAPPING[key]) {
      return PAYLOAD_KEY_MAPPING[key];
    }
    
    // Fallback: spaces for camelCase
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  },

  /**
   * Attempt to generate a summary sentence from payload
   */
  getSummary: (type: string, payload: any): string => {
    const p = typeof payload === 'string' ? JSON.parse(payload) : payload || {};
    
    if (type.includes('resource.assignment')) {
      const resName = p.resourceName ? `'${p.resourceName}'` : (p.resourceId ? `#${p.resourceId}` : 'Resource');
      const eventName = p.eventName ? `'${p.eventName}'` : (p.eventId ? `#${p.eventId}` : 'Event');
      
      if (p.resourceId && p.eventId) {
        return `Resource ${resName} is overdue for Event ${eventName}`;
      }
      if (p.assignmentId) {
        return `Assignment #${p.assignmentId} requires attention`;
      }
    }

    if (p.userName && p.userRegistered) {
       return `User ${p.userName} has registered`;
    }
    
    if (p.message) return p.message;
    if (p.subject) return p.subject;
    
    return '';
  }
};
