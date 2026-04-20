import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RevealSection from "../../components/RevealSection";
import { PanelSkeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import {
  createCustomer,
  getCurrentTrainingModel,
  importCustomByUpload,
  importTelcoByPath,
  importTelcoByUpload,
  listCustomers
} from "../../services/churnApi";

const UPLOAD_STORAGE_KEY = "churnflow.phase1.upload";
const LATEST_CUSTOMER_ID_KEY = "churnflow.phase1.latestCustomerId";

const telecomRequiredFields = [
  { label: "Customer ID", hint: "Unique customer reference used across scoring, actions, and outcomes." },
  { label: "Tenure Months", hint: "How long the customer has stayed active." },
  { label: "Monthly Charges", hint: "Current recurring bill amount for the customer." },
  { label: "Contract", hint: "Use Month-to-month, One year, or Two year." },
  { label: "Internet Service", hint: "Use DSL, Fiber optic, or No." },
  { label: "Tech Support", hint: "Use Yes, No, or No internet service." }
];

const templateCsv = [
  "customerId,tenureMonths,monthlyCharges,contract,internetService,techSupport",
  "CUST-1001,4,89.5,Month-to-month,Fiber optic,No",
  "CUST-1002,18,65.25,One year,DSL,Yes"
].join("\n");

const initialTelecomForm = {
  customerId: "",
  tenureMonths: "",
  monthlyCharges: "",
  contract: "Month-to-month",
  internetService: "Fiber optic",
  techSupport: "No"
};

const normalizeLookupKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const buildFeatureContract = (model) => {
  const identifierColumns = new Set((model?.metadata?.identifier_columns || []).map((item) => normalizeLookupKey(item)));
  const numericColumns = new Set(model?.metadata?.numeric_columns || []);
  const categoricalColumns = new Set(model?.metadata?.categorical_columns || []);
  const inputContract = [
    ...(model?.metadata?.identifier_contract || []),
    ...(model?.metadata?.feature_contract || [])
  ];
  const seen = new Set();

  return inputContract
    .map((item) => {
      const featureName = item.feature_name;
      const sourceColumn = item.source_column || item.feature_name;
      const targetField = item.target_field || item.feature_name;
      const isIdentifier =
        identifierColumns.has(normalizeLookupKey(sourceColumn)) ||
        identifierColumns.has(normalizeLookupKey(targetField)) ||
        isIdentifierFeature({ featureName, sourceColumn, targetField });

      return {
        featureName,
        sourceColumn,
        targetField,
        expectedType: isIdentifier
          ? "identifier"
          : numericColumns.has(featureName)
            ? "numeric"
            : categoricalColumns.has(featureName)
              ? "categorical"
              : "auto"
      };
    })
    .filter((item) => {
      const key = `${normalizeLookupKey(item.sourceColumn)}::${normalizeLookupKey(item.targetField)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};

const isIdentifierFeature = (field) => {
  const normalized = normalizeLookupKey(field?.targetField || field?.sourceColumn || field?.featureName);
  return ["customer_id", "account_id", "id"].includes(normalized) || normalized.endsWith("_id");
};

const buildInitialCustomForm = (model) => {
  const contract = buildFeatureContract(model);
  const base = contract.some((field) => isIdentifierFeature(field)) ? {} : { customerId: "" };
  contract.forEach((field) => {
    base[field.sourceColumn] = "";
  });
  return base;
};

const readStoredUploadState = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(UPLOAD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const UploadCustomersPage = () => {
  const toast = useToast();
  const stored = useMemo(() => readStoredUploadState(), []);
  const [pathForm, setPathForm] = useState(stored?.pathForm || { filePath: "", sheetName: "" });
  const [uploadForm, setUploadForm] = useState({ file: null, sheetName: stored?.uploadSheetName || "" });
  const [customUploadForm, setCustomUploadForm] = useState({ file: null, sheetName: stored?.customUploadSheetName || "" });
  const [manualForm, setManualForm] = useState(stored?.manualForm || initialTelecomForm);
  const [customForm, setCustomForm] = useState(stored?.customForm || {});
  const [activeModel, setActiveModel] = useState(null);
  const [state, setState] = useState({
    loadingPath: false,
    loadingUpload: false,
    loadingCustomUpload: false,
    loadingManual: false,
    loadingCustomers: true,
    error: "",
    message: stored?.message || "",
    createdCustomerId: stored?.createdCustomerId || "",
    recentCustomers: []
  });

  const featureContract = useMemo(() => buildFeatureContract(activeModel), [activeModel]);
  const identifierField = useMemo(() => featureContract.find((field) => isIdentifierFeature(field)) || null, [featureContract]);
  const isCustomWorkspace = Boolean(activeModel?.modelType === "tenant_custom" && activeModel?.deployment?.isDeployed);
  const requiredFields = isCustomWorkspace
    ? [
        ...(identifierField ? [] : [{ label: "customerId", hint: "Fallback customer reference if the dataset did not include a clear ID column." }]),
        ...featureContract.map((field) => ({
          label: field.sourceColumn,
          hint: field === identifierField
            ? "This column will be used as the customer reference inside the workspace. Use the same format the original dataset used."
            : field.expectedType === "numeric"
              ? "This column comes directly from the deployed model contract and should be entered as a number."
              : "This column comes directly from the deployed model contract."
        }))
      ]
    : telecomRequiredFields;

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      UPLOAD_STORAGE_KEY,
      JSON.stringify({
        pathForm,
        uploadSheetName: uploadForm.sheetName,
        customUploadSheetName: customUploadForm.sheetName,
        manualForm,
        customForm,
        message: state.message,
        createdCustomerId: state.createdCustomerId
      })
    );
  }, [customForm, customUploadForm.sheetName, manualForm, pathForm, state.createdCustomerId, state.message, uploadForm.sheetName]);

  useEffect(() => {
    loadWorkspaceContext();
  }, []);

  useEffect(() => {
    if (!isCustomWorkspace) {
      return;
    }

    setCustomForm((previous) => ({
      ...buildInitialCustomForm(activeModel),
      ...previous
    }));
  }, [activeModel, isCustomWorkspace]);

  const setFeedback = (next) => {
    setState((prev) => ({ ...prev, ...next }));
  };

  const loadWorkspaceContext = async () => {
    setState((prev) => ({ ...prev, loadingCustomers: true }));

    try {
      const [customersResponse, currentModelResponse] = await Promise.all([
        listCustomers({ page: 1, limit: 8 }),
        getCurrentTrainingModel().catch(() => ({ data: { model: null } }))
      ]);

      setActiveModel(currentModelResponse?.data?.model || null);
      setState((prev) => ({
        ...prev,
        loadingCustomers: false,
        recentCustomers: customersResponse?.data?.items || []
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingCustomers: false,
        error: prev.error || error.message
      }));
    }
  };

  const loadRecentCustomers = async () => {
    setState((prev) => ({ ...prev, loadingCustomers: true }));

    try {
      const response = await listCustomers({ page: 1, limit: 8 });
      setState((prev) => ({
        ...prev,
        loadingCustomers: false,
        recentCustomers: response?.data?.items || []
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingCustomers: false,
        error: prev.error || error.message
      }));
    }
  };

  const rememberLatestCustomerId = (customerId) => {
    if (typeof window === "undefined" || !customerId) return;
    window.sessionStorage.setItem(LATEST_CUSTOMER_ID_KEY, customerId);
  };

  const downloadTemplate = () => {
    const customHeaders = [
      ...(identifierField ? [] : ["customerId"]),
      ...featureContract.map((field) => field.sourceColumn)
    ];
    const csvContent = isCustomWorkspace ? `${customHeaders.join(",")}\n` : templateCsv;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = isCustomWorkspace ? "custom-model-template.csv" : "telecom-churn-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handlePathImport = async (event) => {
    event.preventDefault();
    setFeedback({ loadingPath: true, error: "", message: "", createdCustomerId: "" });

    try {
      const response = await importTelcoByPath({
        filePath: pathForm.filePath.trim(),
        sheetName: pathForm.sheetName.trim()
      });
      const summary = response?.data;
      setFeedback({
        loadingPath: false,
        message: `Imported ${summary.totalProcessed} telecom customers. ${summary.createdCount} new and ${summary.updatedCount} updated.`
      });
      toast.success("Workbook imported", `${summary.totalProcessed} telecom customers were processed successfully.`);
      await loadRecentCustomers();
    } catch (error) {
      setFeedback({ loadingPath: false, error: error.message, message: "", createdCustomerId: "" });
      toast.error("Could not import workbook", error.message);
    }
  };

  const handleUploadImport = async (event) => {
    event.preventDefault();
    if (!uploadForm.file) {
      setFeedback({ error: "Choose an Excel file before uploading.", message: "" });
      return;
    }

    setFeedback({ loadingUpload: true, error: "", message: "", createdCustomerId: "" });

    try {
      const response = await importTelcoByUpload(uploadForm.file, uploadForm.sheetName.trim());
      const summary = response?.data;
      setFeedback({
        loadingUpload: false,
        message: `Imported ${summary.totalProcessed} telecom customers. ${summary.createdCount} new and ${summary.updatedCount} updated.`
      });
      toast.success("Upload complete", `${summary.totalProcessed} telecom customers were processed successfully.`);
      await loadRecentCustomers();
    } catch (error) {
      setFeedback({ loadingUpload: false, error: error.message, message: "", createdCustomerId: "" });
      toast.error("Could not upload workbook", error.message);
    }
  };

  const handleTelecomCreate = async (event) => {
    event.preventDefault();
    setFeedback({ loadingManual: true, error: "", message: "", createdCustomerId: "" });

    try {
      const response = await createCustomer({
        customerId: manualForm.customerId.trim(),
        subscription: {
          tenureMonths: Number(manualForm.tenureMonths),
          internetService: manualForm.internetService,
          techSupport: manualForm.techSupport
        },
        billing: {
          monthlyCharges: Number(manualForm.monthlyCharges),
          contract: manualForm.contract
        },
        source: "manual"
      });

      const customerId = response?.data?.customerId || manualForm.customerId.trim();
      rememberLatestCustomerId(customerId);
      setManualForm(initialTelecomForm);
      setFeedback({
        loadingManual: false,
        createdCustomerId: customerId,
        message: `Customer ${customerId} was saved and is ready for scoring.`
      });
      toast.success("Customer saved", `${customerId} is ready for scoring.`);
      await loadRecentCustomers();
    } catch (error) {
      setFeedback({ loadingManual: false, error: error.message, message: "", createdCustomerId: "" });
      toast.error("Could not save customer", error.message);
    }
  };

  const handleCustomCreate = async (event) => {
    event.preventDefault();
    setFeedback({ loadingManual: true, error: "", message: "", createdCustomerId: "" });

    try {
      const customerId = String(
        (identifierField && customForm[identifierField.sourceColumn]) ||
        customForm.customerId ||
        ""
      ).trim();
      const normalizedFeatures = {};

      featureContract.forEach((field) => {
        normalizedFeatures[field.sourceColumn] = customForm[field.sourceColumn];
      });

      await createCustomer({
        customerId,
        industryType: "custom",
        schemaVersion: activeModel?.version || "custom-v1",
        normalizedFeatures,
        source: "manual_custom"
      });

      rememberLatestCustomerId(customerId);
      setCustomForm(buildInitialCustomForm(activeModel));
      setFeedback({
        loadingManual: false,
        createdCustomerId: customerId,
        message: `Customer ${customerId} was saved using the deployed custom model fields and is ready for scoring.`
      });
      toast.success("Custom customer saved", `${customerId} is ready for scoring.`);
      await loadRecentCustomers();
    } catch (error) {
      setFeedback({ loadingManual: false, error: error.message, message: "", createdCustomerId: "" });
      toast.error("Could not save custom customer", error.message);
    }
  };

  const handleCustomUpload = async (event) => {
    event.preventDefault();

    if (!customUploadForm.file) {
      setFeedback({ error: "Choose a CSV or Excel file before uploading.", message: "" });
      return;
    }

    setFeedback({ loadingCustomUpload: true, error: "", message: "", createdCustomerId: "" });

    try {
      const response = await importCustomByUpload(customUploadForm.file, customUploadForm.sheetName.trim());
      const summary = response?.data;
      setFeedback({
        loadingCustomUpload: false,
        message: `Imported ${summary.totalProcessed} custom customers for model ${summary.modelVersion}. ${summary.createdCount} new, ${summary.updatedCount} updated, ${summary.skippedRows || 0} skipped.`,
        createdCustomerId: ""
      });
      toast.success("Custom upload complete", `${summary.totalProcessed} custom customers were processed for the deployed model.`);
      setCustomUploadForm({ file: null, sheetName: "" });
      await loadRecentCustomers();
    } catch (error) {
      setFeedback({ loadingCustomUpload: false, error: error.message, message: "", createdCustomerId: "" });
      toast.error("Could not import custom customers", error.message);
    }
  };

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Step 1</p>
        <h2 className="mt-3 text-3xl text-black sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
          {isCustomWorkspace ? "Add records for your deployed custom model." : "Bring customer data into the workspace."}
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black">
          {isCustomWorkspace
            ? "This workspace now has an active custom model. Save customers with the confirmed business fields below, then move to analysis."
            : "Phase 1 stays telecom-ready. Import a workbook or add one telecom customer manually with the six required fields."}
        </p>
      </RevealSection>

      <RevealSection className="soft-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="workspace-kicker">{isCustomWorkspace ? "Active feature contract" : "Prediction-ready schema"}</p>
            <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
              {isCustomWorkspace ? "These are the fields your deployed model expects." : "These are the required telecom inputs."}
            </h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isCustomWorkspace && (
              <button type="button" onClick={downloadTemplate} className="btn-secondary">
                Download template
              </button>
            )}
            <Link to={state.createdCustomerId ? `/app/analyze?customerId=${encodeURIComponent(state.createdCustomerId)}` : "/app/analyze"} className="btn-primary">
              Go to analysis
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {requiredFields.map((field) => (
            <div key={field.label} className="rounded-[1.45rem] border border-blue-200 bg-white p-4 shadow-sm">
              <p className="workspace-kicker">{field.label}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-black italic opacity-80">{field.hint}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {!isCustomWorkspace && (
        <RevealSection className="grid gap-4 lg:grid-cols-2">
          <form className="soft-panel space-y-3" onSubmit={handlePathImport}>
            <p className="workspace-kicker">Path import</p>
            <label>
              <span className="field-label">File Path</span>
              <input
                type="text"
                className="field-input"
                value={pathForm.filePath}
                onChange={(event) => setPathForm((prev) => ({ ...prev, filePath: event.target.value }))}
                required
              />
            </label>
            <label>
              <span className="field-label">Sheet Name (optional)</span>
              <input
                type="text"
                className="field-input"
                value={pathForm.sheetName}
                onChange={(event) => setPathForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              />
            </label>
            <button type="submit" disabled={state.loadingPath} className="btn-primary">
              {state.loadingPath ? "Importing..." : "Import workbook"}
            </button>
          </form>

          <form className="soft-panel space-y-3" onSubmit={handleUploadImport}>
            <p className="workspace-kicker">Direct upload</p>
            <label>
              <span className="field-label">Excel File (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx"
                className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-black"
                onChange={(event) => setUploadForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                required
              />
            </label>
            <label>
              <span className="field-label">Sheet Name (optional)</span>
              <input
                type="text"
                className="field-input"
                value={uploadForm.sheetName}
                onChange={(event) => setUploadForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              />
            </label>
            <button type="submit" disabled={state.loadingUpload} className="btn-primary">
              {state.loadingUpload ? "Uploading..." : "Upload workbook"}
            </button>
          </form>
        </RevealSection>
      )}

      {isCustomWorkspace && (
        <RevealSection>
          <form className="soft-panel space-y-3" onSubmit={handleCustomUpload}>
            <p className="workspace-kicker">Custom bulk upload</p>
            <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
              Upload many custom customers at once
            </h3>
            <p className="text-sm font-bold leading-6 text-black italic">
              Use the deployed model template or a file with matching column names. Each row becomes a saved workspace customer that can be scored right away.
            </p>
            <label>
              <span className="field-label">CSV or Excel file</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-black"
                onChange={(event) => setCustomUploadForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                required
              />
            </label>
            <label>
              <span className="field-label">Sheet Name (optional for Excel)</span>
              <input
                type="text"
                className="field-input"
                value={customUploadForm.sheetName}
                onChange={(event) => setCustomUploadForm((prev) => ({ ...prev, sheetName: event.target.value }))}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={state.loadingCustomUpload} className="btn-primary">
                {state.loadingCustomUpload ? "Uploading..." : "Import custom customers"}
              </button>
              <button type="button" onClick={downloadTemplate} className="btn-secondary">
                Download custom template
              </button>
            </div>
          </form>
        </RevealSection>
      )}

      <RevealSection>
        {!isCustomWorkspace ? (
          <form className="soft-panel grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleTelecomCreate}>
            <div className="md:col-span-2 xl:col-span-3">
              <p className="workspace-kicker">Manual entry</p>
              <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                Add one telecom customer now
              </h3>
            </div>

            <label>
              <span className="field-label">Customer ID</span>
              <input className="field-input" value={manualForm.customerId} onChange={(event) => setManualForm((prev) => ({ ...prev, customerId: event.target.value }))} required />
            </label>
            <label>
              <span className="field-label">Tenure Months</span>
              <input type="number" min="0" className="field-input" value={manualForm.tenureMonths} onChange={(event) => setManualForm((prev) => ({ ...prev, tenureMonths: event.target.value }))} required />
            </label>
            <label>
              <span className="field-label">Monthly Charges</span>
              <input type="number" min="0" step="0.01" className="field-input" value={manualForm.monthlyCharges} onChange={(event) => setManualForm((prev) => ({ ...prev, monthlyCharges: event.target.value }))} required />
            </label>
            <label>
              <span className="field-label">Contract</span>
              <select className="field-input" value={manualForm.contract} onChange={(event) => setManualForm((prev) => ({ ...prev, contract: event.target.value }))}>
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </label>
            <label>
              <span className="field-label">Internet Service</span>
              <select className="field-input" value={manualForm.internetService} onChange={(event) => setManualForm((prev) => ({ ...prev, internetService: event.target.value }))}>
                <option value="Fiber optic">Fiber optic</option>
                <option value="DSL">DSL</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              <span className="field-label">Tech Support</span>
              <select className="field-input" value={manualForm.techSupport} onChange={(event) => setManualForm((prev) => ({ ...prev, techSupport: event.target.value }))}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-3">
              <button type="submit" disabled={state.loadingManual} className="btn-primary">
                {state.loadingManual ? "Saving..." : "Save customer"}
              </button>
            </div>
          </form>
        ) : (
          <form className="soft-panel grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleCustomCreate}>
            <div className="md:col-span-2 xl:col-span-3">
              <p className="workspace-kicker">Manual entry</p>
              <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                Add one custom-model customer now
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-black italic">
                These visible inputs come directly from the dataset contract used to train the deployed model.
              </p>
            </div>

            {!identifierField && (
              <label>
                <span className="field-label">customerId</span>
                <input
                  className="field-input"
                  value={customForm.customerId || ""}
                  onChange={(event) => setCustomForm((prev) => ({ ...prev, customerId: event.target.value }))}
                  required
                />
              </label>
            )}

            {featureContract.map((field) => (
              <label key={field.featureName || field.sourceColumn}>
                <span className="field-label">{field.sourceColumn}</span>
                <input
                  type={field.expectedType === "numeric" ? "number" : "text"}
                  className="field-input"
                  value={customForm[field.sourceColumn] || ""}
                  step={field.expectedType === "numeric" ? "any" : undefined}
                  inputMode={field.expectedType === "numeric" ? "decimal" : undefined}
                  onChange={(event) => setCustomForm((prev) => ({ ...prev, [field.sourceColumn]: event.target.value }))}
                  required
                />
              </label>
            ))}

            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-3">
              <button type="submit" disabled={state.loadingManual} className="btn-primary">
                {state.loadingManual ? "Saving..." : "Save customer"}
              </button>
            </div>
          </form>
        )}
      </RevealSection>

      <RevealSection className="table-shell">
        <div className="border-b border-blue-200 px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="workspace-kicker">Saved in workspace</p>
              <h3 className="text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                Recent customers
              </h3>
            </div>
            <button type="button" className="btn-secondary" onClick={loadRecentCustomers}>
              Refresh list
            </button>
          </div>
        </div>

        {state.loadingCustomers ? (
          <div className="px-5 py-4">
            <PanelSkeleton rows={3} className="border-0! bg-transparent! p-0! shadow-none!" />
          </div>
        ) : state.recentCustomers.length ? (
          <div className="grid gap-3 p-4">
            {state.recentCustomers.map((customer) => (
              <div key={customer._id} className="rounded-[1.2rem] border border-blue-200 bg-blue-50/50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-black font-bold">{customer.customerId}</p>
                    <p className="mt-1 text-xs font-bold text-blue-600 italic">
                      {isCustomWorkspace ? "Saved for the deployed custom model." : `Tenure ${customer.subscription?.tenureMonths ?? "-"} | Charges ${customer.billing?.monthlyCharges ?? "-"}`}
                    </p>
                  </div>
                  <Link to={`/app/analyze?customerId=${encodeURIComponent(customer.customerId)}`} className="btn-secondary">
                    Analyze customer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-6 text-center text-sm text-black font-black italic opacity-60">
            {isCustomWorkspace
              ? "No custom customers saved yet. Add one with the deployed feature contract and it will appear here."
              : "No customers saved yet. Add one manually or import a workbook and they will appear here."}
          </p>
        )}
      </RevealSection>

      {state.error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}

      {state.message && (
        <div className="rounded-[1.45rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p>{state.message}</p>
          {state.createdCustomerId && (
            <p className="mt-2 text-emerald-800">
              Next step: open the analysis page. The customer ID <span className="font-bold text-black">{state.createdCustomerId}</span> will be prefilled automatically.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default UploadCustomersPage;
