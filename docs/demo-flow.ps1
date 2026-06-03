$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000/api/v1"

function Invoke-GigahubJson {
  param (
    [Parameter(Mandatory = $true)]
    [string] $Method,

    [Parameter(Mandatory = $true)]
    [string] $Path,

    [string] $Token,

    [object] $Body
  )

  $headers = @{}

  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $request = @{
    Method = $Method
    Uri = "$baseUrl$Path"
    Headers = $headers
  }

  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = $Body | ConvertTo-Json -Depth 12
  }

  Invoke-RestMethod @request
}

function Get-GigahubSession {
  param (
    [Parameter(Mandatory = $true)]
    [string] $Email,

    [Parameter(Mandatory = $true)]
    [string] $Password,

    [Parameter(Mandatory = $true)]
    [string] $Role
  )

  try {
    Invoke-GigahubJson -Method "Post" -Path "/auth/login" -Body @{
      email = $Email
      password = $Password
    }
  } catch {
    Invoke-GigahubJson -Method "Post" -Path "/auth/register" -Body @{
      email = $Email
      password = $Password
      role = $Role
    }
  }
}

$clientSession = Get-GigahubSession -Email "client@gigahub.local" -Password "StrongPassword123!" -Role "CLIENT"
$freelancerSession = Get-GigahubSession -Email "freelancer@gigahub.local" -Password "StrongPassword123!" -Role "FREELANCER"

$clientToken = $clientSession.data.tokens.accessToken
$freelancerToken = $freelancerSession.data.tokens.accessToken

Write-Host ""
Write-Host "Client Swagger token:"
Write-Host "Bearer $clientToken"

Write-Host ""
Write-Host "Freelancer Swagger token:"
Write-Host "Bearer $freelancerToken"

$liveHealth = Invoke-GigahubJson -Method "Get" -Path "/health/live"
$readyHealth = Invoke-GigahubJson -Method "Get" -Path "/health/ready"

Write-Host ""
Write-Host "Live health:"
$liveHealth | ConvertTo-Json -Depth 12

Write-Host ""
Write-Host "Ready health:"
$readyHealth | ConvertTo-Json -Depth 12

$project = Invoke-GigahubJson -Method "Post" -Path "/projects" -Token $clientToken -Body @{
  title = "Build a senior-grade marketplace backend"
  description = "A complete marketplace workflow with identity, projects, proposals, contracts, milestones, disputes, auditability, dashboard metrics, and an outbox relay worker."
  budgetMin = 5000
  budgetMax = 9000
  currency = "USD"
  skills = @("nestjs", "postgresql", "prisma", "architecture", "outbox", "security")
}

$projectId = $project.data.id

Write-Host ""
Write-Host "Project ID:"
Write-Host $projectId

$publishedProject = Invoke-GigahubJson -Method "Patch" -Path "/projects/$projectId/publish" -Token $clientToken

Write-Host ""
Write-Host "Published project status:"
Write-Host $publishedProject.data.status

$proposal = Invoke-GigahubJson -Method "Post" -Path "/projects/$projectId/proposals" -Token $freelancerToken -Body @{
  coverLetter = "I can build this marketplace backend with clear boundaries, reliable state transitions, audit trails, and async-ready integration events."
  proposedAmount = 6000
  currency = "USD"
  deliveryDays = 28
}

$proposalId = $proposal.data.id

Write-Host ""
Write-Host "Proposal ID:"
Write-Host $proposalId

$contract = Invoke-GigahubJson -Method "Post" -Path "/proposals/$proposalId/accept" -Token $clientToken -Body @{
  milestones = @(
    @{
      title = "Core marketplace workflow"
      description = "Implement project publishing, proposal submission, and contract creation."
      amount = 1800
      dueAt = (Get-Date).AddDays(7).ToString("o")
    },
    @{
      title = "Milestone delivery and dispute flow"
      description = "Implement submit, approve, release, and dispute transitions with audit metadata."
      amount = 2200
      dueAt = (Get-Date).AddDays(14).ToString("o")
    },
    @{
      title = "Operational visibility"
      description = "Expose dashboard metrics, audit browsing, and outbox relay observability."
      amount = 2000
      dueAt = (Get-Date).AddDays(21).ToString("o")
    }
  )
  terms = @{
    sourceIncluded = $true
    actorAuditTrail = $true
    outboxEvents = $true
    dashboardMetrics = $true
  }
}

$contractId = $contract.data.id
$releaseMilestoneId = $contract.data.milestones[0].id
$disputeMilestoneId = $contract.data.milestones[1].id

Write-Host ""
Write-Host "Contract ID:"
Write-Host $contractId

Write-Host ""
Write-Host "Release milestone ID:"
Write-Host $releaseMilestoneId

Write-Host ""
Write-Host "Dispute milestone ID:"
Write-Host $disputeMilestoneId

$submittedReleaseMilestone = Invoke-GigahubJson -Method "Patch" -Path "/milestones/$releaseMilestoneId/submit" -Token $freelancerToken
$approvedReleaseMilestone = Invoke-GigahubJson -Method "Patch" -Path "/milestones/$releaseMilestoneId/approve" -Token $clientToken
$releasedMilestone = Invoke-GigahubJson -Method "Patch" -Path "/milestones/$releaseMilestoneId/release" -Token $clientToken

Write-Host ""
Write-Host "Released milestone status:"
Write-Host $releasedMilestone.data.status

$submittedDisputeMilestone = Invoke-GigahubJson -Method "Patch" -Path "/milestones/$disputeMilestoneId/submit" -Token $freelancerToken

$disputedMilestone = Invoke-GigahubJson -Method "Patch" -Path "/milestones/$disputeMilestoneId/dispute" -Token $clientToken -Body @{
  reason = "The submitted milestone does not include enough evidence for the agreed audit and outbox verification scope."
  evidenceUrls = @(
    "https://example.com/evidence/review-notes",
    "https://example.com/evidence/outbox-relay-log"
  )
}

Write-Host ""
Write-Host "Disputed milestone status:"
Write-Host $disputedMilestone.data.status

$contractMilestones = Invoke-GigahubJson -Method "Get" -Path "/contracts/$contractId/milestones" -Token $clientToken

Write-Host ""
Write-Host "Contract milestones:"
$contractMilestones | ConvertTo-Json -Depth 12

$clientAuditLogs = Invoke-GigahubJson -Method "Get" -Path "/audit-logs/me?page=1&limit=20" -Token $clientToken

Write-Host ""
Write-Host "Client audit logs:"
$clientAuditLogs | ConvertTo-Json -Depth 12

$milestoneAuditLogs = Invoke-GigahubJson -Method "Get" -Path "/audit-logs/me?page=1&limit=20&resourceType=MILESTONE&resourceId=$disputeMilestoneId" -Token $clientToken

Write-Host ""
Write-Host "Dispute milestone audit logs:"
$milestoneAuditLogs | ConvertTo-Json -Depth 12

$clientDashboard = Invoke-GigahubJson -Method "Get" -Path "/dashboard/me" -Token $clientToken
$freelancerDashboard = Invoke-GigahubJson -Method "Get" -Path "/dashboard/me" -Token $freelancerToken

Write-Host ""
Write-Host "Client dashboard:"
$clientDashboard | ConvertTo-Json -Depth 12

Write-Host ""
Write-Host "Freelancer dashboard:"
$freelancerDashboard | ConvertTo-Json -Depth 12

Write-Host ""
Write-Host "Swagger:"
Write-Host "http://localhost:3000/docs"

Write-Host ""
Write-Host "Use this value in Swagger Authorize for client routes:"
Write-Host "Bearer $clientToken"

Write-Host ""
Write-Host "Use this value in Swagger Authorize for freelancer routes:"
Write-Host "Bearer $freelancerToken"