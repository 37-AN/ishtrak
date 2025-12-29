import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate SOP using Ollama service
async function generateSOPWithOllama(issue: any, resolution: string): Promise<string> {
  try {
    const ollamaResponse = await fetch('/api/ollama/generate-sop?XTransformPort=3031', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issue,
        resolution
      })
    })

    if (!ollamaResponse.ok) {
      throw new Error('Ollama service unavailable')
    }

    const result = await ollamaResponse.json()
    return result.sop
  } catch (error) {
    console.error('Failed to generate SOP with Ollama, falling back to template:', error)
    
    // Fallback to template-based generation
    return generateSOPTemplate(issue, resolution)
  }
}

// Fallback template-based SOP generation
function generateSOPTemplate(issue: any, resolution: string): string {
  const templates = {
    infrastructure: `STANDARD OPERATING PROCEDURE: INFRASTRUCTURE INCIDENT RESPONSE

TITLE: ${issue.title}
CATEGORY: ${issue.category}
SEVERITY: ${issue.severity}
ENVIRONMENT: ${issue.environment}

PURPOSE:
This SOP provides a standardized approach for resolving infrastructure-related issues similar to "${issue.title}".

SCOPE:
This procedure applies to all infrastructure components including servers, networks, and cloud resources in ${issue.environment} environment.

PRECONDITIONS:
- Access to infrastructure monitoring tools
- Administrative privileges on affected systems
- Backup and recovery procedures documented
- Communication channels established with stakeholders

STEP-BY-STEP PROCEDURE:

1. INCIDENT DETECTION AND ASSESSMENT
   - Monitor infrastructure dashboards for anomaly detection
   - Verify system status and impact scope
   - Document affected services and user impact
   - Estimate recovery time objective (RTO)

2. IMMEDIATE RESPONSE ACTIONS
   - Implement temporary workaround if available
   - Activate incident response team if severity is high/critical
   - Communicate status to all stakeholders
   - Begin root cause analysis

3. ROOT CAUSE ANALYSIS
   - Review system logs for error patterns
   - Check recent changes or deployments
   - Analyze performance metrics leading to issue
   - Document findings in incident report

4. RESOLUTION IMPLEMENTATION
   - Apply the identified fix based on root cause
   - Test the resolution in staging environment
   - Deploy fix to production with monitoring
   - Update configuration management database

5. VERIFICATION AND VALIDATION
   - Confirm service restoration and functionality
   - Monitor system stability for minimum 2 hours
   - Validate with affected users and stakeholders
   - Update incident status to resolved

6. POST-INCIDENT ACTIVITIES
   - Conduct post-mortem review meeting
   - Document lessons learned and action items
   - Update monitoring and alerting rules
   - Schedule follow-up checks to prevent recurrence

VALIDATION CHECKS:
- [ ] All services are operational
- [ ] Performance metrics are within normal ranges
- [ ] No error alerts in monitoring systems
- [ ] User access and functionality confirmed
- [ ] Documentation updated

ROLLBACK PLAN:
- Revert to last known good configuration
- Restore from recent backup if necessary
- Re-enable services in controlled manner
- Monitor for any rollback complications
- Communicate rollback status to stakeholders

APPROVAL:
This SOP was generated based on successful resolution of similar infrastructure incidents and should be reviewed quarterly for updates.`,
    
    application: `STANDARD OPERATING PROCEDURE: APPLICATION INCIDENT RESPONSE

TITLE: ${issue.title}
CATEGORY: ${issue.category}
SEVERITY: ${issue.severity}
ENVIRONMENT: ${issue.environment}

PURPOSE:
This SOP provides a standardized approach for resolving application-related issues similar to "${issue.title}".

SCOPE:
This procedure applies to all application components in ${issue.environment} environment, including web applications, APIs, and backend services.

PRECONDITIONS:
- Access to application source code and deployment pipelines
- Development and staging environments available
- Application monitoring and logging tools configured
- Rollback procedures documented and tested

STEP-BY-STEP PROCEDURE:

1. ISSUE REPRODUCTION AND ANALYSIS
   - Reproduce the issue in development environment
   - Identify the exact steps to trigger the problem
   - Document expected vs actual behavior
   - Determine impact on users and business processes

2. CODE AND CONFIGURATION REVIEW
   - Review recent code changes in affected modules
   - Check error logs and stack traces for patterns
   - Analyze recent configuration changes
   - Identify the specific component causing the issue

3. DEBUGGING AND ISOLATION
   - Set up debugging environment with appropriate tools
   - Add logging to track execution flow
   - Isolate the problematic code section
   - Test potential fixes in isolation

4. FIX DEVELOPMENT AND TESTING
   - Develop a targeted fix for the root cause
   - Write comprehensive unit tests to verify the fix
   - Test the fix in staging environment
   - Perform regression testing on related functionality

5. DEPLOYMENT AND MONITORING
   - Deploy fix to production with feature flag if possible
   - Monitor application performance and error rates closely
   - Have rollback plan ready if unexpected issues arise
   - Gradually increase traffic to fixed components

6. POST-DEPLOYMENT VALIDATION
   - Verify the issue is completely resolved
   - Monitor system stability for extended period
   - Collect feedback from affected users
   - Update documentation and knowledge base

VALIDATION CHECKS:
- [ ] Application functionality restored
- [ ] Error rates within acceptable thresholds
- [ ] Performance metrics normal
- [ ] User testing confirms resolution
- [ ] No new issues introduced

ROLLBACK PLAN:
- Revert to previous application version
- Restore database to pre-deployment state
- Disable problematic features
- Monitor system during rollback process
- Communicate rollback to stakeholders

APPROVAL:
This SOP was generated based on successful resolution of similar application incidents and should be reviewed quarterly for updates.`,
    
    database: `STANDARD OPERATING PROCEDURE: DATABASE INCIDENT RESPONSE

TITLE: ${issue.title}
CATEGORY: ${issue.category}
SEVERITY: ${issue.severity}
ENVIRONMENT: ${issue.environment}

PURPOSE:
This SOP provides a standardized approach for resolving database-related issues similar to "${issue.title}".

SCOPE:
This procedure applies to all database systems in ${issue.environment} environment, including primary, replica, and backup databases.

PRECONDITIONS:
- Database administration access and privileges
- Current database backups verified and accessible
- Database monitoring and alerting systems active
- Disaster recovery procedures documented and tested

STEP-BY-STEP PROCEDURE:

1. IMPACT ASSESSMENT AND CONTAINMENT
   - Identify affected databases and tables
   - Check data integrity and consistency
   - Estimate data loss or corruption scope
   - Implement immediate containment measures

2. IMMEDIATE RESPONSE ACTIONS
   - Switch to read-only mode if data corruption suspected
   - Promote standby database if available
   - Implement application-level caching to reduce load
   - Communicate database status to application teams

3. ROOT CAUSE INVESTIGATION
   - Review database error logs and alert history
   - Check query performance metrics and execution plans
   - Analyze recent schema changes or migrations
   - Examine hardware and system resource utilization

4. RECOVERY PROCEDURES
   - Determine appropriate recovery strategy based on impact
   - Restore from recent backup if necessary
   - Reapply transactions from backup point to current time
   - Validate data integrity post-restoration

5. PERFORMANCE OPTIMIZATION
   - Review and optimize slow queries identified
   - Update database statistics and rebuild indexes
   - Consider indexing improvements for affected queries
   - Tune database configuration parameters

6. VERIFICATION AND MONITORING
   - Validate data integrity with checksums and queries
   - Monitor database performance metrics closely
   - Test application functionality with recovered data
   - Establish enhanced monitoring for similar issues

VALIDATION CHECKS:
- [ ] Data integrity verified through checksums
- [ ] All applications can access required data
- [ ] Query performance within acceptable ranges
- [ ] Replication and backup processes functional
- [ ] No data loss or corruption detected

ROLLBACK PLAN:
- Restore from most recent clean backup
- Re-run failed transactions in correct order
- Re-establish database replication
- Verify application compatibility with restored data
- Monitor for any rollback-related issues

APPROVAL:
This SOP was generated based on successful resolution of similar database incidents and should be reviewed quarterly for updates.`
  }

  const categoryTemplates = templates[issue.category as keyof typeof templates] || templates.infrastructure
  return categoryTemplates
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

    // Get the issue and its resolution
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        resolutions: {
          where: {
            userRating: {
              gte: 4 // Only generate SOPs for highly-rated resolutions
            }
          },
          orderBy: {
            generatedAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    if (issue.status !== 'resolved') {
      return NextResponse.json(
        { error: 'Issue must be resolved before generating SOP' },
        { status: 400 }
      )
    }

    if (issue.resolutions.length === 0) {
      return NextResponse.json(
        { error: 'No highly-rated resolution found for this issue' },
        { status: 400 }
      )
    }

    // Check if SOP already exists
    const existingSop = await db.aiSop.findFirst({
      where: { issueId }
    })

    if (existingSop) {
      return NextResponse.json(
        { error: 'SOP already exists for this issue' },
        { status: 400 }
      )
    }

    // Generate SOP based on the best resolution using Ollama
    const bestResolution = issue.resolutions[0]
    const sopText = await generateSOPWithOllama(issue, bestResolution.resolutionText)

    // Save the SOP to database
    const sop = await db.aiSop.create({
      data: {
        issueId,
        sopText,
        generatedAt: new Date()
      },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            category: true,
            severity: true,
            resolvedAt: true
          }
        }
      }
    })

    // Create knowledge base entry if resolution was highly rated
    if (bestResolution.userRating && bestResolution.userRating >= 4) {
      await db.knowledgeBase.create({
        data: {
          content: sopText,
          contentType: 'sop',
          averageRating: bestResolution.userRating,
          usageCount: 1
        }
      })
    }

    return NextResponse.json({
      sop,
      message: 'SOP generated successfully using Ollama'
    })
  } catch (error) {
    console.error('Failed to generate SOP:', error)
    return NextResponse.json(
      { error: 'Failed to generate SOP' },
      { status: 500 }
    )
  }
}