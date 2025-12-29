'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Clock, TrendingUp, Bot, FileText, Star, Plus } from 'lucide-react'
import { IssueForm } from '@/components/issue-form'
import { IssueList } from '@/components/issue-list'
import { AiResolutionPanel } from '@/components/ai-resolution-panel'
import { SopLibrary } from '@/components/sop-library'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'

interface DashboardStats {
  totalIssues: number
  openIssues: number
  resolvedIssues: number
  avgResolutionTime: number
  aiResolutionRate: number
  avgUserRating: number
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalIssues: 0,
    openIssues: 0,
    resolvedIssues: 0,
    avgResolutionTime: 0,
    aiResolutionRate: 0,
    avgUserRating: 0
  })
  const [showIssueForm, setShowIssueForm] = useState(false)

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({ title, value, description, icon: Icon, trend }: {
    title: string
    value: string | number
    description: string
    icon: any
    trend?: number
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend !== undefined && (
            <span className={`ml-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({trend >= 0 ? '+' : ''}{trend}%)
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Issue Tracker</h1>
            <p className="text-muted-foreground">
              Local AI-powered IT operations issue management and resolution system
            </p>
          </div>
          <Button onClick={() => setShowIssueForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="resolutions">AI Resolutions</TabsTrigger>
            <TabsTrigger value="sops">SOP Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Issues"
                value={stats.totalIssues}
                description="All tracked issues"
                icon={AlertCircle}
              />
              <StatCard
                title="Open Issues"
                value={stats.openIssues}
                description="Awaiting resolution"
                icon={Clock}
              />
              <StatCard
                title="Resolved Issues"
                value={stats.resolvedIssues}
                description="Successfully closed"
                icon={CheckCircle}
              />
              <StatCard
                title="Avg Resolution Time"
                value={`${stats.avgResolutionTime}h`}
                description="Time to resolve"
                icon={TrendingUp}
              />
              <StatCard
                title="AI Resolution Rate"
                value={`${stats.aiResolutionRate}%`}
                description="Issues resolved by AI"
                icon={Bot}
              />
              <StatCard
                title="Avg User Rating"
                value={`${stats.avgUserRating.toFixed(1)}/5`}
                description="AI solution quality"
                icon={Star}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Issues</CardTitle>
                  <CardDescription>Latest reported IT issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">High</Badge>
                        <span className="font-medium">Database connection timeout</span>
                      </div>
                      <span className="text-sm text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Medium</Badge>
                        <span className="font-medium">API rate limiting errors</span>
                      </div>
                      <span className="text-sm text-muted-foreground">4h ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>Low</Badge>
                        <span className="font-medium">UI display issues on mobile</span>
                      </div>
                      <span className="text-sm text-muted-foreground">6h ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance</CardTitle>
                  <CardDescription>Recent AI resolution effectiveness</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolution Success Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Satisfaction</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-sm font-medium">4.6/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SOP Generation Quality</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="issues">
            <IssueList onNewIssue={() => setShowIssueForm(true)} />
          </TabsContent>

          <TabsContent value="resolutions">
            <AiResolutionPanel />
          </TabsContent>

          <TabsContent value="sops">
            <SopLibrary />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure your AI Issue Tracker</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">AI Model Configuration</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ollama model: llama3.1:8b (CPU optimized)
                      </p>
                      <Button variant="outline" size="sm">Test Connection</Button>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Knowledge Base</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Vector embeddings: Local SQLite-based storage
                      </p>
                      <Button variant="outline" size="sm">Rebuild Index</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showIssueForm && (
        <IssueForm
          onClose={() => setShowIssueForm(false)}
          onSuccess={() => {
            setShowIssueForm(false)
            setActiveTab('issues')
          }}
        />
      )}
    </div>
  )
}