import { motion } from "framer-motion";

const terms = [
  { label: "Service scope", text: "RetainQ provides specialized tools for churn scoring, prioritization, and daily retention execution support." },
  { label: "User responsibility", text: "Teams must validate all suggested actions and ensure all business decisions follow internal governance and applicable laws." },
  { label: "Model disclaimer", text: "Model outputs are probabilistic and are designed to support, not replace, expert review and local business context." },
  { label: "Platform evolution", text: "Our APIs and features may evolve continuously to improve platform reliability, security, and overall operational performance." }
];

const TermsPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-3xl rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium sm:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker">Operating Agreement</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          Terms of Service
        </h1>
        <p className="mt-8 text-lg font-bold leading-8 text-black">
          By using RetainQ, you agree to use the platform responsibly and comply with all applicable privacy, data, and industry regulations.
        </p>

        <div className="mt-12 space-y-8">
          {terms.map((item, index) => (
            <motion.article
              key={item.label}
              className="group"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-blue-600">{item.label}</p>
              <p className="mt-3 text-[15px] font-bold leading-7 text-black">{item.text}</p>
              <div className="mt-6 h-px w-full bg-blue-100 group-last:hidden" />
            </motion.article>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-blue-50 p-8 border border-blue-100">
          <p className="text-sm font-bold text-black leading-7">
            Required further clarification on our usage terms? Please contact our legal operations team at <span className="text-blue-600 underline">legal@retainq.com</span>.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default TermsPage;
