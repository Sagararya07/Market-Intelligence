export default function ScoreCard({label,score,level,sub}:{label:string;score:number;level?:string;sub?:string}) {
  return <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    <div className="flex items-end gap-2 mt-2"><div className="text-3xl font-bold">{Math.round(score)}</div><div className="text-slate-400 mb-1">/100</div></div>
    {level && <div className="text-sm font-semibold mt-1">{level}</div>}
    {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
  </div>
}
