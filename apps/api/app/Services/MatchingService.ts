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
    // Combine relevant fields
    const text = \`\${user.bio || ''} \${user.skills || ''}\`.trim()
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
        // Fallback: If no vector and no bio, we can't do vector matching effectively
        // For now, we'll proceed with heuristic only or attempt generation
        await this.updateUserVector(user)
        const fresh = await SkillVector.findBy('userId', user.id)
        if (fresh) userVec = fresh.vector
    } else {
        userVec = userVectorRecord.vector
    }

    // 2. Fetch all active opportunities
    // In a real app with 10k+ items, we'd use a Vector DB (Pinecone/Weaviate).
    // Here we iterate in-memory as requested for the prototype scope.
    const opportunities = await Opportunity.query().where('status', 'published')

    // 3. Score each opportunity
    const scored = await Promise.all(opportunities.map(async (opp) => {
        // Mocking Opportunity Vector for now since we didn't add a table for it explicitly in the plan
        // In a real scenario, Opportunity would have a `description_vector` column.
        // We will generate a consistent "Mock" vector based on the ID to simulate variety
        const oppVec = await this.gemini.getEmbedding(opp.description || opp.title)

        let aiScore = 0
        if (userVec.length > 0) {
            aiScore = this.cosineSimilarity(userVec, oppVec)
        }

        // Heuristic Scoring
        // Example: Boost if in same city (mock check)
        // Example: Boost if causes match (mock check)
        let heuristicScore = 0.5 // Base score

        // Final Weighted Score
        // 70% AI, 30% Heuristics
        const totalScore = (aiScore * 0.7) + (heuristicScore * 0.3)

        return {
            ...opp.serialize(),
            matchScore: totalScore,
            aiReasoning: \`Match based on overlap in skills.\` // Placeholder
        }
    }))

    // 4. Sort and Return Top 10
    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10)
  }
}
