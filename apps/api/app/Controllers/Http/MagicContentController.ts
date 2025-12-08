import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GeminiService from 'App/Services/GeminiService'

export default class MagicContentController {
  private gemini: GeminiService

  constructor() {
    this.gemini = new GeminiService()
  }

  public async generateDescription({ request, response }: HttpContextContract) {
    const { roughNotes } = request.only(['roughNotes'])

    if (!roughNotes) {
        return response.badRequest('roughNotes are required')
    }

    const prompt = \`
      You are an expert copywriter for non-profit organizations.
      Take the following rough notes and rewrite them into an inspiring, engaging event description (approx 150 words).
      Also generate 3 social media captions (Twitter/LinkedIn/Instagram styles).

      Rough Notes: "\${roughNotes}"

      Return JSON: { "description": "...", "captions": ["...", "...", "..."] }
    \`

    const result = await this.gemini.generateContent(prompt)

    // Attempt to parse JSON from AI response
    try {
        const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonStr)
        return response.ok(data)
    } catch (e) {
        // Fallback
        return response.ok({
            description: result,
            captions: []
        })
    }
  }
}
