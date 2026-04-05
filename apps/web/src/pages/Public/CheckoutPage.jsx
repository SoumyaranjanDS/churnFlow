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
    <div className="relative overflow-hidden px-6 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(192,132,252,0.2),transparent_60%)]" />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <motion.section
          className="overflow-hidden rounded-[2.4rem] border border-white/10 px-6 py-8"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, rgba(192,132,252,0.18), transparent 30%), linear-gradient(180deg, rgba(17,18,28,0.98), rgba(11,12,18,0.98))"
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Checkout</p>
          <h1
            className="mt-4 text-4xl text-white sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            Finish setting up your plan.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/52">
            Review your selected plan, then continue to account setup. Billing is now connected to a plan-aware checkout flow, so the chosen plan and cadence stay attached.
          </p>

          <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">{plan.detail}</p>
                <h2
                  className="mt-2 text-3xl text-white"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
                >
                  {plan.name}
                </h2>
              </div>
              <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-white/70">
                {billing}
              </span>
            </div>

            <div className="mt-5 flex items-end gap-2">
              <p className="text-5xl text-white">{displayPrice}</p>
              <span className="pb-2 text-sm text-white/42">{cadence}</span>
            </div>

            {billing === "yearly" && (
              <p className="mt-2 text-sm text-fuchsia-200/75">Effective monthly equivalent: {plan.yearlyMonthlyEquivalent}</p>
            )}

            <ul className="mt-6 space-y-3">
              {plan.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-white/58">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-300/80" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <motion.section
          className="rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.08, ease: "easeOut" }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/32">Next step</p>
              <h3 className="mt-3 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Continue to account setup
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/48">
                Create your account and keep this plan selection attached to your onboarding flow.
              </p>
              <Link
                to={`/?auth=signup&plan=${plan.id}&billing=${billing}`}
                className="mt-5 inline-flex rounded-full bg-[#fafafa] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#09090b] transition hover:bg-[#ebe7ff]"
              >
                Continue
              </Link>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/32">Need guidance?</p>
              <h3 className="mt-3 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Talk to sales
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/48">
                Best if you want help choosing the right rollout model or need a custom engagement path.
              </p>
              <Link
                to="/#contact"
                className="mt-5 inline-flex rounded-full border border-white/14 px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] text-white/78 transition hover:bg-white/[0.06] hover:text-white"
              >
                Contact team
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="workspace-stat">
              <p className="workspace-kicker">Plan attached</p>
              <p className="mt-2 text-xl text-white">{plan.name}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Billing cycle</p>
              <p className="mt-2 text-xl capitalize text-white">{billing}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Onboarding</p>
              <p className="mt-2 text-xl text-white">Immediate</p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default CheckoutPage;
