import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Calendar, Clock, Target } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

const ProjectAnalytics = ({ project, onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      try {
        const res = await fetch(`/api/projects/${project.id}/sessions?since=${since}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.filter(s => s.completed));
        }
      } catch (e) {
        console.error('Error fetching project sessions', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project.id, days]);

  const totalMinutes = useMemo(() => sessions.reduce((a,s)=>a+(s.durationMinutes||0),0), [sessions]);
  const sessionCount = sessions.length;

  // Helper to pick unit based on minutes
  const unitFor = (values) => {
    const max = Math.max(0, ...values);
    if (max >= 60 * 6) return { unit: 'h', factor: 60, tickFmt: (v)=>`${v}h`, tipFmt: (v)=>`${v.toFixed(1)} h` };
    return { unit: 'm', factor: 1, tickFmt: (v)=>`${v}m`, tipFmt: (v)=>`${v} m` };
  };

  // Daily consistency (minutes per day)
  const dailyLine = useMemo(() => {
    const map = new Map();
    for (let i=0;i<days;i++) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i);
      map.set(d.toISOString().slice(0,10), 0);
    }
    sessions.forEach(s => {
      const k = new Date(s.createdAt).toISOString().slice(0,10);
      if (map.has(k)) map.set(k, (map.get(k)||0) + (s.durationMinutes||0));
    });
    const entries = Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
    const labels = entries.map(([d])=> new Date(d).toLocaleDateString());
    const data = entries.map(([,m])=>m);
    return {
      labels,
      datasets: [{
        label: 'Minutes',
        data,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.15)',
        fill: true,
        tension: 0.35
      }]
    };
  }, [sessions, days]);

  // By hour bar (count)
  const hourlyBar = useMemo(() => {
    const hourly = Array.from({length:24},()=>0);
    sessions.forEach(s=>{ hourly[new Date(s.createdAt).getHours()] += 1; });
    return {
      labels: Array.from({length:24},(_,i)=>`${i}:00`),
      datasets: [{ label: 'Sessions', data: hourly, backgroundColor: 'rgba(59,130,246,0.5)', borderColor:'rgba(59,130,246,1)' }]
    };
  }, [sessions]);

  // By weekday minutes
  const weekdayBar = useMemo(() => {
    const mins = Array.from({length:7},()=>0);
    sessions.forEach(s=>{ mins[new Date(s.createdAt).getDay()] += (s.durationMinutes||0); });
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return { labels, datasets: [{ label: 'Minutes', data: mins, backgroundColor: 'rgba(16,185,129,0.5)', borderColor:'rgba(16,185,129,1)'}] };
  }, [sessions]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="zen-button-secondary p-2"><ArrowLeft size={18} /></button>
        <h2 className="text-2xl font-bold text-zen-800 flex items-center gap-2"><BarChart3 className="text-nature-500"/> {project.name} • Analytics</h2>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zen-600">Range:</span>
        <div className="flex gap-2">
          {[7,30,90].map(r => (
            <button key={r} onClick={()=>setDays(r)} className={`px-3 py-1 rounded-lg text-sm ${days===r?'bg-nature-500 text-white':'bg-zen-100 text-zen-700 hover:bg-zen-200'}`}>{r}d</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nature-500"></div></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="zen-card p-6 text-center"><Clock className="w-7 h-7 text-nature-500 mx-auto mb-2"/><div className="text-2xl font-bold text-zen-800">{totalMinutes}m</div><div className="text-zen-600 text-sm">Total focused</div></div>
            <div className="zen-card p-6 text-center"><Target className="w-7 h-7 text-blue-500 mx-auto mb-2"/><div className="text-2xl font-bold text-zen-800">{sessionCount}</div><div className="text-zen-600 text-sm">Sessions</div></div>
            <div className="zen-card p-6 text-center"><Calendar className="w-7 h-7 text-purple-500 mx-auto mb-2"/><div className="text-2xl font-bold text-zen-800">{(totalMinutes/sessionCount||0).toFixed(1)}m</div><div className="text-zen-600 text-sm">Avg per session</div></div>
          </div>

          {/* Daily trend */}
          <motion.div className="zen-card p-6 mb-8" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <h3 className="text-xl font-semibold text-zen-800 mb-4">Daily Consistency</h3>
            {(() => { const u = unitFor(dailyLine.datasets[0].data); const options = { responsive:true, plugins:{legend:{display:false}, tooltip:{callbacks:{label:(ctx)=>u.tipFmt(ctx.parsed.y)}}}, scales:{ y:{ ticks:{ callback:(v)=>u.tickFmt(v) }}}}; return (<Line data={dailyLine} options={options} />); })()}
          </motion.div>

          {/* Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div className="zen-card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
              <h3 className="text-xl font-semibold text-zen-800 mb-4">Hourly Distribution (sessions)</h3>
              <Bar data={hourlyBar} options={{responsive:true, plugins:{legend:{display:false}}}} />
            </motion.div>
            <motion.div className="zen-card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
              <h3 className="text-xl font-semibold text-zen-800 mb-4">Weekday Minutes</h3>
              {(() => { const u = unitFor(weekdayBar.datasets[0].data); const options={ responsive:true, plugins:{legend:{display:false}, tooltip:{callbacks:{label:(ctx)=>u.tipFmt(ctx.parsed.y)}}}, scales:{ y:{ ticks:{ callback:(v)=>u.tickFmt(v) }}}}; return (<Bar data={weekdayBar} options={options} />); })()}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectAnalytics;


