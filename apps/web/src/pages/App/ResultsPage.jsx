import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RevealSection from "../../components/RevealSection";
import { PanelSkeleton, TableSkeleton } from "../../components/Skeleton";
import { createOutcome, getLatestPredictions, listOutcomes } from "../../services/churnApi";
import { useToast } from "../../context/ToastContext";

const RESULTS_STORAGE_KEY = "churnflow.phase1.results";
const LATEST_CUSTOMER_ID_KEY = "churnflow.phase1.latestCustomerId";

const riskTone = (riskBand) => {
  if (riskBand === "High") return "border-red-200 bg-red-50 text-red-700 font-bold";
  if (riskBand === "Medium") return "border-amber-200 bg-amber-50 text-amber-700 font-bold";
  return "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold";
}

const readStoredResultsState = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(RESULTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const ResultsPage = () => {
  const toast = useToast();
  const location = useLocation();
  const stored = useMemo(() => readStoredResultsState(), []);
  const [filters, setFilters] = useState(stored?.filters || { customerId: "", riskBand: "" });
  const [form, setForm] = useState(
    stored?.form || {
      customerId: "",
      actualChurned: "false",
      retentionSuccessful: "true",
      notes: ""
    }
  );
  const [state, setState] = useState({
    loadingPredictions: true,
    loadingOutcomes: true,
    submitting: false,
    error: "",
    message: "",
    predictions: [],
    outcomes: []
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      RESULTS_STORAGE_KEY,
      JSON.stringify({
        filters,
        form
      })
    );
  }, [filters, form]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const customerIdFromQuery = params.get("customerId");
    const latestCustomerId =
      typeof window !== "undefined" ? window.sessionStorage.getItem(LATEST_CUSTOMER_ID_KEY) : "";

    const preferredCustomerId = customerIdFromQuery || latestCustomerId || stored?.filters?.customerId || "";
    const nextFilters = preferredCustomerId ? { ...filters, customerId: preferredCustomerId } : filters;

    if (preferredCustomerId) {
      setFilters((prev) => ({ ...prev, customerId: preferredCustomerId }));
      setForm((prev) => (prev.customerId === preferredCustomerId ? prev : { ...prev, customerId: preferredCustomerId }));
    }

    loadWorkspaceResults(nextFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const rememberLatestCustomerId = (customerId) => {
    if (typeof window === "undefined" || !customerId) return;
    window.sessionStorage.setItem(LATEST_CUSTOMER_ID_KEY, customerId);
  }

  const loadWorkspaceResults = async (nextFilters = filters) => {
    setState((prev) => ({
      ...prev,
      loadingPredictions: true,
      loadingOutcomes: true,
      error: ""
    }));

    try {
      const customerId = nextFilters.customerId.trim();
      const [predictionResponse, outcomeResponse] = await Promise.all([
        getLatestPredictions({
          page: 1,
          limit: 12,
          search: customerId || undefined,
          riskBand: nextFilters.riskBand || undefined
        }),
        listOutcomes({
          page: 1,
          limit: 20,
          customerId: customerId || undefined
        })
      ]);

      setState((prev) => ({
        ...prev,
        loadingPredictions: false,
        loadingOutcomes: false,
        predictions: predictionResponse?.data?.items || [],
        outcomes: outcomeResponse?.data?.items || []
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingPredictions: false,
        loadingOutcomes: false,
        error: error.message
      }));
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, submitting: true, error: "", message: "" }));

    try {
      const customerId = form.customerId.trim();
      await createOutcome({
        customerId,
        actualChurned: form.actualChurned === "true",
        retentionSuccessful: form.retentionSuccessful === "true",
        notes: form.notes.trim() || undefined
      });

      rememberLatestCustomerId(customerId);
      setForm((prev) => ({
        ...prev,
        customerId,
        actualChurned: "false",
        retentionSuccessful: "true",
        notes: ""
      }));
      setFilters((prev) => ({ ...prev, customerId }));
      setState((prev) => ({
        ...prev,
        submitting: false,
        message: `Outcome saved for ${customerId}.`
      }));
      toast.success("Outcome recorded", `${customerId} now has a verified outcome in the workspace.`);
      await loadWorkspaceResults({ ...filters, customerId });
    } catch (error) {
      setState((prev) => ({ ...prev, submitting: false, error: error.message }));
      toast.error("Could not save outcome", error.message);
    }
  }

  const applyFilters = (event) => {
    event.preventDefault();
    loadWorkspaceResults(filters);
  }

  const resetFilters = () => {
    const nextFilters = { customerId: "", riskBand: "" };
    setFilters(nextFilters);
    loadWorkspaceResults(nextFilters);
  }

  const useCustomer = (customerId) => {
    rememberLatestCustomerId(customerId);
    setFilters((prev) => ({ ...prev, customerId }));
    setForm((prev) => ({ ...prev, customerId }));
    loadWorkspaceResults({ ...filters, customerId });
  }

  const predictionSummary = useMemo(() => {
    const high = state.predictions.filter((item) => item.riskBand === "High").length;
    const medium = state.predictions.filter((item) => item.riskBand === "Medium").length;
    const low = state.predictions.filter((item) => item.riskBand === "Low").length;
    return { high, medium, low };
  }, [state.predictions]);

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Step 5</p>
        <h2 className="mt-3 text-3xl text-black sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
          Results, then verified outcomes.
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black">
          This page now shows both parts of the workflow: the scored churn results coming from the model, and the real outcomes your team records later after outreach.
        </p>
      </RevealSection>

      <RevealSection>
        <form className="soft-panel grid gap-3 md:grid-cols-[1fr_0.8fr_auto]" onSubmit={applyFilters}>
          <label>
            <span className="field-label">Focus Customer ID</span>
            <input
              className="field-input"
              value={filters.customerId}
              onChange={(event) => setFilters((prev) => ({ ...prev, customerId: event.target.value }))}
              placeholder="CUST-5678"
            />
          </label>
          <label>
            <span className="field-label">Risk Band</span>
            <select
              className="field-input"
              value={filters.riskBand}
              onChange={(event) => setFilters((prev) => ({ ...prev, riskBand: event.target.value }))}
            >
              <option value="">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button className="btn-primary w-full" type="submit">Refresh</button>
            <button className="btn-secondary w-full" type="button" onClick={resetFilters}>Reset</button>
          </div>
        </form>
      </RevealSection>

      {state.error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      {state.message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.message}</p>}

      <RevealSection className="soft-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="workspace-kicker">Model output</p>
            <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
              Recent scored results
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-900">
              These are the actual churn predictions already saved in the database. If you scored customers in the Analyze tab, they should appear here immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="workspace-stat min-w-[110px]">
              <p className="workspace-kicker">High</p>
              <p className="mt-2 text-xl text-black font-bold">{predictionSummary.high}</p>
            </div>
            <div className="workspace-stat min-w-[110px]">
              <p className="workspace-kicker">Medium</p>
              <p className="mt-2 text-xl text-black font-bold">{predictionSummary.medium}</p>
            </div>
            <div className="workspace-stat min-w-[110px]">
              <p className="workspace-kicker">Low</p>
              <p className="mt-2 text-xl text-black font-bold">{predictionSummary.low}</p>
            </div>
          </div>
        </div>

        {state.loadingPredictions ? (
          <div className="mt-5">
            <TableSkeleton rows={4} columns={4} className="!border-0 !bg-transparent !shadow-none" />
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:hidden">
              {state.predictions.length ? (
                state.predictions.map((item) => (
                  <article key={item._id} className="mobile-data-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="workspace-kicker">Customer</p>
                        <p className="mt-2 text-lg text-black font-bold">{item.customerId}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.14em] ${riskTone(item.riskBand)}`}>
                        {item.riskBand}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="workspace-kicker">Probability</p>
                        <p className="mt-1 text-slate-900 font-medium">{Number(item.churnProbability ?? 0).toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="workspace-kicker">Decision</p>
                        <p className="mt-1 text-slate-900 font-medium">{item.decision?.predictedLabel === "Yes" ? "Likely churn" : "Looks stable"}</p>
                      </div>
                    </div>
                    {item.explanation?.summary && (
                      <p className="mt-3 text-sm leading-6 text-slate-900 font-medium">{item.explanation.summary}</p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button type="button" className="btn-secondary flex-1" onClick={() => useCustomer(item.customerId)}>
                        Use ID
                      </button>
                      <Link to={`/app/actions?customerId=${encodeURIComponent(item.customerId)}`} className="btn-primary flex-1">
                        Follow-up
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="mobile-data-card text-center bg-blue-50 border border-dashed border-blue-200 p-8 rounded-[2rem]">
                  <p className="workspace-kicker">No scored results yet</p>
                  <p className="mt-2 text-sm font-bold text-black">Run single or batch scoring from the Analyze tab and the saved results will appear here.</p>
                  <Link to="/app/analyze" className="btn-primary mt-6">Open Analyze</Link>
                </div>
              )}
            </div>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-left text-[11px] uppercase tracking-[0.14em] text-black font-extrabold">
                  <tr>
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Risk</th>
                    <th className="px-4 py-4">Probability</th>
                    <th className="px-4 py-4">Decision</th>
                    <th className="px-4 py-4">Summary</th>
                    <th className="px-4 py-4">Next</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {state.predictions.length ? (
                    state.predictions.map((item) => (
                      <tr key={item._id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-black">{item.customerId}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.14em] ${riskTone(item.riskBand)}`}>
                            {item.riskBand}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{Number(item.churnProbability ?? 0).toFixed(4)}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{item.decision?.predictedLabel === "Yes" ? "Likely churn" : "Looks stable"}</td>
                        <td className="px-4 py-3 text-slate-900">{item.explanation?.summary || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" className="btn-secondary !py-1.5" onClick={() => useCustomer(item.customerId)}>
                              Use ID
                            </button>
                            <Link to={`/app/actions?customerId=${encodeURIComponent(item.customerId)}`} className="btn-primary !py-1.5">
                              Follow-up
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm font-extrabold text-black">
                        No scored results found yet. Run analysis first and the saved predictions will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </RevealSection>

      <RevealSection className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="soft-panel grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <p className="workspace-kicker">Verified outcome</p>
            <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
              Record what actually happened
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-900">
              Once outreach or time has passed, save the real result here. The platform attaches the latest related prediction and action automatically when they exist.
            </p>
          </div>
          <label>
            <span className="field-label">Customer ID</span>
            <input
              className="field-input"
              value={form.customerId}
              onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
              required
            />
          </label>
          <label>
            <span className="field-label">Did customer churn?</span>
            <select
              className="field-input"
              value={form.actualChurned}
              onChange={(event) => setForm((prev) => ({ ...prev, actualChurned: event.target.value }))}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <label>
            <span className="field-label">Retention successful?</span>
            <select
              className="field-input"
              value={form.retentionSuccessful}
              onChange={(event) => setForm((prev) => ({ ...prev, retentionSuccessful: event.target.value }))}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <span className="field-label">Notes</span>
            <input
              className="field-input"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Retention call completed, offered annual plan..."
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button className="btn-primary" type="submit" disabled={state.submitting}>
              {state.submitting ? "Saving..." : "Save outcome"}
            </button>
            <Link to={form.customerId ? `/app/analyze?customerId=${encodeURIComponent(form.customerId)}` : "/app/analyze"} className="btn-secondary">
              Open analysis
            </Link>
          </div>
        </form>

        <div className="rounded-[2.5rem] border border-blue-200 bg-white shadow-premium overflow-hidden">
          <div className="border-b border-blue-100 bg-blue-50/30 px-6 py-5">
            <h3 className="text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
              Recent verified outcomes
            </h3>
          </div>

          {state.loadingOutcomes ? (
            <div className="px-5 py-4">
              <PanelSkeleton rows={3} className="!border-0 !bg-transparent !p-0 !shadow-none" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 p-4 md:hidden">
                {state.outcomes.length ? (
                  state.outcomes.map((item) => (
                    <article key={item._id} className="rounded-3xl border border-blue-100 bg-blue-50/20 p-6">
                      <p className="workspace-kicker">Customer</p>
                      <p className="mt-2 text-lg text-black font-extrabold">{item.customerId}</p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <p className="workspace-kicker">Churned</p>
                          <p className="mt-1 text-black font-bold">{item.actualChurned ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="workspace-kicker">Retained</p>
                          <p className="mt-1 text-black font-bold">{item.retentionSuccessful ? "Yes" : "No"}</p>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-blue-100 pt-4">
                        <p className="workspace-kicker">Observed</p>
                        <p className="mt-1 text-black font-bold">{new Date(item.observedAt).toLocaleDateString()}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="mobile-data-card text-center bg-blue-50/30 border border-dashed border-blue-200">
                    <p className="workspace-kicker">No outcomes yet</p>
                    <p className="mt-2 text-sm text-slate-900 font-medium">This section fills in after the team records what really happened to a customer.</p>
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-blue-50 text-left text-[11px] uppercase tracking-[0.14em] text-slate-900 font-bold">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Churned</th>
                      <th className="px-4 py-3">Retained</th>
                      <th className="px-4 py-3">Observed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {state.outcomes.length ? (
                      state.outcomes.map((item) => (
                        <tr key={item._id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-black">{item.customerId}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{item.actualChurned ? "Yes" : "No"}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{item.retentionSuccessful ? "Yes" : "No"}</td>
                          <td className="px-4 py-3 text-slate-900">{new Date(item.observedAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm font-extrabold text-black">
                        No verified outcomes recorded yet.
                      </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </RevealSection>
    </section>
  );
}

export default ResultsPage;
