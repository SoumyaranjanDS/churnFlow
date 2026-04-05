import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RevealSection from "../../components/RevealSection";
import { PanelSkeleton, TableSkeleton } from "../../components/Skeleton";
import { createAction, getLatestPredictions, listActions, listCustomers, updateAction } from "../../services/churnApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const ACTION_STORAGE_KEY = "churnflow.phase1.actions";
const LATEST_CUSTOMER_ID_KEY = "churnflow.phase1.latestCustomerId";

const statuses = ["pending", "in_progress", "completed", "cancelled"];
const actionTypes = ["call", "discount", "plan_upgrade", "support", "email", "other"];

const readStoredActionState = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(ACTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const ActionCenterPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const stored = useMemo(() => readStoredActionState(), []);
  const [form, setForm] = useState(stored?.form || { customerId: "", actionType: "call", owner: "", notes: "" });
  const [state, setState] = useState({
    loading: true,
    loadingSources: true,
    error: "",
    items: [],
    recentCustomers: [],
    recentPredictions: [],
    submitting: false
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify({ form }));
  }, [form]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryCustomerId = params.get("customerId");
    const latestCustomerId = typeof window !== "undefined" ? window.sessionStorage.getItem(LATEST_CUSTOMER_ID_KEY) : "";
    const preferredCustomerId = queryCustomerId || latestCustomerId || "";

    if (preferredCustomerId) {
      setForm((prev) => (prev.customerId === preferredCustomerId ? prev : { ...prev, customerId: preferredCustomerId }));
    }

    loadActions();
    loadSources();
  }, [location.search]);

  const rememberLatestCustomerId = (customerId) => {
    if (typeof window === "undefined" || !customerId) return;
    window.sessionStorage.setItem(LATEST_CUSTOMER_ID_KEY, customerId);
  }

  const loadActions = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await listActions({ page: 1, limit: 50 });
      setState((prev) => ({ ...prev, loading: false, items: response?.data?.items || [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }

  const loadSources = async () => {
    setState((prev) => ({ ...prev, loadingSources: true }));
    try {
      const [customerResponse, predictionResponse] = await Promise.all([
        listCustomers({ page: 1, limit: 6 }),
        getLatestPredictions({ page: 1, limit: 6 })
      ]);
      setState((prev) => ({
        ...prev,
        loadingSources: false,
        recentCustomers: customerResponse?.data?.items || [],
        recentPredictions: predictionResponse?.data?.items || []
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingSources: false,
        error: prev.error || error.message
      }));
    }
  }

  const onCreateAction = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const customerId = form.customerId.trim();
      rememberLatestCustomerId(customerId);
      await createAction({
        customerId,
        actionType: form.actionType,
        owner: form.owner.trim() || undefined,
        notes: form.notes.trim() || undefined
      });
      toast.success("Follow-up created", `A new ${form.actionType} action was created for ${customerId}.`);
      setForm({ customerId, actionType: "call", owner: "", notes: "" });
      await Promise.all([loadActions(), loadSources()]);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      toast.error("Could not create follow-up", error.message);
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  }

  const onStatusChange = async (actionId, status) => {
    try {
      await updateAction(actionId, { status });
      toast.success("Action updated", `Status changed to ${status.replace(/_/g, " ")}.`);
      await loadActions();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      toast.error("Could not update action", error.message);
    }
  }

  const useCustomer = (customerId) => {
    rememberLatestCustomerId(customerId);
    setForm((prev) => ({ ...prev, customerId }));
  }

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Step 4</p>
        <h2 className="mt-3 text-3xl text-white sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
          Follow-up action center.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/80">
          Turn risky accounts into owned interventions, then monitor how those interventions move through the queue.
        </p>
      </RevealSection>

      <RevealSection className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <form className="soft-panel grid gap-3 md:grid-cols-2" onSubmit={onCreateAction}>
          <div className="md:col-span-2">
            <p className="workspace-kicker">Create</p>
            <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              Create action
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              If this customer already has a recent churn prediction, the platform links that prediction automatically. The selected customer ID is remembered across tabs.
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
            <span className="field-label">Action Type</span>
            <select className="field-input" value={form.actionType} onChange={(event) => setForm((prev) => ({ ...prev, actionType: event.target.value }))}>
              {actionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Owner</span>
            <input
              className="field-input"
              value={form.owner}
              onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))}
              placeholder={user?.name || "Retention agent"}
            />
          </label>
          <label>
            <span className="field-label">Notes</span>
            <input className="field-input" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button className="btn-primary" type="submit" disabled={state.submitting}>
              {state.submitting ? "Creating..." : "Create"}
            </button>
            <Link to={form.customerId ? `/app/at-risk?customerId=${encodeURIComponent(form.customerId)}` : "/app/at-risk"} className="btn-secondary">
              View in queue
            </Link>
          </div>
        </form>

        <div className="soft-panel">
          <p className="workspace-kicker">Database-backed references</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Customers ready for follow-up
          </h3>

          {state.loadingSources ? (
            <div className="mt-4">
              <PanelSkeleton rows={4} className="!border-0 !bg-transparent !p-0 !shadow-none" />
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              <div>
                <p className="workspace-kicker">Recent customers</p>
                <div className="mt-3 space-y-3">
                  {state.recentCustomers.length ? (
                    state.recentCustomers.map((item) => (
                      <div key={item._id} className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-white">{item.customerId}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.billing?.contract || "-"} | {item.subscription?.tenureMonths ?? "-"} months
                            </p>
                          </div>
                          <button type="button" className="text-xs text-slate-300 underline-offset-4 hover:text-white hover:underline" onClick={() => useCustomer(item.customerId)}>
                            Use this ID
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No customers yet.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="workspace-kicker">Recent scored customers</p>
                <div className="mt-3 space-y-3">
                  {state.recentPredictions.length ? (
                    state.recentPredictions.map((item) => (
                      <div key={item._id} className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-white">{item.customerId}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.riskBand} risk | {Number(item.churnProbability ?? 0).toFixed(4)}</p>
                          </div>
                          <button type="button" className="text-xs text-slate-300 underline-offset-4 hover:text-white hover:underline" onClick={() => useCustomer(item.customerId)}>
                            Use this ID
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No scored customers yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </RevealSection>

      {state.error && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}

      <RevealSection className="table-shell">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="workspace-kicker">Follow-up database</p>
              <h3 className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Action queue
              </h3>
            </div>
            <button type="button" className="btn-secondary" onClick={() => Promise.all([loadActions(), loadSources()])}>
              Refresh actions
            </button>
          </div>
        </div>
        {state.loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={4} columns={4} className="!border-0 !bg-transparent !shadow-none" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {state.items.length ? (
                state.items.map((item) => (
                  <article key={item._id} className="mobile-data-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="workspace-kicker">Customer</p>
                        <p className="mt-2 text-lg text-white">{item.customerId}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.12em] text-slate-200">
                        {item.actionType}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="workspace-kicker">Owner</p>
                        <p className="mt-1 text-slate-200">{item.owner || "-"}</p>
                      </div>
                      <div>
                        <p className="workspace-kicker">Status</p>
                        <p className="mt-1 text-slate-200">{item.status}</p>
                      </div>
                    </div>
                    <button type="button" className="btn-secondary mt-4 w-full" onClick={() => useCustomer(item.customerId)}>
                      Use customer ID
                    </button>
                    {user?.role !== "agent" && (
                      <label className="mt-4 block">
                        <span className="field-label">Update status</span>
                        <select
                          className="field-input"
                          value={item.status}
                          onChange={(event) => onStatusChange(item._id, event.target.value)}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </article>
                ))
              ) : (
                <div className="mobile-data-card text-center">
                  <p className="workspace-kicker">No actions yet</p>
                  <p className="mt-2 text-sm text-slate-300">Create the first intervention to start tracking follow-ups here.</p>
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reuse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {state.items.length ? (
                    state.items.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 font-medium text-white">{item.customerId}</td>
                        <td className="px-4 py-3 text-slate-300">{item.actionType}</td>
                        <td className="px-4 py-3 text-slate-300">{item.owner || "-"}</td>
                        <td className="px-4 py-3">
                          <select
                            className="field-input max-w-[180px] py-1.5"
                            value={item.status}
                            disabled={user?.role === "agent"}
                            onChange={(event) => onStatusChange(item._id, event.target.value)}
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" className="btn-secondary !py-1.5" onClick={() => useCustomer(item.customerId)}>
                            Use ID
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">No actions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </RevealSection>
    </section>
  );
}

export default ActionCenterPage;
