import RevealSection from "../../components/RevealSection";

const faqs = [
  {
    q: "Can we use this beyond telecom data?",
    a: "Yes. Telco data is the starting point, but the architecture supports other churn-sensitive domains with mapped features.",
  },
  {
    q: "Is the model service separated from backend logic?",
    a: "Yes. FastAPI handles inference and Node handles auth, entities, workflow orchestration, and API governance.",
  },
  {
    q: "Can non-technical users operate this tool?",
    a: "That is the core goal. The product flow is built around upload, analyze, prioritize, and action steps.",
  },
  {
    q: "How do we move to production safely?",
    a: "Use environment-specific configs, strict secrets handling, service health checks, and role-based access controls.",
  },
];

const FaqPage = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-14 sm:px-8">
      <RevealSection>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">FAQ</p>
        <h1 className="mt-3 text-4xl font-medium text-slate-900 sm:text-5xl">Questions teams ask before rollout.</h1>
      </RevealSection>

      <RevealSection className="mt-8 space-y-3">
        {faqs.map((item) => (
          <details key={item.q} className="soft-panel p-5 open:bg-[#f8f3ec]">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-900">{item.q}</summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
          </details>
        ))}
      </RevealSection>
    </div>
  );
}

export default FaqPage;
