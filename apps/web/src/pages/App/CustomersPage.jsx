import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RevealSection from "../../components/RevealSection";
import { PanelSkeleton, TableSkeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import { listCustomers, updateCustomer } from "../../services/churnApi";

const CUSTOMERS_STORAGE_KEY = "churnflow.phase1.customers";
const LATEST_CUSTOMER_ID_KEY = "churnflow.phase1.latestCustomerId";

const sourceOptions = [
  { value: "", label: "All sources" },
  { value: "manual", label: "Manual" },
  { value: "telco_xlsx", label: "Excel import" },
  { value: "manual_custom", label: "Custom manual" },
  { value: "custom_upload", label: "Custom upload" }
];

const contractOptions = ["Month-to-month", "One year", "Two year"];
const internetOptions = ["Fiber optic", "DSL", "No"];
const techSupportOptions = ["No", "Yes", "No internet service"];

const readStoredCustomersState = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CUSTOMERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const mapCustomerToEditForm = (customer) => {
  if (!customer) {
    return {
      country: "",
      state: "",
      city: "",
      tenureMonths: "",
      monthlyCharges: "",
      contract: "Month-to-month",
      internetService: "Fiber optic",
      techSupport: "No"
    };
  }

  return {
    country: customer.profile?.country || "",
    state: customer.profile?.state || "",
    city: customer.profile?.city || "",
    tenureMonths: customer.subscription?.tenureMonths ?? "",
    monthlyCharges: customer.billing?.monthlyCharges ?? "",
    contract: customer.billing?.contract || "Month-to-month",
    internetService: customer.subscription?.internetService || "Fiber optic",
    techSupport: customer.subscription?.techSupport || "No"
  };
}

const buildCustomerPayload = (form) => {
  return {
    profile: {
      country: form.country.trim() || undefined,
      state: form.state.trim() || undefined,
      city: form.city.trim() || undefined
    },
    subscription: {
      tenureMonths: form.tenureMonths === "" ? undefined : Number(form.tenureMonths),
      internetService: form.internetService || undefined,
      techSupport: form.techSupport || undefined
    },
    billing: {
      contract: form.contract || undefined,
      monthlyCharges: form.monthlyCharges === "" ? undefined : Number(form.monthlyCharges)
    }
  };
}

const CustomersPage = () => {
  const toast = useToast();
  const location = useLocation();
  const stored = useMemo(() => readStoredCustomersState(), []);
  const [filters, setFilters] = useState(stored?.filters || { search: "", source: "", page: 1 });
  const [selectedCustomerId, setSelectedCustomerId] = useState(stored?.selectedCustomerId || "");
  const [editForm, setEditForm] = useState(() => mapCustomerToEditForm(null));
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    message: "",
    items: [],
    pagination: null
  });

  const selectedCustomer = useMemo(
    () => state.items.find((item) => item.customerId === selectedCustomerId) || null,
    [selectedCustomerId, state.items]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      CUSTOMERS_STORAGE_KEY,
      JSON.stringify({
        filters,
        selectedCustomerId
      })
    );
  }, [filters, selectedCustomerId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryCustomerId = params.get("customerId");
    const latestCustomerId = typeof window !== "undefined" ? window.sessionStorage.getItem(LATEST_CUSTOMER_ID_KEY) : "";
    const preferredCustomerId = queryCustomerId || (!stored ? latestCustomerId : "");

    if (preferredCustomerId) {
      const nextFilters = { ...filters, search: preferredCustomerId, page: 1 };
      setFilters(nextFilters);
      loadCustomers(nextFilters, preferredCustomerId);
      return;
    }

    loadCustomers(filters, selectedCustomerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (selectedCustomer) {
      setEditForm(mapCustomerToEditForm(selectedCustomer));
    }
  }, [selectedCustomer]);

  const rememberLatestCustomerId = (customerId) => {
    if (typeof window === "undefined" || !customerId) return;
    window.sessionStorage.setItem(LATEST_CUSTOMER_ID_KEY, customerId);
  }

  const syncSelection = (items, preferredCustomerId = "") => {
    const nextSelected =
      items.find((item) => item.customerId === preferredCustomerId) ||
      items.find((item) => item.customerId === selectedCustomerId) ||
      items[0] ||
      null;

    const nextCustomerId = nextSelected?.customerId || "";
    setSelectedCustomerId(nextCustomerId);
    if (nextSelected) {
      setEditForm(mapCustomerToEditForm(nextSelected));
      rememberLatestCustomerId(nextCustomerId);
    }
  }

  const loadCustomers = async (nextFilters = filters, preferredCustomerId = "") => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const normalizedSearch = nextFilters.search.trim();
      const response = await listCustomers({
        page: nextFilters.page,
        limit: 12,
        search: normalizedSearch || undefined,
        source: normalizedSearch ? undefined : nextFilters.source || undefined
      });

      const items = response?.data?.items || [];
      setState((prev) => ({
        ...prev,
        loading: false,
        items,
        pagination: response?.data?.pagination || null
      }));
      syncSelection(items, preferredCustomerId);
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }

  const onApplyFilters = (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, search: filters.search.trim(), page: 1 };
    setFilters(nextFilters);
    loadCustomers(nextFilters, selectedCustomerId);
  }

  const onResetFilters = () => {
    const nextFilters = { search: "", source: "", page: 1 };
    setFilters(nextFilters);
    loadCustomers(nextFilters, selectedCustomerId);
  }

  const onSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.customerId);
    setEditForm(mapCustomerToEditForm(customer));
    rememberLatestCustomerId(customer.customerId);
  }

  const onChangePage = (nextPage) => {
    const nextFilters = { ...filters, page: nextPage };
    setFilters(nextFilters);
    loadCustomers(nextFilters, selectedCustomerId);
  }

  const onSaveCustomer = async (event) => {
    event.preventDefault();

    if (!selectedCustomerId) return;

    setState((prev) => ({ ...prev, saving: true, error: "", message: "" }));
    try {
      await updateCustomer(selectedCustomerId, buildCustomerPayload(editForm));
      setState((prev) => ({
        ...prev,
        saving: false,
        message: `Customer ${selectedCustomerId} was updated in this workspace.`
      }));
      toast.success("Customer updated", `${selectedCustomerId} was updated in this workspace.`);
      await loadCustomers(filters, selectedCustomerId);
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message }));
      toast.error("Could not update customer", error.message);
    }
  }

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Customer Database</p>
        <h2 className="mt-3 text-3xl text-black sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
          Search, review, and maintain saved customer records.
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black">
          This page is your workspace customer view. Find a record quickly, update the core telecom inputs, and move straight into scoring or follow-up without leaving the app.
        </p>
      </RevealSection>

      <RevealSection>
        <form onSubmit={onApplyFilters} className="soft-panel grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
          <label>
            <span className="field-label">Search customer, city, or state</span>
            <input
              className="field-input"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="CUST-5678 or San Jose"
            />
          </label>
          <label>
            <span className="field-label">Source</span>
            <select
              className="field-input"
              value={filters.source}
              onChange={(event) => setFilters((prev) => ({ ...prev, source: event.target.value }))}
            >
              {sourceOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button type="submit" className="btn-primary w-full">
              Search
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onResetFilters}>
              Reset
            </button>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs font-bold leading-6 text-black italic">
              Direct customer search checks the whole workspace, so an old source filter will not hide a matching customer ID.
            </p>
          </div>
        </form>
      </RevealSection>

      {state.error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      {state.message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.message}</p>}

      <RevealSection className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="table-shell">
          <div className="border-b border-blue-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="workspace-kicker">Workspace records</p>
                <h3 className="text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                  Saved customers
                </h3>
              </div>
              <button type="button" className="btn-secondary" onClick={() => loadCustomers(filters, selectedCustomerId)}>
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {state.loading ? (
              <TableSkeleton rows={4} columns={2} className="!border-0 !bg-transparent !shadow-none" />
            ) : state.items.length ? (
              state.items.map((item) => {
                const active = item.customerId === selectedCustomerId;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => onSelectCustomer(item)}
                    className={[
                      "mobile-data-card text-left transition",
                      active ? "border-blue-200 bg-blue-50" : "hover:bg-blue-50/50"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="workspace-kicker">Customer</p>
                        <p className="mt-2 text-lg text-black">{item.customerId}</p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-black font-black">
                        {item.source || "manual"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="workspace-kicker">Location</p>
                        <p className="mt-1 text-black font-bold">{item.profile?.city || item.profile?.state || "-"}</p>
                      </div>
                      <div>
                        <p className="workspace-kicker">Tenure</p>
                        <p className="mt-1 text-black font-bold">{item.subscription?.tenureMonths ?? "-"} months</p>
                      </div>
                      <div>
                        <p className="workspace-kicker">Monthly</p>
                        <p className="mt-1 text-black font-bold">{item.billing?.monthlyCharges ?? "-"}</p>
                      </div>
                      <div>
                        <p className="workspace-kicker">Contract</p>
                        <p className="mt-1 text-black font-bold">{item.billing?.contract || "-"}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="soft-panel text-sm text-black font-black italic">No customers match these filters yet.</p>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50 text-left text-[11px] uppercase tracking-[0.2em] text-black font-black">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Tenure</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {state.loading ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={6}>
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="grid grid-cols-6 gap-3">
                            {Array.from({ length: 6 }).map((__, innerIndex) => (
                              <div key={`${index}-${innerIndex}`} className="skeleton h-4 w-full" />
                            ))}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : state.items.length ? (
                  state.items.map((item) => {
                    const active = item.customerId === selectedCustomerId;
                    return (
                      <tr
                        key={item._id}
                        className={active ? "bg-blue-50" : "transition hover:bg-blue-50/50"}
                        onClick={() => onSelectCustomer(item)}
                      >
                        <td className="cursor-pointer px-4 py-3 font-bold text-black">{item.customerId}</td>
                        <td className="px-4 py-3 text-black font-bold">{item.source || "-"}</td>
                        <td className="px-4 py-3 text-black font-medium">
                          {[item.profile?.city, item.profile?.state].filter(Boolean).join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3 text-black font-extrabold">{item.subscription?.tenureMonths ?? "-"}</td>
                        <td className="px-4 py-3 text-black font-extrabold">{item.billing?.monthlyCharges ?? "-"}</td>
                        <td className="px-4 py-3 text-black font-bold italic">{item.billing?.contract || "-"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-black font-black italic opacity-60" colSpan={6}>No customers match these filters yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {state.pagination && state.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-blue-100 px-5 py-4 text-xs text-black font-black uppercase tracking-widest shadow-premium">
              <p>
                Page {state.pagination.page} of {state.pagination.totalPages} | {state.pagination.total} customers
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary !py-1.5"
                  disabled={state.pagination.page <= 1}
                  onClick={() => onChangePage(state.pagination.page - 1)}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="btn-secondary !py-1.5"
                  disabled={state.pagination.page >= state.pagination.totalPages}
                  onClick={() => onChangePage(state.pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="soft-panel">
          <p className="workspace-kicker">Selected record</p>
          {state.loading ? (
            <PanelSkeleton rows={4} className="!border-0 !bg-transparent !p-0 !shadow-none" />
          ) : selectedCustomer ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h3 className="text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
                  {selectedCustomer.customerId}
                </h3>
                <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-black font-black">
                  {selectedCustomer.source || "manual"}
                </span>
              </div>

              <p className="mt-2 text-sm font-bold leading-6 text-black italic">
                Review the record details below, update the telecom inputs if needed, and jump into scoring or retention follow-up from the same customer context.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="workspace-stat">
                  <p className="workspace-kicker">Tenure</p>
                  <p className="mt-2 text-sm text-black font-bold">{selectedCustomer.subscription?.tenureMonths ?? "-"} months</p>
                </div>
                <div className="workspace-stat">
                  <p className="workspace-kicker">Monthly charges</p>
                  <p className="mt-2 text-sm text-black font-bold">{selectedCustomer.billing?.monthlyCharges ?? "-"}</p>
                </div>
                <div className="workspace-stat">
                  <p className="workspace-kicker">Location</p>
                  <p className="mt-2 text-sm text-black font-bold">
                    {[selectedCustomer.profile?.city, selectedCustomer.profile?.state].filter(Boolean).join(", ") || "Not set"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/app/analyze?customerId=${encodeURIComponent(selectedCustomer.customerId)}`} className="btn-primary">
                  Analyze customer
                </Link>
                <Link to={`/app/at-risk?customerId=${encodeURIComponent(selectedCustomer.customerId)}`} className="btn-secondary">
                  Open in queue
                </Link>
                <Link to={`/app/actions?customerId=${encodeURIComponent(selectedCustomer.customerId)}`} className="btn-secondary">
                  Create follow-up
                </Link>
              </div>

              <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={onSaveCustomer}>
                <label>
                  <span className="field-label">Country</span>
                  <input
                    className="field-input"
                    value={editForm.country}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, country: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="field-label">State</span>
                  <input
                    className="field-input"
                    value={editForm.state}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, state: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="field-label">City</span>
                  <input
                    className="field-input"
                    value={editForm.city}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="field-label">Tenure Months</span>
                  <input
                    type="number"
                    min="0"
                    className="field-input"
                    value={editForm.tenureMonths}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, tenureMonths: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="field-label">Monthly Charges</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="field-input"
                    value={editForm.monthlyCharges}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, monthlyCharges: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="field-label">Contract</span>
                  <select
                    className="field-input"
                    value={editForm.contract}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, contract: event.target.value }))}
                  >
                    {contractOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Internet Service</span>
                  <select
                    className="field-input"
                    value={editForm.internetService}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, internetService: event.target.value }))}
                  >
                    {internetOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Tech Support</span>
                  <select
                    className="field-input"
                    value={editForm.techSupport}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, techSupport: event.target.value }))}
                  >
                    {techSupportOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="btn-primary" disabled={state.saving}>
                    {state.saving ? "Saving..." : "Save customer"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditForm(mapCustomerToEditForm(selectedCustomer))}
                  >
                    Reset edits
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50/30 p-5">
              <p className="text-sm font-bold leading-6 text-black italic">
                No customer is selected yet. Pick a record from the list on the left to inspect and update it.
              </p>
            </div>
          )}
        </div>
      </RevealSection>
    </section>
  );
}

export default CustomersPage;
