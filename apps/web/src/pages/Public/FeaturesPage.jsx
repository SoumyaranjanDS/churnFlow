import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Risk Scoring Pipeline",
    detail: "Score churn probability in realtime or batch with model version tracking and threshold controls."
  },
  {
    title: "At-Risk Prioritization",
    detail: "Filter high-risk accounts instantly and focus your retention team on the next best actions."
  },
  {
    title: "Action Workflow",
    detail: "Create, assign, and track interventions from a single operations-friendly control surface."
  },
  {
    title: "Outcome Feedback Loop",
    detail: "Record final outcomes and continuously improve retention playbooks with measurable feedback."
  }
];

const FeaturesPage = () => {
  return (
    <div className="relative overflow-hidden bg-blue-50 px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_48%_at_20%_0%,rgba(37,99,235,0.05),transparent_65%)]" />

      <motion.section
        className="relative mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-blue-600 font-bold">Platform Features</p>
        <h1
          className="mt-3 max-w-3xl text-4xl text-black sm:text-5xl font-extrabold"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          Built for retention teams that run on speed and clarity.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-black font-bold">
          Every module is designed to move from model output to real customer intervention with less friction.
        </p>
      </motion.section>

      <section className="relative mx-auto mt-8 grid max-w-6xl gap-3 md:grid-cols-2">
        {features.map((item, index) => (
          <motion.article
            key={item.title}
            className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <h2 className="text-2xl text-black font-extrabold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {item.title}
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-black italic">{item.detail}</p>
          </motion.article>
        ))}
      </section>

      <motion.div
        className="relative mx-auto mt-10 flex max-w-6xl justify-start"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/signup"
          className="inline-flex items-center rounded-full bg-[#fafafa] px-5 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7]"
        >
          Start Free
        </Link>
      </motion.div>
    </div>
  );
}

export default FeaturesPage;
