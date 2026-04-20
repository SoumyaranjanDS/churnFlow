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
  title = "RetainQ",
  subtitle = "Retention intelligence platform",
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  showSubtitle = true
}) => {
  const scale = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span className={`relative flex items-center justify-center overflow-hidden border border-blue-200 bg-white shadow-premium ${scale.mark}`}>
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.08),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.05),transparent_42%)]" />
        <img src="/churnflow-logo.svg" alt="RetainQ logo" className="relative z-10 h-[70%] w-[70%]" />
      </span>
      <span className="min-w-0">
        <span className={`block font-bold uppercase text-black ${scale.title} ${titleClassName}`.trim()}>{title}</span>
        {showSubtitle ? (
          <span className={`mt-0.5 block text-black font-medium ${scale.subtitle} ${subtitleClassName}`.trim()}>{subtitle}</span>
        ) : null}
      </span>
    </div>
  );
};

export default BrandLockup;
