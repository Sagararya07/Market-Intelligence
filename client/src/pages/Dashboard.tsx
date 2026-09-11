import { useEffect,useState } from "react"; import { api } from "../lib/api"; import { ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip } from "recharts";
export default function Dashboard(){
  const [d,setD]=useState<any>();


  const fetchDashboard = () => api<any>("/dashboard").then(setD);
  useEffect(() => { fetchDashboard() }, []);

  if(!d)return <div>Loading dashboard…</div>;
  const chart=[{name:"Hot",value:d.hotOpportunities},{name:"Warm",value:d.warmOpportunities},{name:"Cold",value:Math.max(0,d.opportunities.length-d.hotOpportunities-d.warmOpportunities)}];
  return <><div className="mb-7 flex justify-between items-center"><div><h1 className="text-2xl font-bold">Intelligence Dashboard</h1><p className="text-slate-500 text-sm mt-1">Market activity, qualification and opportunity performance.</p></div>
  </div><div className="grid grid-cols-4 gap-4 mb-7">{[["Total Accounts",d.accounts],["New Uploads",d.unprocessedAccounts],["New Signals",d.signals],["Active Requirements",d.requirements],["Hot Opportunities",d.hotOpportunities],["Warm Opportunities",d.warmOpportunities],["Qualified Accounts",d.qualifiedAccounts]].map(([a,b])=><div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5" key={String(a)}><div className="text-xs text-slate-500 uppercase tracking-wider">{a}</div><div className="text-2xl font-bold mt-2 text-slate-800">{b}</div></div>)}</div><div className="grid grid-cols-2 gap-6"><div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6"><h2 className="font-semibold mb-5 text-slate-800">Opportunity Distribution</h2><ResponsiveContainer width="100%" height={280}><BarChart data={chart}><XAxis dataKey="name" tick={{fill: '#64748b' }} axisLine={{stroke: '#e2e8f0'}} tickLine={false} /><YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: '#f8fafc' }}/><Bar dataKey="value" fill="#88A7DB" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6"><h2 className="font-semibold mb-4 text-slate-800">Qualification Snapshot</h2><div className="text-5xl font-bold text-theme-blue">{d.averageIcp}</div><div className="text-sm text-slate-500 mt-2">Average latest ICP score</div><div className="mt-8 text-sm text-slate-400">All metrics are calculated from persisted organization data.</div></div></div>

  </>
}
