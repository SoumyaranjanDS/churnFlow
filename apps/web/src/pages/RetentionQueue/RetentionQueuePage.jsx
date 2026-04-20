import { useEffect, useState } from "react";
import { createAction, listActions, updateAction } from "../../services/churnApi";
import { useAuth } from "../../context/AuthContext";

const statuses = ["pending", "in_progress", "completed", "cancelled"];
const actionTypes = ["call", "discount", "plan_upgrade", "support", "email", "other"];

const RetentionQueuePage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ customerId: "", actionType: "call", owner: "", notes: "" });
  const [state, setState] = useState({ loading: true, error: "", items: [], submitting: false });

  const loadActions = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await listActions({ page: 1, limit: 30 });
      setState((prev) => ({ ...prev, loading: false, error: "", items: response?.data?.items || [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message, items: [] }));
    }
  }

  useEffect(() => {
    loadActions();
  }, []);

  const onCreateAction = async (event) => {
    event.preventDefault();

    setState((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      await createAction({
        customerId: form.customerId.trim(),
        actionType: form.actionType,
        owner: form.owner.trim() || undefined,
        notes: form.notes.trim() || undefined
      });
      setForm({ customerId: "", actionType: "call", owner: "", notes: "" });
      await loadActions();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  }

  const onStatusChange = async (actionId, status) => {
    try {
      await updateAction(actionId, { status });
      await loadActions();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }

  if (state.loading) {
    return <p className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-black">Loading actions...</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-black">Retention Queue</h2>
      {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{state.error}</p>}

      <form className="grid gap-4 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:grid-cols-2" onSubmit={onCreateAction}>
        <h3 className="sm:col-span-2 text-lg font-bold text-black">Create Action</h3>

        <label className="block space-y-1 text-sm font-medium text-black">
          <span>Customer ID</span>
          <input
            type="text"
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-400 transition focus:ring-2"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-black">
          <span>Action Type</span>
          <select
            value={form.actionType}
            onChange={(event) => setForm((prev) => ({ ...prev, actionType: event.target.value }))}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-400 transition focus:ring-2"
          >
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium text-black">
          <span>Owner</span>
          <input
            type="text"
            value={form.owner}
            onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))}
            placeholder={user?.name || "Retention agent"}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-400 transition focus:ring-2"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-black">
          <span>Notes</span>
          <input
            type="text"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-400 transition focus:ring-2"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={state.submitting}
            className="btn-primary"
          >
            {state.submitting ? "Creating..." : "Create Action"}
          </button>
        </div>
      </form>

      {!state.items.length && (
        <p className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-black italic opacity-60">No actions found.</p>
      )}

      {!!state.items.length && (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50 text-left text-[11px] uppercase tracking-[0.2em] text-black font-black">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {state.items.map((item) => (
                  <tr key={item._id} className="text-black font-bold">
                    <td className="px-4 py-3 font-black text-black">{item.customerId}</td>
                    <td className="px-4 py-3 text-blue-600 italic">{item.actionType}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        disabled={user?.role === "agent"}
                        onChange={(event) => onStatusChange(item._id, event.target.value)}
                        className="w-full rounded-lg border border-blue-200 px-2 py-1.5 outline-none ring-blue-400 transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-blue-50 text-xs font-bold uppercase tracking-widest"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-black font-medium opacity-80 italic">{item.owner || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default RetentionQueuePage;
