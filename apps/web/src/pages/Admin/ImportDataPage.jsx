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
    <section className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-black">Data Import</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="grid gap-4 rounded-[2rem] border border-blue-200 bg-white p-6 shadow-premium" onSubmit={handlePathImport}>
          <h3 className="text-lg font-bold text-black">Import by File Path</h3>
          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>File Path (.xlsx)</span>
            <input
              type="text"
              value={pathForm.filePath}
              onChange={(event) => setPathForm((prev) => ({ ...prev, filePath: event.target.value }))}
              placeholder="C:/Users/.../Telco_customer_churn.xlsx"
              className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3 py-2 outline-none ring-blue-400/20 transition focus:ring-4"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Sheet Name (optional)</span>
            <input
              type="text"
              value={pathForm.sheetName}
              onChange={(event) => setPathForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              placeholder="Telco_Churn"
              className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3 py-2 outline-none ring-blue-400/20 transition focus:ring-4"
            />
          </label>

          <button
            type="submit"
            disabled={state.loading}
            className="btn-primary py-3 text-sm"
          >
            {state.loading ? "Importing..." : "Import by Path"}
          </button>
        </form>

        <form className="grid gap-4 rounded-[2rem] border border-blue-200 bg-white p-6 shadow-premium" onSubmit={handleUploadImport}>
          <h3 className="text-lg font-bold text-black">Import by Upload</h3>
          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Excel File</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={(event) => setUploadForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
              className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3 py-2 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-600 file:shadow-sm"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Sheet Name (optional)</span>
            <input
              type="text"
              value={uploadForm.sheetName}
              onChange={(event) => setUploadForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              placeholder="Telco_Churn"
              className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3 py-2 outline-none ring-blue-400/20 transition focus:ring-4"
            />
          </label>

          <button
            type="submit"
            disabled={state.loading}
            className="btn-primary py-3 text-sm"
          >
            {state.loading ? "Importing..." : "Import by Upload"}
          </button>
        </form>
      </div>

      {state.error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-black">{state.error}</p>}
      {state.message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-black">{state.message}</p>}
    </section>
  );
}

export default ImportDataPage;
