import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Search, Eye, Download, FileSpreadsheet, Users, Database, ArrowLeft } from "lucide-react";

export default function DataLibrary() {
  const [results, setResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewingSheet, setViewingSheet] = useState<string | null>(null);

  useEffect(() => {
    api<any>("/imports/results")
      .then(res => setResults(res.results || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Group by Country and Industry
  const sheetsMap = new Map<string, { records: any[], location: string, industry: string }>();

  results.forEach(r => {
    // Extract country from location string (usually the last part)
    const locParts = (r.location || "United States").split(",");
    const country = locParts[locParts.length - 1].trim();
    
    // Simplify industry
    const indParts = (r.industries || "Technology").split(",");
    const industry = indParts[0].trim();

    const sheetName = `${country} — ${industry}`;

    if (!sheetsMap.has(sheetName)) {
      sheetsMap.set(sheetName, { records: [], location: country, industry });
    }
    sheetsMap.get(sheetName)!.records.push(r);
  });

  const allSheets = Array.from(sheetsMap.entries()).map(([name, data]) => ({
    name,
    ...data
  })).sort((a, b) => b.records.length - a.records.length);

  const filteredSheets = allSheets.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = allSheets.reduce((sum, sheet) => sum + sheet.records.length, 0);

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
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(field => `"${(field || "").toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Lumora_${sheetName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-theme-blue/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100">
          <div className="w-12 h-12 border-4 border-theme-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Loading Data Library...</h3>
          <p className="text-slate-500 text-sm">Please wait while we prepare your data sheets.</p>
        </div>
      </div>
    );
  }

  if (viewingSheet) {
    const sheetData = sheetsMap.get(viewingSheet);
    if (!sheetData) return null;
    return (
      <div className="max-w-7xl mx-auto py-4">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setViewingSheet(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-theme-blue transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Library
          </button>
          <button 
            onClick={() => downloadSheet(viewingSheet, sheetData.records)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-theme-peach to-theme-blue text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Full Sheet
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">{viewingSheet}</h2>
            <p className="text-sm text-slate-500 mt-1">{sheetData.records.length} records in this sheet.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <th className="px-4 py-3 font-medium">Enriched Date</th>
                  <th className="px-4 py-3 font-medium">Company Name</th>
                  <th className="px-4 py-3 font-medium">Industries</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Requirement</th>
                  <th className="px-4 py-3 font-medium">Estimated Budget</th>
                  <th className="px-4 py-3 font-medium">Company Social Media</th>
                  <th className="px-4 py-3 font-medium">Company Website</th>
                  <th className="px-4 py-3 font-medium">Company Contact</th>
                  <th className="px-4 py-3 font-medium">Employees</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Founder Name</th>
                  <th className="px-4 py-3 font-medium">CXO's Name</th>
                  <th className="px-4 py-3 font-medium">CXO Email</th>
                  <th className="px-4 py-3 font-medium">CXO Phone</th>
                  <th className="px-4 py-3 font-medium">CXO Social Media</th>
                  <th className="px-4 py-3 font-medium">CXO Other</th>
                  <th className="px-4 py-3 font-medium text-center">Eligible</th>
                </tr>
              </thead>
              <tbody>
                {sheetData.records.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 text-sm whitespace-nowrap">
                    <td className="px-4 py-3 text-slate-500">{r.enrichedDate || "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[200px]" title={r.companyName}>{r.companyName}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={r.industries}>{r.industries || "-"}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={r.location}>{r.location || "-"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.requirement === "Pending Web Extraction" ? (
                        <span className="text-slate-400 italic text-xs bg-slate-100/50 px-2 py-1 rounded border border-slate-100">Pending Extraction</span>
                      ) : r.requirement === "No Requirement Detected" ? (
                        <span className="text-slate-400 italic text-xs">No Requirement Detected</span>
                      ) : (
                        <div className="truncate max-w-[250px]" title={r.requirement}>{r.requirement || "-"}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {r.budget === "Pending Web Extraction" ? (
                        <span className="text-slate-400 italic text-xs bg-slate-100/50 px-2 py-1 rounded border border-slate-100">Pending Extraction</span>
                      ) : r.budget === "No Requirement Detected" ? (
                        <span className="text-slate-400 italic text-xs">-</span>
                      ) : (
                        r.budget || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[150px]"><a href={r.companySocialMedia} target="_blank" className="text-theme-blue hover:underline">{r.companySocialMedia || "-"}</a></td>
                    <td className="px-4 py-3 truncate max-w-[150px]"><a href={r.companyWebsite} target="_blank" className="text-theme-blue hover:underline">{r.companyWebsite || "-"}</a></td>
                    <td className="px-4 py-3 text-theme-blue truncate max-w-[150px]">{r.companyContact || "-"}</td>
                    <td className="px-4 py-3">{r.employees || "-"}</td>
                    <td className="px-4 py-3">{r.revenue || "-"}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]">{r.founderName || "-"}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={r.cxoName}>{r.cxoName || "-"}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={r.cxoEmail}>{r.cxoEmail || "-"}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={r.cxoPhone}>{r.cxoPhone || "-"}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]"><a href={r.cxoSocialMedia} target="_blank" className="text-theme-blue hover:underline">{r.cxoSocialMedia || "-"}</a></td>
                    <td className="px-4 py-3 truncate max-w-[150px]">{r.cxoOther || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.eligible === "Yes" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {r.eligible}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-800 flex items-center justify-center gap-3">
          <span className="bg-gradient-to-r from-theme-peach to-theme-blue text-transparent bg-clip-text">Lumora</span> 
          <span className="text-slate-400">—</span> 
          ICP Data Library
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search sheets / companies / industry" 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-theme-blue transition-all text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-2 bg-gradient-to-r from-theme-peach to-theme-blue text-white font-medium px-6 py-2 rounded-lg shadow-sm hover:opacity-90 transition-opacity">
              Search
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-theme-blue/20 flex items-center justify-center text-theme-blue">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-slate-800 uppercase tracking-wide">All Sheets</h2>
          </div>

          <div className="space-y-0 border border-slate-100 rounded-xl overflow-hidden">
            {filteredSheets.length === 0 && (
              <div className="p-8 text-center text-slate-500">No sheets found.</div>
            )}
            
            {filteredSheets.map((sheet, idx) => (
              <div key={sheet.name} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-8 text-center font-semibold text-theme-blue">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="font-medium text-slate-900 w-64 truncate" title={sheet.name}>
                    {sheet.name}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600 w-48">
                  <Users className="w-4 h-4 text-theme-blue" />
                  <span className="font-bold text-slate-800">{sheet.records.length.toLocaleString()}</span> <span className="text-sm">Records</span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewingSheet(sheet.name)}
                    className="flex items-center gap-2 px-4 py-1.5 border border-theme-blue/40 text-theme-blue rounded-lg hover:bg-theme-blue/10 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button 
                    onClick={() => downloadSheet(sheet.name, sheet.records)}
                    className="flex items-center gap-2 px-4 py-1.5 border border-theme-peach/40 text-theme-peach rounded-lg hover:bg-theme-peach/10 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-center gap-12 items-center text-sm font-medium">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-theme-blue" />
            <span className="text-theme-blue font-bold text-lg">{allSheets.length} Sheets</span>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="flex items-center gap-3">
            <span className="text-theme-peach font-bold text-lg">{totalRecords.toLocaleString()} Records</span>
          </div>
        </div>
      </div>
    </div>
  );
}
