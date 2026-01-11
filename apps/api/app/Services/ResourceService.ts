import Resource from 'App/Models/Resource'
import ResourceAssignment from 'App/Models/ResourceAssignment'
import AuditLog from 'App/Models/AuditLog'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import { DateTime } from 'luxon'

export default class ResourceService {
  /**
   * Provisioning: Admin assigns bulk stock to an Org
   * Note: In this simplified model, we might just be setting the org_id on resources
   * or creating new resource records for the org.
   * Assuming here we are creating/allocating a block of resources or updating existing ones.
   * For this specific requirement "Admin assigns bulk stock", let's assume we are updating the organization_id.
   */
  public async allocateToOrg(resourceIds: number[], orgId: number, adminUser: User) {
    const org = await Organization.findOrFail(orgId)
    
    // Update resources
    await Resource.query()
      .whereIn('id', resourceIds)
      .update({ organizationId: org.id })

    // Log for each resource
    for (const id of resourceIds) {
      await this.logCustodyChain(id, adminUser, 'Allocated to Organization', {
        org_id: org.id,
        org_name: org.name
      })
    }
  }

  /**
   * Distribution: Org assigns specific item to Volunteer
   */
  public async assignToVolunteer(
    resourceId: number, 
    volunteerId: number, 
    orgCoordinator: User,
    notes?: string,
    expectedReturnAt?: DateTime
  ) {
    const resource = await Resource.findOrFail(resourceId)
    const volunteer = await User.findOrFail(volunteerId)

    // Check if resource is available
    if (resource.status === 'in_use' || resource.quantityAvailable < 1) {
      throw new Error('Resource is not available')
    }

    // Create assignment
    const assignment = await ResourceAssignment.create({
      resourceId: resource.id,
      relatedId: volunteer.id, // Assuming relatedId stores the volunteer user ID
      assignmentType: 'volunteer',
      status: ResourceAssignment.STATUS_IN_USE,
      assignedAt: DateTime.now(),
      expectedReturnAt: expectedReturnAt,
      notes: notes,
      quantity: 1 // Assuming 1 unit for now per assignment row
    })

    // Update resource status
    resource.quantityAvailable -= 1
    // If it's a unique item (serial number), mark it as in_use
    if (resource.serialNumber) {
        resource.status = 'in_use'
    }
    await resource.save()

    // Log Custody
    await this.logCustodyChain(resource.id, orgCoordinator, 'Assigned to Volunteer', {
      volunteer_id: volunteer.id,
      assignment_id: assignment.id,
      status_change: 'Allocated -> In Use'
    })

    return assignment
  }

  /**
   * Initiation: Volunteer requests to return item
   * Only applicable if resource is_returnable
   */
  public async requestReturn(assignmentId: number, volunteer: User) {
    const assignment = await ResourceAssignment.findOrFail(assignmentId)
    const resource = await Resource.findOrFail(assignment.resourceId)

    if (!resource.isReturnable) {
      throw new Error('This resource is not returnable')
    }

    // Verify volunteer owns this assignment
    if (assignment.relatedId !== volunteer.id) {
       throw new Error('Unauthorized return request')
    }

    if (assignment.status !== ResourceAssignment.STATUS_IN_USE) {
       throw new Error('Assignment is not in active use')
    }

    assignment.status = ResourceAssignment.STATUS_PENDING_RETURN
    await assignment.save()

    await this.logCustodyChain(resource.id, volunteer, 'Return Requested', {
      assignment_id: assignment.id,
      status_change: 'In Use -> Pending Return'
    })

    return assignment
  }

  /**
   * Reconciliation: Org confirms receipt & condition
   */
  public async confirmReturn(
    assignmentId: number, 
    orgCoordinator: User, 
    condition: string,
    notes?: string
  ) {
    const assignment = await ResourceAssignment.findOrFail(assignmentId)
    const resource = await Resource.findOrFail(assignment.resourceId)

    if (assignment.status !== ResourceAssignment.STATUS_PENDING_RETURN && assignment.status !== ResourceAssignment.STATUS_IN_USE) {
       // Allow returning from IN_USE directly if org initiates the return manually
    }

    assignment.status = ResourceAssignment.STATUS_RETURNED
    assignment.returnedAt = DateTime.now()
    assignment.condition = condition
    if (notes) assignment.notes = (assignment.notes ? assignment.notes + '\n' : '') + notes
    await assignment.save()

    // Update resource availability
    resource.quantityAvailable += 1
    if (resource.serialNumber) {
        resource.status = 'available'
        // If condition is damaged, we might set status to damaged?
        if (condition.toLowerCase() === 'damaged') {
            resource.status = 'damaged'
            resource.quantityAvailable -= 1 // Not available if damaged
        }
    }
    await resource.save()

    await this.logCustodyChain(resource.id, orgCoordinator, 'Return Confirmed', {
      assignment_id: assignment.id,
      condition: condition,
      status_change: 'Pending Return -> Available'
    })

    return assignment
  }

  /**
   * Chain of Custody Log
   */
  private async logCustodyChain(
    resourceId: number, 
    actor: User, 
    action: string, 
    metadata: Record<string, any>
  ) {
    await AuditLog.safeCreate({
      userId: actor.id,
      action: 'custody_chain',
      targetType: 'resource',
      targetId: resourceId,
      details: action,
      metadata: JSON.stringify({
        ...metadata,
        timestamp: DateTime.now().toISO()
      })
    })
  }
}
