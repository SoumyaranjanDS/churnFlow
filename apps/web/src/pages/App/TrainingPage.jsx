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
  queued: "border-amber-200 bg-amber-50 text-black font-bold",
  running: "border-sky-200 bg-sky-50 text-black font-bold",
  completed: "border-emerald-200 bg-emerald-50 text-black font-bold",
  failed: "border-red-200 bg-red-50 text-black font-bold",
  deployed: "border-violet-200 bg-violet-50 text-black font-bold"
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
  const latestJobStyle = JOB_STATUS_STYLE[view.latestJob?.status] || "border-blue-200 bg-blue-50/20 text-black font-bold"
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
        <h2 className="mt-3 text-3xl text-black sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
          Train and track tenant-specific custom models.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black font-bold">
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

      {view.error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{view.error}</p>}
      {view.message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{view.message}</p>}

      <RevealSection className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="soft-panel">
          <p className="workspace-kicker">Current handoff</p>
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Training prerequisites
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="workspace-stat">
              <p className="workspace-kicker">Dataset</p>
              <p className="mt-2 text-sm text-black font-bold">{currentProfile?.fileName || "No onboarding dataset yet"}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Rows available</p>
              <p className="mt-2 text-sm text-black font-bold">{currentProfile?.rowCount || 0}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Target column</p>
              <p className="mt-2 text-sm text-black font-bold">{view.readiness?.confirmedTargetColumn || "-"}</p>
            </div>
            <div className="workspace-stat">
              <p className="workspace-kicker">Feature mappings</p>
              <p className="mt-2 text-sm text-black font-bold">{readiness.featureCount || 0}</p>
            </div>
          </div>

          <div className={`mt-4 rounded-[1.3rem] border px-4 py-4 ${canStartTraining ? "border-emerald-200 bg-emerald-50 text-black font-bold" : "border-amber-200 bg-amber-50 text-black font-bold"}`}>
            <p className="text-sm font-bold">
              {canStartTraining ? "This setup is ready for training." : "This setup is not ready yet."}
            </p>
            <div className="mt-2 space-y-2 text-sm leading-7 text-black font-medium">
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
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Latest training job
          </h3>

          {view.latestJob ? (
            <div className={`mt-4 rounded-[1.3rem] border px-4 py-4 ${latestJobStyle}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-black">Status: {view.latestJob.status}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-black font-bold">{formatDate(view.latestJob.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-black font-bold">{view.latestJob.summary?.message || "Training job recorded."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="workspace-stat">
                  <p className="workspace-kicker">Started</p>
                  <p className="mt-2 text-sm text-black font-bold">{formatDate(view.latestJob.execution?.startedAt)}</p>
                </div>
                <div className="workspace-stat">
                  <p className="workspace-kicker">Finished</p>
                  <p className="mt-2 text-sm text-black font-bold">{formatDate(view.latestJob.execution?.finishedAt)}</p>
                </div>
              </div>

              {(view.latestJob.execution?.errorMessage || view.latestJob.execution?.stderr) && (
                <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50/50 px-4 py-4">
                  <p className="workspace-kicker">Last error or stderr</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-black font-medium">
                    {view.latestJob.execution?.errorMessage || view.latestJob.execution?.stderr}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.3rem] border border-dashed border-blue-200 bg-blue-50/20 px-4 py-4 text-sm leading-7 text-black font-bold">
              No training job has been started yet.
            </div>
          )}

          <div className="mt-4 rounded-[1.2rem] border border-blue-200 bg-blue-50 px-4 py-4">
            <p className="workspace-kicker">Deployment note</p>
            <p className="mt-2 text-sm leading-7 text-black font-bold">
              A ready model can be marked as deployed here. Once deployed, the workspace uses that custom model for new customer scoring in Upload and Analyze.
            </p>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="soft-panel">
          <p className="workspace-kicker">Model registry</p>
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Trained model versions
          </h3>
          <div className="mt-4 space-y-3">
            {(view.models || []).length ? (
              view.models.map((model) => {
                const tone = JOB_STATUS_STYLE[model.status] || "border-blue-200 bg-blue-50/20 text-black font-bold"

                return (
                  <div key={model._id} className={`rounded-[1.2rem] border px-4 py-4 ${tone}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-black font-bold">{model.version}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-black font-bold">{model.status}</p>
                      </div>
                      <div className="text-right text-xs text-black font-bold">
                        <p>{formatDate(model.createdAt)}</p>
                        <p>{model.metrics?.test?.f1 ? `Test F1 ${Number(model.metrics.test.f1).toFixed(3)}` : "Metrics pending"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-black font-bold">
                        Target {model.targetColumn || "-"}
                      </span>
                      <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-black font-bold">
                        {model.featureMappings?.length || 0} mapped fields
                      </span>
                      {model.deployment?.isDeployed && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-black font-bold">
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
              <div className="rounded-[1.2rem] border border-dashed border-blue-200 bg-blue-50/20 px-4 py-4 text-sm text-black font-bold text-center">
                No custom models have been trained yet.
              </div>
            )}
          </div>
        </div>

        <div className="soft-panel">
          <p className="workspace-kicker">Job history</p>
          <h3 className="mt-2 text-2xl text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 800 }}>
            Recent training attempts
          </h3>
          <div className="mt-4 space-y-3">
            {(view.jobs || []).length ? (
              view.jobs.slice(0, 6).map((job) => (
                <div key={job._id} className="rounded-[1.2rem] border border-blue-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-black font-extrabold">{job.trainingContract?.fileName || "Tenant dataset"}</p>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-black font-bold">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-black font-bold">
                    {job.trainingContract?.targetColumn || "-"} • {job.trainingContract?.featureMappings?.length || 0} mapped fields • {formatDate(job.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black font-bold">{job.summary?.message || "Training job recorded."}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-blue-200 bg-blue-50/20 px-4 py-4 text-sm text-black font-bold text-center">
                No training history yet.
              </div>
            )}
          </div>

          {deployedModel && (
            <div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="workspace-kicker">Current deployed model</p>
              <p className="mt-2 text-sm text-black font-bold">{deployedModel.version}</p>
              <p className="mt-1 text-xs leading-5 text-black font-bold">
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
