import { motion } from "framer-motion"
import { Link } from "react-router-dom"

const JourneyEmptyState = ({
  eyebrow = "First step",
  title,
  body,
  accent = "from-fuchsia-300/35 via-violet-300/20 to-sky-300/30",
  highlights = [],
  actions = []
}) => {
  return (
    <motion.div
      className="soft-panel relative overflow-hidden"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div className={`pointer-events-none absolute -left-8 top-0 h-32 w-32 rounded-full bg-gradient-to-br ${accent} blur-3xl`} />
      <div className="pointer-events-none absolute right-0 top-6 h-20 w-20 rounded-full border border-white/10 bg-white/[0.04] blur-sm" />
      <div className="pointer-events-none absolute bottom-6 right-10 h-14 w-14 rounded-[1.4rem] border border-white/10 bg-white/[0.05]" />
      <div className="pointer-events-none absolute bottom-14 right-24 h-10 w-10 rotate-12 rounded-[1rem] border border-white/10 bg-white/[0.04]" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
          <p className="workspace-kicker">{eyebrow}</p>
          <div className="mt-5 space-y-3">
            <div className="flex items-end gap-3">
              <div className="float-soft h-24 w-24 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))]" />
              <div className="float-soft-delayed h-16 w-16 rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-2 rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-3xl text-white sm:text-[2.1rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            {title}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/78">{body}</p>

          {highlights.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <p className="workspace-kicker">{item.kicker || "Why this matters"}</p>
                  <p className="mt-2 text-sm text-white">{item.title}</p>
                  {item.body ? <p className="mt-2 text-xs leading-6 text-slate-400">{item.body}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {actions.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action) =>
                action.to ? (
                  <Link key={`${action.label}-${action.to}`} to={action.to} className={action.variant === "secondary" ? "btn-secondary" : "btn-primary"}>
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={action.variant === "secondary" ? "btn-secondary" : "btn-primary"}
                  >
                    {action.label}
                  </button>
                )
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

export default JourneyEmptyState
