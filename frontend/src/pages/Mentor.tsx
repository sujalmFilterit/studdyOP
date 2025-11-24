import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { MessageCircle, Bot, User } from 'lucide-react'

type ChatMessage = {
  _id: string
  message: string
  isAI: boolean
  timestamp: string
}

export default function Mentor() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchChatHistory()
    }
  }, [token])

  async function fetchChatHistory() {
    try {
      const client = api(token || undefined)
      const { data } = await client.get('/mentor/chat')
      setMessages(data)
      setError(null)
    } catch (e: any) {
      console.error('Failed to fetch chat history:', e)
      setError('Failed to load chat history')
    }
  }

  async function sendMessage() {
    if (!inputMessage.trim() || loading) return

    setLoading(true)
    setError(null)
    try {
      const client = api(token || undefined)
      const { data } = await client.post('/mentor/chat', { message: inputMessage })
      
      setMessages(prev => [...prev, data.userMessage, data.aiMessage])
      setInputMessage('')
    } catch (e: any) {
      console.error('Failed to send message:', e?.response?.data)
      const errorMessage = e?.response?.data?.message || e?.response?.data?.error || 'Failed to send message'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">AI Mentor</h2>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Study Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Start a conversation with your AI mentor!
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg._id} className={`flex gap-3 ${msg.isAI ? '' : 'flex-row-reverse'}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {msg.isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.isAI 
                    ? 'bg-muted' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your AI mentor anything..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
