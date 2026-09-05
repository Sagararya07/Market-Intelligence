import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Building2, Radio, Target, FileText, GitMerge, Settings, LogOut } from "lucide-react";

const links = [
  ["/","Dashboard",BarChart3],["/accounts","Accounts",Building2],["/signals","Signals",Radio],
  ["/opportunities","Opportunities",Target],["/requirements","Requirements",FileText],
  ["/matches","Matches",GitMerge],["/icp","ICP Profiles",Target],["/settings","Data Management",Settings]
] as const;

export default function Layout() {
  const nav = useNavigate();
  return <div className="flex min-h-screen bg-[#f7f8fa]">
    <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col fixed inset-y-0">
      <div className="font-bold text-lg tracking-tight mb-8">Market Intelligence</div>
      <nav className="space-y-1">{links.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive?"bg-slate-100 font-semibold":"text-slate-600 hover:bg-slate-50"}`}><Icon size={17}/>{label}</NavLink>)}</nav>
      <button onClick={()=>{localStorage.removeItem("token");nav("/login")}} className="mt-auto flex gap-3 items-center px-3 py-2.5 text-sm text-slate-600"><LogOut size={17}/> Sign out</button>
    </aside>
    <main className="ml-64 flex-1 min-h-screen"><div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between"><div className="text-sm text-slate-500">AI-powered B2B opportunity intelligence</div><div className="text-sm font-medium">Demo Workspace</div></div><div className="p-8"><Outlet/></div></main>
  </div>
}
