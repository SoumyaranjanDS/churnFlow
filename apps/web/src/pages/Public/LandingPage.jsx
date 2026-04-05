import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { pricingPlans } from "../../content/pricing";
import { useAuth } from "../../context/AuthContext";
import { submitContactMessage } from "../../services/churnApi";

const heroChips = ["99.9% precision", "0.5s scoring", "Action-ready workflow"];

const heroMetrics = [
  {
    label: "Churn Risk Score",
    value: "94.2",
    delta: "3.1% this week",
    trend: "down",
    bars: [40, 55, 45, 70, 90, 65, 100]
  },
  {
    label: "At-Risk Accounts",
    value: "128",
    delta: "12 resolved today",
    trend: "up",
    bars: [100, 80, 75, 60, 85, 90, 70]
  },
  {
    label: "Retention Rate",
    value: "97.8%",
    delta: "+2.1% vs last mo.",
    trend: "up",
    bars: [60, 65, 75, 70, 85, 95, 100]
  }
];

const featureSteps = [
  {
    index: "01",
    title: "Score every account",
    detail: "Run realtime or batch churn predictions with threshold control and model traceability."
  },
  {
    index: "02",
    title: "Surface the right queue",
    detail: "Prioritize high-risk customers instantly instead of digging through static spreadsheets."
  },
  {
    index: "03",
    title: "Launch retention action",
    detail: "Convert model output into calls, offers, escalations, and measurable owner-based workflows."
  }
];

const featureSignals = [
  {
    title: "Control Tower",
    text: "One operating surface for model scores, risk bands, owners, and daily action tracking."
  },
  {
    title: "Fast Ops Loop",
    text: "Upload, analyze, act, and record outcomes without bouncing between tools or teams."
  },
  {
    title: "Enterprise Ready",
    text: "Built to support high-volume scoring, team ownership, and measurable retention execution without adding operational chaos."
  }
];

const whyUsReasons = [
  {
    title: "Built for operators, not just analysts",
    stat: "10x faster",
    detail: "The product is structured around the daily decisions success and ops teams actually need to make."
  },
  {
    title: "Model output becomes action immediately",
    stat: "1 workflow",
    detail: "Prediction, prioritization, ownership, and outcomes stay in one connected system instead of scattered tools."
  },
  {
    title: "Production thinking from day one",
    stat: "Day 1 ready",
    detail: "You are not demoing a notebook. You are building a platform with clear workflows, permissions, persistence, and service boundaries."
  }
];

const testimonials = [
  {
    quote:
      "We moved from weekly spreadsheet review to daily retention action. The team finally knew who to call first.",
    name: "Maya Chen",
    role: "VP Customer Success",
    company: "Northstar Subscriptions"
  },
  {
    quote: "The risk queue became our morning operating ritual in less than a week.",
    name: "Jordan Price",
    role: "Revenue Operations Lead",
    company: "Avenloop"
  },
  {
    quote: "What changed was not only the score. It was the speed of execution after the score.",
    name: "Sofia Martin",
    role: "Retention Manager",
    company: "Waveform Cloud"
  }
];

const faqItems = [
  {
    question: "Is this only for telecom churn use cases?",
    answer: "No. The current model baseline starts with telecom churn patterns, but the platform structure works for any recurring-revenue business."
  },
  {
    question: "Can non-technical teams actually use it every day?",
    answer: "Yes. The workflow is designed for operations and customer success teams to upload data, review the queue, and launch actions quickly."
  },
  {
    question: "Can we fit this into our current workflow?",
    answer: "Yes. The product is designed to plug into an existing business workflow so you can keep scoring, decisions, and actions in one usable operating loop."
  },
  {
    question: "What happens after predictions are generated?",
    answer: "High-risk customers flow into the action queue, owners can create interventions, and final outcomes can be recorded back into the system."
  },
  {
    question: "Can we retrain the model with our own business data later?",
    answer: "Yes. The current setup is modular, so feature engineering, training, evaluation, and deployment can be adapted to your own dataset and retention signals."
  },
  {
    question: "Is this ready for a production-style portfolio project?",
    answer: "Yes. The product already covers scoring, ownership, outcomes, and a usable interface, so it can be presented and tested like a real retention platform."
  },
  {
    question: "Can leadership teams see value without learning model details?",
    answer: "Yes. The experience is built to translate model output into simple risk views, revenue impact, and next-step action plans that non-technical stakeholders can read quickly."
  },
  {
    question: "Do pricing plans support growing customer volume over time?",
    answer: "Yes. You can start with a smaller operating setup, then move into batch automation, expanded workspaces, and more custom deployment options as your retention program grows."
  }
];

const resourceNotes = [
  {
    title: "Churn Readiness Checklist",
    type: "Guide",
    detail: "Everything your team should validate before the first production scoring cycle.",
    tilt: "rotate-[-1.5deg]"
  },
  {
    title: "Retention Playbook Templates",
    type: "Template",
    detail: "Ready-to-use intervention patterns for high, medium, and low risk segments.",
    tilt: "rotate-[1.2deg]"
  },
  {
    title: "Model Review Rhythm",
    type: "Ops Note",
    detail: "A lightweight weekly review routine for thresholds, outcomes, and decision quality.",
    tilt: "rotate-[-0.8deg]"
  }
];

const pricingSignals = [
  { label: "Setup time", value: "2 weeks" },
  { label: "Decision speed", value: "10x faster" },
  { label: "Launch support", value: "Hands-on" }
];

const contactTiles = [
  {
    title: "Launch readiness",
    detail: "Implementation support for data mapping, role setup, and first scoring run."
  },
  {
    title: "Best interventions",
    detail: "Turn risk bands into concrete offers, outreach playbooks, and owner workflows."
  },
  {
    title: "Live scoring",
    detail: "Push fresh customer inputs into a live scoring flow and route the output into your action queue."
  },
  {
    title: "Executive proof",
    detail: "Show retention impact through cleaner score review, outcomes, and recovery stories."
  }
];

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } }
};

const ArrowUpIcon = () => {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 8V2M2 5l3-3 3 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ArrowDownIcon = () => {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 2v6M2 5l3 3 3-3" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ArrowRightIcon = () => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactState, setContactState] = useState({ loading: false, error: "", success: "" });

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactState({ loading: true, error: "", success: "" });

    try {
      const response = await submitContactMessage({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        company: contactForm.company.trim(),
        message: contactForm.message.trim()
      });

      setContactForm({ name: "", email: "", company: "", message: "" });
      setContactState({
        loading: false,
        error: "",
        success: response?.message || "Message sent successfully."
      });
    } catch (error) {
      setContactState({ loading: false, error: error.message, success: "" });
    }
  }

  const getPlanHref = (plan) => {
    if (isAuthenticated) return "/app/dashboard";
    return `/checkout?plan=${plan.id}&billing=${billingCycle}`;
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#fafafa]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          backgroundSize: "200px"
        }}
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: "-160px",
          width: "760px",
          height: "540px",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)"
        }}
        animate={{ opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }}
      />

      <section id="hero" className="relative z-10 mx-auto max-w-6xl px-6 pb-18 pt-20 sm:pt-28">
        <motion.div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr]" variants={stagger} initial="hidden" animate="visible">
          <div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                style={{ boxShadow: "0 0 8px #6366f1" }}
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-[10px] font-normal uppercase tracking-[0.1em] text-white/40">B2B Retention Platform</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-7 max-w-2xl text-balance leading-[1.04] tracking-[-0.02em] text-[#fafafa]"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(42px, 6vw, 72px)",
                fontWeight: 400
              }}
            >
              Predict churn and turn it into a daily operating advantage.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 max-w-md text-[15px] font-light leading-[1.75] text-white/42">
              One website. One workflow. One retention command center for scoring, prioritizing, and acting on at-risk customers.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to={isAuthenticated ? "/app/dashboard" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-full bg-[#fafafa] px-6 py-3 text-[13px] font-medium text-[#09090b] transition-all duration-200 hover:-translate-y-px hover:bg-[#e4e4e7]"
              >
                {isAuthenticated ? "Open Dashboard" : "Start Free"}
                <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowRightIcon />
                </span>
              </Link>

              <a
                href="/#contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3 text-[13px] font-normal text-white/50 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.04] hover:text-white/80"
              >
                Contact Sales
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-2">
              {heroChips.map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-white/30">
                    <span className="h-1 w-1 rounded-full bg-indigo-500/70" />
                    {item}
                  </span>
                  {index < heroChips.length - 1 && <span className="h-3.5 w-px bg-white/[0.07]" />}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="relative">
            <div className="absolute -left-6 top-8 hidden h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl lg:block" />
            <div className="absolute -right-8 bottom-0 hidden h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl lg:block" />

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/25">Live Dashboard Preview</p>
                  <p className="mt-1 text-[13px] text-white/55">Signal board for this morning's churn queue</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-1 divide-y divide-white/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {heroMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    className="p-5 sm:p-6"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/25">{metric.label}</p>
                    <p
                      className="mt-2.5 text-[#fafafa]"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "34px", fontWeight: 400 }}
                    >
                      {metric.value}
                    </p>
                    <p className={`mt-1.5 flex items-center gap-1 text-[11px] ${metric.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                      {metric.trend === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      {metric.delta}
                    </p>

                    <div className="mt-4 flex h-9 items-end gap-[3px]">
                      {metric.bars.map((barHeight, barIndex) => (
                        <motion.div
                          key={`${metric.label}-${barIndex}`}
                          className="flex-1 rounded-t-sm"
                          style={{ background: barHeight >= 90 ? "#6366f1" : "rgba(99,102,241,0.28)" }}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${barHeight}%` }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.45, delay: 0.12 + barIndex * 0.03 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/[0.06] px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Feature System</p>
              <h2
                className="mt-3 max-w-xl text-4xl text-[#fafafa]"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
              >
                A flow that moves from signal to action without losing momentum.
              </h2>
            </div>

            <div className="grid gap-0 md:grid-cols-3">
              {featureSteps.map((step, index) => (
                <motion.article
                  key={step.title}
                  className="relative border-t border-white/[0.06] px-6 py-6 md:border-l md:first:border-l-0 md:border-t-0"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/25">{step.index}</span>
                  <h3 className="mt-3 text-2xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/45">{step.detail}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {featureSignals.map((item, index) => (
              <motion.article
                key={item.title}
                className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-5"
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <div className="absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(99,102,241,0.5),transparent)]" />
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">Layer {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-2xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/45">{item.text}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="why-us" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.42 }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Why Us</p>
            <h2
              className="mt-3 max-w-xl text-4xl text-[#fafafa]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
            >
              More than a model score. A retention operating system with intent.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/45">
              The difference is not just prediction accuracy. It is how quickly your team can turn signal into action without losing clarity.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-6">
            <div className="absolute bottom-0 left-9 top-0 w-px bg-[linear-gradient(180deg,transparent,rgba(99,102,241,0.45),transparent)]" />
            <div className="space-y-6">
              {whyUsReasons.map((item, index) => (
                <motion.article
                  key={item.title}
                  className="relative pl-10"
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.34, delay: index * 0.06 }}
                >
                  <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-indigo-300/30 bg-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.35)]" />
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                      {item.title}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/35">
                      {item.stat}
                    </span>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">{item.detail}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="testimonials" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Proof</p>
          <h2
            className="mt-3 max-w-2xl text-4xl text-[#fafafa]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            Teams do not just get a model. They get a better retention rhythm.
          </h2>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <motion.article
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.42 }}
          >
            <div className="absolute right-6 top-5 text-[74px] leading-none text-white/[0.06]">"</div>
            <p className="max-w-2xl text-[28px] leading-[1.35] text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              {testimonials[0].quote}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
              <div>
                <p className="text-sm text-white/75">{testimonials[0].name}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-white/30">
                  {testimonials[0].role} | {testimonials[0].company}
                </p>
              </div>
            </div>
          </motion.article>

          <div className="grid gap-4">
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35 }}
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">Recovered revenue</p>
                <p className="mt-2 text-3xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                  $1.2M
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">Decision time</p>
                <p className="mt-2 text-3xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                  10x
                </p>
              </div>
            </motion.div>

            {testimonials.slice(1).map((item, index) => (
              <motion.article
                key={item.name}
                className={`rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-5 ${index === 0 ? "rotate-[-1.1deg]" : "rotate-[1deg]"}`}
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <p className="text-sm leading-7 text-white/52">{item.quote}</p>
                <div className="mt-4">
                  <p className="text-sm text-white/78">{item.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/28">
                    {item.role} | {item.company}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="resources" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Resources</p>
            <h2
              className="mt-3 max-w-2xl text-4xl text-[#fafafa]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
            >
              Playbooks and field notes that look alive, not forgotten.
            </h2>
          </div>
          <Link to="/resources" className="text-[11px] uppercase tracking-[0.12em] text-white/45 transition hover:text-white/75">
            Open full library
          </Link>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {resourceNotes.map((item, index) => (
            <motion.article
              key={item.title}
              className={`relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-6 ${item.tilt}`}
              initial={{ opacity: 0, y: 18, rotate: index === 1 ? 1.2 : -0.8 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.42, delay: index * 0.06 }}
            >
              <div className="absolute right-5 top-5 h-12 w-12 rounded-full border border-white/10 bg-white/[0.04]" />
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">{item.type}</p>
              <h3 className="mt-3 max-w-[15rem] text-2xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-white/45">{item.detail}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="faq" className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <motion.div
          className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-6 py-8 sm:px-8 sm:py-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Frequently Asked Questions</p>
            <h2
              className="mt-4 text-4xl text-[#fafafa] sm:text-[44px]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
            >
              Clear answers before your team commits.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
              These are the questions teams usually ask when they are moving from a good ML demo toward a real retention product.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl space-y-3">
            {faqItems.map((item, index) => (
              <motion.article
                key={item.question}
                className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.03] px-5"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.04 }}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  onClick={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                >
                  <span className={`text-[14px] leading-6 transition-colors duration-300 sm:text-[15px] ${openFaqIndex === index ? "text-white" : "text-white/76"}`}>
                    {item.question}
                  </span>
                  <motion.span
                    className="relative block h-4 w-4 shrink-0 text-white/35"
                    animate={openFaqIndex === index ? { rotate: 45 } : { rotate: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {openFaqIndex === index && (
                    <motion.div
                      key={item.question}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.48, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <motion.p
                        initial={{ y: -8 }}
                        animate={{ y: 0 }}
                        exit={{ y: -8 }}
                        transition={{ duration: 0.42, ease: "easeOut" }}
                        className="max-w-3xl pb-5 text-sm leading-7 text-white/45"
                      >
                        {item.answer}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="contact" className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8">
        <motion.div
          className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.42 }}
        >
          <div
            className="relative overflow-hidden rounded-[2.4rem] border border-white/10 px-6 py-8 sm:px-8"
            style={{
              background:
                "radial-gradient(circle at 30% 50%, rgba(179, 82, 255, 0.28), transparent 38%), linear-gradient(180deg, rgba(31,18,44,0.98), rgba(16,13,24,0.98))"
            }}
          >
            <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_55%)]" />

            <div className="relative z-10 max-w-lg">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Contact</p>
              <h2
                className="mt-4 text-balance text-4xl text-white sm:text-5xl"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
              >
                Upgrade your retention workflow with a cleaner operating system.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/58">
                For teams that want more than a one-off score, ChurnFlow helps structure a full operating loop around prediction, prioritization, and action.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={isAuthenticated ? "/app/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center rounded-full bg-[#fafafa] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#09090b] transition hover:bg-[#ebe7ff]"
                >
                  {isAuthenticated ? "Open App" : "Start Free"}
                </Link>
                <a
                  href="mailto:sales@churnflow.ai"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Contact Sales
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-white/10 bg-black/15 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">Response time</p>
                  <p className="mt-2 text-lg text-white">under 24 hrs</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-black/15 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">Use cases</p>
                  <p className="mt-2 text-lg text-white">SaaS, telecom</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-black/15 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">Email</p>
                  <p className="mt-2 text-lg text-white">sales@churnflow.ai</p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-5 py-6 sm:px-6"
          >
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/28">Book a conversation</p>
              <h3 className="mt-3 text-3xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Tell us what your team needs.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
                Share the use case, team size, or rollout goal. We will help shape the best starting point for your churn workflow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="field-label">Name</span>
                <input
                  className="field-input"
                  value={contactForm.name}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span className="field-label">Email</span>
                <input
                  type="email"
                  className="field-input"
                  value={contactForm.email}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="field-label">Company</span>
              <input
                className="field-input"
                value={contactForm.company}
                onChange={(event) => setContactForm((prev) => ({ ...prev, company: event.target.value }))}
              />
            </label>

            <label className="mt-3 block">
              <span className="field-label">Message</span>
              <textarea
                rows={6}
                className="field-input resize-none"
                value={contactForm.message}
                onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))}
                required
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={contactState.loading}
                className="inline-flex items-center justify-center rounded-full bg-[#fafafa] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#09090b] transition hover:bg-[#ebe7ff] disabled:opacity-60"
              >
                {contactState.loading ? "Sending..." : "Send Message"}
              </button>
              <p className="text-xs text-white/35">Usually replies within one business day.</p>
            </div>

            {contactState.success && <p className="mt-4 text-sm text-emerald-300">{contactState.success}</p>}
            {contactState.error && <p className="mt-4 text-sm text-red-300">{contactState.error}</p>}
          </form>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-4">
            {contactTiles.map((item, index) => (
              <motion.article
                key={item.title}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] px-5 py-5"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.34, delay: index * 0.05 }}
              >
                <div className="mb-4 h-9 w-9 rounded-full border border-fuchsia-300/25 bg-fuchsia-400/10" />
                <h3 className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/48">{item.detail}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-16">
        <motion.div
          className="relative overflow-hidden rounded-[2.8rem] border border-white/10 px-6 py-10 sm:px-8 sm:py-12"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(129, 82, 255, 0.28), transparent 34%), linear-gradient(180deg, rgba(35,18,54,0.96) 0%, rgba(14,11,24,0.98) 100%)"
          }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.45 }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="pointer-events-none absolute left-1/2 top-12 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Pricing</p>
            <h2
              className="mt-4 text-balance text-4xl text-[#fafafa] sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
            >
              Choose the plan that fits your retention operating rhythm.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-[15px]">
              Start lean, then scale into larger scoring volumes, deeper automation, and more hands-on support as the team grows.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] transition ${
                  billingCycle === "monthly" ? "bg-white/[0.1] text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] transition ${
                  billingCycle === "yearly" ? "bg-white/[0.1] text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                Yearly
              </button>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-fuchsia-200/70">
              {billingCycle === "yearly" ? "Annual billing active | save around 20%" : "Switch to yearly to lower effective spend"}
            </p>
          </div>

          <div className="relative z-10 mt-10 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <motion.article
                key={plan.name}
                className={`relative overflow-hidden rounded-[2rem] border px-5 py-6 sm:px-6 ${
                  plan.featured
                    ? "border-fuchsia-300/25 bg-[linear-gradient(180deg,rgba(187,112,255,0.22),rgba(255,255,255,0.06))] shadow-[0_20px_80px_rgba(129,82,255,0.18)]"
                    : "border-white/10 bg-white/[0.04]"
                }`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.38, delay: index * 0.06 }}
              >
                {plan.featured && (
                  <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/85">
                    Most Popular
                  </div>
                )}

                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{plan.detail}</p>
                <h3 className="mt-3 text-3xl text-[#fafafa]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-end gap-1.5">
                  <p className="text-4xl text-white sm:text-5xl">{billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}</p>
                  <span className="pb-1 text-sm text-white/45">{billingCycle === "monthly" ? "/month" : "/year"}</span>
                </div>
                <p className="mt-2 text-xs text-white/42">
                  {billingCycle === "monthly" ? "Flexible monthly access for growing teams." : "Lower effective cost with annual planning."}
                </p>

                <ul className="mt-6 space-y-3">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-white/62">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-300/80" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={getPlanHref(plan)}
                  className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] transition ${
                    plan.featured
                      ? "bg-[#fafafa] font-medium text-[#09090b] hover:bg-[#ebe7ff]"
                      : "border border-white/12 text-white/80 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.article>
            ))}
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
            {pricingSignals.map((item, index) => (
              <motion.div
                key={item.label}
                className="rounded-[1.3rem] border border-white/10 bg-black/15 px-4 py-4 text-left"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.32, delay: index * 0.05 }}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">{item.label}</p>
                <p className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                  {item.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default LandingPage;
