import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [state, setState] = useState({ loading: false, error: "", notice: "" });

  const onSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", notice: "" });

    try {
      const response = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      });

      if (response?.data?.verificationRequired) {
        const notice = "Account created. Verify your email before signing in.";
        navigate("/login", {
          replace: true,
          state: { notice, email: form.email.trim() }
        });
        return;
      }

      navigate("/app/dashboard", { replace: true });
    } catch (error) {
      setState({ loading: false, error: error.message, notice: "" });
      return;
    }

    setState({ loading: false, error: "", notice: "" });
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <form
        className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-white/20 bg-white/95 p-6 shadow-soft"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-600">Get access to churn monitoring and actions.</p>
        </div>

        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-400 transition focus:ring-2"
            required
          />
        </label>

        <button
          type="submit"
          disabled={state.loading}
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.loading ? "Creating account..." : "Create account"}
        </button>

        {state.notice && <p className="text-sm font-medium text-emerald-700">{state.notice}</p>}
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
