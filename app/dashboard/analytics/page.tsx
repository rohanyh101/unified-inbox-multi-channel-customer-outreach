"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Users, 
  Download,
  Phone,
  Mail,
  Activity,
  Calendar,
  Filter
} from "lucide-react"
import { toast } from "sonner"

interface AnalyticsData {
  overview: {
    totalMessages: number
    totalContacts: number
    avgResponseTime: number
    engagementRate: number
  }
  responseMetrics: {
    avgResponseTime: string
    medianResponseTime: string
    fastestResponse: string
    slowestResponse: string
  }
  channelVolume: {
    SMS: number
    WHATSAPP: number
    EMAIL: number
  }
  dailyStats: {
    date: string
    sent: number
    received: number
    responseTime: number
  }[]
  topContacts: {
    id: string
    name: string
    messageCount: number
    avgResponseTime: number
    lastContact: string
  }[]
}

type DateRange = '7d' | '30d' | '90d' | '1y'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/analytics/export?range=${dateRange}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Report exported successfully!')
      } else {
        toast.error('Failed to export report')
      }
    } catch (error) {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <Phone className="h-4 w-4" />
      case 'WHATSAPP': return <MessageSquare className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS': return 'bg-blue-500'
      case 'WHATSAPP': return 'bg-green-500'
      case 'EMAIL': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`
    return `${Math.round(minutes / 1440)}d`
  }

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case '1y': return 'Last year'
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="flex items-center gap-2">
                  ← Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading your analytics...
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show welcome message for new users (no data yet)
  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => window.history.back()} 
                  className="flex items-center gap-2"
                >
                  ← Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <Activity className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Analytics Data</h3>
              <p className="text-gray-600 mb-6">
                Start sending and receiving messages to see your performance analytics and insights.
              </p>
              <Button 
                onClick={() => window.history.back()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Inbox
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()} 
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Report'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Description */}
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-gray-600">
              Track your messaging performance and insights across all channels
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Showing data for {getDateRangeLabel(dateRange).toLowerCase()}
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview?.totalMessages?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Sent and received in {getDateRangeLabel(dateRange).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Contacts you've messaged with
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatResponseTime(analyticsData?.overview?.avgResponseTime || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Average time to respond
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analyticsData?.overview?.engagementRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Messages that got responses
            </p>
          </CardContent>
        </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Response Time Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Time Metrics
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your response performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Average Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{analyticsData?.responseMetrics?.avgResponseTime || '0m'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Median Response Time</p>
                <p className="text-2xl font-bold text-green-600">{analyticsData?.responseMetrics?.medianResponseTime || '0m'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Fastest Response</p>
                <p className="text-lg font-semibold text-emerald-600">{analyticsData?.responseMetrics?.fastestResponse || '0m'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Slowest Response</p>
                <p className="text-lg font-semibold text-orange-600">{analyticsData?.responseMetrics?.slowestResponse || '0m'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Channel Volume
            </CardTitle>
            <CardDescription>
              Messages by communication channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analyticsData?.channelVolume || {}).map(([channel, count]) => {
              const total = Object.values(analyticsData?.channelVolume || {}).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0
              
              return (
                <div key={channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(channel)}
                      <span className="text-sm font-medium">{channel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getChannelColor(channel)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Activity
          </CardTitle>
          <CardDescription>
            Message volume and response times over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analyticsData?.dailyStats || []).map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-24">
                    {new Date(stat.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Sent: {stat.sent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Received: {stat.received}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Avg Response: </span>
                  <span className="text-sm font-medium">{formatResponseTime(stat.responseTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contacts */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Contacts</CardTitle>
          <CardDescription>
            Most active contacts by message volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analyticsData?.topContacts || []).map((contact, index) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-600">
                      Last contact: {new Date(contact.lastContact).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{contact.messageCount} messages</p>
                  <p className="text-sm text-gray-600">
                    Avg response: {formatResponseTime(contact.avgResponseTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  )
}
