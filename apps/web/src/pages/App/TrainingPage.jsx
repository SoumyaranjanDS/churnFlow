import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import JourneyEmptyState from "../../components/JourneyEmptyState"
import RevealSection from "../../components/RevealSection"
import { WorkspacePageSkeleton } from "../../components/Skeleton"
import { useToast } from "../../context/ToastContext"
import {
  createTrainingJob,
  deployTrainingModel,
  getLatestTrainingJob,
  getOnboardingSnapshot,
  getTrainingJobs,
  getTrainingModels,
  getTrainingReadiness
} from "../../services/churnApi"

const JOB_STATUS_STYLE = {
  queued: "border-amber-300/30 bg-amber-500/10 text-amber-100",
  running: "border-sky-300/30 bg-sky-500/10 text-sky-100",
  completed: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
  failed: "border-red-300/30 bg-red-500/10 text-red-100",
  deployed: "border-violet-300/30 bg-violet-500/10 text-violet-100"
}

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-")

const TrainingPage = () => {
  const toast = useToast()
  const [view, setView] = useState({
    loading: true,
    starting: false,
    deployingId: "",
    error: "",
    message: "",
    snapshot: null,
    readiness: null,
    latestJob: null,
    jobs: [],
    models: []
  })

  const load = async () => {
    setView((prev) => ({ ...prev, loading: true, error: "" }))

    try {
      const snapshotResponse = await getOnboardingSnapshot()
      const snapshot = snapshotResponse?.data || null
      const profileId = snapshot?.datasetProfile?._id || ""

      const [readinessResponse, latestJobResponse, jobsResponse, modelsResponse] = await Promise.all([
        profileId ? getTrainingReadiness(profileId) : Promise.resolve({ data: null }),
        getLatestTrainingJob(),
        getTrainingJobs(),
        getTrainingModels()
      ])

      setView((prev) => ({
        ...prev,
        loading: false,
        snapshot,
        readiness: readinessResponse?.data || null,
        latestJob: latestJobResponse?.data?.job || null,
        jobs: jobsResponse?.data?.items || [],
        models: modelsResponse?.data?.items || []
      }))
    } catch (error) {
      setView((prev) => ({ ...prev, loading: false, error: error.message }))
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const activeStatus = view.latestJob?.status
    if (!["queued", "running"].includes(activeStatus)) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      load()
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [view.latestJob?.status])

  const startTraining = async () => {
    const profileId = view.snapshot?.datasetProfile?._id || ""
    setView((prev) => ({ ...prev, starting: true, error: "", message: "" }))

    try {
      const response = await createTrainingJob(profileId)
      setView((prev) => ({
        ...prev,
        message: response?.message || "Training job queued."
      }))
      toast.success("Training queued", "The custom model training job has been queued in the background.")
      await load()
    } catch (error) {
      setView((prev) => ({ ...prev, error: error.message }))
      toast.error("Could not start training", error.message)
    } finally {
      setView((prev) => ({ ...prev, starting: false }))
    }
  }

  const deployModel = async (modelId) => {
    setView((prev) => ({ ...prev, deployingId: modelId, error: "", message: "" }))

    try {
      const response = await deployTrainingModel(modelId)
      setView((prev) => ({
        ...prev,
        message: response?.message || "Model deployed."
      }))
      toast.success("Model deployed", "This workspace will now use the deployed custom model for scoring.")
      await load()
    } catch (error) {
      setView((prev) => ({ ...prev, error: error.message }))
      toast.error("Could not deploy model", error.message)
    } finally {
      setView((prev) => ({ ...prev, deployingId: "" }))
    }
  }

  const readiness = view.readiness?.readiness || {}
  const latestJobStyle = JOB_STATUS_STYLE[view.latestJob?.status] || "border-white/10 bg-white/[0.04] text-slate-100"
  const canStartTraining = Boolean(readiness.readyForCustomTraining)
  const currentProfile = view.snapshot?.datasetProfile || null
  const deployedModel = useMemo(
    () => (view.models || []).find((item) => item.deployment?.isDeployed) || null,
    [view.models]
  )
  const isFirstTrainingVisit = !view.loading && !currentProfile && !(view.jobs || []).length && !(view.models || []).length
  const showReadyToTrainState = !view.loading && currentProfile && canStartTraining && !(view.jobs || []).length

  if (view.loading && !view.snapshot && !(view.jobs || []).length && !(view.models || []).length) {
    return <WorkspacePageSkeleton stats={3} tableRows={3} />
  }

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Phase 3</p>
        <h2 className="mt-3 text-3xl text-white sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
          Train and track tenant-specific custom models.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/80">
          This page turns the confirmed Phase 2 handoff into a real training lifecycle: queued, running, completed, failed, and deployed.
        </p>
      </RevealSection>

      {isFirstTrainingVisit ? (
        <JourneyEmptyState
          eyebrow="First training visit"
          title="Training opens right after Custom Setup is confirmed"
          body="This area is where ChurnFlow turns the confirmed dataset contract into a tenant-specific model. Start in Custom Setup, save the Gemini-assisted confirmation, and then come back here when the handoff is ready."
          accent="from-sky-300/35 via-violet-300/20 to-fuchsia-300/25"
          highlights={[
            {
              kicker: "Before training",
              title: "Confirm one dataset contract",
              body: "We need the churn column, the important feature columns, and the business definition of churn to be locked in first."
            },
            {
              kicker: "After training",
              title: "Deploy the model and use it like Phase 1",
              body: "Once deployed, your workspace can create customers, score them, and move them through queue, actions, and results."
            }
          ]}
          actions={[
            { label: "Open Custom Setup", to: "/app/custom-setup" },
            { label: "Back to dashboard", to: "/app/dashboard", variant: "secondary" }
          ]}
        />
      ) : null}

      {showReadyToTrainState ? (
        <JourneyEmptyState
          eyebrow="Ready to train"
          title="Everything is lined up for your first custom model run"
          body="The dataset contract is confirmed, the churn target is set, and the mapped fields are ready. Start the first training job when your team is ready and we will track the lifecycle here."
          accent="from-emerald-300/35 via-sky-300/20 to-violet-300/20"
          highlights={[
            {
              kicker: "What happens next",
              title: "Training runs in the background",
              body: "You can stay on this page and watch queued, running, completed, or failed states without leaving the workflow."
            },
            {
              kicker: "After completion",
              title: "Deploy and start scoring immediately",
              body: "Once a model is marked as deployed, this workspace switches to the custom scoring path automatically."
            }
          ]}
          actions={[
            { label: view.starting ? "Queueing training..." : "Start custom model training", onClick: startTraining },
            { label: "Review Custom Setup", to: "/app/custom-setup", variant: "secondary" }
          ]}
        />
      ) : null}

      {view.error && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{view.error}</p>}
      {view.message && <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{view.message}</p>}

      <RevealSection className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="soft-panel">
          <p className="workspace-kicker">Current handoff</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Training prerequisites
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="workspace-stat">
              <p className="workspace-kicker">Dataset</p>
              <p className="mt-2 text-sm text-white">{currentProfile?.fileName || "No onboarding dataset yet"}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Rows available</p>
              <p className="mt-2 text-sm text-white">{currentProfile?.rowCount || 0}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Target column</p>
              <p className="mt-2 text-sm text-white">{view.readiness?.confirmedTargetColumn || "-"}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Feature mappings</p>
              <p className="mt-2 text-sm text-white">{readiness.featureCount || 0}</p>
            </div>
          </div>

          <div className={`mt-4 rounded-[1.3rem] border px-4 py-4 ${canStartTraining ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100" : "border-amber-300/30 bg-amber-500/10 text-amber-100"}`}>
            <p className="text-sm font-medium text-white">
              {canStartTraining ? "This setup is ready for training." : "This setup is not ready yet."}
            </p>
            <div className="mt-2 space-y-2 text-sm leading-7 opacity-90">
              {canStartTraining ? (
                <p>Start a tenant-specific training job. The backend will run it in the background and keep the status updated here.</p>
              ) : (
                (readiness.blockers || ["Finish the Custom Setup confirmation first."]).map((item) => <p key={item}>{item}</p>)
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" disabled={view.starting || !canStartTraining} onClick={startTraining}>
              {view.starting ? "Queueing training..." : "Start custom model training"}
            </button>
            <button type="button" className="btn-secondary" onClick={load}>
              Refresh page data
            </button>
          </div>
        </div>

        <div className="soft-panel">
          <p className="workspace-kicker">Live status</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Latest training job
          </h3>

          {view.latestJob ? (
            <div className={`mt-4 rounded-[1.3rem] border px-4 py-4 ${latestJobStyle}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white">Status: {view.latestJob.status}</p>
                <p className="text-xs uppercase tracking-[0.14em] opacity-80">{formatDate(view.latestJob.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-100/90">{view.latestJob.summary?.message || "Training job recorded."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="workspace-stat">
                  <p className="workspace-kicker">Started</p>
                  <p className="mt-2 text-sm text-white">{formatDate(view.latestJob.execution?.startedAt)}</p>
                </div>
                <div className="workspace-stat">
                  <p className="workspace-kicker">Finished</p>
                  <p className="mt-2 text-sm text-white">{formatDate(view.latestJob.execution?.finishedAt)}</p>
                </div>
              </div>

              {(view.latestJob.execution?.errorMessage || view.latestJob.execution?.stderr) && (
                <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="workspace-kicker">Last error or stderr</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-200">
                    {view.latestJob.execution?.errorMessage || view.latestJob.execution?.stderr}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
              No training job has been started yet.
            </div>
          )}

          <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
            <p className="workspace-kicker">Deployment note</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              A ready model can be marked as deployed here. Once deployed, the workspace uses that custom model for new customer scoring in Upload and Analyze.
            </p>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="soft-panel">
          <p className="workspace-kicker">Model registry</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Trained model versions
          </h3>
          <div className="mt-4 space-y-3">
            {(view.models || []).length ? (
              view.models.map((model) => {
                const tone = JOB_STATUS_STYLE[model.status] || "border-white/10 bg-white/[0.04] text-slate-100"

                return (
                  <div key={model._id} className={`rounded-[1.2rem] border px-4 py-4 ${tone}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white">{model.version}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] opacity-80">{model.status}</p>
                      </div>
                      <div className="text-right text-xs text-slate-200/80">
                        <p>{formatDate(model.createdAt)}</p>
                        <p>{model.metrics?.test?.f1 ? `Test F1 ${Number(model.metrics.test.f1).toFixed(3)}` : "Metrics pending"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200">
                        Target {model.targetColumn || "-"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200">
                        {model.featureMappings?.length || 0} mapped fields
                      </span>
                      {model.deployment?.isDeployed && (
                        <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-100">
                          Deployed
                        </span>
                      )}
                    </div>
                    {["ready", "deployed"].includes(model.status) && !model.deployment?.isDeployed && (
                      <div className="mt-4">
                        <button type="button" className="btn-secondary" disabled={view.deployingId === model._id} onClick={() => deployModel(model._id)}>
                          {view.deployingId === model._id ? "Deploying..." : "Mark as deployed"}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
                No custom models have been trained yet.
              </div>
            )}
          </div>
        </div>

        <div className="soft-panel">
          <p className="workspace-kicker">Job history</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Recent training attempts
          </h3>
          <div className="mt-4 space-y-3">
            {(view.jobs || []).length ? (
              view.jobs.slice(0, 6).map((job) => (
                <div key={job._id} className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-white">{job.trainingContract?.fileName || "Tenant dataset"}</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {job.trainingContract?.targetColumn || "-"} • {job.trainingContract?.featureMappings?.length || 0} mapped fields • {formatDate(job.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{job.summary?.message || "Training job recorded."}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
                No training history yet.
              </div>
            )}
          </div>

          {deployedModel && (
            <div className="mt-4 rounded-[1.2rem] border border-emerald-300/30 bg-emerald-500/10 px-4 py-4">
              <p className="workspace-kicker">Current deployed model</p>
              <p className="mt-2 text-sm text-white">{deployedModel.version}</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100/80">
                Deployed at {formatDate(deployedModel.deployment?.deployedAt)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/app/upload" className="btn-primary">
                  Create customer
                </Link>
                <Link to="/app/analyze" className="btn-secondary">
                  Score customer
                </Link>
                <Link to="/app/results" className="btn-secondary">
                  View results
                </Link>
              </div>
            </div>
          )}
        </div>
      </RevealSection>
    </section>
  )
}

export default TrainingPage
