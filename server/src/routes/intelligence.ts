import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const intelligenceRouter = Router();
intelligenceRouter.use(requireAuth);

intelligenceRouter.post("/run", async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.organizationId;

    // Get the first ICP Profile for the organization, or create a mock one
    let icpProfile = await prisma.icpProfile.findFirst({ where: { organizationId: orgId } });
    if (!icpProfile) {
      icpProfile = await prisma.icpProfile.create({
        data: {
          organizationId: orgId,
          name: "Default Target Profile",
          description: "Auto-generated default ICP",
          isActive: true
        }
      });
    }

    // Removed old data deletion to preserve existing analysis and save API resources

    // Find a small batch of accounts that haven't been assessed yet
    // LIMIT 2 to prevent Vercel 10s serverless timeout!
    const accounts = await prisma.account.findMany({
      where: { 
        organizationId: orgId,
        assessments: { none: {} } // Only get accounts that have NO ICP Assessment
      },
      include: { contacts: true, technologies: true },
      take: 2
    });
    
    // If all accounts are already analyzed, return early to save resources
    if (accounts.length === 0) {
      return res.json({
        success: true,
        stats: { accountsScored: 0, signalsGenerated: 0, opportunitiesGenerated: 0, requirementsGenerated: 0, matchesGenerated: 0 },
        message: "All accounts are already analyzed."
      });
    }

    let signalsGenerated = 0;
    let opportunitiesGenerated = 0;
    let accountsScored = 0;
    let requirementsGenerated = 0;
    let matchesGenerated = 0;

    const { analyzeAccountsBatch } = await import("../services/ai.service.js");
    
    // Call the Gemini LLM
    const intelligenceData = await analyzeAccountsBatch(accounts);

    for (const aiData of intelligenceData) {
      const account = accounts.find(a => a.id === aiData.accountId);
      if (!account) continue;

      try {
        const score = aiData.icpScore;
        const classification = score > 80 ? "Tier 1" : score > 60 ? "Tier 2" : "Tier 3";

        // 1. Generate ICP Assessment
        let assessment = await prisma.icpAssessment.findFirst({
          where: { accountId: account.id, icpProfileId: icpProfile.id }
        });
        
        const assessmentData = {
          marketFitScore: score,
          businessScaleScore: score,
          economicFitScore: score,
          growthCapacityScore: score,
          buyingReadinessScore: score,
          commercialFitScore: score,
          overallScore: score,
          classification: classification,
          hardGatePassed: true,
          explanation: "Analyzed by AI based on industry context, employee scale, and revenue indicators."
        };
        
        if (assessment) {
          await prisma.icpAssessment.update({
            where: { id: assessment.id },
            data: assessmentData
          });
        } else {
          await prisma.icpAssessment.create({
            data: {
              accountId: account.id,
              icpProfileId: icpProfile.id,
              ...assessmentData
            }
          });
        }
        accountsScored++;

        // 1b. Generate AccountIntelligence (upsert to avoid duplicates)
        await prisma.accountIntelligence.upsert({
          where: { accountId: account.id },
          update: {
            marketingMaturity: aiData.marketingMaturity,
            technologyMaturity: aiData.technologyMaturity,
            growthObjective: "Market Expansion",
            primaryProblem: aiData.primaryProblem,
            confidence: 0.85
          },
          create: {
            accountId: account.id,
            marketingMaturity: aiData.marketingMaturity,
            technologyMaturity: aiData.technologyMaturity,
            growthObjective: "Market Expansion",
            primaryProblem: aiData.primaryProblem,
            confidence: 0.85
          }
        });

        // 2. Generate Market Signals
        let signalId = null;
        if (aiData.marketSignal) {
          const signal = await prisma.marketSignal.create({
            data: {
              organizationId: orgId,
              accountId: account.id,
              sourceType: "NEWS",
              sourceName: "AI Analysis",
              signalType: aiData.marketSignal.type || "TECHNOLOGY_SIGNAL",
              title: aiData.marketSignal.title,
              signalStrength: aiData.marketSignal.confidence || 0.8,
              confidence: aiData.marketSignal.confidence || 0.8,
              status: "NEW"
            }
          });
          signalId = signal.id;
          signalsGenerated++;
        }

        // 2b. Generate Growth Signal and Pain Point
        if (signalId) {
          await prisma.growthSignal.create({
            data: {
              accountId: account.id,
              signalId: signalId,
              growthTrigger: "Strategic Need",
              confidence: 0.88
            }
          });
          
          if (aiData.painPoint) {
            await prisma.painPoint.create({
              data: {
                accountId: account.id,
                signalId: signalId,
                category: aiData.painPoint.category || "Operations",
                title: aiData.painPoint.title,
                severity: aiData.painPoint.severity || "MEDIUM",
                confidence: aiData.painPoint.confidence || 0.8
              }
            });
          }
        }

        // 3. Generate Requirements & Buyer Intent
        let requirementId = null;
        if (aiData.requirement) {
          const req = await prisma.requirement.create({
            data: {
              accountId: account.id,
              signalId: signalId,
              requirementType: "DETECTED",
              category: aiData.requirement.category || "Enterprise Software",
              title: aiData.requirement.title,
              description: aiData.requirement.description,
              budgetMin: aiData.requirement.budgetMin,
              budgetMax: aiData.requirement.budgetMax,
              budgetCurrency: aiData.requirement.budgetCurrency || "USD",
              status: "POTENTIAL",
              confidence: aiData.requirement.confidence || 0.8,
              urgency: aiData.requirement.urgency || "MEDIUM"
            }
          });
          requirementId = req.id;
          requirementsGenerated++;

          await prisma.buyerIntent.create({
            data: {
              accountId: account.id,
              signalId: signalId || (await prisma.marketSignal.findFirst({where:{accountId:account.id}}))?.id || "",
              score: score * 0.9,
              level: score > 80 ? "HOT" : score > 65 ? "WARM" : "COLD",
              requirementSummary: req.title,
              confidence: req.confidence
            }
          });
        }

        // 4. Generate Opportunities and Matches
        if (score >= 65) {
          const oppClass = score >= 85 ? "HOT" : score >= 75 ? "WARM" : "NURTURE";
          await prisma.opportunity.create({
            data: {
              organizationId: orgId,
              accountId: account.id,
              opportunityType: "BUYING_OPPORTUNITY",
              title: `${oppClass} Fit: ${account.companyName} Opportunity`,
              summary: `This account scores ${score} on the ICP fit assessment based on deep AI analysis.`,
              buyerIntentScore: score * 0.9,
              sellerIntentScore: score * 0.8,
              requirementScore: score * 0.85,
              fitScore: score,
              economicScore: score * 0.9,
              readinessScore: signalId ? 80 : 50,
              growthScore: score * 0.7,
              confidenceScore: 0.9,
              opportunityScore: (score + (signalId ? 80 : 50)) / 2,
              classification: oppClass,
              status: "OPEN"
            }
          });
          opportunitiesGenerated++;

          // Generate a Match if we created a requirement
          if (requirementId) {
            const seller = await prisma.account.findFirst({ where: { organizationId: orgId } });
            if (seller) {
               await prisma.opportunityMatch.create({
                 data: {
                   buyerAccountId: account.id,
                   sellerAccountId: seller.id,
                   buyerRequirementId: requirementId,
                   sellerProduct: aiData.requirement.category || "Enterprise Solution",
                   matchScore: score * 0.9,
                   productMatch: score > 80 ? 95 : 75,
                   industryMatch: score > 75 ? 90 : 65,
                   geographyMatch: 100,
                   budgetMatch: 85,
                   timelineMatch: score > 80 ? 90 : 70,
                   reason: `High ICP match aligning with AI-detected need for ${aiData.requirement.category || 'enterprise software'}.`,
                   confidence: 0.88,
                   status: "NEW"
                 }
               });
               matchesGenerated++;
            }
          }
        }
      } catch (accountErr: any) {
        console.error(`Error processing account ${account.companyName}:`, accountErr?.message || accountErr);
        // Continue processing other accounts even if one fails
        continue;
      }
    }

    res.json({
      success: true,
      stats: {
        accountsScored,
        signalsGenerated,
        opportunitiesGenerated,
        requirementsGenerated,
        matchesGenerated
      }
    });
  } catch (err) {
    next(err);
  }
});
