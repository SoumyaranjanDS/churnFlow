import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const plans = [
  { name: "Starter", price: "$39", detail: "Small teams", points: ["10k customers/mo", "Single workspace", "Email support"] },
  { name: "Growth", price: "$129", detail: "Scaling retention teams", points: ["100k customers/mo", "Batch scoring API", "Role-based access"], featured: true },
  { name: "Scale", price: "Custom", detail: "Enterprise deployment", points: ["Unlimited volume", "Custom infra", "Priority SLA"] }
];

const PricingPage = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_85%_0%,rgba(99,102,241,0.16),transparent_65%)]" />

      <motion.section
        className="relative mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Pricing</p>
        <h1 className="mt-3 text-4xl text-[#fafafa] sm:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
          Plans for every retention stage.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
          Start with lightweight scoring and scale to full enterprise orchestration when needed.
        </p>
      </motion.section>

      <section className="relative mx-auto mt-8 grid max-w-6xl gap-3 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.article
            key={plan.name}
            className={[
              "rounded-2xl border p-5",
              plan.featured ? "border-indigo-400/35 bg-indigo-500/10" : "border-white/10 bg-white/[0.03]"
            ].join(" ")}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">{plan.detail}</p>
            <h2 className="mt-2 text-3xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              {plan.name}
            </h2>
            <p className="mt-2 text-2xl text-white">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/45">
              {plan.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/[0.05] hover:text-white"
            >
              Choose Plan
            </Link>
          </motion.article>
        ))}
      </section>
    </div>
  );
}

export default PricingPage;
