import { useState } from "react";
import { motion } from "framer-motion";
import { submitContactMessage } from "../../services/churnApi";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [state, setState] = useState({ loading: false, error: "", success: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", success: "" });
    try {
      const response = await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        message: form.message.trim()
      });
      setForm({ name: "", email: "", company: "", message: "" });
      setState({ loading: false, error: "", success: response?.message || "Message sent successfully." });
    } catch (error) {
      setState({ loading: false, error: error.message, success: "" });
    }
  }

  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <div className="pt-8">
          <p className="workspace-kicker">Get in Touch</p>
          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
            Talk with our team.
          </h1>
          <p className="mt-8 text-lg font-bold leading-8 text-black">
            Share your retention goals, current stack, and expected customer volume. We will help you build a high-performance rollout plan for RetainQ.
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-blue-200 shadow-sm text-blue-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.81 12.81 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <p className="text-base font-bold text-black">+1 (555) RETAIN-Q</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-blue-200 shadow-sm text-blue-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <p className="text-base font-bold text-black">hello@retainq.com</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium sm:p-10">
          <div className="grid gap-6 sm:grid-cols-2">
            <label>
              <span className="field-label">Full Name</span>
              <input
                className="field-input"
                placeholder="John Doe"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span className="field-label">Work Email</span>
              <input
                type="email"
                className="field-input"
                placeholder="john@company.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="mt-6 block">
            <span className="field-label">Company Name</span>
            <input
              className="field-input"
              placeholder="Acme Corp"
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
            />
          </label>

          <label className="mt-6 block">
            <span className="field-label">Your Goals</span>
            <textarea
              rows={5}
              className="field-input resize-none"
              placeholder="Tell us about your retention targets..."
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              required
            />
          </label>

          <button type="submit" disabled={state.loading} className="btn-primary mt-8 w-full py-4 text-sm font-bold shadow-blue-200">
            {state.loading ? "Sending..." : "Send Message"}
          </button>

          {state.success && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-700 border border-emerald-100"
            >
              {state.success}
            </motion.p>
          )}
          {state.error && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-700 border border-red-100"
            >
              {state.error}
            </motion.p>
          )}
        </form>
      </motion.section>
    </div>
  );
}

export default ContactPage;
