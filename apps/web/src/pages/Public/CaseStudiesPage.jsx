import { motion } from "framer-motion";

const cases = [
  { company: "Enterprise Telco X", lift: "+9.4%", summary: "Prioritized high-risk month-to-month contracts and reduced cycle time for proactive outreach." },
  { company: "Growth SaaS Platform", lift: "+7.1%", summary: "Linked churn risk directly to onboarding plateaus and reduced early stage cancellations." },
  { company: "B2B Logistics Global", lift: "+11.8%", summary: "Mapped overall account health to renewal workflows to prevent high-value drop-off." },
];

const CaseStudiesPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker">Success Stories</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          Retention outcomes <span className="text-blue-600 italic font-accent font-normal underline underline-offset-8 decoration-blue-100/50">proven</span> in practice.
        </h1>
        <p className="mt-8 text-xl font-bold leading-8 text-black max-w-3xl">
          See how leading customer success teams are using RetainQ to move from reactive defense to proactive operating excellence.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cases.map((item, index) => (
            <motion.article 
              key={item.company} 
              className="group rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-none transition-all hover:-translate-y-2 hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{item.company}</p>
              <p className="mt-4 text-4xl font-black text-black">{item.lift}</p>
              <div className="mt-6 border-t border-blue-200 pt-5">
                <p className="text-[15px] font-bold leading-7 text-black italic">{item.summary}</p>
              </div>
              <button className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 group-hover:text-black">
                Read full case <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default CaseStudiesPage;
