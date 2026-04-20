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
      <h2 className="text-2xl font-bold tracking-tight text-black">Customer Scoring</h2>

      <form
        className="grid gap-4 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        onSubmit={onSubmit}
      >
        <label className="block space-y-1 text-sm font-medium text-slate-900">
          <span>Customer ID</span>
          <input
            type="text"
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            placeholder="7590-VHVEG"
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-400 transition focus:ring-2"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-slate-900">
          <span>Threshold</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={form.threshold}
            onChange={(event) => setForm((prev) => ({ ...prev, threshold: event.target.value }))}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 outline-none ring-blue-400 transition focus:ring-2"
            required
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={state.loading}
            className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
          >
            {state.loading ? "Scoring..." : "Score Customer"}
          </button>
        </div>
      </form>

      {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-black border border-red-200">{state.error}</p>}

      {state.result && (
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-black">Prediction Result</h3>
          <div className="mt-4 grid gap-3 text-sm text-black sm:grid-cols-2">
            <p className="flex justify-between border-b border-blue-50 pb-2 sm:border-0 sm:pb-0">
              <span className="font-bold text-black">Customer ID</span> 
              <span className="font-mono">{state.result.customerId}</span>
            </p>
            <p className="flex justify-between border-b border-blue-50 pb-2 sm:border-0 sm:pb-0">
              <span className="font-bold text-black">Churn Probability</span> 
              <span className="font-bold text-blue-600">{(state.result.churnProbability * 100).toFixed(2)}%</span>
            </p>
            <p className="flex justify-between border-b border-blue-50 pb-2 sm:border-0 sm:pb-0">
              <span className="font-bold text-black">Risk Band</span> 
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                state.result.riskBand === 'High' ? 'bg-red-50 text-red-700' : 
                state.result.riskBand === 'Medium' ? 'bg-amber-50 text-amber-700' : 
                'bg-emerald-50 text-emerald-700'
              }`}>{state.result.riskBand}</span>
            </p>
            <p className="flex justify-between border-b border-blue-50 pb-2 sm:border-0 sm:pb-0">
              <span className="font-bold text-black">Predicted Label</span> 
              <span className="font-bold">{state.result.predictedLabel}</span>
            </p>
            <p className="sm:col-span-2 flex justify-between pt-2">
              <span className="font-bold text-black">Model Version</span> 
              <span className="text-black font-extrabold italic">{state.result.modelVersion}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default CustomerScoringPage;
