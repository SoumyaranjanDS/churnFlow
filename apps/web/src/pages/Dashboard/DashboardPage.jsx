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
    return <p className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-black italic">Loading dashboard...</p>;
  }

  if (state.error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{state.error}</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-black">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="workspace-kicker">API Status</p>
          <p className="mt-2 text-2xl font-bold text-black">{state.metrics.health}</p>
          <p className="mt-1 text-xs font-bold text-blue-600 italic">Environment: {state.metrics.env}</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="workspace-kicker">Customers</p>
          <p className="mt-2 text-3xl font-black text-black">{state.metrics.customerTotal}</p>
          <p className="mt-1 text-xs font-bold text-blue-600 italic">Records available for scoring</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="workspace-kicker">Retention Actions</p>
          <p className="mt-2 text-3xl font-black text-black">{state.metrics.actionTotal}</p>
          <p className="mt-1 text-xs font-bold text-blue-600 italic">Open + historical interventions</p>
        </div>

        {user?.role === "admin" && (
          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <p className="workspace-kicker">Users</p>
            <p className="mt-2 text-3xl font-black text-black">{state.metrics.userTotal}</p>
            <p className="mt-1 text-xs font-bold text-blue-600 italic">Authorized platform users</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;
