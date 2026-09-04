import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import Papa from "papaparse";

export const importRouter = Router();
importRouter.use(requireAuth);

function pick(row: any, names: string[]) {
  const key = Object.keys(row).find(k => names.includes(k.toLowerCase().trim()));
  return key ? row[key] : undefined;
}

importRouter.post("/preview", async (req: AuthRequest, res, next) => {
  try {
    const csv = String(req.body.csv ?? "");
    const parsed = Papa.parse<Record<string,string>>(csv, { header: true, skipEmptyLines: true });
    const rows = parsed.data;
    const columns = parsed.meta.fields ?? [];
    const mapping: Record<string,string> = {};
    const targets: Record<string,string[]> = {
      companyName: ["company","company name","company_name","account","account name","organization","organisation","business","business name","client","client name", "company name for emails"],
      website: ["website","domain","url","company website","company domain"],
      companyLinkedin: ["company linkedin url", "company linkedin", "linkedin company url", "linkedin url", "linkedin"],
      industry: ["industry","sector","category","vertical"],
      country: ["country","nation", "company country"],
      state: ["state", "company state", "region", "province"],
      city: ["city","location", "company city"],
      employeeCount: ["employees","employee count","employee_count", "# employees", "company size", "size"],
      revenueRange: ["revenue","revenue range", "annual revenue", "estimated revenue", "sales"],
      fullName: ["contact","contact name","full name", "first name", "name", "person", "lead name", "lead"],
      email: ["email","contact email", "email address", "work email"],
      phone: ["corporate phone", "company phone", "phone", "phone number", "contact number", "mobile", "cell", "work phone", "mobile phone", "other phone"],
      contactLinkedin: ["person linkedin url", "person linkedin", "contact linkedin", "contact linkedin url"],
      jobTitle: ["title","job title","job_title", "designation", "position", "role"]
    };
    for (const [target, aliases] of Object.entries(targets)) {
      const found = columns.find((c: string) => aliases.includes(c.toLowerCase().trim()));
      if (found) mapping[target] = found;
    }
    res.json({ columns, mapping, preview: rows.slice(0,10), totalRecords: rows.length, errors: parsed.errors });
  } catch (e) { next(e); }
});

importRouter.post("/execute", async (req: AuthRequest, res, next) => {
  try {
    const csv = String(req.body.csv ?? "");
    const mapping = req.body.mapping ?? {};
    const parsed = Papa.parse<Record<string,string>>(csv, { header: true, skipEmptyLines: true });
    let created = 0, duplicates = 0, errors = 0;
    for (const row of parsed.data) {
      const companyName = row[mapping.companyName];
      if (!companyName) { errors++; continue; }
      const accountId = `IMP-${companyName.toUpperCase().replace(/[^A-Z0-9]+/g,"-").slice(0,30)}`;
      const exists = await prisma.account.findFirst({ where: { organizationId: req.user!.organizationId, OR: [{ accountId }, { companyName }] } });
      if (exists) { duplicates++; continue; }
      const account = await prisma.account.create({ data: {
        organizationId: req.user!.organizationId, accountId, companyName,
        website: row[mapping.website] || undefined, 
        linkedinUrl: row[mapping.companyLinkedin] || undefined,
        industry: row[mapping.industry] || undefined,
        country: row[mapping.country] || undefined, 
        state: row[mapping.state] || undefined,
        city: row[mapping.city] || undefined,
        employeeCount: row[mapping.employeeCount] ? Number(row[mapping.employeeCount]) || undefined : undefined,
        revenueRange: row[mapping.revenueRange] || undefined, source: "CSV"
      }});
      
      let fullName = row[mapping.fullName];
      // If the mapper grabbed "First Name" as the fullName, try to append "Last Name"
      if (mapping.fullName && mapping.fullName.trim().toLowerCase() === "first name" && row["Last Name"]) {
        fullName = `${fullName} ${row["Last Name"]}`.trim();
      }

      if (fullName) await prisma.contact.create({ data: { 
        accountId: account.id, 
        fullName, 
        email: row[mapping.email] || undefined, 
        phone: row[mapping.phone] || undefined,
        linkedinUrl: row[mapping.contactLinkedin] || undefined,
        jobTitle: row[mapping.jobTitle] || undefined 
      } });
      await prisma.accountDataSource.create({ data: { accountId: account.id, sourceType: "CSV", sourceName: "CSV Import", rawData: row as any } });
      created++;
    }
    const job = await prisma.importJob.create({ data: { organizationId: req.user!.organizationId, fileName: "uploaded.csv", totalRecords: parsed.data.length, validRecords: created, duplicateRecords: duplicates, errorRecords: errors, status: "COMPLETED", columnMapping: mapping } });
    res.json({ job });
  } catch (e) { next(e); }
});
