import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [state, setState] = useState({ loading: false, error: "" });
  const notice = location.state?.notice || "";

  const onSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "" });

    try {
      await login({
        email: form.email.trim(),
        password: form.password
      });
      const redirectTo = location.state?.from || "/app/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setState({ loading: false, error: error.message });
      return;
    }

    setState({ loading: false, error: "" });
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-blue-50 px-4 pt-20 pb-20">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl opacity-50" />
      <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl opacity-50" />

      <form
        className="relative z-10 w-full max-w-md space-y-6 rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium sm:p-10"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-black">Welcome back</h2>
          <p className="mt-2 text-sm font-bold text-black italic">Sign in to access churn operations.</p>
          {notice && (
            <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-xs font-bold text-black border border-blue-200">
              {notice}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Work Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/30 px-4 py-3 outline-none ring-blue-400/20 transition focus:ring-4"
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/30 px-4 py-3 outline-none ring-blue-400/20 transition focus:ring-4"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={state.loading}
          className="btn-primary w-full py-4 text-sm font-bold shadow-blue-200"
        >
          {state.loading ? "Signing in..." : "Continue to Dashboard"}
        </button>

        {state.error && (
          <p className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-black border border-red-200">
            {state.error}
          </p>
        )}

        <p className="text-center text-sm font-bold text-black pt-2">
          New here?{" "}
          <Link to="/signup" className="text-blue-600 underline underline-offset-4 font-black hover:text-blue-800">
            Create account
          </Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
