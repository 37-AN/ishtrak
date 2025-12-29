'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

interface IssueFormProps {
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  title: string
  description: string
  category: string
  severity: string
  environment: string
  systemAffected: string
  reporterName: string
  reporterEmail: string
}

export function IssueForm({ onClose, onSuccess }: IssueFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    severity: '',
    environment: '',
    systemAffected: '',
    reporterName: '',
    reporterEmail: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create issue')
      }

      const result = await response.json()
      
      // Trigger AI resolution generation in background
      if (result.issueId) {
        fetch(`/api/ai/generate-resolution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ issueId: result.issueId }),
        }).catch(err => console.error('Failed to generate AI resolution:', err))
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Report a new IT issue. AI will automatically generate resolution suggestions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue, including any error messages, steps to reproduce, and expected behavior"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                  <SelectItem value="medium">Medium - Some functionality affected</SelectItem>
                  <SelectItem value="high">High - Major functionality affected</SelectItem>
                  <SelectItem value="critical">Critical - System down or security breach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment *</Label>
              <Select value={formData.environment} onValueChange={(value) => handleInputChange('environment', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemAffected">System Affected *</Label>
            <Input
              id="systemAffected"
              placeholder="e.g., Web Application, Database Server, API Gateway"
              value={formData.systemAffected}
              onChange={(e) => handleInputChange('systemAffected', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporterName">Your Name *</Label>
              <Input
                id="reporterName"
                placeholder="Your full name"
                value={formData.reporterName}
                onChange={(e) => handleInputChange('reporterName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporterEmail">Your Email *</Label>
              <Input
                id="reporterEmail"
                type="email"
                placeholder="your.email@company.com"
                value={formData.reporterEmail}
                onChange={(e) => handleInputChange('reporterEmail', e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Issue...
                </>
              ) : (
                'Create Issue'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}