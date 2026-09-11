import re

with open("client/src/pages/Imports.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { UploadCloud, FileText as FileIcon, Download } from "lucide-react";',
    'import { UploadCloud, FileText as FileIcon, Download, Search, Eye, Users, Database, X } from "lucide-react";'
)

# 2. Add new states inside Imports component
state_insertion = """  const [searchQuery, setSearchQuery] = useState("");
  const [viewingSheet, setViewingSheet] = useState<string | null>(null);"""
content = re.sub(
    r'(const \[filterPhonePrefix, setFilterPhonePrefix\] = useState\(""\);)',
    r'\1\n' + state_insertion,
    content
)

# 3. Add Sheets logic just before filteredResults
sheets_logic = """
  const sheetsMap = new Map<string, { records: any[], location: string, industry: string }>();
  results.forEach(r => {
    const locParts = (r.location || "United States").split(",");
    const country = locParts[locParts.length - 1].trim();
    const indParts = (r.industries || "Technology").split(",");
    const industry = indParts[0].trim();
    const sheetName = `${country} — ${industry}`;
    if (!sheetsMap.has(sheetName)) {
      sheetsMap.set(sheetName, { records: [], location: country, industry });
    }
    sheetsMap.get(sheetName)!.records.push(r);
  });
  const allSheets = Array.from(sheetsMap.entries()).map(([name, data]) => ({
    name, ...data
  })).sort((a, b) => b.records.length - a.records.length);
  
  const filteredSheets = allSheets.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const downloadSheet = (sheetName: string, records: any[]) => {
    const headers = [
      "Enriched Date", "Company Name", "Industries", "Location", "Requirement", "Estimated Budget", "Company Social Media Links", 
      "Company Website", "Company Contact", "Number of Employees", "Revenue", "Founder Name",
      "CXO's Name", "CXO Email", "CXO Phone", "CXO Social Media", "CXO Other",
      "Eligible (Yes/No)"
    ];
    const rows = records.map(r => [
      r.enrichedDate, r.companyName, r.industries, r.location, r.requirement, r.budget, r.companySocialMedia,
      r.companyWebsite, r.companyContact, r.employees, r.revenue, r.founderName,
      r.cxoName, r.cxoEmail, r.cxoPhone, r.cxoSocialMedia, r.cxoOther,
      r.eligible
    ]);
    const escapeCsv = (str: any) => `"${String(str || "").replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map(row => row.map(escapeCsv).join(","))].join("\\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Lumora_${sheetName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    link.click();
  };
"""
content = re.sub(
    r'(const filteredResults = results\.filter\(r => \{)',
    sheets_logic + r'\n  \1\n    if (viewingSheet) {\n      const locParts = (r.location || "United States").split(",");\n      const country = locParts[locParts.length - 1].trim();\n      const indParts = (r.industries || "Technology").split(",");\n      const industry = indParts[0].trim();\n      if (`${country} — ${industry}` !== viewingSheet) return false;\n    }',
    content
)

# 4. Modify the header and replace the Data Import box with a grid
old_header_and_import = """      <h1 className="text-2xl font-bold text-slate-900">Data Import</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Preview, map and import existing company/contact data without overwriting source records. Supports CSV and Excel.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">"""
      
new_header_and_import = """      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Data Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Import new records or access your grouped data library without overwriting source records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Data Import</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1">"""

content = content.replace(old_header_and_import, new_header_and_import)

# 5. Insert Data Library box closing the grid
old_end_of_import = """          </div>
        )}
      </div>

      {/* Results Table Loading State */}"""

new_end_of_import = """          </div>
        )}
          </div>
        </div>

        {/* Data Library Box */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Data Library (ICP)</h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden max-h-[500px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search sheets..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-theme-blue text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredSheets.length === 0 && <div className="text-center text-slate-500 py-4 text-sm">No sheets found.</div>}
              {filteredSheets.map((sheet, idx) => (
                <div key={sheet.name} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${viewingSheet === sheet.name ? 'border-theme-blue bg-theme-blue/5' : 'border-slate-100 hover:border-theme-blue/30 hover:bg-slate-50'}`}>
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-semibold text-slate-800 text-sm truncate" title={sheet.name}>{sheet.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {sheet.records.length} records
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewingSheet(viewingSheet === sheet.name ? null : sheet.name)} className={`p-1.5 rounded transition-colors ${viewingSheet === sheet.name ? 'text-white bg-theme-blue hover:bg-theme-blue/90' : 'text-theme-blue hover:bg-theme-blue/10'}`} title={viewingSheet === sheet.name ? "Close Sheet" : "View Sheet"}>
                      {viewingSheet === sheet.name ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => downloadSheet(sheet.name, sheet.records)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors" title="Download CSV"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between text-xs font-medium text-slate-600">
              <span>{allSheets.length} Sheets</span>
              <span>{allSheets.reduce((sum, s) => sum + s.records.length, 0)} Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table Loading State */}"""
content = content.replace(old_end_of_import, new_end_of_import)

# 6. Update the table title
old_table_title = """              <h2 className="text-lg font-bold text-slate-900">Processed Results</h2>
              <p className="text-sm text-slate-500 mt-1">View and download your imported and evaluated leads.</p>"""

new_table_title = """              <h2 className="text-lg font-bold text-slate-900">
                {viewingSheet ? `Processed Results: ${viewingSheet}` : "All Processed Results"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {viewingSheet ? "Viewing filtered leads from the selected sheet." : "View and download your imported and evaluated leads."}
              </p>"""
content = content.replace(old_table_title, new_table_title)

with open("client/src/pages/Imports.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Update complete!")
