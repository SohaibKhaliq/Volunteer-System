import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import AuditLog from 'App/Models/AuditLog'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OrganizationInvitesController {
  /**
   * Get all invites for an organization
   */
  public async index({ params, request, response }: HttpContextContract) {
    const { organizationId } = params
    const { status } = request.qs()

    let query = OrganizationInvite.query().where('organization_id', organizationId)

    if (status) {
      query = query.where('status', status)
    }

    const invites = await query
      .preload('organization')
      .preload('inviter')
      .orderBy('created_at', 'desc')

    return response.ok(invites)
  }

  /**
   * Send an invitation
   */
  public async store({ params, request, response, auth }: HttpContextContract) {
    const { organizationId } = params
    const {
      email,
      first_name,
      last_name,
      role = 'volunteer',
      message
    } = request.only(['email', 'first_name', 'last_name', 'role', 'message'])

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound({ message: 'Organization not found' })
    }

    // Check if user already exists and is already a volunteer
    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      const existing = await Database.from('organization_volunteers')
        .where('organization_id', organizationId)
        .where('user_id', existingUser.id)
        .first()

      if (existing) {
        return response.conflict({ message: 'User is already a volunteer for this organization' })
      }
    }

    // Check for existing pending invitation
    const existingInvite = await OrganizationInvite.query()
      .where('organization_id', organizationId)
      .where('email', email)
      .where('status', 'pending')
      .first()

    if (existingInvite && !existingInvite.isExpired()) {
      return response.conflict({ message: 'An active invitation already exists for this email' })
    }

    // Create invitation
    const token = OrganizationInvite.generateToken()
    const expiresAt = DateTime.now().plus({ days: 7 })

    const invite = await OrganizationInvite.create({
      organizationId: parseInt(organizationId),
      email,
      firstName: first_name,
      lastName: last_name,
      role,
      message,
      token,
      expiresAt,
      invitedBy: auth.user?.id,
      status: 'pending'
    })

    // TODO: Send email with invitation link
    // await Mail.send((mailer) => {
    //   mailer
    //     .from('noreply@Local Aid.com')
    //     .to(email)
    //     .subject(`You're invited to join ${org.name}`)
    //     .htmlView('emails/organization_invite', { invite, org, token })
    // })

    return response.created({
      message: 'Invitation sent successfully',
      invite
    })
  }

  /**
   * Resend an invitation
   */
  public async resend({ params, response }: HttpContextContract) {
    const invite = await OrganizationInvite.find(params.id)
    if (!invite) {
      return response.notFound({ message: 'Invitation not found' })
    }

    if (invite.status !== 'pending') {
      return response.badRequest({ message: 'Can only resend pending invitations' })
    }

    // Generate new token and extend expiration
    invite.token = OrganizationInvite.generateToken()
    invite.expiresAt = DateTime.now().plus({ days: 7 })
    await invite.save()

    // TODO: Send email

    return response.ok({ message: 'Invitation resent successfully' })
  }

  /**
   * Accept an invitation (public endpoint, uses token)
   */
  public async accept({ request, response, auth }: HttpContextContract) {
    const { token } = request.params()

    const invite = await OrganizationInvite.query()
      .where('token', token)
      .preload('organization')
      .first()

    if (!invite) {
      return response.notFound({ message: 'Invalid invitation token' })
    }

    if (!invite.isValid()) {
      return response.badRequest({
        message: invite.isExpired() ? 'Invitation has expired' : 'Invitation is no longer valid'
      })
    }

    // Check if user is authenticated
    if (!auth.user) {
      return response.unauthorized({ message: 'You must be logged in to accept invitations' })
    }

    // Check if email matches
    if (auth.user.email !== invite.email) {
      return response.forbidden({ message: 'This invitation is for a different email address' })
    }

    // Check if already a volunteer
    const existing = await Database.from('organization_volunteers')
      .where('organization_id', invite.organizationId)
      .where('user_id', auth.user.id)
      .first()

    if (existing) {
      await invite.accept()
      return response.ok({
        message: 'You are already a volunteer for this organization',
        organization: invite.organization
      })
    }

    // Add volunteer to organization
    await invite.organization.related('volunteers').attach({
      [auth.user.id]: {
        role: invite.role,
        status: 'active',
        joined_at: DateTime.now().toSQL()
      }
    })

    // Mark  invitation as accepted
    await invite.accept()

    return response.ok({
      message: `Welcome to ${invite.organization.name}!`,
      organization: invite.organization
    })
  }

  /**
   * Reject an invitation
   */
  public async reject({ request, response }: HttpContextContract) {
    const { token } = request.params()

    const invite = await OrganizationInvite.query().where('token', token).first()

    if (!invite) {
      return response.notFound({ message: 'Invalid invitation token' })
    }

    if (invite.status !== 'pending') {
      return response.badRequest({ message: 'Invitation has already been responded to' })
    }

    await invite.reject()

    return response.ok({ message: 'Invitation declined' })
  }

  /**
   * Cancel an invitation
   */
  public async destroy({ params, response }: HttpContextContract) {
    const invite = await OrganizationInvite.find(params.id)
    if (!invite) {
      return response.notFound({ message: 'Invitation not found' })
    }

    if (invite.status !== 'pending') {
      return response.badRequest({ message: 'Can only cancel pending invitations' })
    }

    await invite.cancel()

    return response.ok({ message: 'Invitation cancelled' })
  }

  /**
   * Admin accept: allow an admin to accept an invite on behalf of a user
   * Request body should include { userId } (the user to attach). This is
   * an admin-only operation.
   */
  public async adminAccept({ params, request, auth, response }: HttpContextContract) {
    // authenticate admin
    await auth.use('api').authenticate()
    const user = auth.user!
    if (!user || !(user.isAdmin || (user.roles && Array.isArray(user.roles) && user.roles.some((r: any) => String(r?.name ?? r?.role ?? '').toLowerCase().includes('admin'))))) {
      return response.unauthorized({ message: 'Admin access required' })
    }

    const { organizationId } = params
    const inviteId = params.id
    const userId = request.input('userId')

    if (!userId) return response.badRequest({ message: 'userId is required' })

    const invite = await OrganizationInvite.query().where('organization_id', organizationId).where('id', inviteId).first()
    if (!invite) return response.notFound({ message: 'Invitation not found' })
    if (invite.status !== 'pending') return response.badRequest({ message: 'Invitation is not pending' })

    const targetUser = await User.find(userId)
    if (!targetUser) return response.notFound({ message: 'User not found' })

    // Attach user to organization as a volunteer
    const org = await Organization.find(organizationId)
    if (!org) return response.notFound({ message: 'Organization not found' })

    await org.related('volunteers').attach({ [targetUser.id]: { role: invite.role, status: 'active', joined_at: DateTime.now().toSQL() } })

    // Mark invite accepted
    await invite.accept()

    // Log audit
    await AuditLog.create({ userId: user.id, action: 'invite_accepted_by_admin', targetType: 'organization', targetId: invite.organizationId, metadata: JSON.stringify({ inviteId: invite.id, acceptedFor: targetUser.id }) })

    return response.ok({ message: 'Invite accepted', invite })
  }
}
