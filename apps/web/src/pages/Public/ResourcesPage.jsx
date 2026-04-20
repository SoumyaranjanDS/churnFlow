import { motion } from "framer-motion";

const resources = [
  { title: "Churn Readiness Checklist", type: "Guide", detail: "What to prepare before your first production scoring cycle." },
  { title: "Retention Playbook Templates", type: "Template", detail: "Starter action frameworks for high, medium, and low risk customers." },
  { title: "Model Review Cadence", type: "Operational Note", detail: "A practical weekly routine for threshold and outcome monitoring." }
];

const ResourcesPage = () => {
  return (
    <div className="relative overflow-hidden bg-blue-50 px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_20%_0%,rgba(37,99,235,0.05),transparent_65%)]" />

      <motion.section
        className="relative mx-auto max-w-5xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-blue-600 font-bold">Resources</p>
        <h1
          className="mt-3 max-w-2xl text-4xl text-black sm:text-5xl font-extrabold"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          Reference material for your team.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-black font-bold">
          Use these resources to onboard quickly and keep your retention process consistent.
        </p>
      </motion.section>

      <section className="relative mx-auto mt-8 grid max-w-5xl gap-3">
        {resources.map((item, index) => (
          <motion.article
            key={item.title}
            className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-blue-600 font-bold">{item.type}</p>
            <h2 className="mt-2 text-2xl text-black font-extrabold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {item.title}
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-black italic">{item.detail}</p>
          </motion.article>
        ))}
      </section>
    </div>
  );
}

export default ResourcesPage;
