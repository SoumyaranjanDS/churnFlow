import { motion } from "framer-motion";
import { Link, useLocation, Navigate } from "react-router-dom";
import { getPlanById } from "../../content/pricing";
import { useAuth } from "../../context/AuthContext";

const CheckoutPage = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams(location.search);
  const billing = params.get("billing") === "yearly" ? "yearly" : "monthly";
  const planId = params.get("plan") || "growth";
  const plan = getPlanById(planId);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const displayPrice = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const cadence = billing === "yearly" ? "/year" : "/month";

  return (
    <div className="relative min-h-screen bg-blue-50 px-6 pb-32 pt-32 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Plan Summary */}
        <motion.section
          className="rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium sm:p-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <p className="workspace-kicker">Review Selection</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
            Selected Plan.
          </h1>
          <p className="mt-6 text-[15px] font-bold leading-7 text-black">
            Review your chosen operating model for RetainQ. You can scale or adjust your seat count after joining.
          </p>

          <div className="mt-10 rounded-[2rem] border border-blue-100 bg-blue-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">{plan.detail}</p>
                <h2 className="mt-2 text-3xl font-bold text-black">
                  {plan.name}
                </h2>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                {billing}
              </span>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <p className="text-6xl font-extrabold tracking-tight text-black">{displayPrice}</p>
              <span className="pb-2 text-lg font-bold text-blue-600">{cadence}</span>
            </div>

            {billing === "yearly" && (
              <p className="mt-4 text-sm font-bold text-blue-800">Effective monthly: {plan.yearlyMonthlyEquivalent}</p>
            )}

            <ul className="mt-10 space-y-4">
              {plan.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm font-bold leading-6 text-black">
                  <svg className="mt-1 h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Next Steps */}
        <motion.section
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium transition-all hover:shadow-xl">
              <p className="workspace-kicker">Account Setup</p>
              <h3 className="mt-4 text-2xl font-extrabold text-black">
                Continue to setup
              </h3>
              <p className="mt-4 text-[13px] font-bold leading-6 text-black">
                Create your team account and keep this plan selection attached to your onboarding flow.
              </p>
              <Link
                to={`/?auth=signup&plan=${plan.id}&billing=${billing}`}
                className="btn-primary mt-8 w-full py-4 text-sm font-bold shadow-blue-200"
              >
                Continue Setup
              </Link>
            </div>

            <div className="rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium transition-all hover:shadow-xl">
              <p className="workspace-kicker">Need Guidance?</p>
              <h3 className="mt-4 text-2xl font-extrabold text-black">
                Talk to Sales
              </h3>
              <p className="mt-4 text-[13px] font-bold leading-6 text-black">
                Best if you need a custom enterprise rollout model or high-volume engagement path.
              </p>
              <Link
                to="/#contact"
                className="btn-secondary mt-8 w-full py-4 text-sm font-bold"
              >
                Contact Team
              </Link>
            </div>
          </div>

          <div className="mt-auto grid gap-4 rounded-[2.5rem] bg-white border border-blue-200 p-8 text-black shadow-premium sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">Selection</p>
              <p className="text-xl font-bold">{plan.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">Billing</p>
              <p className="text-xl font-bold capitalize">{billing}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">Onboarding</p>
              <p className="text-xl font-bold">Immediate</p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default CheckoutPage;
