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

  public static async generateCaseId(): Promise<string> {
    const prefix = 'REQ'
    const year = new Date().getFullYear()

    // Find the last request for the current year to determine the sequence
    const lastRequest = await HelpRequest.query()
      .where('case_id', 'like', `${prefix}-${year}-%`)
      .orderBy('id', 'desc')
      .first()

    let sequence = 1

    if (lastRequest && lastRequest.caseId) {
      const parts = lastRequest.caseId.split('-')
      // Expected format: REQ-YYYY-XXXX
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10)
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1
        }
      }
    }

    const paddedSequence = sequence.toString().padStart(4, '0')
    return `${prefix}-${year}-${paddedSequence}`
  }
}
