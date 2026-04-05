import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getHealth, listActions, listCustomers, listUsers } from "../../services/churnApi";

const DashboardPage = () => {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", metrics: null });

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const calls = [getHealth(), listCustomers({ page: 1, limit: 1 }), listActions({ page: 1, limit: 1 })];

        if (user?.role === "admin") {
          calls.push(listUsers());
        }

        const responses = await Promise.all(calls);
        if (!mounted) return;

        const [healthRes, customersRes, actionsRes, usersRes] = responses;

        const customerTotal = customersRes?.data?.pagination?.total || 0;
        const actionTotal = actionsRes?.data?.pagination?.total || 0;
        const userTotal = user?.role === "admin" ? usersRes?.data?.length || 0 : null;

        setState({
          loading: false,
          error: "",
          metrics: {
            health: healthRes?.message || "API healthy",
            customerTotal,
            actionTotal,
            userTotal,
            env: healthRes?.data?.env || "unknown"
          }
        });
      } catch (error) {
        if (!mounted) return;
        setState({ loading: false, error: error.message, metrics: null });
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  if (state.loading) {
    return <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading dashboard...</p>;
  }

  if (state.error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{state.error}</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">API Status</h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">{state.metrics.health}</p>
          <p className="mt-1 text-sm text-slate-600">Environment: {state.metrics.env}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customers</h3>
          <p className="mt-2 text-3xl font-bold text-brand-700">{state.metrics.customerTotal}</p>
          <p className="mt-1 text-sm text-slate-600">Records available for scoring</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Retention Actions</h3>
          <p className="mt-2 text-3xl font-bold text-brand-700">{state.metrics.actionTotal}</p>
          <p className="mt-1 text-sm text-slate-600">Open + historical interventions</p>
        </div>

        {user?.role === "admin" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Users</h3>
            <p className="mt-2 text-3xl font-bold text-brand-700">{state.metrics.userTotal}</p>
            <p className="mt-1 text-sm text-slate-600">Authorized platform users</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;
