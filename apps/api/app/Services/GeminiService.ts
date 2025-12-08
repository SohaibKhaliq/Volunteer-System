import Env from '@ioc:Adonis/Core/Env'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any
  private embeddingModel: any
  private mockMode: boolean = false

  constructor() {
    const apiKey = Env.get('GEMINI_API_KEY')
    if (!apiKey || apiKey === 'undefined') {
      this.mockMode = true
      console.log('GeminiService: Mock Mode Enabled (Missing API Key)')
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
        this.embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' })
      } catch (error) {
        console.error('GeminiService Init Error:', error)
        this.mockMode = true
      }
    }
  }

  /**
   * Generates text content based on a prompt
   */
  public async generateContent(prompt: string): Promise<string> {
    if (this.mockMode) {
      return this.mockGenerateContent(prompt)
    }

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API Error (generateContent):', error)
      return this.mockGenerateContent(prompt)
    }
  }

  /**
   * Generates embeddings for a given text
   */
  public async getEmbedding(text: string): Promise<number[]> {
    if (this.mockMode) {
      return this.mockEmbedding()
    }

    try {
      const result = await this.embeddingModel.embedContent(text)
      return result.embedding.values
    } catch (error) {
      console.error('Gemini API Error (getEmbedding):', error)
      return this.mockEmbedding()
    }
  }

  /**
   * Analyzes sentiment of a text
   * Returns: { score: number (-1 to 1), label: string, summary: string }
   */
  public async analyzeSentiment(text: string): Promise<{ score: number; label: string; summary: string }> {
    const prompt = \`Analyze the sentiment of the following text.
    Return a JSON object with:
    - score: a number between -1.0 (negative) and 1.0 (positive)
    - label: "Positive", "Neutral", or "Negative"
    - summary: a one-sentence summary of the sentiment

    Text: "\${text}"\`

    const result = await this.generateContent(prompt)

    // Attempt to parse JSON from the response
    try {
        // Clean up markdown code blocks if present
        const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(jsonStr)
    } catch (e) {
        // Fallback if JSON parsing fails
        return {
            score: 0,
            label: 'Neutral',
            summary: result.substring(0, 100)
        }
    }
  }

  // --- MOCK IMPLEMENTATIONS ---

  private mockGenerateContent(prompt: string): string {
    if (prompt.includes('social media captions')) {
      return \`#VolunteerLife #Community\n\nJoin us for an amazing event! We need your help to make a difference. Sign up today!\`
    }
    if (prompt.includes('rewrite')) {
      return \`[MOCK AI REWRITE]: This event is an exciting opportunity to engage with your community and develop new skills. We are looking for passionate individuals to join our team.\`
    }
    return \`[MOCK AI RESPONSE]: I have processed your request: "\${prompt.substring(0, 30)}..."\`
  }

  private mockEmbedding(): number[] {
    // Return a random 768-dimensional vector (standard for Gemini/PaLM)
    return Array.from({ length: 768 }, () => Math.random() * 2 - 1)
  }
}
