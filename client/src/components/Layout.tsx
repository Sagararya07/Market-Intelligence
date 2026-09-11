import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Building2, Radio, Target, FileText, GitMerge, Settings, LogOut, Library, Sparkles, Code, ChevronDown, ChevronRight, Database } from "lucide-react";

const mainLinks = [
  ["/","Dashboard",BarChart3],
  ["/data-management","Data Management",Database]
] as const;

const devLinks = [
  ["/accounts","Accounts",Building2],
  ["/signals","Signals",Radio],
  ["/opportunities","Opportunities",Target],
  ["/requirements","Requirements",FileText],
  ["/matches","Matches",GitMerge],
  ["/icp","ICP Profiles",Target]
] as const;

export default function Layout() {
  const nav = useNavigate();
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  return <div className="flex min-h-screen bg-[#f7f8fa]">
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0">
      <div className="p-5 flex items-center gap-2 mb-2">
        <Sparkles className="text-theme-blue w-6 h-6" />
        <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-theme-peach to-theme-blue text-transparent bg-clip-text uppercase">Lumora</div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <nav className="space-y-1 mb-6">
          {mainLinks.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive?"bg-theme-blue/20 text-slate-900 font-semibold":"text-slate-600 hover:bg-slate-50 hover:text-theme-blue"}`}><Icon size={17} />{label}</NavLink>)}
        </nav>
      </div>

      <div className="p-5 mt-auto pt-0 border-t border-slate-200">
        <div className="pt-4 pb-2 space-y-1">
          <button onClick={() => setDevToolsOpen(!devToolsOpen)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-theme-blue transition-colors">
            <div className="flex items-center gap-3"><Code size={17} />Developer Tools</div>
            {devToolsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {devToolsOpen && (
            <div className="pl-6 py-1 space-y-1 border-l border-slate-100 ml-4 max-h-[40vh] overflow-y-auto">
              {devLinks.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive?"bg-theme-blue/20 text-slate-900 font-semibold":"text-slate-600 hover:bg-slate-50 hover:text-theme-blue"}`}><Icon size={16} />{label}</NavLink>)}
            </div>
          )}
        </div>
        <button onClick={()=>{localStorage.removeItem("token");nav("/login")}} className="w-full flex gap-3 items-center px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-theme-blue transition-colors"><LogOut size={17}/> Sign out</button>
      </div>
    </aside>
    <main className="ml-64 flex-1 min-h-screen"><div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between"><div className="text-sm text-slate-500">AI-powered B2B opportunity intelligence</div><div className="text-sm font-medium">Demo Workspace</div></div><div className="p-8"><Outlet/></div></main>
  </div>
}
