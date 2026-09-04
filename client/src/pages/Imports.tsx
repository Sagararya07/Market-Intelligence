import { useState, useRef } from "react";
import { api } from "../lib/api";
import { UploadCloud, FileText as FileIcon } from "lucide-react";
import * as XLSX from "xlsx";

export default function Imports() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<any>();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              ? "border-blue-500 bg-blue-50"
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
              <FileIcon className="w-12 h-12 text-blue-500 mb-3" />
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
              onClick={() =>
                api<any>("/imports/preview", {
                  method: "POST",
                  body: JSON.stringify({ csv }),
                }).then(setPreview)
              }
            >
              Preview Data
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              onClick={async () => {
                try {
                  const p = await api<any>("/imports/preview", { method: "POST", body: JSON.stringify({ csv }) });
                  const d = await api<any>("/imports/execute", { method: "POST", body: JSON.stringify({ csv, mapping: p.mapping }) });
                  alert(`Success! Imported ${d.job.validRecords} records. Duplicates skipped: ${d.job.duplicateRecords}.`);
                  setCsv("");
                  setFileName("");
                } catch (err: any) {
                  if (err.message === "Session expired") return;
                  alert("Failed to execute directly. Please click 'Preview Data' to see potential errors.");
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
                  className="bg-slate-900 hover:bg-black text-white font-medium px-5 py-2 rounded-lg transition-colors shadow-sm"
                  onClick={() =>
                    api<any>("/imports/execute", {
                      method: "POST",
                      body: JSON.stringify({ csv, mapping: preview.mapping }),
                    }).then((d) => {
                      alert(`Success! Imported ${d.job.validRecords} records. Duplicates skipped: ${d.job.duplicateRecords}.`);
                      setCsv("");
                      setFileName("");
                      setPreview(null);
                    })
                  }
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
    </>
  );
}
