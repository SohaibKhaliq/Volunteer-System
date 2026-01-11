import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Certificate from 'App/Models/Certificate'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
// import CertificateTemplate from 'App/Models/CertificateTemplate'

export default class CertificatesController {
  private async getOrganizationId(auth: any): Promise<number | null> {
    if (!auth?.user) return null
    const member = await OrganizationTeamMember.query().where('user_id', auth.user.id).first()
    return member ? member.organizationId : null
  }

  // --- Organization Actions ---
  public async issuedByOrganization({ auth, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    if (!orgId) return response.forbidden({ message: 'User not part of an organization' })

    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    
    const certs = await Certificate.query()
      .where('organization_id', orgId)
      .preload('user')
      .preload('template')
      .preload('module')
      .paginate(page, limit)
      
    return response.ok(certs)
  }

  public async issue({ auth, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    if (!orgId) return response.forbidden({ message: 'User not part of an organization' })
    
    const { userId, templateId, moduleId } = request.only(['userId', 'templateId', 'moduleId'])
    
    // Validate template ownership if needed, for now assume global or valid.
    
    const cert = await Certificate.create({
        organizationId: orgId,
        userId,
        templateId,
        moduleId: moduleId || null,
        status: 'active'
    })
    
    return response.created(cert)
  }

  public async revoke({ auth, params, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    const cert = await Certificate.findOrFail(params.id)
    
    if (!orgId || cert.organizationId !== orgId) {
        return response.forbidden({message: 'Not authorized'})
    }
    
    const { reason } = request.only(['reason'])
    cert.status = 'revoked'
    cert.revocationReason = reason
    await cert.save()
    
    return response.ok(cert)
  }

  // --- Volunteer Actions ---

  public async myCertificates({ auth, response }: HttpContextContract) {
      const certs = await Certificate.query()
        .where('user_id', auth.user!.id)
        .where('status', 'active')
        .preload('organization')
        .preload('template')
        .preload('module')
        
      return response.ok(certs)
  }
  
  public async download({ auth, params, response }: HttpContextContract) {
      const cert = await Certificate.query()
        .where('id', params.id)
        .preload('user')
        .preload('organization')
        .preload('template')
        .firstOrFail()
        
      // Ensure user owns it or is admin/org. 
      if (cert.userId !== auth.user!.id) {
          // Check if org member
          const orgId = await this.getOrganizationId(auth)
          if (!orgId || orgId !== cert.organizationId) {
               return response.forbidden({message: 'Not authorized'})
          }
      }
      
      return response.ok(cert)
  }

  // --- Public Actions ---

  public async verify({ params, response }: HttpContextContract) {
      const uuid = params.uuid
      const cert = await Certificate.query()
        .where('uuid', uuid)
        .preload('user', (q) => q.select('id', 'first_name', 'last_name', 'email'))
        .preload('organization', (q) => q.select('id', 'name'))
        .preload('template')
        .preload('module')
        .first()
        
      if (!cert) {
          return response.notFound({ message: 'Certificate not found' })
      }
      
      return response.ok({
          valid: cert.status === 'active',
          certificate: cert,
          revocationReason: cert.revocationReason
      })
  }
}
