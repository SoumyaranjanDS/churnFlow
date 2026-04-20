import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RevealSection from "../../components/RevealSection";
import { PanelSkeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import {
  getCurrentTrainingModel,
  getLatestPredictions,
  listActions,
  scoreBatchCustomers,
  scoreCustomer
} from "../../services/churnApi";

const ANALYZE_STORAGE_KEY = "churnflow.phase1.analyze";
const LATEST_CUSTOMER_ID_KEY = "churnflow.phase1.latestCustomerId";

const riskTone = (riskBand) => {
  if (riskBand === "High") return "border-red-200 bg-red-50 text-red-700 font-bold";
  if (riskBand === "Medium") return "border-amber-200 bg-amber-50 text-amber-700 font-bold";
  return "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold";
}

const readStoredAnalyzeState = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(ANALYZE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AnalyzeCustomersPage = () => {
  const toast = useToast();
  const location = useLocation();
  const stored = useMemo(() => readStoredAnalyzeState(), []);
  const [singleForm, setSingleForm] = useState(stored?.singleForm || { customerId: "", threshold: "0.5" });
  const [batchForm, setBatchForm] = useState(stored?.batchForm || { limit: "100", threshold: "0.5" });
  const [state, setState] = useState({
    loadingSingle: false,
    loadingBatch: false,
    loadingRecent: true,
    loadingModel: true,
    error: "",
    singleResult: stored?.singleResult || null,
    batchResult: stored?.batchResult || null,
    recentPredictions: [],
    recentActions: [],
    activeModel: null
  });

  const batchPreview = useMemo(() => {
    const items = [...(state.batchResult?.items || [])];
    return items.sort((left, right) => (right.churnProbability || 0) - (left.churnProbability || 0)).slice(0, 5);
  }, [state.batchResult]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      ANALYZE_STORAGE_KEY,
      JSON.stringify({
        singleForm,
        batchForm,
        singleResult: state.singleResult,
        batchResult: state.batchResult
      })
    );
  }, [batchForm, singleForm, state.batchResult, state.singleResult]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const customerIdFromQuery = params.get("customerId");
    const latestCustomerId =
      typeof window !== "undefined" ? window.sessionStorage.getItem(LATEST_CUSTOMER_ID_KEY) : "";

    const preferredCustomerId = customerIdFromQuery || latestCustomerId || "";
    if (preferredCustomerId) {
      setSingleForm((prev) => (prev.customerId === preferredCustomerId ? prev : { ...prev, customerId: preferredCustomerId }));
    }
  }, [location.search]);

  useEffect(() => {
    loadRecentWorkspaceActivity();
    loadActiveModel();
  }, []);

  const rememberLatestCustomerId = (customerId) => {
    if (typeof window === "undefined" || !customerId) return;
    window.sessionStorage.setItem(LATEST_CUSTOMER_ID_KEY, customerId);
  }

  const loadRecentWorkspaceActivity = async () => {
    setState((prev) => ({ ...prev, loadingRecent: true }));

    try {
      const [predictionResponse, actionResponse] = await Promise.all([
        getLatestPredictions({ page: 1, limit: 5 }),
        listActions({ page: 1, limit: 5 })
      ]);

      setState((prev) => ({
        ...prev,
        loadingRecent: false,
        recentPredictions: predictionResponse?.data?.items || [],
        recentActions: actionResponse?.data?.items || []
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingRecent: false,
        error: prev.error || error.message
      }));
    }
  }

  const loadActiveModel = async () => {
    try {
      const response = await getCurrentTrainingModel();
      setState((prev) => ({
        ...prev,
        loadingModel: false,
        activeModel: response?.data?.model || null
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        loadingModel: false,
        activeModel: null
      }));
    }
  }

  const handleSingleAnalyze = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, loadingSingle: true, error: "" }));

    try {
      const response = await scoreCustomer({
        customerId: singleForm.customerId.trim(),
        threshold: Number(singleForm.threshold)
      });
      const nextResult = response?.data || null;
      rememberLatestCustomerId(singleForm.customerId.trim());
      setState((prev) => ({ ...prev, loadingSingle: false, singleResult: nextResult }));
      toast.success("Customer scored", `${singleForm.customerId.trim()} was scored successfully.`);
      await loadRecentWorkspaceActivity();
    } catch (error) {
      setState((prev) => ({ ...prev, loadingSingle: false, error: error.message }));
      toast.error("Could not score customer", error.message);
    }
  }

  const handleBatchAnalyze = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, loadingBatch: true, error: "" }));

    try {
      const response = await scoreBatchCustomers({
        limit: Number(batchForm.limit),
        threshold: Number(batchForm.threshold)
      });
      setState((prev) => ({ ...prev, loadingBatch: false, batchResult: response?.data || null }));
      toast.success("Batch scoring complete", `${response?.data?.totalProcessed || 0} customers were scored.`);
      await loadRecentWorkspaceActivity();
    } catch (error) {
      setState((prev) => ({ ...prev, loadingBatch: false, error: error.message }));
      toast.error("Could not run batch scoring", error.message);
    }
  }

  const usePredictionCustomerId = (customerId) => {
    rememberLatestCustomerId(customerId);
    setSingleForm((prev) => ({ ...prev, customerId }));
  }

  const isCustomWorkspace = Boolean(state.activeModel?.modelType === "tenant_custom" && state.activeModel?.deployment?.isDeployed);

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Step 2</p>
        <h2 className="mt-3 text-3xl text-black sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
          {isCustomWorkspace ? "Turn saved custom records into churn decisions." : "Turn telecom records into churn decisions."}
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black">
          {isCustomWorkspace
            ? "This workspace has a deployed custom model. Score one saved customer or run a batch on the saved custom records in this workspace."
            : "Score one customer when you want to inspect a single account, or run a batch to generate the next at-risk queue for the team."}
        </p>
      </RevealSection>

      {state.loadingModel && (
        <RevealSection className="soft-panel">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="skeleton h-3 w-20" />
              <div className="skeleton mt-4 h-7 w-52" />
              <div className="skeleton mt-4 h-3.5 w-full" />
              <div className="skeleton mt-2 h-3.5 w-4/5" />
            </div>
            <div className="skeleton h-11 w-36 rounded-full" />
          </div>
        </RevealSection>
      )}

      {isCustomWorkspace && !state.loadingModel && (
        <RevealSection className="soft-panel">
          <p className="workspace-kicker">Active model</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg text-black font-bold">{state.activeModel?.version || "Custom model"}</p>
              <p className="mt-1 text-sm font-bold text-slate-900 italic">
                Deployed custom model predictions use the confirmed feature contract from Custom Setup and Training.
              </p>
            </div>
            <Link to="/app/upload" className="btn-secondary">
              Add custom customers
            </Link>
          </div>
        </RevealSection>
      )}

      <RevealSection className="grid gap-4 lg:grid-cols-2">
        <form className="soft-panel space-y-3" onSubmit={handleSingleAnalyze}>
          <p className="workspace-kicker">Single customer</p>
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Review one account
          </h3>
          <p className="text-sm font-bold leading-6 text-slate-900">
            {isCustomWorkspace
              ? "Use a saved customer ID from this workspace. The result will use the deployed custom model and explain the risk in plain business language."
              : "Use a saved telecom customer ID from this workspace. The result will explain the risk in plain business language."}
          </p>
          <label>
            <span className="field-label">Customer ID</span>
            <input
              type="text"
              className="field-input"
              value={singleForm.customerId}
              onChange={(event) => setSingleForm((prev) => ({ ...prev, customerId: event.target.value }))}
              required
            />
          </label>
          <label>
            <span className="field-label">Risk threshold</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              className="field-input"
              value={singleForm.threshold}
              onChange={(event) => setSingleForm((prev) => ({ ...prev, threshold: event.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={state.loadingSingle} className="btn-primary">
              {state.loadingSingle ? "Analyzing..." : "Score customer"}
            </button>
            <Link to="/app/upload" className="btn-secondary">
              Need to add data first?
            </Link>
          </div>
        </form>

        <form className="soft-panel space-y-3" onSubmit={handleBatchAnalyze}>
          <p className="workspace-kicker">Batch analysis</p>
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Generate the next priority queue
          </h3>
          <p className="text-sm font-bold leading-6 text-slate-900">
            {isCustomWorkspace
              ? "This scores the latest saved custom customers in the workspace and groups them into high, medium, and low churn risk."
              : "This scores the latest telecom records in the workspace and groups them into high, medium, and low churn risk."}
          </p>
          <label>
            <span className="field-label">Customers to score</span>
            <input
              type="number"
              min="1"
              max="500"
              className="field-input"
              value={batchForm.limit}
              onChange={(event) => setBatchForm((prev) => ({ ...prev, limit: event.target.value }))}
            />
          </label>
          <label>
            <span className="field-label">Risk threshold</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              className="field-input"
              value={batchForm.threshold}
              onChange={(event) => setBatchForm((prev) => ({ ...prev, threshold: event.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={state.loadingBatch} className="btn-primary">
              {state.loadingBatch ? "Analyzing..." : "Run batch scoring"}
            </button>
            <Link to="/app/at-risk" className="btn-secondary">
              Open at-risk queue
            </Link>
          </div>
        </form>
      </RevealSection>

      {state.error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}

      {state.singleResult && (
        <RevealSection className="soft-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="workspace-kicker">Latest single result</p>
              <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                {state.singleResult.customerId}
              </h3>
            </div>
            <div className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] ${riskTone(state.singleResult.riskBand)}`}>
              {state.singleResult.riskBand} risk
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="workspace-stat">
              <p className="workspace-kicker">Prediction</p>
              <p className="mt-2 text-xl text-black font-bold">{state.singleResult.predictedLabel === "Yes" ? "Likely to churn" : "Looks stable"}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Probability</p>
              <p className="mt-2 text-xl text-black font-bold">{Number(state.singleResult.churnProbability ?? 0).toFixed(4)}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Threshold</p>
              <p className="mt-2 text-xl text-black font-bold">{Number(state.singleResult.threshold ?? 0).toFixed(2)}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Model</p>
              <p className="mt-2 break-all text-sm text-black font-bold">{state.singleResult.modelVersion || "-"}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-blue-200 bg-blue-50/50 p-5">
            <p className="workspace-kicker">Business summary</p>
            <p className="mt-3 text-sm font-bold leading-7 text-black italic">
              {state.singleResult.explanation?.summary || "No summary available for this prediction."}
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50/50 p-5">
              <p className="workspace-kicker">Top churn drivers</p>
              <div className="mt-4 space-y-3">
                {(state.singleResult.explanation?.topDrivers || []).length ? (
                  state.singleResult.explanation.topDrivers.map((item) => (
                    <div key={item} className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-black font-extrabold shadow-sm">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-black font-bold">No driver notes available.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50/50 p-5">
              <p className="workspace-kicker">Recommended next actions</p>
              <div className="mt-4 space-y-3">
                {(state.singleResult.explanation?.recommendedActions || []).length ? (
                  state.singleResult.explanation.recommendedActions.map((item) => (
                    <div key={item} className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-black font-extrabold shadow-sm">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-black font-bold">No action suggestions available.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/app/results?customerId=${encodeURIComponent(state.singleResult.customerId)}`} className="btn-secondary">
              Open results
            </Link>
            <Link to={`/app/at-risk?customerId=${encodeURIComponent(state.singleResult.customerId)}`} className="btn-secondary">
              View at-risk queue
            </Link>
            <Link to={`/app/actions?customerId=${encodeURIComponent(state.singleResult.customerId)}`} className="btn-primary">
              Create follow-up action
            </Link>
          </div>
        </RevealSection>
      )}

      {state.batchResult && (
        <RevealSection className="soft-panel">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="workspace-kicker">Batch output</p>
              <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                {state.batchResult.totalProcessed} customers scored
              </h3>
            </div>
            <Link to="/app/at-risk" className="btn-secondary">
              Review queue
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="workspace-stat">
              <p className="workspace-kicker">High risk</p>
              <p className="mt-2 text-2 text-black font-bold">{state.batchResult.summary?.highRiskCount ?? 0}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Medium risk</p>
              <p className="mt-2 text-2xl text-black font-bold">{state.batchResult.summary?.mediumRiskCount ?? 0}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Low risk</p>
              <p className="mt-2 text-2xl text-black font-bold">{state.batchResult.summary?.lowRiskCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-blue-200 bg-blue-50/50 p-5">
            <div>
              <p className="workspace-kicker">Highest priority preview</p>
              <p className="mt-2 text-sm font-bold text-black italic">Use this preview to decide which customers should get the first outbound retention actions.</p>
            </div>

            <div className="mt-4 space-y-3">
              {batchPreview.length ? (
                batchPreview.map((item) => (
                  <div key={item.predictionId} className="rounded-[1.2rem] border border-blue-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-black font-bold">{item.customerId}</p>
                        <p className="mt-1 text-xs font-bold text-blue-600 italic">
                          {item.predictedLabel === "Yes" ? "Likely to churn" : "Looks stable"} at probability {Number(item.churnProbability ?? 0).toFixed(4)}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${riskTone(item.riskBand)}`}>
                        {item.riskBand}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-900 font-bold">No preview items available.</p>
              )}
            </div>
          </div>
        </RevealSection>
      )}

      <RevealSection className="grid gap-4 xl:grid-cols-2">
        <div className="soft-panel">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="workspace-kicker">Recent predictions</p>
              <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                Workspace scoring history
              </h3>
            </div>
            <button type="button" className="btn-secondary" onClick={loadRecentWorkspaceActivity}>
              Refresh
            </button>
          </div>

          {state.loadingRecent ? (
            <div className="mt-4">
              <PanelSkeleton rows={3} className="!border-0 !bg-transparent !p-0 !shadow-none" />
            </div>
          ) : state.recentPredictions.length ? (
            <div className="mt-4 space-y-3">
              {state.recentPredictions.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="w-full rounded-[1.2rem] border border-blue-200 bg-white px-4 py-4 text-left transition hover:border-blue-300 hover:shadow-premium"
                  onClick={() => usePredictionCustomerId(item.customerId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-black font-extrabold">{item.customerId}</p>
                      <p className="mt-1 text-xs font-bold text-slate-900">{item.explanation?.summary || "Prediction stored in this workspace."}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${riskTone(item.riskBand)}`}>
                      {item.riskBand}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm font-bold text-slate-900">No recent predictions yet. Run a single or batch score and they will appear here.</p>
          )}
        </div>

        <div className="soft-panel">
          <p className="workspace-kicker">Recent actions</p>
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Latest follow-ups
          </h3>

          {state.loadingRecent ? (
            <div className="mt-4">
              <PanelSkeleton rows={3} className="!border-0 !bg-transparent !p-0 !shadow-none" />
            </div>
          ) : state.recentActions.length ? (
            <div className="mt-4 space-y-3">
              {state.recentActions.map((item) => (
                <div key={item._id} className="rounded-3xl border border-blue-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] text-black font-extrabold">{item.customerId}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                        {item.actionType} | {item.status}
                      </p>
                    </div>
                    <button type="button" className="text-xs text-blue-600 font-extrabold underline underline-offset-4 hover:text-blue-700" onClick={() => usePredictionCustomerId(item.customerId)}>
                      Use this ID
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm font-bold text-black">No recent actions yet. Once the team creates follow-ups, they will appear here.</p>
          )}
        </div>
      </RevealSection>
    </section>
  );
}

export default AnalyzeCustomersPage;
