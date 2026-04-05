import { motion } from "framer-motion";

const sections = [
  { label: "Data processed", text: "Account metadata, uploaded customer records for scoring, and operational usage logs." },
  { label: "Purpose", text: "Service delivery, security hardening, troubleshooting, and product performance improvements." },
  { label: "Retention", text: "Data is retained only for agreed operational windows, compliance, and legal obligations." },
  { label: "Security", text: "Role-based access, scoped credentials, and protected network boundaries are enforced in production." }
];

const PrivacyPage = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_10%_0%,rgba(99,102,241,0.16),transparent_65%)]" />

      <motion.section
        className="relative mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Privacy Policy</p>
        <h1
          className="mt-3 text-4xl text-[#fafafa] sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
        >
          How we handle data.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
          We process only the information required to authenticate users, run churn workflows, and keep the platform reliable.
        </p>

        <div className="mt-8 grid gap-3">
          {sections.map((item, index) => (
            <motion.article
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: index * 0.05 }}
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/30">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/50">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default PrivacyPage;
