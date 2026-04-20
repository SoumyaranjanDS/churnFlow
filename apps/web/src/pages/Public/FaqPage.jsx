import { motion } from "framer-motion";

const faqs = [
  {
    q: "Can we use RetainQ beyond telco datasets?",
    a: "Yes. While our starting templates are telco-optimized, the underlying architecture is designed to support any subscription-based or transactional business model with custom feature mapping.",
  },
  {
    q: "Is the AI service separated from administrative logic?",
    a: "Yes. Our FastAPI-based induction system handles LLM and predictive inference independently, while the Node.js core manages authentication, entity relationships, and operational governance.",
  },
  {
    q: "Can non-technical teams operate the platform?",
    a: "That is our primary goal. RetainQ's experience is built around clear operational steps: import, analyze, prioritize, and action—making advanced ML accessible to every success leader.",
  },
  {
    q: "How do we move to production environment safely?",
    a: "We provide environment-specific configurations, strict secrets management, health checks, and role-based access control (RBAC) to ensure your data stays protected at scale.",
  },
];

const FaqPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker">Knowledge Base</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          Frequently asked questions.
        </h1>
        <p className="mt-8 text-lg font-bold leading-8 text-black">
          Answers to the most common technical and operational questions teams have before rolling out RetainQ globally.
        </p>

        <div className="mt-12 space-y-4">
          {faqs.map((item, index) => (
            <motion.details 
              key={item.q} 
              className="group rounded-3xl border border-blue-200 bg-white p-6 shadow-sm transition-all hover:shadow-md open:shadow-premium"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold text-black">
                <span>{item.q}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-open:rotate-180">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="mt-6 border-t border-blue-50 pt-4">
                <p className="text-[15px] font-bold leading-7 text-black">{item.a}</p>
              </div>
            </motion.details>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm font-bold text-black">
            Still have questions? <button className="text-blue-600 underline underline-offset-4">Read our documentation</button> or <button className="text-blue-600 underline underline-offset-4">contact support</button>.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default FaqPage;
