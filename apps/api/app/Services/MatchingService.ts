import GeminiService from './GeminiService'
import SkillVector from 'App/Models/SkillVector'
import Opportunity from 'App/Models/Opportunity'
import User from 'App/Models/User'

export default class MatchingService {
  private gemini: GeminiService

  constructor() {
    this.gemini = new GeminiService()
  }

  /**
   * Calculates the cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      magnitudeA += vecA[i] * vecA[i]
      magnitudeB += vecB[i] * vecB[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  }

  /**
   * Update User's Vector based on their bio/skills
   */
  public async updateUserVector(user: User) {
    // Correctly serialize skills if it's an array or relation
    // We assume skills might be loaded or we just use bio for now if skills is complex
    // If skills is a ManyToMany, we should map it.
    // For now, handling string or array safely.
    let skillsText = ''
    if (Array.isArray((user as any).skills)) {
        skillsText = (user as any).skills.map(s => s.name || s).join(' ')
    } else if (typeof (user as any).skills === 'string') {
        skillsText = (user as any).skills
    }

    const text = \`\${user.bio || ''} \${skillsText}\`.trim()
    if (!text) return

    const embedding = await this.gemini.getEmbedding(text)

    // Store in DB
    await SkillVector.updateOrCreate(
      { userId: user.id },
      { embeddingJson: JSON.stringify(embedding) }
    )
  }

  /**
   * Get Recommended Opportunities for a User
   */
  public async getRecommendedOpportunities(user: User): Promise<any[]> {
    // 1. Get User Vector
    const userVectorRecord = await SkillVector.findBy('userId', user.id)

    // If no vector, generate it on the fly (lazy load)
    let userVec: number[] = []
    if (!userVectorRecord) {
        await this.updateUserVector(user)
        const fresh = await SkillVector.findBy('userId', user.id)
        if (fresh) userVec = fresh.vector
    } else {
        userVec = userVectorRecord.vector
    }

    // 2. Fetch all active opportunities
    const opportunities = await Opportunity.query().where('status', 'published')

    // 3. Score each opportunity
    const scored = await Promise.all(opportunities.map(async (opp) => {
        // Optimally, we would cache this vector in the DB
        const oppVec = await this.gemini.getEmbedding(opp.description || opp.title)

        let aiScore = 0
        if (userVec.length > 0) {
            aiScore = this.cosineSimilarity(userVec, oppVec)
        }

        let heuristicScore = 0.5 // Base score

        const totalScore = (aiScore * 0.7) + (heuristicScore * 0.3)

        return {
            ...opp.serialize(),
            matchScore: totalScore,
            aiReasoning: \`Match based on overlap in skills.\`
        }
    }))

    // 4. Sort and Return Top 10
    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10)
  }
}
