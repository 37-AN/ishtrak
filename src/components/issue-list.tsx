'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Filter, Eye, Clock, CheckCircle, AlertCircle, XCircle, Bot } from 'lucide-react'

interface Issue {
  id: string
  title: string
  description: string
  category: string
  severity: string
  environment: string
  systemAffected: string
  status: string
  reporterName: string
  reporterEmail: string
  createdAt: string
  resolvedAt?: string
  resolutions?: Array<{
    id: string
    resolutionText: string
    userRating?: number
    generatedAt: string
  }>
  sops?: Array<{
    id: string
    sopText: string
    userRating?: number
    generatedAt: string
  }>
}

interface IssueListProps {
  onNewIssue: () => void
}

export function IssueList({ onNewIssue }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  useEffect(() => {
    fetchIssues()
  }, [])

  useEffect(() => {
    filterIssues()
  }, [issues, searchTerm, statusFilter, severityFilter])

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues')
      if (response.ok) {
        const data = await response.json()
        setIssues(data)
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterIssues = () => {
    let filtered = issues

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.systemAffected.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter)
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.severity === severityFilter)
    }

    setFilteredIssues(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading issues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Issue Management</CardTitle>
              <CardDescription>Track and manage IT operations issues</CardDescription>
            </div>
            <Button onClick={onNewIssue}>New Issue</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-center">
                        <p className="text-muted-foreground">No issues found</p>
                        <Button variant="outline" className="mt-2" onClick={onNewIssue}>
                          Create your first issue
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(issue.status)}
                          <span className="text-sm">{issue.status.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{issue.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{issue.category}</Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{issue.environment}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{issue.systemAffected}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(issue.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedIssue && (
        <Dialog open={true} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedIssue.status)}
                {selectedIssue.title}
              </DialogTitle>
              <DialogDescription>
                Issue Details and AI-Generated Solutions
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Category</h4>
                    <Badge variant="outline">{selectedIssue.category}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Severity</h4>
                    {getSeverityBadge(selectedIssue.severity)}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Environment</h4>
                    <Badge variant="secondary">{selectedIssue.environment}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">System Affected</h4>
                    <p className="text-sm">{selectedIssue.systemAffected}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedIssue.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Reporter</h4>
                  <p className="text-sm">{selectedIssue.reporterName} ({selectedIssue.reporterEmail})</p>
                </div>

                {selectedIssue.resolutions && selectedIssue.resolutions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI-Generated Resolutions
                    </h4>
                    <div className="space-y-3">
                      {selectedIssue.resolutions.map((resolution) => (
                        <Card key={resolution.id}>
                          <CardContent className="pt-4">
                            <div className="whitespace-pre-wrap text-sm mb-2">
                              {resolution.resolutionText}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Generated: {formatDate(resolution.generatedAt)}</span>
                              {resolution.userRating && (
                                <span>Rating: {resolution.userRating}/5 ⭐</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIssue.sops && selectedIssue.sops.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Generated SOPs</h4>
                    <div className="space-y-3">
                      {selectedIssue.sops.map((sop) => (
                        <Card key={sop.id}>
                          <CardContent className="pt-4">
                            <div className="whitespace-pre-wrap text-sm mb-2">
                              {sop.sopText}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Generated: {formatDate(sop.generatedAt)}</span>
                              {sop.userRating && (
                                <span>Rating: {sop.userRating}/5 ⭐</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}