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
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_20%_0%,rgba(99,102,241,0.14),transparent_65%)]" />

      <motion.section
        className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Contact</p>
          <h1 className="mt-3 text-4xl text-[#fafafa] sm:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Talk with our team.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/45">
            Share your retention goals, current stack, and expected customer volume. We will help with rollout planning.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Name</span>
              <input
                className="field-input"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span className="field-label">Email</span>
              <input
                type="email"
                className="field-input"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="field-label">Company</span>
            <input
              className="field-input"
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
            />
          </label>

          <label className="mt-3 block">
            <span className="field-label">Message</span>
            <textarea
              rows={5}
              className="field-input resize-none"
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              required
            />
          </label>

          <button type="submit" disabled={state.loading} className="mt-4 inline-flex rounded-full bg-[#fafafa] px-5 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7] disabled:opacity-60">
            {state.loading ? "Sending..." : "Send Message"}
          </button>

          {state.success && <p className="mt-3 text-xs text-emerald-300">{state.success}</p>}
          {state.error && <p className="mt-3 text-xs text-red-300">{state.error}</p>}
        </form>
      </motion.section>
    </div>
  );
}

export default ContactPage;
