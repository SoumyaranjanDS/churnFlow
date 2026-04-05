import RevealSection from "../../components/RevealSection";

const integrations = [
  { name: "CSV / Excel Imports", detail: "Simple file ingestion for teams without direct data pipelines." },
  { name: "Node API Endpoints", detail: "Programmatic customer ingest, scoring, and action operations." },
  { name: "FastAPI Inference Service", detail: "Dedicated ML prediction service with model metadata endpoint." },
  { name: "MongoDB Storage", detail: "Reliable persistence for users, predictions, actions, and outcomes." },
];

const IntegrationsPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-8">
      <RevealSection>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Integrations</p>
        <h1 className="mt-3 text-4xl font-medium text-slate-900 sm:text-5xl">Connect to your current stack.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          Start manual and gradually automate. The architecture supports both lightweight and production-grade integration paths.
        </p>
      </RevealSection>

      <RevealSection className="mt-10 grid gap-4 md:grid-cols-2">
        {integrations.map((item) => (
          <article key={item.name} className="soft-panel">
            <h2 className="text-xl font-medium text-slate-900">{item.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </article>
        ))}
      </RevealSection>
    </div>
  );
}

export default IntegrationsPage;
