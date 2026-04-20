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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-blue-50 px-4 pt-20 pb-20">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl opacity-50" />
      <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl opacity-50" />

      <form
        className="relative z-10 w-full max-w-md space-y-6 rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium sm:p-10"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-black">Create account</h2>
          <p className="mt-2 text-sm font-bold text-black italic">Get access to premium churn monitoring.</p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Full Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Jane Cooper"
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/30 px-4 py-3 outline-none ring-blue-400/20 transition focus:ring-4"
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm font-bold text-black">
            <span>Work Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="jane@company.com"
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
              placeholder="Min. 8 characters"
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
          {state.loading ? "Creating account..." : "Start Free Trial"}
        </button>

        {state.notice && (
          <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-black border border-emerald-200">
            {state.notice}
          </p>
        )}
        {state.error && (
          <p className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-black border border-red-200">
            {state.error}
          </p>
        )}

        <p className="text-center text-sm font-bold text-black pt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 underline underline-offset-4 font-black hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
