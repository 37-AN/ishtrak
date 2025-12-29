'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Bot, Star, Clock, CheckCircle, AlertCircle, BarChart3, PieChart, Activity } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalIssues: number
    resolvedIssues: number
    aiResolutionRate: number
    avgResolutionTime: number
    avgUserRating: number
    sopCount: number
  }
  trends: {
    issuesByMonth: Array<{ month: string; count: number }>
    resolutionsByMonth: Array<{ month: string; count: number }>
    ratingsByMonth: Array<{ month: string; avgRating: number }>
  }
  categories: Array<{
    name: string
    count: number
    resolved: number
    avgRating: number
  }>
  severity: Array<{
    level: string
    count: number
    resolved: number
    avgResolutionTime: number
  }>
  aiPerformance: {
    modelUsed: string
    totalResolutions: number
    avgRating: number
    successRate: number
  }
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-yellow-600'
    if (rating >= 2.5) return 'text-orange-600'
    return 'text-red-600'
  }

  const MetricCard = ({ title, value, description, icon: Icon, trend, color = "default" }: {
    title: string
    value: string | number
    description: string
    icon: any
    trend?: number
    color?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {description}
          {trend !== undefined && (
            <span className={`flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your IT issue resolution performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Issues"
          value={data.overview.totalIssues}
          description="Issues reported"
          icon={AlertCircle}
        />
        <MetricCard
          title="Resolved Issues"
          value={data.overview.resolvedIssues}
          description="Successfully resolved"
          icon={CheckCircle}
          trend={15.3}
        />
        <MetricCard
          title="AI Resolution Rate"
          value={`${data.overview.aiResolutionRate}%`}
          description="Resolved by AI suggestions"
          icon={Bot}
          trend={8.7}
        />
        <MetricCard
          title="Avg Resolution Time"
          value={`${data.overview.avgResolutionTime}h`}
          description="Time to resolve issues"
          icon={Clock}
          trend={-12.4}
        />
        <MetricCard
          title="Avg User Rating"
          value={`${data.overview.avgUserRating.toFixed(1)}/5`}
          description="AI solution quality"
          icon={Star}
          trend={5.2}
          color="text-yellow-600"
        />
        <MetricCard
          title="SOPs Generated"
          value={data.overview.sopCount}
          description="Standard operating procedures"
          icon={Activity}
          trend={22.1}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Issues by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Issues by Category
            </CardTitle>
            <CardDescription>Distribution of issues across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.count} issues</Badge>
                      <span className="text-muted-foreground">
                        {category.resolved} resolved
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(category.resolved / category.count) * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Resolution rate: {((category.resolved / category.count) * 100).toFixed(1)}%</span>
                    <span className={getRatingColor(category.avgRating)}>
                      Avg rating: {category.avgRating.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Issues by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Issues by Severity
            </CardTitle>
            <CardDescription>Resolution performance by issue severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.severity.map((severity) => (
                <div key={severity.level} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium capitalize ${getSeverityColor(severity.level)}`}>
                      {severity.level}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{severity.count} issues</Badge>
                      <span className="text-muted-foreground">
                        {severity.resolved} resolved
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(severity.resolved / severity.count) * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Resolution rate: {((severity.resolved / severity.count) * 100).toFixed(1)}%</span>
                    <span>Avg time: {severity.avgResolutionTime}h</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Performance Metrics
          </CardTitle>
          <CardDescription>Effectiveness of AI-generated resolutions and SOPs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Model</h4>
                <p className="text-sm text-muted-foreground mb-4">{data.aiPerformance.modelUsed}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Resolutions Generated</span>
                  <span className="font-medium">{data.aiPerformance.totalResolutions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average User Rating</span>
                  <span className={`font-medium ${getRatingColor(data.aiPerformance.avgRating)}`}>
                    {data.aiPerformance.avgRating.toFixed(1)}/5
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {data.aiPerformance.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Performance Indicators</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>User Satisfaction</span>
                    <span>{data.aiPerformance.avgRating.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(data.aiPerformance.avgRating / 5) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Resolution Success</span>
                    <span>{data.aiPerformance.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.aiPerformance.successRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Adoption Rate</span>
                    <span>87.3%</span>
                  </div>
                  <Progress value={87.3} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Issue resolution and rating trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Issues vs Resolutions</h4>
              <div className="space-y-2">
                {data.trends.issuesByMonth.map((month, index) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="text-sm w-16">{month.month}</span>
                    <div className="flex-1 flex gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>{month.count} issues</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>{data.trends.resolutionsByMonth[index]?.count || 0} resolved</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Average Rating Trend</h4>
              <div className="space-y-2">
                {data.trends.ratingsByMonth.map((rating) => (
                  <div key={rating.month} className="flex items-center gap-4">
                    <span className="text-sm w-16">{rating.month}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress value={(rating.avgRating / 5) * 100} className="flex-1 h-2" />
                        <span className={`text-sm font-medium ${getRatingColor(rating.avgRating)}`}>
                          {rating.avgRating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}