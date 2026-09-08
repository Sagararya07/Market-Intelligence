import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

export default function IcpProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    api<any>(`/icp-profiles/${id}`).then(d => {
      setProfile(d);
      setName(d.name);
      setDescription(d.description || "");
      setIsActive(d.isActive);
      setRules(d.rules || []);
    }).catch(() => navigate("/icp"));
  }, [id, navigate]);

  const addRule = () => {
    setRules([...rules, { dimension: "COMPANY_SIZE", ruleType: "numeric", fieldName: "employeeCount", operator: "greaterThan", value: 100, weight: 10 }]);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const cleanRules = rules.map(r => ({
        dimension: r.dimension,
        ruleType: r.ruleType,
        fieldName: r.fieldName,
        operator: r.operator,
        value: r.value,
        weight: Number(r.weight)
      }));
      await api(`/icp-profiles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, description, isActive, rules: cleanRules })
      });
      alert("Profile saved successfully");
    } catch (e) {
      alert("Failed to save profile");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      await api(`/icp-profiles/${id}`, { method: "DELETE" });
      navigate("/icp");
    } catch (e) {
      alert("Failed to delete profile");
    }
  };

  if (!profile) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/icp")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit ICP Profile</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1 space-y-6">
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold border-b pb-3">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Profile Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2 text-sm" rows={3} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-slate-300" />
              <span className="text-sm font-medium">Active Profile</span>
            </label>
          </div>

          <div className="bg-white border rounded-xl p-5 space-y-4">
            <button onClick={handleSave} className="w-full bg-gradient-to-r from-theme-peach to-theme-blue text-slate-900 shadow-sm flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
              <Save size={16} /> Save Changes
            </button>
            <button onClick={handleDelete} className="w-full text-red-600 border border-red-200 bg-red-50 py-2 rounded-lg text-sm font-medium hover:bg-red-100">
              Delete Profile
            </button>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">ICP Rules</h2>
              <button onClick={addRule} className="text-sm font-medium text-theme-blue flex items-center gap-1 hover:bg-theme-blue/10 px-2 py-1 rounded">
                <Plus size={16} /> Add Rule
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-lg">
                No rules defined yet. Add rules to target specific company traits.
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex gap-4 items-start">
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Dimension</label>
                        <select value={rule.dimension} onChange={e => updateRule(index, "dimension", e.target.value)} className="w-full text-sm border rounded p-1.5 bg-white">
                          <option value="COMPANY_SIZE">Company Size</option>
                          <option value="REVENUE">Revenue</option>
                          <option value="GEOGRAPHY">Geography</option>
                          <option value="TECHNOLOGY">Technology</option>
                          <option value="INDUSTRY">Industry</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Field Name</label>
                        <input type="text" value={rule.fieldName} onChange={e => updateRule(index, "fieldName", e.target.value)} placeholder="e.g. employeeCount" className="w-full text-sm border rounded p-1.5 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Operator</label>
                        <select value={rule.operator} onChange={e => updateRule(index, "operator", e.target.value)} className="w-full text-sm border rounded p-1.5 bg-white">
                          <option value="greaterThan">Greater Than</option>
                          <option value="lessThan">Less Than</option>
                          <option value="between">Between</option>
                          <option value="equals">Equals</option>
                          <option value="in">In List</option>
                          <option value="contains">Contains</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Value (JSON/String/Number)</label>
                        <input 
                          type="text" 
                          value={typeof rule.value === "object" ? JSON.stringify(rule.value) : rule.value} 
                          onChange={e => {
                            let val: any = e.target.value;
                            try { if(val.startsWith("[") || val.startsWith("{")) val = JSON.parse(val); } catch(e){}
                            if(!isNaN(Number(val)) && val !== "") val = Number(val);
                            updateRule(index, "value", val);
                          }} 
                          placeholder='e.g. 100 or ["US", "UK"]' 
                          className="w-full text-sm border rounded p-1.5 bg-white font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Weight Score</label>
                        <input type="number" value={rule.weight} onChange={e => updateRule(index, "weight", Number(e.target.value))} className="w-full text-sm border rounded p-1.5 bg-white" />
                      </div>
                    </div>
                    <button onClick={() => removeRule(index)} className="text-slate-400 hover:text-red-500 p-1 mt-5">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
