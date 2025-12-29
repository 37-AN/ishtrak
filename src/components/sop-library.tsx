'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText, Search, Star, Clock, Download, Eye, Bot, Loader2 } from 'lucide-react'

interface AiSop {
  id: string
  issueId: string
  issue: {
    id: string
    title: string
    category: string
    severity: string
    resolvedAt?: string
  }
  sopText: string
  generatedAt: string
  userRating?: number
  userFeedback?: string
}

export function SopLibrary() {
  const [sops, setSops] = useState<AiSop[]>([])
  const [filteredSops, setFilteredSops] = useState<AiSop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [selectedSop, setSelectedSop] = useState<AiSop | null>(null)
  const [exportDialog, setExportDialog] = useState<{ open: boolean; sop: AiSop | null }>({
    open: false,
    sop: null
  })
  const [exportFormat, setExportFormat] = useState('markdown')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchSops()
  }, [])

  useEffect(() => {
    filterSops()
  }, [sops, searchTerm, categoryFilter, ratingFilter])

  const fetchSops = async () => {
    try {
      const response = await fetch('/api/ai/sops')
      if (response.ok) {
        const data = await response.json()
        setSops(data)
      }
    } catch (error) {
      console.error('Failed to fetch SOPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSops = () => {
    let filtered = sops

    if (searchTerm) {
      filtered = filtered.filter(sop =>
        sop.issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.sopText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.issue.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(sop => sop.issue.category === categoryFilter)
    }

    if (ratingFilter !== 'all') {
      if (ratingFilter === 'rated') {
        filtered = filtered.filter(sop => sop.userRating !== undefined)
      } else if (ratingFilter === 'unrated') {
        filtered = filtered.filter(sop => sop.userRating === undefined)
      } else {
        const minRating = parseInt(ratingFilter)
        filtered = filtered.filter(sop => (sop.userRating || 0) >= minRating)
      }
    }

    setFilteredSops(filtered)
  }

  const handleExport = async () => {
    if (!exportDialog.sop) return

    setExporting(true)
    try {
      const response = await fetch(`/api/ai/sops/${exportDialog.sop.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: exportFormat }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Create and download the file
        const blob = new Blob([data.content], { 
          type: exportFormat === 'pdf' ? 'application/pdf' : 'text/markdown' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `SOP_${exportDialog.sop.issue.title.replace(/[^a-zA-Z0-9]/g, '_')}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setExportDialog({ open: false, sop: null })
      }
    } catch (error) {
      console.error('Failed to export SOP:', error)
    } finally {
      setExporting(false)
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

  const renderStars = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating}/5)</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const parseSopStructure = (sopText: string) => {
    // Try to parse structured SOP content
    const sections = []
    const lines = sopText.split('\n')
    let currentSection = { title: '', content: [] as string[] }

    for (const line of lines) {
      if (line.match(/^#+\s/) || line.match(/^[A-Z][A-Z\s]*:$/)) {
        if (currentSection.title) {
          sections.push({ ...currentSection })
        }
        currentSection = { 
          title: line.replace(/^#+\s/, '').replace(':', ''), 
          content: [] 
        }
      } else if (line.trim()) {
        currentSection.content.push(line)
      }
    }
    
    if (currentSection.title) {
      sections.push(currentSection)
    }

    return sections
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading SOP library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SOP Library
          </CardTitle>
          <CardDescription>
            Standard Operating Procedures automatically generated from resolved issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SOPs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="ui">User Interface</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="rated">Rated</SelectItem>
                <SelectItem value="unrated">Unrated</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSops.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No SOPs found</p>
              <p className="text-sm text-muted-foreground">
                SOPs are automatically generated when issues are resolved
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSops.map((sop) => (
                <Card key={sop.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-tight mb-2">
                          {sop.issue.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {sop.issue.category}
                          </Badge>
                          {getSeverityBadge(sop.issue.severity)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bot className="h-3 w-3" />
                      <span>AI Generated</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground line-clamp-3">
                        {sop.sopText.substring(0, 150)}...
                      </div>
                      
                      {renderStars(sop.userRating)}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(sop.generatedAt)}</span>
                        {sop.issue.resolvedAt && (
                          <span>Resolved {formatDate(sop.issue.resolvedAt)}</span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedSop(sop)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExportDialog({ open: true, sop })}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOP Details Dialog */}
      <Dialog open={!!selectedSop} onOpenChange={() => setSelectedSop(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Standard Operating Procedure
            </DialogTitle>
            <DialogDescription>
              AI-generated SOP for: {selectedSop?.issue.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSop && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Issue Category</h4>
                    <Badge variant="outline">{selectedSop.issue.category}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Severity</h4>
                    {getSeverityBadge(selectedSop.issue.severity)}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">SOP Content</h4>
                  <div className="space-y-4">
                    {parseSopStructure(selectedSop.sopText).map((section, index) => (
                      <div key={index} className="border-l-4 border-l-primary pl-4">
                        <h5 className="font-medium mb-2">{section.title}</h5>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {section.content.join('\n')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Generated:</span>
                    <div>{formatDate(selectedSop.generatedAt)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Issue Resolved:</span>
                    <div>{selectedSop.issue.resolvedAt ? formatDate(selectedSop.issue.resolvedAt) : 'N/A'}</div>
                  </div>
                </div>

                {selectedSop.userRating && (
                  <div>
                    <h4 className="font-medium mb-2">User Rating</h4>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedSop.userRating)}
                    </div>
                    {selectedSop.userFeedback && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Feedback:</strong> {selectedSop.userFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog.open} onOpenChange={(open) => !open && setExportDialog({ open: false, sop: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export SOP</DialogTitle>
            <DialogDescription>
              Choose export format for the SOP
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {exportDialog.sop && (
              <div>
                <h4 className="font-medium mb-2">{exportDialog.sop.issue.title}</h4>
                <p className="text-sm text-muted-foreground">
                  This SOP was generated on {formatDate(exportDialog.sop.generatedAt)}
                </p>
              </div>
            )}

            <div>
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown (.md)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setExportDialog({ open: false, sop: null })}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}