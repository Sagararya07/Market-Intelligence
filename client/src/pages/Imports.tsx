import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { UploadCloud, FileText as FileIcon, Download } from "lucide-react";
import * as XLSX from "xlsx";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const filteredResults = results.filter(r => {
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
      "Enriched Date", "Company Name", "Industries", "Location", "Requirement", "Estimated Budget", "Company Social Media Links", 
      "Company Website", "Company Contact", "Number of Employees", "Revenue", "Founder Name",
      "CXO's Name", "CXO Email", "CXO Phone", "CXO Social Media", "CXO Other",
      "Eligible (Yes/No)"
    ];
    
    const rows = filteredResults.map(r => [
      r.enrichedDate, r.companyName, r.industries, r.location, r.requirement, r.budget, r.companySocialMedia,
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
      <h1 className="text-2xl font-bold text-slate-900">Data Import</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Preview, map and import existing company/contact data without overwriting source records. Supports CSV and Excel.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
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
              <h2 className="text-lg font-bold text-slate-900">Processed Results</h2>
              <p className="text-sm text-slate-500 mt-1">View and download your imported and evaluated leads.</p>
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
                  <th colSpan={expandedColumns.company ? 11 : 1} onClick={() => setExpandedColumns(s => ({...s, company: !s.company}))} className="px-4 py-3 border-r border-slate-200 text-center font-bold cursor-pointer hover:bg-slate-200 transition-colors group">
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
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100 truncate max-w-[200px]" title={r.companyName}>{r.companyName}</td>
                    {expandedColumns.company && (
                      <>
                        <td className="px-4 py-3 truncate max-w-[250px]" title={r.industries}>{r.industries || "-"}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={r.location}>{r.location || "-"}</td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3"><a href={r.companySocialMedia} target="_blank" className="text-theme-blue hover:underline truncate max-w-[150px] inline-block">{r.companySocialMedia || "-"}</a></td>
                        <td className="px-4 py-3"><a href={r.companyWebsite} target="_blank" className="text-theme-blue hover:underline truncate max-w-[150px] inline-block">{r.companyWebsite || "-"}</a></td>
                        <td className="px-4 py-3 text-theme-blue truncate max-w-[150px]" title={r.companyContact}>{r.companyContact || "-"}</td>
                        <td className="px-4 py-3">{r.employees || "-"}</td>
                        <td className="px-4 py-3">{r.revenue || "-"}</td>
                        <td className="px-4 py-3 border-r border-slate-200 truncate max-w-[150px]" title={r.founderName}>{r.founderName || "-"}</td>
                      </>
                    )}
                    
                    <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100 truncate max-w-[150px]" title={r.cxoName}>{r.cxoName || "-"}</td>
                    {expandedColumns.decisionMaker && (
                      <>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={r.cxoEmail}>{r.cxoEmail || "-"}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={r.cxoPhone}>{r.cxoPhone || "-"}</td>
                        <td className="px-4 py-3"><a href={r.cxoSocialMedia} target="_blank" className="text-theme-blue hover:underline truncate max-w-[150px] inline-block">{r.cxoSocialMedia || "-"}</a></td>
                        <td className="px-4 py-3 border-r border-slate-200 truncate max-w-[150px]" title={r.cxoOther}>{r.cxoOther || "-"}</td>
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
    </>
  );
}
