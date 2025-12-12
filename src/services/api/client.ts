const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    return this.request<{ user: { id: string; email: string; name: string }; token: string }>(
      '/api/auth/register',
      { method: 'POST', body: { email, password, name } }
    )
  }

  async login(email: string, password: string) {
    return this.request<{ user: { id: string; email: string; name: string }; token: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } }
    )
  }

  async getMe() {
    return this.request<{ user: { id: string; email: string; name: string; created_at: string } }>(
      '/api/auth/me'
    )
  }

  // Session endpoints
  async createSession(subject: string, counterpartyName: string) {
    return this.request<{ session: SessionData }>(
      '/api/sessions',
      { method: 'POST', body: { subject, counterpartyName } }
    )
  }

  async getSession(id: string) {
    return this.request<{ session: SessionData }>(`/api/sessions/${id}`)
  }

  async getSessions() {
    return this.request<{ sessions: SessionData[] }>('/api/sessions')
  }

  async joinSession(id: string) {
    return this.request<{ success: boolean }>(
      `/api/sessions/${id}/join`,
      { method: 'POST' }
    )
  }

  async updateSessionStatus(id: string, status: string) {
    return this.request<{ success: boolean; status: string }>(
      `/api/sessions/${id}/status`,
      { method: 'PATCH', body: { status } }
    )
  }

  async addDecision(sessionId: string, content: string) {
    return this.request<{ id: string; content: string }>(
      `/api/sessions/${sessionId}/decisions`,
      { method: 'POST', body: { content } }
    )
  }

  async addCommitment(sessionId: string, content: string, ownerId: string) {
    return this.request<{ id: string; ownerId: string; content: string }>(
      `/api/sessions/${sessionId}/commitments`,
      { method: 'POST', body: { content, ownerId } }
    )
  }

  async getOutcomes(sessionId: string) {
    return this.request<{ decisions: Decision[]; commitments: Commitment[] }>(
      `/api/sessions/${sessionId}/outcomes`
    )
  }

  // Transcript endpoints
  async addMessage(sessionId: string, content: string, speakerType: 'user' | 'counterparty') {
    return this.request<TranscriptMessageData>(
      `/api/transcripts/${sessionId}/messages`,
      { method: 'POST', body: { content, speakerType } }
    )
  }

  async getTranscript(sessionId: string) {
    return this.request<{ messages: TranscriptMessageData[] }>(
      `/api/transcripts/${sessionId}`
    )
  }

  // Daily endpoints
  async createDailyRoom(sessionId: string) {
    return this.request<{ url: string; name: string; mock?: boolean }>(
      '/api/daily/room',
      { method: 'POST', body: { sessionId } }
    )
  }

  async getDailyToken(sessionId: string) {
    return this.request<{ token: string; roomUrl: string; mock?: boolean }>(
      `/api/daily/token/${sessionId}`
    )
  }
}

// Types for API responses
export interface SessionData {
  id: string
  subject: string
  creator_id: string
  creator_name: string
  counterparty_id: string | null
  counterparty_name: string
  counterparty_user_name?: string
  status: 'pending' | 'connected' | 'active' | 'ended'
  daily_room_url: string | null
  daily_room_name: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface TranscriptMessageData {
  id: string
  session_id: string
  speaker_id: string | null
  speaker_name: string | null
  speaker_type: 'user' | 'counterparty' | 'system'
  content: string
  is_violation: boolean
  rule_number: number | null
  created_at: string
}

export interface Decision {
  id: string
  session_id: string
  content: string
  created_at: string
}

export interface Commitment {
  id: string
  session_id: string
  owner_id: string
  owner_name: string
  content: string
  created_at: string
}

export const api = new ApiClient()
