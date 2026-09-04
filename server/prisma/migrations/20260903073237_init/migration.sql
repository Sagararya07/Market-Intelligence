-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'SALES', 'VIEWER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CSV', 'LINKEDIN', 'WEBSITE', 'JOB_PORTAL', 'MARKETPLACE', 'SEARCH', 'NEWS', 'RFP', 'MANUAL', 'API');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('BUYING_SIGNAL', 'SELLING_SIGNAL', 'REQUIREMENT_SIGNAL', 'HIRING_SIGNAL', 'FUNDING_SIGNAL', 'EXPANSION_SIGNAL', 'TECHNOLOGY_SIGNAL', 'PRODUCT_LAUNCH', 'PARTNERSHIP', 'RFP', 'RFQ', 'TENDER', 'SEARCH_INTENT', 'PAIN_POINT', 'JOB_CHANGE', 'WEBSITE_CHANGE', 'COMPETITOR_SIGNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "IntentType" AS ENUM ('BUY', 'SELL', 'BOTH', 'REQUIREMENT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntentLevel" AS ENUM ('HOT', 'WARM', 'COLD', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('UNKNOWN', 'EXPLORING', 'POTENTIAL', 'ACTIVE', 'URGENT', 'FULFILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('BUYING_OPPORTUNITY', 'SELLING_OPPORTUNITY', 'PARTNERSHIP', 'VENDOR_MATCH', 'DEMAND_SUPPLY_MATCH', 'STRATEGIC_OPPORTUNITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OpportunityClass" AS ENUM ('HOT', 'WARM', 'COLD', 'NURTURE');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WORKING', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'NURTURE');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('SOURCE_FACT', 'USER_PROVIDED', 'CALCULATED', 'AI_INFERENCE', 'AI_CLASSIFICATION');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "linkedinUrl" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "industry" TEXT,
    "subIndustry" TEXT,
    "businessModel" TEXT,
    "companyType" TEXT,
    "employeeCount" INTEGER,
    "employeeRange" TEXT,
    "estimatedRevenue" DOUBLE PRECISION,
    "revenueCurrency" TEXT,
    "revenueRange" TEXT,
    "foundedYear" INTEGER,
    "annualRevenue" DOUBLE PRECISION,
    "totalFunding" DOUBLE PRECISION,
    "latestFunding" DOUBLE PRECISION,
    "latestFundingDate" TIMESTAMP(3),
    "growthStage" TEXT,
    "businessStatus" TEXT,
    "description" TEXT,
    "valueProposition" TEXT,
    "targetCustomer" TEXT,
    "productServiceSummary" TEXT,
    "source" TEXT,
    "sourceRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "seniority" TEXT,
    "department" TEXT,
    "email" TEXT,
    "emailStatus" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "decisionAuthority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDataSource" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "rawData" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTechnology" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "AccountTechnology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSignal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountId" TEXT,
    "contactId" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceExternalId" TEXT,
    "signalType" "SignalType" NOT NULL,
    "signalSubtype" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "summary" TEXT,
    "publishedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" TEXT,
    "rawContent" TEXT,
    "normalizedContent" TEXT,
    "signalStrength" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalClassification" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "intentType" "IntentType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoningSummary" TEXT NOT NULL,
    "detectedKeywords" TEXT[],
    "semanticEvidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerIntent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" "IntentLevel" NOT NULL,
    "intentCategory" TEXT,
    "requirementSummary" TEXT,
    "urgency" TEXT,
    "timeline" TEXT,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "budgetCurrency" TEXT,
    "decisionMakerDetected" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerIntent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" "IntentLevel" NOT NULL,
    "productSummary" TEXT,
    "serviceSummary" TEXT,
    "targetBuyer" TEXT,
    "targetIndustry" TEXT,
    "targetGeography" TEXT,
    "distributionNeed" TEXT,
    "partnershipNeed" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "signalId" TEXT,
    "requirementType" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "problemStatement" TEXT,
    "desiredSolution" TEXT,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "budgetCurrency" TEXT,
    "timeline" TEXT,
    "urgency" TEXT,
    "decisionMaker" TEXT,
    "decisionAuthority" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DOUBLE PRECISION NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PainPoint" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "signalId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PainPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthSignal" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "growthTrigger" TEXT NOT NULL,
    "growthStage" TEXT,
    "growthDirection" TEXT,
    "description" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountIntelligence" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "businessModel" TEXT,
    "growthStage" TEXT,
    "businessStability" TEXT,
    "marketingMaturity" TEXT,
    "technologyMaturity" TEXT,
    "customerValue" DOUBLE PRECISION,
    "acv" DOUBLE PRECISION,
    "aov" DOUBLE PRECISION,
    "ltv" DOUBLE PRECISION,
    "marketingSpend" DOUBLE PRECISION,
    "paidMediaSpend" DOUBLE PRECISION,
    "internalTeamSize" INTEGER,
    "externalAgencyUsage" TEXT,
    "salesCycle" TEXT,
    "cac" DOUBLE PRECISION,
    "growthObjective" TEXT,
    "growthHorizon" TEXT,
    "growthAmbition" TEXT,
    "primaryProblem" TEXT,
    "primaryOpportunity" TEXT,
    "decisionMaker" TEXT,
    "decisionAuthority" TEXT,
    "lastAnalyzedAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductServiceProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "offeringType" TEXT,
    "primaryOffering" TEXT,
    "secondaryOfferings" TEXT,
    "revenueGeneratingOffering" TEXT,
    "targetCustomer" TEXT,
    "customerType" TEXT,
    "customerSegment" TEXT,
    "valueProposition" TEXT,
    "problemSolved" TEXT,
    "differentiation" TEXT,
    "marketPotential" TEXT,
    "competitiveEnvironment" TEXT,
    "internationalPotential" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductServiceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcpProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IcpProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcpRule" (
    "id" TEXT NOT NULL,
    "icpProfileId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "isHardGate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IcpRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcpAssessment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "icpProfileId" TEXT NOT NULL,
    "marketFitScore" DOUBLE PRECISION NOT NULL,
    "businessScaleScore" DOUBLE PRECISION NOT NULL,
    "economicFitScore" DOUBLE PRECISION NOT NULL,
    "growthCapacityScore" DOUBLE PRECISION NOT NULL,
    "buyingReadinessScore" DOUBLE PRECISION NOT NULL,
    "commercialFitScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "classification" TEXT NOT NULL,
    "hardGatePassed" BOOLEAN NOT NULL,
    "explanation" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IcpAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicIntent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "whyNow" TEXT,
    "growthObjective" TEXT,
    "desiredOutcome" TEXT,
    "selfIdentifiedGap" TEXT,
    "expectedOutcome" TEXT,
    "successDefinition" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "overallHealthScore" DOUBLE PRECISION NOT NULL,
    "summary" TEXT,
    "primaryProblem" TEXT,
    "primaryOpportunity" TEXT,
    "priority" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisDimension" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "finding" TEXT,
    "evidence" TEXT,
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "opportunityType" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "buyerIntentScore" DOUBLE PRECISION NOT NULL,
    "sellerIntentScore" DOUBLE PRECISION NOT NULL,
    "requirementScore" DOUBLE PRECISION NOT NULL,
    "fitScore" DOUBLE PRECISION NOT NULL,
    "economicScore" DOUBLE PRECISION NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "growthScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "opportunityScore" DOUBLE PRECISION NOT NULL,
    "classification" "OpportunityClass" NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "currency" TEXT,
    "urgency" TEXT,
    "timeline" TEXT,
    "recommendedAction" TEXT,
    "recommendedContact" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "signalId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "observedValue" TEXT,
    "inferredValue" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunitySignal" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OpportunitySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityMatch" (
    "id" TEXT NOT NULL,
    "buyerAccountId" TEXT NOT NULL,
    "sellerAccountId" TEXT NOT NULL,
    "buyerRequirementId" TEXT,
    "sellerProduct" TEXT,
    "sellerService" TEXT,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "productMatch" DOUBLE PRECISION NOT NULL,
    "industryMatch" DOUBLE PRECISION NOT NULL,
    "geographyMatch" DOUBLE PRECISION NOT NULL,
    "budgetMatch" DOUBLE PRECISION NOT NULL,
    "timelineMatch" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "signalId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "buyerIntentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "requirementWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "fitWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "readinessWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "economicWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "growthWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "evidenceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "hotThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "warmThreshold" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "coldThreshold" DOUBLE PRECISION NOT NULL DEFAULT 40,

    CONSTRAINT "ScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "validRecords" INTEGER NOT NULL DEFAULT 0,
    "duplicateRecords" INTEGER NOT NULL DEFAULT 0,
    "errorRecords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PREVIEW',
    "columnMapping" JSONB,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_key" ON "Technology"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AccountTechnology_accountId_technologyId_key" ON "AccountTechnology"("accountId", "technologyId");

-- CreateIndex
CREATE UNIQUE INDEX "SignalClassification_signalId_key" ON "SignalClassification"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerIntent_signalId_key" ON "BuyerIntent"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerIntent_signalId_key" ON "SellerIntent"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_signalId_key" ON "Requirement"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "PainPoint_signalId_key" ON "PainPoint"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthSignal_signalId_key" ON "GrowthSignal"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountIntelligence_accountId_key" ON "AccountIntelligence"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductServiceProfile_accountId_key" ON "ProductServiceProfile"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicIntent_accountId_key" ON "StrategicIntent"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Diagnosis_accountId_key" ON "Diagnosis"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunitySignal_opportunityId_signalId_key" ON "OpportunitySignal"("opportunityId", "signalId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringConfig_organizationId_key" ON "ScoringConfig"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDataSource" ADD CONSTRAINT "AccountDataSource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTechnology" ADD CONSTRAINT "AccountTechnology_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTechnology" ADD CONSTRAINT "AccountTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSignal" ADD CONSTRAINT "MarketSignal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSignal" ADD CONSTRAINT "MarketSignal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSignal" ADD CONSTRAINT "MarketSignal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalClassification" ADD CONSTRAINT "SignalClassification_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerIntent" ADD CONSTRAINT "BuyerIntent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerIntent" ADD CONSTRAINT "BuyerIntent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerIntent" ADD CONSTRAINT "SellerIntent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerIntent" ADD CONSTRAINT "SellerIntent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PainPoint" ADD CONSTRAINT "PainPoint_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PainPoint" ADD CONSTRAINT "PainPoint_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthSignal" ADD CONSTRAINT "GrowthSignal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthSignal" ADD CONSTRAINT "GrowthSignal_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountIntelligence" ADD CONSTRAINT "AccountIntelligence_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductServiceProfile" ADD CONSTRAINT "ProductServiceProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcpProfile" ADD CONSTRAINT "IcpProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcpRule" ADD CONSTRAINT "IcpRule_icpProfileId_fkey" FOREIGN KEY ("icpProfileId") REFERENCES "IcpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcpAssessment" ADD CONSTRAINT "IcpAssessment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcpAssessment" ADD CONSTRAINT "IcpAssessment_icpProfileId_fkey" FOREIGN KEY ("icpProfileId") REFERENCES "IcpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicIntent" ADD CONSTRAINT "StrategicIntent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisDimension" ADD CONSTRAINT "DiagnosisDimension_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySignal" ADD CONSTRAINT "OpportunitySignal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySignal" ADD CONSTRAINT "OpportunitySignal_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_buyerAccountId_fkey" FOREIGN KEY ("buyerAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_sellerAccountId_fkey" FOREIGN KEY ("sellerAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_buyerRequirementId_fkey" FOREIGN KEY ("buyerRequirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountEvent" ADD CONSTRAINT "AccountEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountEvent" ADD CONSTRAINT "AccountEvent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringConfig" ADD CONSTRAINT "ScoringConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
