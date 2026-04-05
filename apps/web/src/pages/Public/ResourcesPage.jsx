import { motion } from "framer-motion";

const resources = [
  { title: "Churn Readiness Checklist", type: "Guide", detail: "What to prepare before your first production scoring cycle." },
  { title: "Retention Playbook Templates", type: "Template", detail: "Starter action frameworks for high, medium, and low risk customers." },
  { title: "Model Review Cadence", type: "Operational Note", detail: "A practical weekly routine for threshold and outcome monitoring." }
];

const ResourcesPage = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_20%_0%,rgba(99,102,241,0.12),transparent_65%)]" />

      <motion.section
        className="relative mx-auto max-w-5xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Resources</p>
        <h1
          className="mt-3 max-w-2xl text-4xl text-[#fafafa] sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
        >
          Reference material for your team.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
          Use these resources to onboard quickly and keep your retention process consistent.
        </p>
      </motion.section>

      <section className="relative mx-auto mt-8 grid max-w-5xl gap-3">
        {resources.map((item, index) => (
          <motion.article
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">{item.type}</p>
            <h2 className="mt-2 text-2xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/45">{item.detail}</p>
          </motion.article>
        ))}
      </section>
    </div>
  );
}

export default ResourcesPage;
