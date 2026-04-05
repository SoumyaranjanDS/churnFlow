import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RevealSection from "../../components/RevealSection";
import { PanelSkeleton, TableSkeleton } from "../../components/Skeleton";
import { createAction, getLatestPredictions, listActions } from "../../services/churnApi";

const QUEUE_STORAGE_KEY = "churnflow.phase1.queue";
const LATEST_CUSTOMER_ID_KEY = "churnflow.phase1.latestCustomerId";

const riskBadgeClass = (riskBand) => {
  if (riskBand === "High") return "bg-red-500/15 text-red-200 border border-red-300/20";
  if (riskBand === "Medium") return "bg-amber-500/15 text-amber-200 border border-amber-300/20";
  return "bg-emerald-500/15 text-emerald-200 border border-emerald-300/20";
}

const readStoredQueueState = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AtRiskCustomersPage = () => {
  const location = useLocation();
  const stored = useMemo(() => readStoredQueueState(), []);
  const [filters, setFilters] = useState(stored?.filters || { search: "", riskBand: "", minProbability: "", page: 1 });
  const [state, setState] = useState({
    loading: true,
    loadingActivity: true,
    error: "",
    items: [],
    pagination: null,
    actionMessage: stored?.actionMessage || "",
    recentActions: []
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify({
        filters,
        actionMessage: state.actionMessage
      })
    );
  }, [filters, state.actionMessage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryCustomerId = params.get("customerId");
    const latestCustomerId = typeof window !== "undefined" ? window.sessionStorage.getItem(LATEST_CUSTOMER_ID_KEY) : "";

    if (queryCustomerId) {
      const next = { ...filters, search: queryCustomerId, page: 1 };
      setFilters(next);
      loadLatestPredictions(next);
      loadRecentActivity();
      return;
    }

    if (!stored && latestCustomerId) {
      const next = { ...filters, search: latestCustomerId, page: 1 };
      setFilters(next);
      loadLatestPredictions(next);
      loadRecentActivity();
      return;
    }

    loadLatestPredictions(filters);
    loadRecentActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const rememberLatestCustomerId = (customerId) => {
    if (typeof window === "undefined" || !customerId) return;
    window.sessionStorage.setItem(LATEST_CUSTOMER_ID_KEY, customerId);
  }

  const loadLatestPredictions = async (nextFilters = filters) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await getLatestPredictions({
        page: nextFilters.page,
        limit: 20,
        riskBand: nextFilters.riskBand || undefined,
        minProbability: nextFilters.minProbability ? Number(nextFilters.minProbability) : undefined,
        search: nextFilters.search || undefined
      });
      setState((prev) => ({
        ...prev,
        loading: false,
        items: response?.data?.items || [],
        pagination: response?.data?.pagination || null
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }

  const loadRecentActivity = async () => {
    setState((prev) => ({ ...prev, loadingActivity: true }));
    try {
      const response = await listActions({ page: 1, limit: 5 });
      setState((prev) => ({
        ...prev,
        loadingActivity: false,
        recentActions: response?.data?.items || []
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingActivity: false,
        error: prev.error || error.message
      }));
    }
  }

  const handleCreateAction = async (customerId, predictionId) => {
    try {
      rememberLatestCustomerId(customerId);
      await createAction({
        customerId,
        predictionId,
        actionType: "call",
        notes: "Created from At-Risk queue"
      });
      setState((prev) => ({ ...prev, actionMessage: `Action created for ${customerId}` }));
      await Promise.all([loadLatestPredictions(filters), loadRecentActivity()]);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message, actionMessage: "" }));
    }
  }

  const useCustomer = (customerId) => {
    rememberLatestCustomerId(customerId);
    const next = { ...filters, search: customerId, page: 1 };
    setFilters(next);
    loadLatestPredictions(next);
  }

  const applyFilters = (event) => {
    event.preventDefault();
    const next = { ...filters, page: 1 };
    setFilters(next);
    loadLatestPredictions(next);
  }

  const goToPage = (nextPage) => {
    const next = { ...filters, page: nextPage };
    setFilters(next);
    loadLatestPredictions(next);
  }

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Step 3</p>
        <h2 className="mt-3 text-3xl text-white sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
          Risk queue and handoff.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/80">
          Review the latest scored customers, narrow the list with filters, and hand risky accounts straight into follow-up actions.
        </p>
      </RevealSection>

      <RevealSection>
        <form onSubmit={applyFilters} className="soft-panel grid gap-3 md:grid-cols-4">
          <label>
            <span className="field-label">Search Customer ID</span>
            <input
              className="field-input"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
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
          <label>
            <span className="field-label">Min Probability</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              className="field-input"
              value={filters.minProbability}
              onChange={(event) => setFilters((prev) => ({ ...prev, minProbability: event.target.value }))}
            />
          </label>
          <div className="flex items-end gap-3">
            <button type="submit" className="btn-primary w-full">Apply</button>
          </div>
        </form>
      </RevealSection>

      {state.error && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
      {state.actionMessage && <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{state.actionMessage}</p>}

      <RevealSection className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {state.loading ? (
          <TableSkeleton rows={4} columns={4} className="!border-0 !bg-transparent !shadow-none" />
        ) : (
          <div className="table-shell">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="workspace-kicker">Database-backed queue</p>
                  <h3 className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                    Latest scored customers
                  </h3>
                </div>
                <button type="button" className="btn-secondary" onClick={() => loadLatestPredictions(filters)}>
                  Refresh queue
                </button>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {state.items.length ? (
                state.items.map((item) => (
                  <article key={item._id} className="mobile-data-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="workspace-kicker">Customer</p>
                        <p className="mt-2 text-lg text-white">{item.customerId}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${riskBadgeClass(item.riskBand)}`}>{item.riskBand}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="workspace-kicker">Probability</p>
                        <p className="mt-1 text-slate-200">{Number(item.churnProbability ?? 0).toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="workspace-kicker">Prediction</p>
                        <p className="mt-1 text-slate-200">{item.decision?.predictedLabel || "-"}</p>
                      </div>
                    </div>
                    {item.explanation?.summary && (
                      <p className="mt-3 text-sm leading-6 text-slate-300">{item.explanation.summary}</p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button type="button" className="btn-secondary flex-1" onClick={() => useCustomer(item.customerId)}>
                        Use ID
                      </button>
                      <button type="button" className="btn-primary flex-1" onClick={() => handleCreateAction(item.customerId, item._id)}>
                        Create Action
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="px-2 py-6 text-center text-sm text-slate-400">No scored customers found.</p>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Probability</th>
                    <th className="px-4 py-3">Prediction</th>
                    <th className="px-4 py-3">Why</th>
                    <th className="px-4 py-3">Handoff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {state.items.length ? (
                    state.items.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 font-medium text-white">{item.customerId}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs ${riskBadgeClass(item.riskBand)}`}>{item.riskBand}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{Number(item.churnProbability ?? 0).toFixed(4)}</td>
                        <td className="px-4 py-3 text-slate-300">{item.decision?.predictedLabel || "-"}</td>
                        <td className="px-4 py-3 text-slate-400">{item.explanation?.summary || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" className="btn-secondary !py-1.5" onClick={() => useCustomer(item.customerId)}>
                              Use ID
                            </button>
                            <button type="button" className="btn-primary !py-1.5" onClick={() => handleCreateAction(item.customerId, item._id)}>
                              Create Action
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">No scored customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="soft-panel">
          <p className="workspace-kicker">Recent follow-up actions</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Last created actions
          </h3>

          {state.loadingActivity ? (
            <div className="mt-4">
              <PanelSkeleton rows={3} className="!border-0 !bg-transparent !p-0 !shadow-none" />
            </div>
          ) : state.recentActions.length ? (
            <div className="mt-4 space-y-3">
              {state.recentActions.map((item) => (
                <div key={item._id} className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-white">{item.customerId}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                        {item.actionType} | {item.status}
                      </p>
                    </div>
                    <Link to={`/app/actions?customerId=${encodeURIComponent(item.customerId)}`} className="text-xs text-slate-300 underline-offset-4 hover:text-white hover:underline">
                      Open follow-up
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No actions yet. Create one from this queue and it will appear here.</p>
          )}

          <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="workspace-kicker">Quick path</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              If you already know which customer needs follow-up, jump straight into the follow-up tab with the current customer ID carried over.
            </p>
            <Link to={filters.search ? `/app/actions?customerId=${encodeURIComponent(filters.search)}` : "/app/actions"} className="btn-secondary mt-4">
              Open follow-up tab
            </Link>
          </div>
        </div>
      </RevealSection>

      {!!state.pagination && (
        <RevealSection className="flex flex-col gap-3 rounded-[1.4rem] border border-white/12 bg-white/[0.04] px-4 py-3 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p>Page {state.pagination.page} of {state.pagination.totalPages || 1}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary !py-1.5"
              disabled={state.pagination.page <= 1}
              onClick={() => goToPage(state.pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary !py-1.5"
              disabled={state.pagination.page >= (state.pagination.totalPages || 1)}
              onClick={() => goToPage(state.pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </RevealSection>
      )}
    </section>
  );
}

export default AtRiskCustomersPage;
