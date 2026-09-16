import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Download, File as FileIcon } from "lucide-react";

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

export default function DataAnalytics() {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState({ company: false, decisionMaker: false });

  const fetchFiles = async () => {
    try {
      const data = await api<any>("/imports/files");
      setFiles(data.files || []);
      if (data.files && data.files.length > 0) {
        setSelectedFileId(data.files[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch files", e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchResults = async (jobId: string) => {
    if (!jobId) return;
    try {
      setIsLoadingResults(true);
      const data = await api<any>(`/imports/file/${encodeURIComponent(jobId)}`);
      setResults(data.results || []);
    } catch (e) {
      console.error("Failed to fetch results", e);
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    if (selectedFileId) {
      fetchResults(selectedFileId);
    }
  }, [selectedFileId]);

  const selectedFileObj = files.find(f => f.id === selectedFileId);
  const selectedFileName = selectedFileObj ? selectedFileObj.name : "";

  const downloadCSV = () => {
    const headers = [
      "Enriched Date", "Company Name", "Industries", "Location", "Requirement", "Estimated Budget", "Date Declared", "Source Link", "Company Social Media Links", 
      "Company Website", "Company Contact", "Number of Employees", "Revenue", "Founder Name",
      "CXO's Name", "CXO Email", "CXO Phone", "CXO Social Media", "CXO Other",
      "Eligible (Yes/No)"
    ];
    const rows = results.map(r => [
      r.enrichedDate, r.companyName, r.industries, r.location, r.requirement, r.budget, r.requirementDate, r.requirementSource, r.companySocialMedia,
      r.companyWebsite, r.companyContact, r.employees, r.revenue, r.founderName,
      r.cxoName, r.cxoEmail, r.cxoPhone, r.cxoSocialMedia, r.cxoOther,
      r.eligible
    ]);
    const escapeCsv = (str: any) => `"\$\{String(str || "").replace(/"/g, '""')\}"`;
    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map(row => row.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Lumora_${selectedFileName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    link.click();
  };

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore analytics and insights grouped by your uploaded files.
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar for Files */}
        <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sticky top-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileIcon className="w-5 h-5 text-theme-blue" /> Uploaded Files
          </h2>
          
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Filter by Upload Date</label>
            <input 
              type="date"
              className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-700 focus:ring-theme-blue focus:border-theme-blue"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate("")}
                className="text-xs text-theme-blue mt-1 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="text-sm text-slate-500">No files uploaded yet.</div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const filtered = files.filter(f => !filterDate || new Date(f.date).toISOString().split('T')[0] === filterDate);
                if (filtered.length === 0) {
                  return <div className="text-sm text-slate-500 italic p-2">No files match the selected date.</div>;
                }
                return filtered.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFileId(f.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${selectedFileId === f.id ? 'border-theme-blue bg-theme-blue/5 text-theme-blue font-medium' : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="truncate mb-1" title={f.name}>{f.name}</div>
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>{f.count} rows</span>
                        <span>{new Date(f.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">{new Date(f.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Main Content area */}
        <div className="flex-1">
          {isLoadingResults && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-theme-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Loading File Data...</h3>
              <p className="text-slate-500 text-sm">Please wait while we fetch the records for {selectedFileName}.</p>
            </div>
          )}

          {!isLoadingResults && selectedFileId && results.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-12">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    File: {selectedFileName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Viewing {results.length} total rows from this specific upload.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
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
                    {results.map((r, i) => (
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
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={15} className="px-4 py-12 text-center text-slate-500">
                          No results found in this file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoadingResults && selectedFileId && results.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 text-slate-500">
              No results found in this file.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
