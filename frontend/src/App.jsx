import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell
} from 'recharts';
import { 
  TrendingUp, Users, GraduationCap, LayoutDashboard, 
  Filter, Menu, ChevronRight, Activity, Map, 
  BookOpen, HelpCircle, Bell, User, Search, RefreshCw, Layers
} from 'lucide-react';
import axios from 'axios';

const CHART_COLORS = ['#2E6BA8', '#0C8EA1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [trends, setTrends] = useState([]);
  const [levelsData, setLevelsData] = useState([]);
  const [approval, setApproval] = useState({ matricula: 0, tasa: 0 });
  const [availableFilters, setAvailableFilters] = useState({ years: [], levels: [], departments: [] });
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedYear, setSelectedYear] = useState('Todos');
  const [selectedLevel, setSelectedLevel] = useState('Todos los niveles');
  const [searchTerm, setSearchTerm] = useState('');

  // Load filter options once
  useEffect(() => {
    axios.get('http://localhost:8000/filters').then(res => {
      setAvailableFilters(res.data);
    }).catch(err => console.error("Filter fetch error", err));
  }, []);

  // Fetch metrics automatically when a filter changes
  useEffect(() => {
    fetchMetrics();
  }, [selectedYear, selectedLevel, searchTerm]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear !== 'Todos') params.append('year', selectedYear);
      if (selectedLevel !== 'Todos los niveles') params.append('level', selectedLevel);
      if (searchTerm) params.append('dept', searchTerm);

      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const [trendsRes, levelsRes, approvalRes] = await Promise.all([
        axios.get(`http://localhost:8000/metrics/enrollment/trends${queryStr}`),
        axios.get(`http://localhost:8000/metrics/enrollment/levels${queryStr}`),
        axios.get(`http://localhost:8000/metrics/approval/overview${queryStr}`)
      ]);
      
      setTrends(trendsRes.data);
      setLevelsData(levelsRes.data);
      setApproval(approvalRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 bg-slate-50 overflow-hidden">
      
      {/* 🧭 SIDEBAR NAV */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-4 mb-10 px-2 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-utu-blue flex items-center justify-center">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-utu-blue">DGETP <span className="font-light text-slate-600">UTU</span></h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Analytics Dashboard</span>
            </div>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            <NavItem icon={<LayoutDashboard size={18}/>} label="Perspectiva General" active />
            <NavItem icon={<Activity size={18}/>} label="Resultados" />
            <NavItem icon={<Users size={18}/>} label="Matrícula" />
            <NavItem icon={<Map size={18}/>} label="Análisis Territorial" />
            
            <div className="pt-6 pb-2 text-xs font-semibold text-slate-400 uppercase px-4 border-t border-slate-100 mt-6">Gestión</div>
            <NavItem icon={<Layers size={18}/>} label="Reportes PDF" />
            <NavItem icon={<HelpCircle size={18}/>} label="Soporte Técnico" />
          </nav>
        </div>
      </aside>

      {/* 🚀 MAIN VIEW */}
      <div className="flex-1 flex flex-col h-screen relative scroll-smooth overflow-y-auto">
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">Tablero de Dirección Central</h2>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-utu-blue transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-0 right-0.5 w-2 h-2 bg-utu-danger rounded-full"></span>
            </button>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-semibold text-slate-700">Actor Nivel Alto</span>
                <span className="block text-xs text-slate-500">Dirección General</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-utu-blue">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full relative">
          
          {/* Overlay loading */}
          {loading && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
               <RefreshCw className="animate-spin text-utu-blue w-10 h-10" />
            </div>
          )}

          {/* 1) TOP AREA - CUSTOM SEARCH & FILTERS */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-inst flex flex-col md:flex-row gap-4 items-center justify-between relative z-20">
            
            {/* Department Search/Select */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Map size={18} className="text-slate-400" />
              </div>
              <select 
                title="Selecciona un Departamento"
                className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-utu-blue/20 focus:border-utu-blue transition-all appearance-none cursor-pointer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <option value="">Buscar o seleccionar departamento...</option>
                {availableFilters.departments?.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-600">Año:</span>
                 <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-utu-blue"
                 >
                   <option value="Todos">Todos</option>
                   {availableFilters.years.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>

              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-600">Nivel:</span>
                 <select 
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 max-w-[150px] md:max-w-xs outline-none focus:border-utu-blue"
                 >
                   <option value="Todos los niveles">Todos los niveles</option>
                   {availableFilters.levels.map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
              </div>

              {/* Loading Indicator */}
              {loading && <RefreshCw className="animate-spin text-utu-blue" size={18} />}
            </div>
          </section>

          {/* 2) MIDDLE AREA - MAIN KPI INDICATOR CARDS */}
          <section>
             <div className="flex justify-between items-end mb-4 mt-6">
               <h3 className="text-lg font-bold text-slate-800">Indicadores Estratégicos {selectedYear !== 'Todos' ? `(${selectedYear})` : '(Histórico)'}</h3>
               <span className="text-xs font-medium text-slate-500">Filtrado por: {selectedLevel !== 'Todos los niveles' ? selectedLevel.slice(0, 20) : 'Total General'}</span>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
               <KpiCard icon={<Users />} label="Matrícula Total Filtro" value={approval?.matricula?.toLocaleString() ?? "0"} subtext="Sujetos enrolados" color="blue" />
               <KpiCard icon={<GraduationCap />} label="Promoción Filtro" value={approval?.tasa ? `${(approval.tasa * 100).toFixed(1)}%` : "0%"} subtext="Monitor = 1" color="emerald" />
               <KpiCard icon={<Activity />} label="Departamentos" value={searchTerm || 'Todos'} subtext="Criterio de Búsqueda" color="amber" />
               <KpiCard icon={<TrendingUp />} label="Nivel Educativo" value={selectedLevel === 'Todos los niveles' ? 'General' : selectedLevel.slice(0, 15)} subtext="Selección actual" color="cyan" />
             </div>
          </section>

          {/* 3) BOTTOM AREA - CHARTS & TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12 relative z-10">
            
            {/* Chart 1 */}
            <div className="inst-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Evolución Histórica de Matrícula</h3>
                {selectedYear !== 'Todos' && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-200">Filtro de año ignorado en histórico</span>}
              </div>
              <div className="h-[300px]">
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A4A7D" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1A4A7D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="anio" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="total" stroke="#1A4A7D" strokeWidth={3} fill="url(#colorBlue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-slate-400 text-sm">Sin datos para este filtro</div>
                )}
              </div>
            </div>

            {/* Chart 2 */}
            <div className="inst-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Distribución por Nivel Educativo</h3>
                 {selectedLevel !== 'Todos los niveles' && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-200">Filtro de nivel ignorado en comparativa</span>}
              </div>
              <div className="h-[300px]">
                {levelsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelsData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="niv_des" type="category" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} width={120} />
                      <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                        {levelsData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-slate-400 text-sm">Sin datos para este filtro</div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-utu-blue/10 text-utu-blue' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      <span className={active ? 'text-utu-blue' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );
}

function KpiCard({ icon, label, value, subtext, color }) {
  const colorMap = {
    blue: 'bg-utu-blue text-white',
    emerald: 'bg-utu-success text-white',
    amber: 'bg-utu-warning text-white',
    cyan: 'bg-utu-accent text-white',
  };

  return (
    <div className="inst-card p-5 border-l-4 border-l-slate-300 relative overflow-hidden" style={{ borderLeftColor: color === 'blue' ? '#1A4A7D' : color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : '#0C8EA1' }}>
      <div className="flex justify-between items-start">
         <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 leading-tight">{label}</p>
            <h4 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 truncate max-w-[130px]" title={value}>{value}</h4>
         </div>
         <div className={`p-2.5 rounded-lg opacity-80 ${colorMap[color]}`}>
            {React.cloneElement(icon, { size: 18 })}
         </div>
      </div>
      <div className="mt-5">
         <span className={`text-[11px] font-semibold ${subtext.includes('↓') || subtext.includes('-') ? 'text-utu-warning' : subtext.includes('Invariable') || subtext.includes('Selección') || subtext.includes('Criterio') ? 'text-slate-400' : 'text-utu-success'}`}>
           {subtext}
         </span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800">
          {Number(payload[0].value).toLocaleString()} <span className="text-[10px] font-medium text-slate-500 ml-1">alumnos</span>
        </p>
      </div>
    );
  }
  return null;
}
