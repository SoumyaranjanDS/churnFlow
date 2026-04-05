import { useState } from "react";
import { importTelcoByPath, importTelcoByUpload } from "../../services/churnApi";

const ImportDataPage = () => {
  const [pathForm, setPathForm] = useState({ filePath: "", sheetName: "" });
  const [uploadForm, setUploadForm] = useState({ file: null, sheetName: "" });
  const [state, setState] = useState({ loading: false, error: "", message: "" });

  const handlePathImport = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", message: "" });

    try {
      const response = await importTelcoByPath({
        filePath: pathForm.filePath,
        sheetName: pathForm.sheetName
      });

      const summary = response?.data;
      setState({
        loading: false,
        error: "",
        message: `Imported ${summary.totalProcessed} rows (created: ${summary.createdCount}, updated: ${summary.updatedCount})`
      });
    } catch (error) {
      setState({ loading: false, error: error.message, message: "" });
    }
  }

  const handleUploadImport = async (event) => {
    event.preventDefault();
    if (!uploadForm.file) {
      setState({ loading: false, error: "Choose a file first.", message: "" });
      return;
    }

    setState({ loading: true, error: "", message: "" });

    try {
      const response = await importTelcoByUpload(uploadForm.file, uploadForm.sheetName);
      const summary = response?.data;

      setState({
        loading: false,
        error: "",
        message: `Imported ${summary.totalProcessed} rows (created: ${summary.createdCount}, updated: ${summary.updatedCount})`
      });
    } catch (error) {
      setState({ loading: false, error: error.message, message: "" });
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Import</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handlePathImport}>
          <h3 className="text-lg font-semibold text-slate-900">Import by File Path</h3>
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>File Path (.xlsx)</span>
            <input
              type="text"
              value={pathForm.filePath}
              onChange={(event) => setPathForm((prev) => ({ ...prev, filePath: event.target.value }))}
              placeholder="C:/Users/.../Telco_customer_churn.xlsx"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Sheet Name (optional)</span>
            <input
              type="text"
              value={pathForm.sheetName}
              onChange={(event) => setPathForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              placeholder="Telco_Churn"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            />
          </label>

          <button
            type="submit"
            disabled={state.loading}
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.loading ? "Importing..." : "Import by Path"}
          </button>
        </form>

        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleUploadImport}>
          <h3 className="text-lg font-semibold text-slate-900">Import by Upload</h3>
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Excel File</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={(event) => setUploadForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Sheet Name (optional)</span>
            <input
              type="text"
              value={uploadForm.sheetName}
              onChange={(event) => setUploadForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              placeholder="Telco_Churn"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            />
          </label>

          <button
            type="submit"
            disabled={state.loading}
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.loading ? "Importing..." : "Import by Upload"}
          </button>
        </form>
      </div>

      {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{state.error}</p>}
      {state.message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{state.message}</p>}
    </section>
  );
}

export default ImportDataPage;
