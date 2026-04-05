const joinClasses = (...items) => items.filter(Boolean).join(" ");

const SkeletonBlock = ({ className = "" }) => {
  return <div className={joinClasses("skeleton", className)} />;
};

const SkeletonTextGroup = ({ lines = ["w-full", "w-4/5", "w-3/5"], className = "" }) => {
  return (
    <div className={joinClasses("space-y-3", className)}>
      {lines.map((line, index) => (
        <SkeletonBlock key={`${line}-${index}`} className={joinClasses("h-3.5", line)} />
      ))}
    </div>
  );
};

const StatSkeletonGrid = ({ count = 4 }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="workspace-stat">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="mt-4 h-8 w-24" />
          <SkeletonBlock className="mt-3 h-3.5 w-28" />
        </div>
      ))}
    </div>
  );
};

const PanelSkeleton = ({ rows = 4, className = "" }) => {
  return (
    <div className={joinClasses("soft-panel", className)}>
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-4 h-7 w-48" />
      <SkeletonTextGroup className="mt-4" lines={["w-full", "w-11/12", "w-4/5"]} />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-3.5 w-full" />
            <SkeletonBlock className="mt-2 h-3.5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
};

const TableSkeleton = ({ rows = 5, columns = 5, className = "" }) => {
  return (
    <div className={joinClasses("table-shell", className)}>
      <div className="border-b border-white/10 px-5 py-4">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-3 h-7 w-44" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <SkeletonBlock key={`${rowIndex}-${columnIndex}`} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkspacePageSkeleton = ({ stats = 4, tableRows = 5 }) => {
  return (
    <section className="space-y-6">
      <div className="workspace-hero">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="mt-5 h-11 w-3/5 max-w-xl" />
        <SkeletonTextGroup className="mt-5 max-w-2xl" lines={["w-full", "w-11/12", "w-4/5"]} />
      </div>

      <StatSkeletonGrid count={stats} />

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={3} />
      </div>

      <TableSkeleton rows={tableRows} columns={4} />
    </section>
  );
};

export {
  PanelSkeleton,
  SkeletonBlock,
  SkeletonTextGroup,
  StatSkeletonGrid,
  TableSkeleton,
  WorkspacePageSkeleton
};
