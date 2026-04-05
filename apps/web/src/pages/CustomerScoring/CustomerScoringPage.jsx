import { useState } from "react";
import { scoreCustomer } from "../../services/churnApi";

const CustomerScoringPage = () => {
  const [form, setForm] = useState({ customerId: "", threshold: "0.5" });
  const [state, setState] = useState({ loading: false, error: "", result: null });

  const onSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", result: null });

    try {
      const response = await scoreCustomer({
        customerId: form.customerId.trim(),
        threshold: Number(form.threshold)
      });

      setState({ loading: false, error: "", result: response.data });
    } catch (error) {
      setState({ loading: false, error: error.message, result: null });
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customer Scoring</h2>

      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        onSubmit={onSubmit}
      >
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Customer ID</span>
          <input
            type="text"
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            placeholder="7590-VHVEG"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Threshold</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={form.threshold}
            onChange={(event) => setForm((prev) => ({ ...prev, threshold: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            required
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={state.loading}
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.loading ? "Scoring..." : "Score Customer"}
          </button>
        </div>
      </form>

      {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{state.error}</p>}

      {state.result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Prediction Result</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-900">Customer:</span> {state.result.customerId}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Probability:</span>{" "}
              {Number(state.result.churnProbability).toFixed(4)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Risk Band:</span> {state.result.riskBand}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Predicted Label:</span> {state.result.predictedLabel}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-slate-900">Model Version:</span> {state.result.modelVersion}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default CustomerScoringPage;
