import RevealSection from "../../components/RevealSection";

const cases = [
  { company: "Telecom Segment A", lift: "+9.4%", summary: "Prioritized high-risk month-to-month contracts and improved outreach speed." },
  { company: "SaaS Segment B", lift: "+7.1%", summary: "Linked churn risk to onboarding completion and reduced early cancellations." },
  { company: "B2B Segment C", lift: "+11.8%", summary: "Mapped account health + action logging to prevent renewal drop-off." },
];

const CaseStudiesPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-8">
      <RevealSection>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Case Studies</p>
        <h1 className="mt-3 text-4xl font-medium text-slate-900 sm:text-5xl">Retention outcomes in practice.</h1>
      </RevealSection>

      <RevealSection className="mt-10 grid gap-4 md:grid-cols-3">
        {cases.map((item) => (
          <article key={item.company} className="soft-panel">
            <p className="text-xs text-slate-500">{item.company}</p>
            <p className="mt-2 text-3xl font-medium text-[#557065]">{item.lift}</p>
            <p className="mt-3 text-sm text-slate-600">{item.summary}</p>
          </article>
        ))}
      </RevealSection>
    </div>
  );
}

export default CaseStudiesPage;
