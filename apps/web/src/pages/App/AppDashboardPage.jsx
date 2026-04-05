import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RevealSection from "../../components/RevealSection";
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
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return <WorkspacePageSkeleton stats={4} tableRows={4} />;
  if (state.error) return <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p>;

  const summary = state.summary;
  const hasCustomModel = Boolean(state.activeModel?.modelType === "tenant_custom" && state.activeModel?.deployment?.isDeployed);
  const isCustomWorkspace = hasCustomModel || user?.currentTenant?.industryType === "custom";
  const nextSteps = isCustomWorkspace
    ? hasCustomModel
      ? [
          { title: "Create new customer", description: "Use the deployed custom-model fields.", to: "/app/upload" },
          { title: "Run churn prediction", description: "Score the saved custom customer.", to: "/app/analyze" },
          { title: "Work at-risk queue", description: "Create actions and assign owners.", to: "/app/at-risk" },
          { title: "Record outcomes", description: "Measure retention impact.", to: "/app/results" }
        ]
      : [
          { title: "Open Custom Setup", description: "Upload your sample dataset and let Gemini inspect it.", to: "/app/custom-setup" },
          { title: "Confirm mappings", description: "Review the churn column and save the setup.", to: "/app/custom-setup" },
          { title: "Train first custom model", description: "Launch training once readiness is green.", to: "/app/training" },
          { title: "Create and score customers", description: "After deployment, the workspace behaves like the daily scoring flow.", to: "/app/upload" }
        ]
    : [
        { title: "Upload latest customer file", description: "Start with current data.", to: "/app/upload" },
        { title: "Run churn analysis", description: "Score and prioritize by risk.", to: "/app/analyze" },
        { title: "Work at-risk queue", description: "Create actions and assign owners.", to: "/app/at-risk" },
        { title: "Record outcomes", description: "Measure retention impact.", to: "/app/results" }
      ];
  const metrics = [
    { label: "Total Customers", value: summary?.customers?.total ?? 0, detail: "Records in current workspace" },
    { label: "High Risk", value: summary?.customers?.highRiskCount ?? 0, detail: "Need attention first" },
    { label: "Pending Actions", value: summary?.actions?.pending ?? 0, detail: "Open interventions waiting" },
    { label: "Retention Success", value: `${Math.round((summary?.outcomes?.retentionSuccessRate ?? 0) * 100)}%`, detail: "Observed recovery rate" },
  ];
  const trendBars = [
    Math.max(16, Math.min(100, summary?.customers?.total ? 28 : 16)),
    Math.max(24, Math.min(100, (summary?.customers?.highRiskCount ?? 0) * 12)),
    Math.max(18, Math.min(100, (summary?.actions?.pending ?? 0) * 10)),
    Math.max(22, Math.min(100, Math.round((summary?.outcomes?.retentionSuccessRate ?? 0) * 100)))
  ];
  const hasActivity =
    (summary?.customers?.total ?? 0) > 0 ||
    (summary?.customers?.highRiskCount ?? 0) > 0 ||
    (summary?.actions?.pending ?? 0) > 0 ||
    (summary?.outcomes?.retentionSuccessRate ?? 0) > 0;

  return (
    <section className="space-y-6">
      <RevealSection className="workspace-hero">
        <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="workspace-kicker">Dashboard</p>
            <h2 className="mt-3 text-3xl text-white sm:text-[2.35rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              Your daily retention snapshot.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300/80">
              This is the quickest view of customer volume, open risk, pending action, and recovery progress across the current cycle.
            </p>
            {hasCustomModel && (
              <div className="mt-4 inline-flex rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-emerald-100">
                Custom model live: {state.activeModel?.version || "Deployed"}
              </div>
            )}
            {!hasCustomModel && isCustomWorkspace && (
              <div className="mt-4 inline-flex rounded-full border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-sky-100">
                Custom setup in progress: {user?.currentTenant?.onboardingStatus || "schema_ready"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="workspace-stat">
              <p className="workspace-kicker">At-risk share</p>
              <p className="mt-2 text-2xl text-white">{summary?.customers?.highRiskCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">customers marked high priority</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Action pace</p>
              <p className="mt-2 text-2xl text-white">{summary?.actions?.pending ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">items still awaiting work</p>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <div key={item.label} className="workspace-stat">
            <p className="workspace-kicker">{item.label}</p>
            <p className="mt-2 text-3xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              {item.value}
            </p>
            <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
          </div>
        ))}
      </RevealSection>

      <RevealSection className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="soft-panel">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="workspace-kicker">Activity pulse</p>
              <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Current operating signal
              </h3>
            </div>
            <p className="text-xs text-slate-400">scroll-triggered preview</p>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3">
            {trendBars.map((height, index) => (
              <motion.div
                key={index}
                className="flex-1 rounded-t-[1rem] bg-[linear-gradient(180deg,rgba(244,114,182,0.85),rgba(99,102,241,0.45))]"
                initial={{ height: 0, opacity: 0 }}
                whileInView={{ height: `${height}%`, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.06, ease: "easeOut" }}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.12em] text-slate-400">
            <span>Total</span>
            <span>Risk</span>
            <span>Actions</span>
            <span>Success</span>
          </div>
        </div>

        <div className="soft-panel">
          <p className="workspace-kicker">System note</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            {hasActivity ? "The workspace is active." : "No activity yet."}
          </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300/78">
              {hasActivity
                ? "You already have enough signal to move into queue review, action creation, and measurable outcome tracking."
                : isCustomWorkspace
                  ? hasCustomModel
                    ? "Start by creating one customer with the deployed custom-model fields, then run a scoring cycle. The dashboard will fill in as soon as the first records are processed."
                    : "Your custom workspace is ready for dataset setup, Gemini review, and training. Once the model is deployed, the daily scoring flow will unlock automatically."
                  : "Start by importing a customer file, then run a scoring cycle. The dashboard will become more useful as soon as the first records are processed."}
            </p>

          {!hasActivity && (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.025] p-5">
              <p className="workspace-kicker">Suggested first move</p>
              <p className="mt-2 text-sm text-slate-300">
                {isCustomWorkspace
                  ? hasCustomModel
                    ? "Create one custom customer with the deployed model fields, then score that customer to start populating the dashboard."
                    : "Open Custom Setup, confirm the dataset flow, and train the first tenant model before you begin daily customer scoring."
                  : "Upload a customer file and run the first batch analysis to populate this dashboard."}
              </p>
              <Link to={isCustomWorkspace && !hasCustomModel ? "/app/custom-setup" : "/app/upload"} className="btn-primary mt-4">
                {isCustomWorkspace ? (hasCustomModel ? "Create customer" : "Open Custom Setup") : "Upload data"}
              </Link>
            </div>
          )}
        </div>
      </RevealSection>

      <RevealSection className="soft-panel">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="workspace-kicker">Recommended flow</p>
            <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              Move from fresh data to retention proof.
            </h3>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Each step below follows the real operating order, so new users can understand what to do without guessing.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {nextSteps.map((step, index) => (
            <Link
              key={step.title}
              to={step.to}
              className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 transition hover:border-white/18 hover:bg-white/[0.08]"
            >
              <p className="workspace-kicker">{String(index + 1).padStart(2, "0")}</p>
              <h4 className="mt-2 text-xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                {step.title}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
            </Link>
          ))}
        </div>
      </RevealSection>
    </section>
  );
}

export default AppDashboardPage;
