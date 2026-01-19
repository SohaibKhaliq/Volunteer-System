import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Certificate from 'App/Models/Certificate'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Drive from '@ioc:Adonis/Core/Drive'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'

export default class CertificatesController {
  private async getOrganizationId(auth: any): Promise<number | null> {
    if (!auth?.user) return null
    const member = await OrganizationTeamMember.query().where('user_id', auth.user.id).first()
    return member ? member.organizationId : null
  }
  
  // --- Admin Actions ---
  public async index({ auth, response }: HttpContextContract) {
    if (!auth.user!.isAdmin) return response.forbidden({ message: 'Admin access required' })
    const certs = await Certificate.query()
      .preload('user')
      .preload('organization')
      .preload('recipientOrganization')
      .preload('module')
      
    return response.ok(certs)
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
      .preload('recipientOrganization')
      .preload('module')
      .paginate(page, limit)
      
    return response.ok(certs)
  }

  public async issue({ auth, request, response }: HttpContextContract) {
    let issuingOrgId = await this.getOrganizationId(auth)
    const { userId, recipientOrgId, moduleId, recipientType, organizationId: providedOrgId } = request.only([
      'userId', 'recipientOrgId', 'moduleId', 'recipientType', 'organizationId'
    ])

    if (auth.user!.isAdmin && providedOrgId) {
      issuingOrgId = Number(providedOrgId)
    }

    if (!issuingOrgId) return response.forbidden({ message: 'Issuing organization not specified' })
    
    const certificateFile = request.file('certificate_file', {
      size: '10mb',
      extnames: ['pdf', 'jpg', 'jpeg', 'png']
    })

    if (!certificateFile) {
      return response.badRequest({ message: 'Certificate file is required' })
    }

    if (!certificateFile.isValid) {
      return response.badRequest(certificateFile.errors)
    }

    const fileName = `${uuidv4()}.${certificateFile.extname}`
    await certificateFile.moveToDisk('certificates', {
      name: fileName
    })

    const certData: any = {
      organizationId: issuingOrgId,
      moduleId: moduleId || null,
      filePath: fileName,
      fileName: certificateFile.clientName,
      fileType: certificateFile.extname,
      recipientType: recipientType || 'volunteer',
      status: 'active',
      issuedAt: DateTime.local()
    }

    if (recipientType === 'organization') {
      certData.recipientOrganizationId = recipientOrgId
      certData.userId = null
    } else {
      certData.userId = userId || auth.user!.id
      certData.recipientOrganizationId = null
    }

    const cert = await Certificate.create(certData)
    
    return response.created(cert)
  }

  public async revoke({ auth, params, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    const cert = await Certificate.findOrFail(params.id)
    
    if (!auth.user!.isAdmin) {
        if (!orgId || cert.organizationId !== orgId) {
            return response.forbidden({message: 'Not authorized'})
        }
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
        .preload('module')
        
      return response.ok(certs)
  }
  
  public async download({ auth, params, response }: HttpContextContract) {
      const cert = await Certificate.query()
        .where('id', params.id)
        .preload('user')
        .preload('organization')
        .preload('recipientOrganization')
        .firstOrFail()
        
      // Ensure user owns it or is admin/org member. 
      const isOwner = cert.userId === auth.user!.id
      const isRecipientOrgMember = cert.recipientType === 'organization' && 
                                   cert.recipientOrganizationId && 
                                   (await OrganizationTeamMember.query().where('user_id', auth.user!.id).where('organization_id', cert.recipientOrganizationId).first())
      
      if (!isOwner && !isRecipientOrgMember) {
          const orgId = await this.getOrganizationId(auth)
          if (!orgId || orgId !== cert.organizationId) {
               // Also allow admins
               if (!auth.user!.isAdmin) {
                 return response.forbidden({message: 'Not authorized'})
               }
          }
      }

      const filePath = `certificates/${cert.filePath}`
      if (!(await Drive.exists(filePath))) {
        return response.notFound({ message: 'File not found on disk' })
      }

      const stream = await Drive.getStream(filePath)
      
      response.header('Content-Type', this.getContentType(cert.fileType))
      response.header('Content-Disposition', `attachment; filename="${cert.fileName}"`)
      
      return response.stream(stream)
  }

  private getContentType(ext: string | null): string {
    switch (ext?.toLowerCase()) {
      case 'pdf': return 'application/pdf'
      case 'png': return 'image/png'
      case 'jpg':
      case 'jpeg': return 'image/jpeg'
      default: return 'application/octet-stream'
    }
  }

  // --- Public Actions ---

  public async verify({ params, response }: HttpContextContract) {
      const uuid = params.uuid
      const cert = await Certificate.query()
        .where('uuid', uuid)
        .preload('user', (q) => q.select('id', 'first_name', 'last_name', 'email'))
        .preload('organization', (q) => q.select('id', 'name'))
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
