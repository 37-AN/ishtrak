'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bot, Star, ThumbsUp, ThumbsDown, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface AiResolution {
  id: string
  issueId: string
  issue: {
    id: string
    title: string
    description: string
    category: string
    severity: string
    status: string
  }
  resolutionText: string
  modelUsed: string
  generatedAt: string
  userRating?: number
  userFeedback?: string
}

export function AiResolutionPanel() {
  const [resolutions, setResolutions] = useState<AiResolution[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResolution, setSelectedResolution] = useState<AiResolution | null>(null)
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; resolution: AiResolution | null }>({
    open: false,
    resolution: null
  })
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    fetchResolutions()
  }, [])

  const fetchResolutions = async () => {
    try {
      const response = await fetch('/api/ai/resolutions')
      if (response.ok) {
        const data = await response.json()
        setResolutions(data)
      }
    } catch (error) {
      console.error('Failed to fetch AI resolutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRateResolution = async () => {
    if (!ratingDialog.resolution) return

    setSubmittingRating(true)
    try {
      const response = await fetch(`/api/ai/resolutions/${ratingDialog.resolution.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || undefined
        }),
      })

      if (response.ok) {
        // Update the resolution in the list
        setResolutions(prev => prev.map(res => 
          res.id === ratingDialog.resolution!.id 
            ? { ...res, userRating: rating, userFeedback: feedback.trim() || undefined }
            : res
        ))
        
        // Close dialog and reset form
        setRatingDialog({ open: false, resolution: null })
        setRating(0)
        setFeedback('')
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setSubmittingRating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const renderStars = (currentRating: number, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 cursor-pointer transition-colors ${
              star <= currentRating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300 hover:text-yellow-200'
            }`}
            onClick={() => onRate?.(star)}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading AI resolutions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-Generated Resolutions
          </CardTitle>
          <CardDescription>
            Review and rate AI-generated solutions for IT issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resolutions.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No AI resolutions available yet</p>
              <p className="text-sm text-muted-foreground">
                Create issues and AI will automatically generate resolution suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resolutions.map((resolution) => (
                <Card key={resolution.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(resolution.issue.status)}
                          <h4 className="font-medium">{resolution.issue.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{resolution.issue.category}</Badge>
                          {getSeverityBadge(resolution.issue.severity)}
                          <Badge variant="secondary">{resolution.issue.status.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{formatDate(resolution.generatedAt)}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Bot className="h-3 w-3" />
                          {resolution.modelUsed}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                        {resolution.resolutionText}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {resolution.userRating ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Your rating:</span>
                              {renderStars(resolution.userRating)}
                              <span className="text-sm font-medium">{resolution.userRating}/5</span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedResolution(resolution)
                                setRatingDialog({ open: true, resolution })
                              }}
                            >
                              Rate this solution
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedResolution(resolution)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>

                      {resolution.userFeedback && (
                        <Alert>
                          <AlertDescription className="text-sm">
                            <strong>Your feedback:</strong> {resolution.userFeedback}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog.open} onOpenChange={(open) => !open && setRatingDialog({ open: false, resolution: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate AI Resolution</DialogTitle>
            <DialogDescription>
              Help improve AI suggestions by rating this resolution
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {ratingDialog.resolution && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">{ratingDialog.resolution.issue.title}</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {ratingDialog.resolution.resolutionText}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>How helpful was this resolution?</Label>
              <div className="mt-2">
                {renderStars(rating, setRating)}
              </div>
            </div>

            <div>
              <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="What was good about this resolution? What could be improved?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRatingDialog({ open: false, resolution: null })}
              disabled={submittingRating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRateResolution}
              disabled={rating === 0 || submittingRating}
            >
              {submittingRating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolution Details Dialog */}
      <Dialog open={!!selectedResolution} onOpenChange={() => setSelectedResolution(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Resolution Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedResolution && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Issue: {selectedResolution.issue.title}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{selectedResolution.issue.category}</Badge>
                    {getSeverityBadge(selectedResolution.issue.severity)}
                    <Badge variant="secondary">{selectedResolution.issue.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedResolution.issue.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">AI-Generated Resolution</h4>
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                    {selectedResolution.resolutionText}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Generated:</span>
                    <div>{formatDate(selectedResolution.generatedAt)}</div>
                  </div>
                  <div>
                    <span className="font-medium">AI Model:</span>
                    <div>{selectedResolution.modelUsed}</div>
                  </div>
                </div>

                {selectedResolution.userRating && (
                  <div>
                    <h4 className="font-medium mb-2">Your Rating</h4>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedResolution.userRating)}
                      <span className="text-sm">{selectedResolution.userRating}/5</span>
                    </div>
                    {selectedResolution.userFeedback && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Feedback:</strong> {selectedResolution.userFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}