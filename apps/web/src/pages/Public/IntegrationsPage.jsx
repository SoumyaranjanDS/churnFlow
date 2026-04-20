import { motion } from "framer-motion";

const integrations = [
  { name: "CSV / Excel Imports", detail: "Fast, reliable file ingestion for teams without direct engineering data pipelines." },
  { name: "Native REST APIs", detail: "Programmatic hooks for customer ingest, advanced scoring, and action orchestration." },
  { name: "Inference Engine", detail: "Dedicated FastAPI service layer for model lifecycle and prediction metadata." },
  { name: "Entity Synchronization", detail: "High-performance persistence layer for users, predictions, and operational logging." },
];

const IntegrationsPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker">Connectivity</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          Connect to your stack.
        </h1>
        <p className="mt-8 text-xl font-bold leading-8 text-black max-w-3xl">
          Start lightweight and scale to full automation. RetainQ's architecture is built to support both manual operations and enterprise-scale data flows.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {integrations.map((item, index) => (
            <motion.article 
              key={item.name} 
              className="rounded-[2.5rem] border border-blue-200 bg-white p-10 shadow-premium transition-all hover:bg-blue-50/50"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-sm mb-8">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-black">{item.name}</h2>
              <p className="mt-4 text-[15px] font-bold leading-7 text-black italic">{item.detail}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default IntegrationsPage;
