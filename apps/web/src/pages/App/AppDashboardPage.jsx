import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WorkspacePageSkeleton } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { getCurrentTrainingModel, getDashboardSummary } from "../../services/churnApi";

const AppDashboardPage = () => {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", summary: null, activeModel: null });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [summaryResponse, modelResponse] = await Promise.all([
          getDashboardSummary({ days: 30 }),
          getCurrentTrainingModel().catch(() => ({ data: { model: null } }))
        ]);
        if (!mounted) return;
        setState({
          loading: false,
          error: "",
          summary: summaryResponse?.data || null,
          activeModel: modelResponse?.data?.model || null
        });
      } catch (error) {
        if (!mounted) return;
        setState({ loading: false, error: error.message, summary: null, activeModel: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (state.loading) return <WorkspacePageSkeleton stats={4} tableRows={4} />;
  if (state.error) return <p className="p-6 text-red-600 bg-red-50 rounded-3xl border border-red-200 font-bold">{state.error}</p>;

  const summary = state.summary;
  const metrics = [
    { label: "Total Customers", value: summary?.customers?.total ?? 0, detail: "Workspace footprint" },
    { label: "High Risk", value: summary?.customers?.highRiskCount ?? 0, detail: "Immediate priority" },
    { label: "Open Actions", value: summary?.actions?.pending ?? 0, detail: "Awaiting intervention" },
    { label: "Success Rate", value: `${Math.round((summary?.outcomes?.retentionSuccessRate ?? 0) * 100)}%`, detail: "Recovery effectiveness" },
  ];

  const nextSteps = [
    { title: "Import Data", desc: "Upload your latest customer records.", to: "/app/upload" },
    { title: "Run Analysis", desc: "Score customers and identify risk.", to: "/app/analyze" },
    { title: "Retention Queue", desc: "Manage high-risk interventions.", to: "/app/at-risk" },
    { title: "Measure Impact", desc: "Record outcomes and track recovery.", to: "/app/results" },
  ];

  return (
    <div className="space-y-10">
      {/* Metrics Row */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item, index) => (
          <motion.div
            key={item.label}
            className="workspace-stat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <p className="workspace-kicker">{item.label}</p>
            <p className="mt-3 text-4xl font-extrabold text-black">{item.value}</p>
            <p className="mt-2 text-xs text-black font-bold uppercase tracking-tight">{item.detail}</p>
          </motion.div>
        ))}
      </section>

      {/* Main Grid */}
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Active Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[2.5rem] bg-white p-10 shadow-premium border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="workspace-kicker">Performance</p>
                <h3 className="mt-3 text-3xl font-extrabold text-black">Retention Pulse</h3>
              </div>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            
            <div className="mt-12 flex h-56 items-end gap-3">
              {[60, 45, 90, 75, 40, 85, 95].map((h, i) => (
                <motion.div 
                  key={i}
                  className="flex-1 rounded-2xl bg-blue-100 hover:bg-blue-600 transition-colors duration-300 shadow-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-between text-[11px] font-bold uppercase tracking-widest text-black">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] bg-blue-600 p-10 text-white shadow-premium relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <h3 className="relative z-10 text-2xl font-black italic">Workspace Active</h3>
            <p className="relative z-10 mt-4 text-[15px] font-bold leading-7 text-white/90">
              The platform is standing by. Start by uploading a customer file to generate the first batch of retention scores.
            </p>
            <Link to="/app/upload" className="relative z-10 mt-8 inline-block rounded-full bg-white px-8 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-600 transition-all hover:scale-105 hover:shadow-xl shadow-lg">
              Launch Import
            </Link>
          </div>

          <div className="space-y-4">
            <p className="px-5 text-[11px] font-black uppercase tracking-[0.2em] text-black">Quick Workflow</p>
            {nextSteps.map((step, i) => (
              <Link 
                key={step.title} 
                to={step.to}
                className="group flex items-center justify-between rounded-[2rem] bg-white p-6 border border-blue-200 shadow-sm transition-all hover:shadow-premium hover:-translate-y-1 hover:border-blue-400"
              >
                <div>
                  <p className="text-[15px] font-black text-black">{step.title}</p>
                  <p className="mt-1 text-xs font-bold text-blue-600 italic">{step.desc}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none"><path d="M4 2.5l3.5 3.5L4 9.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppDashboardPage;
