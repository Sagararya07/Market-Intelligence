import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function IcpProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    api<any>("/icp-profiles").then(d => setProfiles(d.items));
  };

  const handleCreate = async () => {
    const name = prompt("Enter a name for the new ICP Profile:");
    if (!name) return;
    
    try {
      const newProfile = await api<any>("/icp-profiles", {
        method: "POST",
        body: JSON.stringify({ name, description: "New custom profile", rules: [] })
      });
      navigate(`/icp/${newProfile.id}`);
    } catch (e) {
      alert("Failed to create profile");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ICP Profiles</h1>
          <p className="text-slate-500 mt-1">Manage your Ideal Customer Profiles to guide the intelligence engine.</p>
        </div>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Create Profile
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-sm text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No ICP Profiles found. Create one to get started.</td>
              </tr>
            ) : profiles.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                <td className="px-6 py-4 text-slate-500">{p.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/icp/${p.id}`} className="text-blue-600 hover:underline font-medium">Edit / View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
