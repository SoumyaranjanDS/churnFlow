const SIZE_MAP = {
  sm: {
    mark: "h-8 w-8 rounded-2xl",
    title: "text-[12px] tracking-[0.16em]",
    subtitle: "text-[10px]"
  },
  md: {
    mark: "h-10 w-10 rounded-[1.15rem]",
    title: "text-[13px] tracking-[0.18em]",
    subtitle: "text-[10px]"
  },
  lg: {
    mark: "h-12 w-12 rounded-[1.35rem]",
    title: "text-sm tracking-[0.2em]",
    subtitle: "text-[11px]"
  }
};

const BrandLockup = ({
  size = "md",
  title = "ChurnFlow",
  subtitle = "Retention intelligence platform",
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  showSubtitle = true
}) => {
  const scale = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span className={`relative flex items-center justify-center overflow-hidden border border-white/10 bg-white/[0.06] shadow-[0_14px_32px_rgba(8,10,18,0.24)] ${scale.mark}`}>
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(196,181,253,0.35),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(96,165,250,0.22),transparent_42%)]" />
        <img src="/churnflow-logo.svg" alt="ChurnFlow logo" className="relative z-10 h-[76%] w-[76%]" />
      </span>
      <span className="min-w-0">
        <span className={`block font-medium uppercase text-white ${scale.title} ${titleClassName}`.trim()}>{title}</span>
        {showSubtitle ? (
          <span className={`mt-1 block text-white/40 ${scale.subtitle} ${subtitleClassName}`.trim()}>{subtitle}</span>
        ) : null}
      </span>
    </div>
  );
};

export default BrandLockup;
