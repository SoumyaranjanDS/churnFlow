import RevealSection from "../../components/RevealSection";

const pillars = [
  "Operational clarity over complexity",
  "Model-backed decisions with human control",
  "Production-minded engineering from day one",
];

const AboutPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-8">
      <RevealSection>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">About</p>
        <h1 className="mt-3 text-4xl font-medium text-slate-900 sm:text-5xl">Designed for practical retention work.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          ChurnFlow combines a clean MERN application surface with a dedicated ML inference service so your teams can move quickly without compromising system design.
        </p>
      </RevealSection>

      <RevealSection className="mt-10 soft-panel">
        <h2 className="text-2xl font-medium text-slate-900">What we optimize for</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {pillars.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8ea196]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </RevealSection>
    </div>
  );
}

export default AboutPage;
