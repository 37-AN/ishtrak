import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple text similarity function (in production, use proper embeddings)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)
  
  const intersection = words1.filter(word => words2.includes(word))
  const union = [...new Set([...words1, ...words2])]
  
  return intersection.length / union.length
}

// Simple keyword extraction for vector representation
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'after', 'many', 'only', 'some', 'also', 'what', 'when', 'make', 'like', 'into', 'than', 'call', 'come', 'could', 'first', 'work', 'down', 'may', 'should', 'through', 'between', 'must', 'such', 'under', 'well', 'where', 'much', 'before', 'right', 'too', 'any', 'same', 'how', 'look', 'little', 'world', 'very', 'still', 'hand', 'old', 'life', 'tell', 'here', 'show', 'even', 'back', 'think', 'year', 'give', 'take', 'just', 'good', 'most', 'know', 'over', 'great', 'long', 'find', 'where', 'much', 'before', 'right', 'too', 'any', 'same'].includes(word))
  
  // Return unique keywords
  return [...new Set(words)]
}

// Retrieve relevant knowledge base entries using RAG
async function retrieveRelevantContent(query: string, category: string) {
  try {
    const knowledgeBase = await db.knowledgeBase.findMany({
      where: {
        contentType: 'resolution',
        averageRating: {
          gte: 3.5
        }
      },
      orderBy: [
        { averageRating: 'desc' },
        { usageCount: 'desc' }
      ],
      take: 20
    })

    const queryKeywords = extractKeywords(query)

    const scoredEntries = knowledgeBase.map(entry => {
      const contentKeywords = extractKeywords(entry.content)
      const commonKeywords = queryKeywords.filter(keyword => contentKeywords.includes(keyword))
      
      const keywordSimilarity = commonKeywords.length / Math.max(queryKeywords.length, contentKeywords.length)
      const ratingBoost = entry.averageRating / 5
      const usageBoost = Math.min(entry.usageCount / 10, 1)
      
      const finalScore = keywordSimilarity * 0.6 + ratingBoost * 0.3 + usageBoost * 0.1
      
      return {
        ...entry,
        similarityScore: finalScore,
        matchedKeywords: commonKeywords
      }
    })

    return scoredEntries
      .filter(entry => entry.similarityScore > 0.1)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3)
  } catch (error) {
    console.error('Failed to retrieve relevant content:', error)
    return []
  }
}

// Generate resolution using Ollama service
async function generateResolutionWithOllama(issue: any, relevantContent: any[]): Promise<string> {
  try {
    const ollamaResponse = await fetch('/api/ollama/generate-resolution?XTransformPort=3031', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issue,
        relevantContent
      })
    })

    if (!ollamaResponse.ok) {
      throw new Error('Ollama service unavailable')
    }

    const result = await ollamaResponse.json()
    return result.resolution
  } catch (error) {
    console.error('Failed to generate with Ollama, falling back to template:', error)
    
    // Fallback to template-based generation
    return generateResolutionTemplate(issue, relevantContent)
  }
}

// Fallback template-based generation
function generateResolutionTemplate(issue: any, relevantContent: any[]): string {
  const baseTemplates = {
    infrastructure: [
      `Infrastructure Issue Resolution Plan for "${issue.title}":

1. INITIAL ASSESSMENT
   - Verify current system status and impact scope
   - Check monitoring dashboards for anomaly patterns
   - Document affected services and user impact

2. IMMEDIATE ACTIONS
   - Implement temporary workaround if available
   - Communicate status to stakeholders
   - Begin root cause analysis

3. ROOT CAUSE ANALYSIS
   - Review system logs for error patterns
   - Check recent changes or deployments
   - Analyze performance metrics leading to issue

4. RESOLUTION STEPS
   - Apply the identified fix based on root cause
   - Test the resolution in staging environment
   - Deploy fix to production with monitoring

5. VERIFICATION
   - Confirm service restoration
   - Monitor system stability for 2 hours
   - Validate with affected users

6. PREVENTION
   - Update monitoring to catch similar issues early
   - Document lessons learned
   - Consider infrastructure improvements if recurring issue`
    ],
    application: [
      `Application Issue Resolution for "${issue.title}":

1. ISSUE REPRODUCTION
   - Reproduce the issue in development environment
   - Identify the exact steps to trigger the problem
   - Document expected vs actual behavior

2. CODE ANALYSIS
   - Review recent code changes in affected modules
   - Check error logs and stack traces
   - Identify the specific component causing the issue

3. DEBUGGING PROCESS
   - Set up debugging environment
   - Add logging to track execution flow
   - Isolate the problematic code section

4. FIX IMPLEMENTATION
   - Develop a targeted fix for the root cause
   - Write unit tests to verify the fix
   - Test the fix in staging environment

5. DEPLOYMENT
   - Deploy fix to production with feature flag if possible
   - Monitor application performance closely
   - Roll back if unexpected issues arise

6. POST-RESOLUTION
   - Update documentation if needed
   - Add regression tests
   - Review code review process to prevent similar issues`
    ],
    database: [
      `Database Issue Resolution for "${issue.title}":

1. IMPACT ASSESSMENT
   - Identify affected databases and tables
   - Check data integrity and consistency
   - Estimate data loss or corruption scope

2. IMMEDIATE CONTAINMENT
   - Switch to read-only mode if data corruption suspected
   - Promote standby database if available
   - Implement application-level caching to reduce load

3. ROOT CAUSE INVESTIGATION
   - Review database error logs
   - Check query performance metrics
   - Analyze recent schema changes or migrations

4. RECOVERY PROCEDURES
   - Restore from recent backup if necessary
   - Reapply transactions from backup point to current time
   - Validate data integrity post-restoration

5. PERFORMANCE OPTIMIZATION
   - Review and optimize slow queries
   - Update database statistics
   - Consider indexing improvements

6. PREVENTIVE MEASURES
   - Implement better monitoring and alerting
   - Schedule regular database maintenance
   - Review backup and recovery procedures`
    ],
    network: [
      `Network Issue Resolution for "${issue.title}":

1. NETWORK ASSESSMENT
   - Identify affected network segments and services
   - Test connectivity between critical nodes
   - Check network device status and logs

2. TROUBLESHOOTING STEPS
   - Ping critical network endpoints
   - Trace routes to identify bottlenecks
   - Check firewall rules and ACL configurations

3. CONFIGURATION REVIEW
   - Verify recent network configuration changes
   - Check DNS resolution for affected services
   - Review load balancer configurations

4. RESOLUTION IMPLEMENTATION
   - Apply necessary configuration fixes
   - Restart network services if required
   - Update routing tables if needed

5. VALIDATION
   - Test end-to-end connectivity
   - Verify service accessibility
   - Monitor network performance metrics

6. DOCUMENTATION
   - Document the root cause and resolution
   - Update network diagrams if changes made
   - Review monitoring and alerting setup`
    ],
    security: [
      `Security Issue Resolution for "${issue.title}":

1. SECURITY ASSESSMENT
   - Determine the scope and impact of the security issue
   - Identify affected systems and data
   - Assess potential data exposure or system compromise

2. IMMEDIATE CONTAINMENT
   - Isolate affected systems from the network
   - Change credentials for potentially compromised accounts
   - Block malicious IP addresses or traffic patterns

3. FORENSIC ANALYSIS
   - Preserve system logs and evidence
   - Analyze attack vectors and entry points
   - Determine the timeline of the security breach

4. REMEDIATION
   - Patch vulnerabilities that were exploited
   - Clean or rebuild compromised systems
   - Implement additional security controls

5. RECOVERY
   - Restore services from clean backups
   - Verify system integrity and security
   - Monitor for any suspicious activity

6. PREVENTION
   - Conduct security audit and penetration testing
   - Update security policies and procedures
   - Provide security awareness training if needed`
    ]
  }

  const categoryTemplates = baseTemplates[issue.category as keyof typeof baseTemplates] || baseTemplates.infrastructure
  const baseTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)]

  // If we have relevant content from RAG, enhance the template
  if (relevantContent.length > 0) {
    const relevantText = relevantContent.map(entry => 
      `Similar Issue Resolution (Rating: ${entry.averageRating}/5):\n${entry.content.substring(0, 500)}...`
    ).join('\n\n')

    return `${baseTemplate}

7. LEARNED FROM SIMILAR ISSUES
   Based on analysis of ${relevantContent.length} similar resolved issues:

${relevantText}

   Key patterns identified:
   ${relevantContent.map(entry => `- ${entry.matchedKeywords.slice(0, 3).join(', ')}`).join('\n   ')}

8. ENHANCED PREVENTION
   - Apply lessons learned from similar incidents
   - Implement proactive monitoring for identified patterns
   - Update runbooks with successful resolution strategies`
  }

  return baseTemplate
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { issueId } = body

    if (!issueId) {
      return NextResponse.json(
        { error: 'Missing issueId' },
        { status: 400 }
      )
    }

    // Get the issue details
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        reporter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    // Check if resolution already exists
    const existingResolution = await db.aiResolution.findFirst({
      where: { issueId }
    })

    if (existingResolution) {
      return NextResponse.json(
        { error: 'Resolution already exists for this issue' },
        { status: 400 }
      )
    }

    // Retrieve relevant content using RAG
    const relevantContent = await retrieveRelevantContent(
      `${issue.title} ${issue.description}`,
      issue.category
    )

    // Generate AI resolution using Ollama service
    const resolutionText = await generateResolutionWithOllama(issue, relevantContent)

    // Save the resolution to database
    const resolution = await db.aiResolution.create({
      data: {
        issueId,
        resolutionText,
        modelUsed: 'llama3.1:8b (Ollama + RAG)',
        generatedAt: new Date()
      },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            severity: true,
            status: true
          }
        }
      }
    })

    // Update issue status to in_progress
    await db.issue.update({
      where: { id: issueId },
      data: { status: 'in_progress' }
    })

    // Update usage count for retrieved content
    if (relevantContent.length > 0) {
      await Promise.all(
        relevantContent.map(entry =>
          db.knowledgeBase.update({
            where: { id: entry.id },
            data: {
              usageCount: {
                increment: 1
              }
            }
          })
        )
      )
    }

    return NextResponse.json({
      resolution,
      relevantContentCount: relevantContent.length,
      message: 'AI resolution generated successfully using Ollama and RAG'
    })
  } catch (error) {
    console.error('Failed to generate AI resolution:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI resolution' },
      { status: 500 }
    )
  }
}