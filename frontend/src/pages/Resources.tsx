import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BookOpen, ExternalLink, Star, Video, FileText, Book, GraduationCap } from 'lucide-react'

type Resource = {
  _id: string
  subject: string
  title: string
  type: 'video' | 'article' | 'book' | 'course'
  url: string
  description: string
  rating: number
  completed: boolean
}

type Recommendation = {
  title: string
  type: string
  url: string
  description: string
}

export default function Resources() {
  const { token } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchResources()
    }
  }, [token])

  async function fetchResources() {
    try {
      const client = api(token || undefined)
      const { data } = await client.get('/resources')
      setResources(data)
    } catch (e) {
      console.error('Failed to fetch resources')
    }
  }

  async function getRecommendations() {
    if (!subject.trim()) return

    setLoading(true)
    try {
      const client = api(token || undefined)
      const { data } = await client.post('/resources/recommend', { subject })
      setRecommendations(data.recommendations)
    } catch (e) {
      console.error('Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  async function saveResource(resource: Recommendation) {
    try {
      const client = api(token || undefined)
      await client.post('/resources', {
        subject,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description
      })
      fetchResources()
    } catch (e) {
      console.error('Failed to save resource')
    }
  }

  async function updateResource(id: string, updates: Partial<Resource>) {
    try {
      const client = api(token || undefined)
      await client.put(`/resources/${id}`, updates)
      fetchResources()
    } catch (e) {
      console.error('Failed to update resource')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'article': return <FileText className="h-4 w-4" />
      case 'book': return <Book className="h-4 w-4" />
      case 'course': return <GraduationCap className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800'
      case 'article': return 'bg-blue-100 text-blue-800'
      case 'book': return 'bg-green-100 text-green-800'
      case 'course': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Learning Resources</h2>
      </div>

      <Tabs defaultValue="my-resources" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-resources">My Resources</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-resources" className="space-y-4">
          {resources.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
                <p className="text-muted-foreground">
                  Discover AI-recommended resources for your subjects
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resources.map(resource => (
                <Card key={resource._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                        <Badge variant="outline">{resource.subject}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" asChild>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Resource
                        </a>
                      </Button>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= resource.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                              onClick={() => updateResource(resource._id, { rating: star })}
                            />
                          ))}
                        </div>
                        <Button
                          variant={resource.completed ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateResource(resource._id, { completed: !resource.completed })}
                        >
                          {resource.completed ? 'Completed' : 'Mark Complete'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Get AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter a subject (e.g., React, Mathematics, Physics)"
                  onKeyPress={(e) => e.key === 'Enter' && getRecommendations()}
                />
                <Button onClick={getRecommendations} disabled={loading || !subject.trim()}>
                  {loading ? 'Finding...' : 'Find Resources'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recommended Resources for {subject}</h3>
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(rec.type)}
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                      </div>
                      <Badge className={getTypeColor(rec.type)}>
                        {rec.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{rec.description}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" asChild>
                        <a href={rec.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Resource
                        </a>
                      </Button>
                      <Button onClick={() => saveResource(rec)}>
                        Save to My Resources
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
