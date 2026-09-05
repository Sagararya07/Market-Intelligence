import { useEffect,useState } from "react"; import { api } from "../lib/api"; import { ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip } from "recharts";
export default function Dashboard(){
  const [d,setD]=useState<any>();
  const [running, setRunning] = useState(false);
  
  const fetchDashboard = () => api<any>("/dashboard").then(setD);
  useEffect(() => { fetchDashboard() }, []);
  
  const runEngine = async () => {
    setRunning(true);
    try {
      const res = await api<any>("/intelligence/run", { method: "POST" });
      alert(`Success! Scored ${res.stats.accountsScored} accounts. Generated ${res.stats.signalsGenerated} signals and ${res.stats.opportunitiesGenerated} opportunities.`);
      await fetchDashboard();
    } catch (e: any) {
      alert("Failed to run engine: " + e.message);
    } finally {
      setRunning(false);
    }
  };

  if(!d)return <div>Loading dashboard…</div>;
  const chart=[{name:"Hot",value:d.hotOpportunities},{name:"Warm",value:d.warmOpportunities},{name:"Cold",value:Math.max(0,d.opportunities.length-d.hotOpportunities-d.warmOpportunities)}];
  return <><div className="mb-7 flex justify-between items-center"><div><h1 className="text-2xl font-bold">Intelligence Dashboard</h1><p className="text-slate-500 text-sm mt-1">Market activity, qualification and opportunity performance.</p></div>
  <button onClick={runEngine} disabled={running} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex gap-2 items-center">
    {running ? "Analyzing..." : "Run Intelligence Engine"}
  </button>
  </div><div className="grid grid-cols-4 gap-4 mb-7">{[["Total Accounts",d.accounts],["New Uploads",d.unprocessedAccounts],["New Signals",d.signals],["Active Requirements",d.requirements],["Hot Opportunities",d.hotOpportunities],["Warm Opportunities",d.warmOpportunities],["Qualified Accounts",d.qualifiedAccounts]].map(([a,b])=><div className="bg-white border rounded-xl p-5" key={String(a)}><div className="text-xs text-slate-500">{a}</div><div className="text-2xl font-bold mt-2">{b}</div></div>)}</div><div className="grid grid-cols-2 gap-6"><div className="bg-white border rounded-xl p-6"><h2 className="font-semibold mb-5">Opportunity Distribution</h2><ResponsiveContainer width="100%" height={280}><BarChart data={chart}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#0f172a" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div><div className="bg-white border rounded-xl p-6"><h2 className="font-semibold mb-4">Qualification Snapshot</h2><div className="text-5xl font-bold">{d.averageIcp}</div><div className="text-sm text-slate-500 mt-2">Average latest ICP score</div><div className="mt-8 text-sm text-slate-600">All metrics are calculated from persisted organization data.</div></div></div>
  {running && (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Running Intelligence...</h3>
        <p className="text-slate-500 text-sm">Evaluating ICP fit, extracting market signals, and generating opportunities. This may take a few moments.</p>
      </div>
    </div>
  )}
  </>
}
