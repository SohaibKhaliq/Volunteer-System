import HelpRequest from 'App/Models/HelpRequest'

export default class TriageService {
  public static calculateUrgencyScore(data: Partial<HelpRequest>, types: string[]): number {
    let score = 0

    // Severity Score
    switch (data.severity) {
      case 'critical':
        score += 40
        break
      case 'high':
        score += 20
        break
      case 'medium':
        score += 10
        break
      case 'low':
        score += 0
        break
    }

    // Type Score
    if (types.includes('medical')) score += 30
    if (types.includes('rescue')) score += 40
    if (types.includes('shelter')) score += 20
    if (types.includes('food')) score += 10

    // Keyword Analysis (Simple implementation)
    const keywords = ['trapped', 'bleeding', 'child', 'baby', 'fire', 'flood', 'collapse']
    const text = (data.description || '') + ' ' + (data.source || '')
    const lowerText = text.toLowerCase()

    let keywordMatches = 0
    keywords.forEach((word) => {
      if (lowerText.includes(word)) {
        keywordMatches++
      }
    })

    // Cap keyword score contribution
    score += Math.min(keywordMatches * 10, 50)

    // Normalize to 0-100
    return Math.min(score, 100)
  }

  public static generateCaseId(): string {
    const prefix = 'REQ'
    const year = new Date().getFullYear()
    const random = Math.floor(1000 + Math.random() * 9000)
    const timestamp = Date.now().toString().slice(-4)
    return `${prefix}-${year}-${timestamp}-${random}`
  }
}
