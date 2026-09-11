import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { UploadCloud, FileText as FileIcon, Download, Search, Eye, Users, Database, X } from "lucide-react";
import * as XLSX from "xlsx";

const ExpandableText = ({ text, className = "max-w-[250px]", isLink = false }: { text: string, className?: string, isLink?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text === "-") return <span>-</span>;
  
  if (isLink) {
    return (
      <div 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <a href={text} target="_blank" rel="noopener noreferrer" className={`text-theme-blue hover:underline inline-block ${isExpanded ? "whitespace-normal break-all min-w-[200px]" : `truncate ${className}`}`} title={text}>{text}</a>
      </div>
    );
  }
  
  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`cursor-pointer transition-all duration-200 ${isExpanded ? "whitespace-normal break-words min-w-[200px]" : `truncate ${className}`}`}
      title={isExpanded ? "Click to collapse" : "Click to expand"}
    >
      {text}
    </div>
  );
};

export default function Imports() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<any>();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [expandedColumns, setExpandedColumns] = useState({ company: false, decisionMaker: false });
  const [filterDate, setFilterDate] = useState("");
  const [filterPhonePrefix, setFilterPhonePrefix] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingSheet, setViewingSheet] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runEngine = async (force: boolean = false) => {
    setRunning(true);
    try {
      if (force) {
        if (!confirm("This will reset all existing intelligence data and rescan all accounts. Continue?")) {
          setRunning(false);
          return;
        }
        await api("/intelligence/reset", { method: "POST" });
      }

      let totalScored = 0;
      let totalSignals = 0;
      let totalOpps = 0;
      let isDone = false;

      while (!isDone) {
        const res = await api<any>("/intelligence/run", { method: "POST" });
        if (res.stats.accountsScored === 0) {
          isDone = true;
          break;
        }
        totalScored += res.stats.accountsScored;
        totalSignals += res.stats.signalsGenerated;
        totalOpps += res.stats.opportunitiesGenerated;
      }
      
      alert(`Success! Scored ${totalScored} accounts. Generated ${totalSignals} signals and ${totalOpps} opportunities.`);
      await fetchResults();
    } catch (e: any) {
      alert("Failed to run engine: " + e.message);
    } finally {
      setRunning(false);
    }
  };

  const fetchResults = async () => {
    try {
      setIsLoadingResults(true);
      const data = await api<any>("/imports/results");
      setResults(data.results || []);
    } catch (e) {
      console.error("Failed to fetch results", e);
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);
  
  
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
      "Enriched Date", "Company Name", "Industries", "Location", "Requirement", "Estimated Budget", "Date Declared", "Source Link", "Company Social Media Links", 
      "Company Website", "Company Contact", "Number of Employees", "Revenue", "Founder Name",
      "CXO's Name", "CXO Email", "CXO Phone", "CXO Social Media", "CXO Other",
      "Eligible (Yes/No)"
    ];
    const rows = records.map(r => [
      r.enrichedDate, r.companyName, r.industries, r.location, r.requirement, r.budget, r.requirementDate, r.requirementSource, r.companySocialMedia,
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

  const filteredResults = results.filter(r => {
    if (viewingSheet) {
      const locParts = (r.location || "United States").split(",");
      const country = locParts[locParts.length - 1].trim();
      const indParts = (r.industries || "Technology").split(",");
      const industry = indParts[0].trim();
      if (`${country} — ${industry}` !== viewingSheet) return false;
    }
    let match = true;
    if (filterDate && !(r.enrichedDate && r.enrichedDate.startsWith(filterDate))) {
      match = false;
    }
    if (filterPhonePrefix) {
      const phone = String(r.cxoPhone || r.companyContact || "").trim();
      if (!phone.startsWith(filterPhonePrefix)) {
        match = false;
      }
    }
    return match;
  });

  const downloadCSV = () => {
    if (!filteredResults.length) {
      alert("No results to download for this date.");
      return;
    }
    
    const headers = [
      "Enriched Date", "Company Name", "Industries", "Location", "Requirement", "Estimated Budget", "Date Declared", "Source Link", "Company Social Media Links", 
      "Company Website", "Company Contact", "Number of Employees", "Revenue", "Founder Name",
      "CXO's Name", "CXO Email", "CXO Phone", "CXO Social Media", "CXO Other",
      "Eligible (Yes/No)"
    ];
    
    const rows = filteredResults.map(r => [
      r.enrichedDate, r.companyName, r.industries, r.location, r.requirement, r.budget, r.requirementDate, r.requirementSource, r.companySocialMedia,
      r.companyWebsite, r.companyContact, r.employees, r.revenue, r.founderName,
      r.cxoName, r.cxoEmail, r.cxoPhone, r.cxoSocialMedia, r.cxoOther,
      r.eligible
    ]);
    
    const escapeCsv = (str: any) => `"${String(str || "").replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map(row => row.map(escapeCsv).join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "processed_results.csv";
    link.click();
  };

  const handleFile = (f: File) => {
    if (f.name.endsWith(".csv")) {
      setFileName(f.name);
      f.text().then(setCsv);
      setPreview(null);
    } else if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvStr = XLSX.utils.sheet_to_csv(worksheet);
          setCsv(csvStr);
          setPreview(null);
        } catch (err) {
          alert("Failed to parse Excel file. Please ensure it is a valid spreadsheet.");
        }
      };
      reader.readAsArrayBuffer(f);
    } else {
      alert("Please upload a valid CSV or Excel file.");
      return;
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Import new records or access your grouped data library without overwriting source records.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => runEngine(true)} disabled={running} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex gap-2 items-center">
            {running ? "Scanning..." : "Force Re-scan All"}
          </button>
          <button onClick={() => runEngine(false)} disabled={running} className="bg-gradient-to-r from-theme-peach to-theme-blue text-slate-900 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex gap-2 items-center border-none">
            <Database className="w-4 h-4" />
            {running ? "Processing..." : "Run Intelligence Engine"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Data Import</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1">
        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? "border-theme-blue bg-theme-blue/10"
              : "border-slate-300 hover:bg-slate-50 hover:border-slate-400"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          
          {csv ? (
            <>
              <FileIcon className="w-12 h-12 text-theme-blue mb-3" />
              <p className="text-sm font-semibold text-slate-800">{fileName}</p>
              <p className="text-xs text-slate-500 mt-1">Click or drag a new file to replace</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">CSV or Excel files (.xlsx, .xls)</p>
            </>
          )}
        </div>

        {/* Actions */}
        {csv && !preview && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-colors"
              onClick={async () => {
                setIsProcessing(true);
                setProcessingMessage("Generating data preview...");
                try {
                  const p = await api<any>("/imports/preview", {
                    method: "POST",
                    body: JSON.stringify({ csv }),
                  });
                  setPreview(p);
                } catch (e: any) {
                  alert("Failed to preview: " + e.message);
                } finally {
                  setIsProcessing(false);
                }
              }}
            >
              Preview Data
            </button>
            <button
              className="bg-theme-blue hover:bg-theme-blue text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              onClick={async () => {
                setIsProcessing(true);
                setProcessingMessage("Executing import... This may take a minute.");
                try {
                  const p = await api<any>("/imports/preview", { method: "POST", body: JSON.stringify({ csv }) });
                  const d = await api<any>("/imports/execute", { method: "POST", body: JSON.stringify({ csv, mapping: p.mapping }) });
                  alert(`Success! Imported ${d.job.validRecords} records. Duplicates skipped: ${d.job.duplicateRecords}.`);
                  setCsv("");
                  setFileName("");
                  fetchResults();
                } catch (err: any) {
                  if (err.message === "Session expired") return;
                  alert("Failed to execute directly. Please click 'Preview Data' to see potential errors.");
                } finally {
                  setIsProcessing(false);
                }
              }}
            >
              Execute Import
            </button>
          </div>
        )}

        {preview && (
          <div className="mt-8 border-t border-slate-200 pt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Import Preview</h2>
              <div className="flex gap-3">
                <button
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setPreview(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-gradient-to-r from-theme-peach to-theme-blue text-slate-900 shadow-sm font-medium px-5 py-2 rounded-lg transition-colors shadow-sm"
                  onClick={async () => {
                    setIsProcessing(true);
                    setProcessingMessage("Executing import... This may take a minute.");
                    try {
                      const d = await api<any>("/imports/execute", {
                        method: "POST",
                        body: JSON.stringify({ csv, mapping: preview.mapping }),
                      });
                      alert(`Success! Imported ${d.job.validRecords} records. Duplicates skipped: ${d.job.duplicateRecords}.`);
                      setCsv("");
                      setFileName("");
                      setPreview(null);
                      fetchResults();
                    } catch (e: any) {
                      alert("Failed to execute: " + e.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  Execute Import
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                ["Total Records", preview.totalRecords],
                ["Columns Found", preview.columns.length],
                ["Parsing Errors", preview.errors.length],
                ["Mapped Fields", Object.keys(preview.mapping).length],
              ].map(([label, value]) => (
                <div
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  key={String(label)}
                >
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                    {label}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Data Sample</h3>
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-72 shadow-inner">
                {JSON.stringify(preview.preview, null, 2)}
              </pre>
            </div>
          </div>
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

      {/* Results Table Loading State */}
      {isLoadingResults && (
        <div className="fixed inset-0 bg-theme-blue/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 border-4 border-theme-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Loading Results Data...</h3>
            <p className="text-slate-500 text-sm">Please wait while we fetch the processed records.</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {!isLoadingResults && results.length > 0 && (
        <div className="mt-12 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {viewingSheet ? `Processed Results: ${viewingSheet}` : "All Processed Results"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {viewingSheet ? "Viewing filtered leads from the selected sheet." : "View and download your imported and evaluated leads."}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Filter by Date:</label>
                <input 
                  type="date" 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-theme-blue focus:ring-1 focus:ring-theme-blue"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                
                <label className="text-sm font-medium text-slate-700 ml-2">Phone Region:</label>
                <select 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-theme-blue focus:ring-1 focus:ring-theme-blue"
                  value={filterPhonePrefix}
                  onChange={(e) => setFilterPhonePrefix(e.target.value)}
                >
                  <option value="">All Regions</option>
                  <option value="+91">India (+91)</option>
                  <option value="+1">United States / Canada (+1)</option>
                  <option value="+44">United Kingdom (+44)</option>
                  <option value="+61">Australia (+61)</option>
                </select>
                
                {(filterDate || filterPhonePrefix) && (
                  <button onClick={() => { setFilterDate(""); setFilterPhonePrefix(""); }} className="text-sm text-slate-500 hover:text-slate-800 ml-2">Clear Filters</button>
                )}
              </div>
              <button
                className="bg-gradient-to-r from-theme-peach to-theme-blue text-slate-900 shadow-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                onClick={downloadCSV}
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 select-none">
                <tr>
                  <th colSpan={expandedColumns.company ? 13 : 1} onClick={() => setExpandedColumns(s => ({...s, company: !s.company}))} className="px-4 py-3 border-r border-slate-200 text-center font-bold cursor-pointer hover:bg-slate-200 transition-colors group">
                    <div className="flex items-center justify-center gap-2">
                      Company Details
                      <span className="text-slate-400 bg-slate-200 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs group-hover:bg-slate-300 transition-colors">
                        {expandedColumns.company ? '-' : '+'}
                      </span>
                    </div>
                  </th>
                  <th colSpan={expandedColumns.decisionMaker ? 5 : 1} onClick={() => setExpandedColumns(s => ({...s, decisionMaker: !s.decisionMaker}))} className="px-4 py-3 border-r border-slate-200 text-center font-bold cursor-pointer hover:bg-slate-200 transition-colors group">
                    <div className="flex items-center justify-center gap-2">
                      Decision Maker (CXO)
                      <span className="text-slate-400 bg-slate-200 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs group-hover:bg-slate-300 transition-colors">
                        {expandedColumns.decisionMaker ? '-' : '+'}
                      </span>
                    </div>
                  </th>
                  <th colSpan={2} className="px-4 py-3 text-center font-bold bg-theme-blue/10/50">Status & Meta</th>
                </tr>
                <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 font-semibold border-r border-slate-100">Company Name</th>
                  {expandedColumns.company && (
                    <>
                      <th className="px-4 py-2 font-semibold">Industries</th>
                      <th className="px-4 py-2 font-semibold">Location</th>
                      <th className="px-4 py-2 font-semibold">Requirement</th>
                      <th className="px-4 py-2 font-semibold">Estimated Budget</th>
                      <th className="px-4 py-2 font-semibold">Date Declared</th>
                      <th className="px-4 py-2 font-semibold">Source Link</th>
                      <th className="px-4 py-2 font-semibold">Social Media Links</th>
                      <th className="px-4 py-2 font-semibold">Company Website</th>
                      <th className="px-4 py-2 font-semibold">Contact</th>
                      <th className="px-4 py-2 font-semibold">Employees</th>
                      <th className="px-4 py-2 font-semibold">Revenue</th>
                      <th className="px-4 py-2 border-r border-slate-200 font-semibold">Founder Name</th>
                    </>
                  )}
                  
                  <th className="px-4 py-2 font-semibold border-r border-slate-100">CXO's Name</th>
                  {expandedColumns.decisionMaker && (
                    <>
                      <th className="px-4 py-2 font-semibold">Email</th>
                      <th className="px-4 py-2 font-semibold">Phone</th>
                      <th className="px-4 py-2 font-semibold">Social Media Link</th>
                      <th className="px-4 py-2 border-r border-slate-200 font-semibold">Other Info</th>
                    </>
                  )}
                  
                  <th className="px-4 py-2 font-semibold text-center bg-theme-blue/10/50">Date Enriched</th>
                  <th className="px-4 py-2 font-semibold text-center bg-theme-blue/10/50">Eligible (Yes/No)</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors [&>td]:align-top">
                    <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100">
                      <ExpandableText text={r.companyName} className="max-w-[200px]" />
                    </td>
                    {expandedColumns.company && (
                      <>
                        <td className="px-4 py-3"><ExpandableText text={r.industries} className="max-w-[250px]" /></td>
                        <td className="px-4 py-3"><ExpandableText text={r.location} className="max-w-[150px]" /></td>
                        <td className="px-4 py-3">
                          {r.requirement === "Pending Web Extraction" ? (
                            <span className="text-slate-400 italic text-xs bg-slate-100/50 px-2 py-1 rounded border border-slate-100">Pending Extraction</span>
                          ) : r.requirement === "No Requirement Detected" ? (
                            <span className="text-slate-400 italic text-xs">No Requirement Detected</span>
                          ) : (
                            <ExpandableText text={r.requirement} className="max-w-[250px]" />
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
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.requirementDate}</td>
                        <td className="px-4 py-3"><ExpandableText text={r.requirementSource} isLink className="max-w-[150px]" /></td>
                        <td className="px-4 py-3"><ExpandableText text={r.companySocialMedia} isLink className="max-w-[150px]" /></td>
                        <td className="px-4 py-3"><ExpandableText text={r.companyWebsite} isLink className="max-w-[150px]" /></td>
                        <td className="px-4 py-3 text-theme-blue"><ExpandableText text={r.companyContact} className="max-w-[150px]" /></td>
                        <td className="px-4 py-3">{r.employees || "-"}</td>
                        <td className="px-4 py-3">{r.revenue || "-"}</td>
                        <td className="px-4 py-3 border-r border-slate-200"><ExpandableText text={r.founderName} className="max-w-[150px]" /></td>
                      </>
                    )}
                    
                    <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100"><ExpandableText text={r.cxoName} className="max-w-[150px]" /></td>
                    {expandedColumns.decisionMaker && (
                      <>
                        <td className="px-4 py-3"><ExpandableText text={r.cxoEmail} className="max-w-[150px]" /></td>
                        <td className="px-4 py-3"><ExpandableText text={r.cxoPhone} className="max-w-[150px]" /></td>
                        <td className="px-4 py-3"><ExpandableText text={r.cxoSocialMedia} isLink className="max-w-[150px]" /></td>
                        <td className="px-4 py-3 border-r border-slate-200"><ExpandableText text={r.cxoOther} className="max-w-[150px]" /></td>
                      </>
                    )}
                    
                    <td className="px-4 py-3 text-center bg-theme-blue/10/20 text-slate-500 text-xs font-medium">
                      {r.enrichedDate || "-"}
                    </td>
                    <td className="px-4 py-3 text-center bg-theme-blue/10/20">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center justify-center min-w-[3rem] ${r.eligible === 'Yes' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {r.eligible}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-12 text-center text-slate-500">
                      No results found for the selected date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-theme-blue/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 border-4 border-theme-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Processing...</h3>
            <p className="text-slate-500 text-sm">{processingMessage}</p>
          </div>
        </div>
      )}

      {running && (
        <div className="fixed inset-0 bg-theme-blue/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 border-4 border-theme-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Running Intelligence...</h3>
            <p className="text-slate-500 text-sm">Evaluating ICP fit, extracting market signals, and generating opportunities. This may take a few moments.</p>
          </div>
        </div>
      )}
    </>
  );
}
