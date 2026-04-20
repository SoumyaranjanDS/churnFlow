import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const plans = [
  { name: "Starter", price: "$39", cadence: "/mo", detail: "Small teams", points: ["10k customers/mo", "Single workspace", "Email support"] },
  { name: "Growth", price: "$129", cadence: "/mo", detail: "Scaling retention teams", points: ["100k customers/mo", "Batch scoring API", "Role-based access"], featured: true },
  { name: "Scale", price: "Custom", cadence: "", detail: "Enterprise deployment", points: ["Unlimited volume", "Custom infra", "Priority SLA"] }
];

const PricingPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker text-center">Pricing</p>
        <h1 className="mt-4 text-center text-5xl font-extrabold tracking-tight text-black sm:text-7xl">
          Plans for every <span className="text-blue-600 italic font-accent font-normal">stage</span>.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xl font-bold leading-8 text-black">
          Start with lightweight scoring and scale to full enterprise orchestration as your retention operations mature.
        </p>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article 
              key={plan.name} 
              className={[
                "relative rounded-[2.5rem] border p-8 shadow-premium transition-all hover:-translate-y-2",
                plan.featured ? "border-blue-300 bg-white shadow-xl scale-105 z-10" : "border-blue-200 bg-white"
              ].join(" ")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.featured && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Most Popular
                </span>
              )}
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900">{plan.detail}</p>
              <h2 className="mt-3 text-3xl font-extrabold text-black">{plan.name}</h2>
              <div className="mt-6 border-t border-blue-100 pt-4">
                <p className="text-[15px] font-bold leading-7 text-black">{plan.price}</p>
                <p className="text-sm font-bold text-blue-600">{plan.cadence}</p>
              </div>
              
              <ul className="mt-10 space-y-4">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-[13px] font-bold text-black">
                    <svg className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link
                  to="/signup"
                  className={[
                    "flex w-full items-center justify-center rounded-full py-4 text-xs font-extrabold uppercase tracking-widest transition-all",
                    plan.featured 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700" 
                      : "border border-blue-200 bg-white text-black hover:bg-blue-50"
                  ].join(" ")}
                >
                  Choose {plan.name}
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default PricingPage;
