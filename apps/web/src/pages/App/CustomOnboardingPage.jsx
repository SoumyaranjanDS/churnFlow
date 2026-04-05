import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import JourneyEmptyState from "../../components/JourneyEmptyState"
import RevealSection from "../../components/RevealSection"
import { WorkspacePageSkeleton } from "../../components/Skeleton"
import { useToast } from "../../context/ToastContext"
import {
  analyzeOnboardingDataset,
  confirmOnboardingSetup,
  getOnboardingHistory,
  getOnboardingSnapshot,
  getTrainingReadiness,
  prepareTrainingHandoff
} from "../../services/churnApi"

const STORAGE_KEY = "churnflow.phase2.onboarding"
const TARGETS = [
  ["", "Not mapped yet"],
  ["customer_id", "Customer ID"],
  ["tenure_months", "Tenure (months)"],
  ["monthly_charges", "Monthly charges"],
  ["contract", "Contract"],
  ["internet_service", "Internet service"],
  ["tech_support", "Tech support"],
  ["subscription_plan", "Subscription plan"],
  ["billing_amount", "Billing amount"],
  ["engagement_score", "Engagement score"],
  ["support_ticket_count", "Support ticket count"],
  ["last_active_at", "Last active at"],
  ["target_label", "Churn status label"]
]
const INDUSTRIES = [
  ["telecom", "Telecom"],
  ["subscription_like", "Subscription business"],
  ["custom_unknown", "Other business type"]
]
const TARGET_LABELS = Object.fromEntries(TARGETS)
const INDUSTRY_LABELS = Object.fromEntries(INDUSTRIES)
const CONFIDENCE = { high: 3, medium: 2, low: 1 }
const WORKFLOW_STEPS = [
  { id: "01", title: "Upload sample", helper: "Add one sample CSV or XLSX file" },
  { id: "02", title: "Review AI findings", helper: "See Gemini's first-pass guess" },
  { id: "03", title: "Confirm setup", helper: "Correct the churn label and mappings" },
  { id: "04", title: "Check readiness", helper: "See if the data is ready for the next phase" }
]
const BUSY_COPY = {
  loading: ["Loading your saved setup...", "Rebuilding the latest onboarding view..."],
  submitting: ["Uploading your sample file...", "Reading the sheet and columns...", "Asking Gemini to review the dataset..."],
  confirming: ["Saving your confirmed setup...", "Checking the churn column and mapped fields...", "Preparing the readiness result..."],
  checking: ["Re-checking the current setup...", "Reviewing blockers and readiness..."],
  handoffing: ["Preparing the Phase 3 handoff...", "Packaging the confirmed feature contract..."]
}

const readStored = () => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const prettify = (value) => String(value || "-").replace(/_/g, " ")
const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-")
const pickLabel = (lookup, value, fallback = "-") => lookup[value] || fallback

const buildSuggestionLookup = (snapshot) => {
  const dataset = snapshot?.datasetProfile || {}
  const schema = snapshot?.schemaProfile || {}
  const lookup = new Map()

  ;(schema.mappingSuggestions || dataset.analysis?.mappingSuggestions || []).forEach((item) => {
    if (!item?.sourceColumn || !item?.targetField) return

    const current = lookup.get(item.sourceColumn)
    if (!current || (CONFIDENCE[item.confidence] || 0) > (CONFIDENCE[current.confidence] || 0)) {
      lookup.set(item.sourceColumn, item)
    }
  })

  return lookup
}

const buildEditor = (snapshot) => {
  const dataset = snapshot?.datasetProfile || {}
  const schema = snapshot?.schemaProfile || {}
  const aiSuggestedTargetColumn =
    schema?.ai?.suggestedTargetColumn ||
    dataset.analysis?.ai?.suggestedTargetColumn ||
    dataset.analysis?.targetCandidates?.[0] ||
    ""
  const saved = dataset?.confirmation?.confirmedAt
    ? dataset.confirmation
    : {
        confirmedIndustry: schema.confirmedIndustry || schema.suggestedIndustry || dataset.analysis?.suggestedIndustry || "custom_unknown",
        confirmedMappings: schema.confirmedMappings || [],
        confirmedTargetColumn: schema.confirmedTargetColumn || aiSuggestedTargetColumn,
        selectedChurnDefinition: schema.selectedChurnDefinition || dataset.analysis?.ai?.churnDefinitionOptions?.[0] || "",
        followUpAnswers: schema.followUpAnswers || []
      }

  const confirmed = new Map((saved.confirmedMappings || []).map((item) => [item.sourceColumn, item.targetField]))
  const suggested = buildSuggestionLookup(snapshot)

  return {
    confirmedIndustry: saved.confirmedIndustry || dataset.analysis?.suggestedIndustry || "custom_unknown",
    confirmedTargetColumn: saved.confirmedTargetColumn || aiSuggestedTargetColumn,
    selectedChurnDefinition: saved.selectedChurnDefinition || dataset.analysis?.ai?.churnDefinitionOptions?.[0] || "",
    followUpAnswers: Object.fromEntries((saved.followUpAnswers || []).map((item) => [item.question, item.answer])),
    mappingRows: (dataset.columns || []).map((column) => ({
      sourceColumn: column,
      targetField:
        confirmed.get(column) ||
        suggested.get(column)?.targetField ||
        (column === aiSuggestedTargetColumn ? "target_label" : "")
    }))
  }
}

const getAnsweredQuestions = (questions, answers) => {
  return questions.filter((question) => String(answers[question] || "").trim()).length
}

const getStatusCopy = ({ dataset, readiness, confirmed }) => {
  if (!dataset?._id) {
    return {
      tone: "slate",
      title: "Upload a sample file to begin",
      body: "Start by uploading a small CSV or XLSX file. We will inspect the columns, guess what they mean, and show you the next best step.",
      nextAction: "Upload a sample dataset."
    }
  }

  if (!confirmed) {
    return {
      tone: "sky",
      title: "Gemini already guessed the setup. You just need to confirm it.",
      body: "We pre-filled the likely meaning of your dataset columns and the most likely churn column. Review the guesses in your own dataset language, correct anything wrong, answer the short business questions, and save the setup.",
      nextAction: "Review Gemini's guesses below and click Save setup."
    }
  }

  if (readiness.readyForCustomTraining) {
    return {
      tone: "emerald",
      title: "Your data is ready for a custom churn model",
      body: "The dataset now has a confirmed churn target and enough structure for a future tenant-specific training job.",
      nextAction: "Prepare the training handoff when you are ready."
    }
  }

  if (readiness.readyForTelecomPrediction) {
    return {
      tone: "violet",
      title: "This data can use the telecom starter path",
      body: "The mapped fields are close to the telecom contract. You can score with the starter model now while collecting more custom history.",
      nextAction: "Use the starter path or keep improving this custom setup."
    }
  }

  return {
    tone: "amber",
    title: "Your data still needs a few fixes before training",
    body: "Use the fix list below to correct the churn column, the mapped fields, or the data coverage. Then save the setup again.",
    nextAction: "Use the fix list below, update the setup, and save again."
  }
}

const sortMappings = (rows) => {
  return [...rows].sort((left, right) => Number(Boolean(right.targetField)) - Number(Boolean(left.targetField)) || left.sourceColumn.localeCompare(right.sourceColumn))
}

const buildGeminiSuggestedRows = (snapshot, existingRows = []) => {
  const dataset = snapshot?.datasetProfile || {}
  const aiSuggestedTargetColumn =
    snapshot?.schemaProfile?.ai?.suggestedTargetColumn ||
    dataset.analysis?.ai?.suggestedTargetColumn ||
    dataset.analysis?.targetCandidates?.[0] ||
    ""
  const suggestionLookup = buildSuggestionLookup(snapshot)
  const existingLookup = new Map((existingRows || []).map((row) => [row.sourceColumn, row.targetField]))

  return (dataset.columns || []).map((column) => ({
    sourceColumn: column,
    targetField:
      suggestionLookup.get(column)?.targetField ||
      existingLookup.get(column) ||
      (column === aiSuggestedTargetColumn ? "target_label" : "")
  }))
}

const buildBlockerFixes = (blockers = []) => {
  const fixes = []

  blockers.forEach((blocker) => {
    if (blocker.includes("Confirm which column represents churn") || blocker.includes("Confirm which column means churn") || blocker.includes("Confirm which column represents churn or loss")) {
      fixes.push("In Step 3, review Gemini's churn-column guess and choose the real churn outcome column.")
      return
    }

    if (blocker.includes("Map at least 3 usable feature columns")) {
      fixes.push("In Step 3, keep or correct at least 3 useful column meanings in the mapping section.")
      return
    }

    if (blocker.includes("Collect at least 100 historical rows") || blocker.includes("Need at least 100 labeled rows")) {
      fixes.push("Upload a larger historical dataset with at least 100 rows and a real churn label.")
      return
    }

    if (blocker.includes("Missing telecom baseline field:")) {
      const field = blocker.split(":")[1]?.trim() || "telecom field"
      fixes.push(`Only if you want the telecom starter path: map a column for ${field}.`)
      return
    }

    fixes.push(blocker)
  })

  return Array.from(new Set(fixes))
}

const buildNextStepList = ({ dataset, confirmed, readiness, questions, answeredQuestions, blockers }) => {
  if (!dataset?._id) {
    return ["Upload a sample CSV or XLSX file."]
  }

  if (!confirmed) {
    const steps = []
    steps.push("Review Gemini's guessed churn column and column meanings.")
    if (questions.length && answeredQuestions < questions.length) {
      steps.push(`Answer all ${questions.length} short business questions.`)
    }
    steps.push("Correct anything that looks wrong.")
    steps.push("Click Save setup.")
    return steps
  }

  if (readiness.readyForCustomTraining) {
    return [
      "Click Prepare training handoff.",
      "Use that confirmed setup in Phase 3 to train a tenant-specific churn model."
    ]
  }

  if (readiness.readyForTelecomPrediction) {
    return [
      "You can already use the telecom starter model for scoring.",
      "If you want a custom model later, keep collecting more labeled history and then re-check readiness."
    ]
  }

  if (blockers.length) {
    return [
      "Use the fix list in Step 4.",
      "Go back to Step 3 and correct the setup.",
      "Click Save setup again."
    ]
  }

  return ["Refresh the readiness result after saving the setup."]
}

const getBusyState = (view) => {
  if (view.submitting) return "submitting"
  if (view.confirming) return "confirming"
  if (view.checking) return "checking"
  if (view.handoffing) return "handoffing"
  if (view.loading) return "loading"
  return ""
}

const buildStepCards = ({ dataset, confirmed, readiness, handoff }) => {
  const readinessGood = Boolean(readiness?.readyForCustomTraining || readiness?.readyForTelecomPrediction)

  return WORKFLOW_STEPS.map((step) => {
    if (step.id === "01") {
      return {
        ...step,
        state: dataset?._id ? "done" : "active",
        detail: dataset?.fileName || "Choose a sample file"
      }
    }

    if (step.id === "02") {
      return {
        ...step,
        state: dataset?._id ? (confirmed ? "done" : "active") : "pending",
        detail: dataset?._id ? "Gemini suggestions are ready" : "Waiting for a sample file"
      }
    }

    if (step.id === "03") {
      return {
        ...step,
        state: confirmed ? "done" : dataset?._id ? "active" : "pending",
        detail: confirmed ? "Setup saved" : dataset?._id ? "Review and confirm" : "Not started yet"
      }
    }

    return {
      ...step,
      state: handoff ? "done" : confirmed ? "active" : "pending",
      detail: handoff ? "Phase 3 handoff ready" : readinessGood ? "Ready for the next move" : confirmed ? "Needs one final check" : "Waiting for confirmation"
    }
  })
}

const CustomOnboardingPage = () => {
  const toast = useToast()
  const stored = useMemo(() => readStored(), [])
  const [file, setFile] = useState(null)
  const [sheet, setSheet] = useState(stored?.sheet || "")
  const [editor, setEditor] = useState(stored?.editor || {
    confirmedIndustry: "custom_unknown",
    confirmedTargetColumn: "",
    selectedChurnDefinition: "",
    followUpAnswers: {},
    mappingRows: []
  })
  const [view, setView] = useState({
    loading: true,
    submitting: false,
    confirming: false,
    checking: false,
    handoffing: false,
    error: "",
    handoffError: stored?.handoffError || "",
    message: stored?.message || "",
    snapshot: stored?.snapshot || null,
    history: stored?.history || [],
    training: stored?.training || null,
    handoff: stored?.handoff || null
  })
  const [busyMessageIndex, setBusyMessageIndex] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      sheet,
      editor,
      message: view.message,
      snapshot: view.snapshot,
      history: view.history,
      training: view.training,
      handoff: view.handoff,
      handoffError: view.handoffError
    }))
  }, [editor, sheet, view.handoff, view.handoffError, view.history, view.message, view.snapshot, view.training])

  const busyState = getBusyState(view)

  useEffect(() => {
    setBusyMessageIndex(0)

    if (!busyState || !BUSY_COPY[busyState] || BUSY_COPY[busyState].length <= 1) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setBusyMessageIndex((current) => (current + 1) % BUSY_COPY[busyState].length)
    }, 1800)

    return () => window.clearInterval(intervalId)
  }, [busyState])

  const applyLoadedState = (snapshot, history, training = null, message = "") => {
    setEditor(buildEditor(snapshot))
    setView((prev) => ({
      ...prev,
      loading: false,
      error: "",
      handoffError: "",
      snapshot,
      history,
      training,
      handoff: null,
      message: message || prev.message
    }))
  }

  const load = async (profileId = "") => {
    setView((prev) => ({ ...prev, loading: true, error: "" }))
    try {
      const [snapshotResponse, historyResponse] = await Promise.all([
        getOnboardingSnapshot(profileId),
        getOnboardingHistory()
      ])
      const snapshot = snapshotResponse?.data || null
      const isConfirmed = Boolean(snapshot?.datasetProfile?.confirmation?.confirmedAt || snapshot?.schemaProfile?.confirmedTargetColumn)
      let training = null

      if (isConfirmed) {
        try {
          const trainingResponse = await getTrainingReadiness(profileId || snapshot?.datasetProfile?._id || "")
          training = trainingResponse?.data || null
        } catch {
          training = null
        }
      }

      applyLoadedState(snapshot, historyResponse?.data?.items || [], training)
    } catch (error) {
      setView((prev) => ({ ...prev, loading: false, error: error.message }))
    }
  }

  useEffect(() => {
    load()
  }, [])

  const upload = async (event) => {
    event.preventDefault()
    if (!file) {
      setView((prev) => ({ ...prev, error: "Choose a sample CSV or XLSX file first." }))
      return
    }

    setView((prev) => ({ ...prev, submitting: true, error: "", handoffError: "", training: null, handoff: null }))
    try {
      const response = await analyzeOnboardingDataset(file, sheet)
      const historyResponse = await getOnboardingHistory()
      applyLoadedState(
        response?.data || null,
        historyResponse?.data?.items || [],
        null,
        `We reviewed ${response?.data?.datasetProfile?.fileName || file.name}. Gemini already guessed the likely column meanings for you.`
      )
      toast.success("Dataset reviewed", "Gemini finished the first-pass analysis and filled in the likely setup.")
      setFile(null)
    } catch (error) {
      setView((prev) => ({ ...prev, loading: false, error: error.message }))
      toast.error("Could not analyze dataset", error.message)
    } finally {
      setView((prev) => ({ ...prev, submitting: false }))
    }
  }

  const changeMapping = (sourceColumn, targetField) => {
    setEditor((prev) => ({
      ...prev,
      confirmedTargetColumn:
        targetField === "target_label"
          ? sourceColumn
          : prev.confirmedTargetColumn === sourceColumn && targetField !== "target_label"
            ? ""
            : prev.confirmedTargetColumn,
      mappingRows: prev.mappingRows.map((row) => {
        if (row.sourceColumn === sourceColumn) return { ...row, targetField }
        if (targetField === "target_label" && row.targetField === "target_label") return { ...row, targetField: "" }
        return row
      })
    }))
  }

  const applyGeminiSetup = () => {
    const snapshot = view.snapshot
    const suggestedRows = buildGeminiSuggestedRows(snapshot, editor.mappingRows)
    const aiTarget =
      snapshot?.schemaProfile?.ai?.suggestedTargetColumn ||
      snapshot?.datasetProfile?.analysis?.ai?.suggestedTargetColumn ||
      snapshot?.datasetProfile?.analysis?.targetCandidates?.[0] ||
      ""

    setEditor((prev) => ({
      ...prev,
      confirmedTargetColumn: prev.confirmedTargetColumn || aiTarget,
      selectedChurnDefinition:
        prev.selectedChurnDefinition ||
        snapshot?.datasetProfile?.analysis?.ai?.churnDefinitionOptions?.[0] ||
        "",
      mappingRows: suggestedRows
    }))

    setView((prev) => ({
      ...prev,
      message: "Gemini's suggested mappings are now applied. Only change something if it looks wrong."
    }))
  }

  const saveSetup = async () => {
    const datasetProfileId = view.snapshot?.datasetProfile?._id
    const questions = view.snapshot?.datasetProfile?.analysis?.ai?.businessQuestions || []
    const unanswered = questions.filter((question) => !String(editor.followUpAnswers[question] || "").trim())
    const fallbackRows = buildGeminiSuggestedRows(view.snapshot, editor.mappingRows)
    const mappings = (editor.mappingRows.filter((item) => item.targetField).length ? editor.mappingRows : fallbackRows).filter((item) => item.targetField)
    const targetColumn =
      editor.confirmedTargetColumn ||
      view.snapshot?.schemaProfile?.ai?.suggestedTargetColumn ||
      view.snapshot?.datasetProfile?.analysis?.ai?.suggestedTargetColumn ||
      mappings.find((item) => item.targetField === "target_label")?.sourceColumn ||
      ""

    if (!datasetProfileId) return setView((prev) => ({ ...prev, error: "Upload and review a dataset first." }))
    if (!mappings.length) return setView((prev) => ({ ...prev, error: "Gemini could not map enough useful columns yet. Open advanced corrections and choose the important ones manually." }))
    if (!targetColumn) return setView((prev) => ({ ...prev, error: "Choose which source column represents churn before saving the setup." }))
    if (questions.length && unanswered.length) {
      return setView((prev) => ({ ...prev, error: `Answer all ${questions.length} business questions before saving the setup.` }))
    }

    setView((prev) => ({ ...prev, confirming: true, error: "", handoffError: "" }))
    try {
      const followUpAnswers = questions.map((question) => ({
        question,
        answer: String(editor.followUpAnswers[question] || "").trim()
      }))

      const response = await confirmOnboardingSetup({
        datasetProfileId,
        confirmedIndustry: editor.confirmedIndustry,
        confirmedMappings: mappings,
        confirmedTargetColumn: targetColumn,
        selectedChurnDefinition: editor.selectedChurnDefinition || "Customer churned or became inactive",
        followUpAnswers
      })

      const [snapshotResponse, historyResponse] = await Promise.all([
        getOnboardingSnapshot(datasetProfileId),
        getOnboardingHistory()
      ])
      applyLoadedState(
        snapshotResponse?.data || null,
        historyResponse?.data?.items || [],
        response?.data?.trainingReadiness || null,
        "Setup saved. Here is the readiness result."
      )
      toast.success("Setup confirmed", "The custom-model setup has been saved and rechecked.")
    } catch (error) {
      setView((prev) => ({ ...prev, error: error.message }))
      toast.error("Could not save setup", error.message)
    } finally {
      setView((prev) => ({ ...prev, confirming: false }))
    }
  }

  const recheckReadiness = async () => {
    const profileId = view.snapshot?.datasetProfile?._id || ""
    setView((prev) => ({ ...prev, checking: true, error: "", handoffError: "" }))
    try {
      const response = await getTrainingReadiness(profileId)
      setView((prev) => ({ ...prev, training: response?.data || null, message: "Readiness updated." }))
      toast.success("Readiness refreshed", "The latest setup has been checked again.")
    } catch (error) {
      setView((prev) => ({ ...prev, error: error.message }))
      toast.error("Could not refresh readiness", error.message)
    } finally {
      setView((prev) => ({ ...prev, checking: false }))
    }
  }

  const createHandoff = async () => {
    const profileId = view.snapshot?.datasetProfile?._id || ""
    setView((prev) => ({ ...prev, handoffing: true, error: "", handoffError: "" }))
    try {
      const response = await prepareTrainingHandoff(profileId)
      setView((prev) => ({ ...prev, handoff: response?.data || null, handoffError: "", message: "Training handoff prepared." }))
      toast.success("Training handoff ready", "The confirmed contract is ready for the Training page.")
    } catch (error) {
      setView((prev) => ({ ...prev, handoff: error.details || error.responseData?.details || null, handoffError: error.message }))
      toast.error("Could not prepare handoff", error.message)
    } finally {
      setView((prev) => ({ ...prev, handoffing: false }))
    }
  }

  const dataset = view.snapshot?.datasetProfile || null
  const schema = view.snapshot?.schemaProfile || null
  const ai = schema?.ai || dataset?.analysis?.ai || {}
  const readiness = view.training?.readiness || schema?.readiness || dataset?.analysis?.readiness || {}
  const confirmed = Boolean(dataset?.confirmation?.confirmedAt || schema?.confirmedTargetColumn)
  const orderedMappings = sortMappings(editor.mappingRows || [])
  const questions = ai.businessQuestions || []
  const answeredQuestions = getAnsweredQuestions(questions, editor.followUpAnswers || {})
  const suggestionLookup = useMemo(() => buildSuggestionLookup(view.snapshot), [view.snapshot])
  const aiSuggestedTargetColumn = ai.suggestedTargetColumn || dataset?.analysis?.targetCandidates?.[0] || ""
  const mappedRows = orderedMappings.filter((item) => item.targetField)
  const highConfidenceMappedRows = mappedRows.filter((item) => (suggestionLookup.get(item.sourceColumn)?.confidence || "medium") === "high")
  const reviewRows = orderedMappings.filter((item) => {
    const suggestion = suggestionLookup.get(item.sourceColumn)
    return !item.targetField || !suggestion || suggestion.confidence !== "high"
  })
  const targets = Array.from(
    new Set(
      [
        aiSuggestedTargetColumn,
        ...(dataset?.analysis?.targetCandidates || []),
        ...orderedMappings.filter((item) => item.targetField === "target_label").map((item) => item.sourceColumn)
      ].filter(Boolean)
    )
  )
  const status = getStatusCopy({ dataset, readiness, confirmed })
  const blockers = view.training?.readiness?.blockers || readiness.blockers || []
  const blockerFixes = buildBlockerFixes(blockers)
  const nextSteps = buildNextStepList({ dataset, confirmed, readiness, questions, answeredQuestions, blockers })
  const preview = view.handoff?.phase3ContractPreview || view.training?.phase3ContractPreview || null
  const stepCards = buildStepCards({ dataset, confirmed, readiness, handoff: view.handoff })
  const busyMessage = busyState ? BUSY_COPY[busyState]?.[busyMessageIndex] || "Working..." : ""
  const mainButtonTone = status.tone === "emerald" ? "border-emerald-300/30 bg-emerald-500/12 text-emerald-100" : status.tone === "amber" ? "border-amber-300/30 bg-amber-500/10 text-amber-100" : status.tone === "violet" ? "border-violet-300/25 bg-violet-500/10 text-violet-100" : "border-sky-300/25 bg-sky-500/10 text-sky-100"
  const showFirstTimeState = !view.loading && !dataset?._id
  const openUploadPicker = () => {
    if (typeof document === "undefined") return
    document.getElementById("phase2-upload-input")?.click()
  }

  if (view.loading && !view.snapshot) {
    return <WorkspacePageSkeleton stats={3} tableRows={3} />
  }

  return (
    <section className="space-y-5">
      <RevealSection className="workspace-hero">
        <p className="workspace-kicker">Custom Model Setup</p>
        <h2 className="mt-3 text-3xl text-white sm:text-[2.2rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
          Turn a client dataset into a clean churn-model setup.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/80">
          This page works in a simple order: upload a sample, let Gemini guess the column meanings, confirm or correct the guesses, then check whether the data is ready for a custom model.
        </p>
      </RevealSection>

      {showFirstTimeState ? (
        <JourneyEmptyState
          eyebrow="First custom-model step"
          title="Begin with one sample file and let Gemini explain it back to you"
          body="Upload a small CSV or XLSX sample. ChurnFlow will inspect the columns, guess what each one means, suggest the churn column, and only ask for the confirmations that still matter."
          highlights={[
            {
              kicker: "Good news",
              title: "You do not need a perfect dataset to begin",
              body: "A representative sample is enough for the first pass. We use that to set up the right questions and mappings."
            },
            {
              kicker: "What happens after upload",
              title: "Gemini turns raw columns into plain-language guidance",
              body: "That means a non-technical user can review the setup without understanding model attributes or training terms."
            }
          ]}
          actions={[
            { label: "Choose sample file", onClick: openUploadPicker },
            { label: "Open Training page", to: "/app/training", variant: "secondary" }
          ]}
        />
      ) : null}

      {busyState && (
        <RevealSection className="soft-panel border-sky-300/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(14,165,233,0.06))]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="workspace-kicker">Working on it</p>
              <p className="mt-2 text-base text-white">{busyMessage}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300/80">
                Keep this tab open. We will update the screen as soon as the current step finishes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300 animate-pulse" />
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300/70 animate-pulse [animation-delay:180ms]" />
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300/45 animate-pulse [animation-delay:360ms]" />
            </div>
          </div>
        </RevealSection>
      )}

      <RevealSection className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {stepCards.map((step) => {
          const stepTone =
            step.state === "done"
              ? "border-emerald-300/30 bg-emerald-500/10"
              : step.state === "active"
                ? "border-sky-300/25 bg-sky-500/10"
                : "border-white/10 bg-white/[0.035]"

          return (
            <div key={step.id} className={`rounded-[1.4rem] border px-4 py-4 ${stepTone}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{step.id}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                  step.state === "done"
                    ? "bg-emerald-400/15 text-emerald-200"
                    : step.state === "active"
                      ? "bg-sky-400/15 text-sky-200"
                      : "bg-white/5 text-slate-400"
                }`}>
                  {step.state === "done" ? "Done" : step.state === "active" ? "Current" : "Next"}
                </span>
              </div>
              <p className="mt-3 text-sm text-white">{step.title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{step.helper}</p>
              <p className="mt-3 text-xs leading-5 text-slate-300">{step.detail}</p>
            </div>
          )
        })}
      </RevealSection>

      <RevealSection className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <form className="soft-panel" onSubmit={upload}>
          <p className="workspace-kicker">Step 1</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Upload a small sample file
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Use a CSV or XLSX file with a few representative rows. We only need enough data to understand the columns and the churn label.
          </p>
          <label className="mt-5 block">
            <span className="field-label">Sample dataset</span>
                <input id="phase2-upload-input" type="file" accept=".csv,.xlsx" className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <label className="mt-4 block">
            <span className="field-label">Sheet name if needed</span>
            <input value={sheet} onChange={(event) => setSheet(event.target.value)} className="field-input" placeholder="Leave blank unless your workbook has multiple sheets" />
          </label>
          {file && (
            <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-black/20 px-4 py-4">
              <p className="workspace-kicker">Selected file</p>
              <p className="mt-2 text-sm text-white">{file.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {(file.size / 1024).toFixed(1)} KB • ready for Gemini review
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={view.submitting} className="btn-primary">{view.submitting ? "Analyzing sample..." : "Ask Gemini to review this file"}</button>
            <button type="button" className="btn-secondary" onClick={() => load()}>Load saved setup</button>
          </div>
        </form>

        <div className="soft-panel">
          <p className="workspace-kicker">What happens here</p>
          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            One clear step at a time
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>1. We inspect the file and Gemini guesses what the important columns mean.</p>
            <p>2. Gemini also guesses the most likely churn column for you.</p>
            <p>3. You only confirm the guesses, correct anything wrong, and answer any missing business questions.</p>
            <p>4. We tell you whether the dataset is ready for a custom model or what still needs fixing.</p>
          </div>
          <details className="mt-5 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
            <summary className="cursor-pointer text-sm text-white">See previous uploads</summary>
            <div className="mt-3 space-y-3">
              {(view.history || []).length ? view.history.map((item) => (
                <button key={item._id} type="button" onClick={() => load(item._id)} className={`w-full rounded-[1rem] border px-3 py-3 text-left transition ${String(item._id) === String(dataset?._id) ? "border-white/20 bg-white/[0.08]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"}`}>
                  <p className="text-sm text-white">{item.fileName}</p>
                  <p className="mt-1 text-xs text-slate-400">{pickLabel(INDUSTRY_LABELS, item.analysis?.suggestedIndustry, prettify(item.analysis?.suggestedIndustry))} • {item.rowCount || 0} rows • {formatDate(item.createdAt)}</p>
                </button>
              )) : <p className="text-sm text-slate-400">No saved uploads yet.</p>}
            </div>
          </details>
        </div>
      </RevealSection>

      {view.error && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{view.error}</p>}
      {view.message && <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{view.message}</p>}

      {dataset && (
        <>
          <RevealSection className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="soft-panel">
              <p className="workspace-kicker">Step 2</p>
              <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                What we found in your file
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="workspace-stat"><p className="workspace-kicker">Business type</p><p className="mt-2 text-white">{pickLabel(INDUSTRY_LABELS, schema?.suggestedIndustry || dataset?.analysis?.suggestedIndustry, prettify(schema?.suggestedIndustry || dataset?.analysis?.suggestedIndustry))}</p></div>
                <div className="workspace-stat"><p className="workspace-kicker">Rows checked</p><p className="mt-2 text-white">{dataset?.rowCount || 0}</p></div>
                <div className="workspace-stat"><p className="workspace-kicker">Gemini guessed churn column</p><p className="mt-2 text-white">{aiSuggestedTargetColumn || "Not sure yet"}</p></div>
                <div className="workspace-stat"><p className="workspace-kicker">Suggested mappings</p><p className="mt-2 text-white">{orderedMappings.filter((item) => item.targetField).length}</p></div>
              </div>
              <div className={`mt-4 rounded-[1.3rem] border px-4 py-4 ${mainButtonTone}`}>
                <p className="text-sm font-medium text-white">{status.title}</p>
                <p className="mt-2 text-sm leading-7 opacity-90">{status.body}</p>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-[0.14em] opacity-80">
                  <p>Next</p>
                  {nextSteps.map((item) => <p key={item} className="normal-case tracking-normal opacity-100">{item}</p>)}
                </div>
              </div>
            </div>

            <div className="soft-panel">
              <p className="workspace-kicker">Plain-language summary</p>
              <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                What the AI already guessed
              </h3>
              <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-200">
                {ai.executiveSummary || "We could not generate a business summary yet. Upload a file again if the AI layer was unavailable."}
              </div>
              <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="workspace-kicker">You only need to confirm these guesses</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <p><span className="text-slate-400">Guessed churn column:</span> {aiSuggestedTargetColumn || "No clear guess yet"}</p>
                  <p><span className="text-slate-400">Guessed mapped columns:</span> {mappedRows.length}</p>
                  <p><span className="text-slate-400">High-confidence guesses:</span> {highConfidenceMappedRows.length}</p>
                  <p><span className="text-slate-400">Questions left:</span> {answeredQuestions}/{questions.length}</p>
                </div>
              </div>
              {(ai.missingFieldExplanations || []).length > 0 && (
                <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="workspace-kicker">Fields that would make the model stronger later</p>
                  <div className="mt-3 space-y-3">
                    {ai.missingFieldExplanations.slice(0, 4).map((item) => (
                      <div key={`${item.field}-${item.reason}`}>
                        <p className="text-sm text-white">{item.field}</p>
                        <p className="mt-1 text-xs leading-6 text-slate-400">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </RevealSection>

          <RevealSection className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="soft-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="workspace-kicker">Step 3</p>
              <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Confirm Gemini&apos;s setup
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                    You are not mapping every column manually. Gemini already guessed which dataset columns matter, what they likely mean, and which one looks like the churn outcome. In most cases, you can accept that setup and only fix the few uncertain columns.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-secondary" onClick={applyGeminiSetup}>
                    Use Gemini setup
                  </button>
                  <button type="button" className="btn-primary" disabled={view.confirming} onClick={saveSetup}>{view.confirming ? "Saving and checking..." : "Confirm setup"}</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="field-label">Business type</span>
                  <select className="field-input" value={editor.confirmedIndustry} onChange={(event) => setEditor((prev) => ({ ...prev, confirmedIndustry: event.target.value }))}>
                    {INDUSTRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="field-label">Which column shows the real churn outcome?</span>
                  <select className="field-input" value={editor.confirmedTargetColumn} onChange={(event) => setEditor((prev) => ({ ...prev, confirmedTargetColumn: event.target.value }))}>
                    <option value="">Select the churn column</option>
                    {targets.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Gemini guessed: <span className="text-slate-200">{aiSuggestedTargetColumn || "No clear guess yet"}</span>
                  </p>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="field-label">In one sentence, what counts as churn here?</span>
                <input className="field-input" value={editor.selectedChurnDefinition} onChange={(event) => setEditor((prev) => ({ ...prev, selectedChurnDefinition: event.target.value }))} placeholder="Example: A customer is churned when they cancel their subscription" />
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="workspace-stat">
                  <p className="workspace-kicker">Churn guess</p>
                  <p className="mt-2 text-sm text-white">{aiSuggestedTargetColumn || "Choose it manually"}</p>
                </div>
                <div className="workspace-stat">
                  <p className="workspace-kicker">Questions answered</p>
                  <p className="mt-2 text-sm text-white">{answeredQuestions}/{questions.length}</p>
                </div>
                <div className="workspace-stat">
                  <p className="workspace-kicker">Mapped columns</p>
                  <p className="mt-2 text-sm text-white">{mappedRows.length}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="workspace-kicker">Gemini mapping summary</p>
                    <p className="mt-2 text-sm text-slate-300">These are Gemini&apos;s guesses for your dataset columns. We keep the internal model fields behind the scenes, so you mostly just need to confirm whether the guesses are correct.</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">{mappedRows.length} mapped</span>
                </div>
                <div className="mt-4 space-y-3">
                  {mappedRows.length ? mappedRows.slice(0, 8).map((row) => {
                    const suggestion = suggestionLookup.get(row.sourceColumn)
                    return (
                      <div key={row.sourceColumn} className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm text-white">{row.sourceColumn}</p>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                            {suggestion?.source === "ai" ? "Gemini guess" : "Mapped"}
                          </span>
                          {suggestion?.confidence ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                              {suggestion.confidence}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          Meaning: <span className="text-slate-200">{pickLabel(TARGET_LABELS, row.targetField, row.targetField)}</span>
                          {suggestion?.reason ? ` - ${suggestion.reason}` : ""}
                        </p>
                      </div>
                    )
                  }) : (
                    <p className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-400">
                      Gemini could not map enough columns yet. Use the advanced corrections below.
                    </p>
                  )}
                </div>

                <details className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <summary className="cursor-pointer text-sm text-white">
                    Open advanced corrections {reviewRows.length ? `(${reviewRows.length} columns may need review)` : ""}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Only change these if Gemini guessed something incorrectly or missed an important business column.
                  </p>
                  <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {orderedMappings.map((row) => {
                      const suggestion = suggestionLookup.get(row.sourceColumn)

                      return (
                        <div key={row.sourceColumn} className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm text-white">{row.sourceColumn}</p>
                            {suggestion ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                                {suggestion.source === "ai" ? "Gemini guess" : "Rule guess"}
                              </span>
                            ) : null}
                          </div>
                          {suggestion ? (
                            <p className="mt-2 text-xs leading-5 text-slate-400">
                              Suggested meaning: <span className="text-slate-200">{pickLabel(TARGET_LABELS, suggestion.targetField, suggestion.targetField)}</span>
                              {suggestion.reason ? ` - ${suggestion.reason}` : ""}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              No automatic guess yet. Choose the meaning manually if this column matters.
                            </p>
                          )}
                          <select className="field-input mt-3" value={row.targetField} onChange={(event) => changeMapping(row.sourceColumn, event.target.value)}>
                            {TARGETS.map(([value, label]) => <option key={value || "none"} value={value}>{label}</option>)}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                </details>
              </div>
            </div>

            <div className="soft-panel">
              <p className="workspace-kicker">Only answer what is still missing</p>
              <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Business questions that still matter
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                These are only here to fill the remaining gaps. If the file already makes the business meaning clear, this section stays short.
              </p>
              <div className="mt-4 space-y-3">
                {questions.length ? questions.map((question) => (
                  <label key={question} className="block rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                    <span className="text-sm text-white">{question}</span>
                    <textarea rows="3" className="field-input mt-3 resize-none" value={editor.followUpAnswers[question] || ""} onChange={(event) => setEditor((prev) => ({ ...prev, followUpAnswers: { ...prev.followUpAnswers, [question]: event.target.value } }))} placeholder="Type the business answer here" />
                  </label>
                )) : <p className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-400">No follow-up questions were needed for this file.</p>}
              </div>

              {(ai.normalizationSuggestions || []).length > 0 && (
                <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="workspace-kicker">Data cleanup suggestions</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                    {ai.normalizationSuggestions.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </div>
              )}
            </div>
          </RevealSection>

          <RevealSection className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="soft-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="workspace-kicker">Step 4</p>
                  <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                    Readiness result
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Once the setup is saved, this section tells you clearly whether the dataset is ready or what still needs to be fixed.
                  </p>
                </div>
                <button type="button" className="btn-secondary" disabled={view.checking || !confirmed} onClick={recheckReadiness}>{view.checking ? "Checking..." : "Check readiness again"}</button>
              </div>

              <div className={`mt-4 rounded-[1.3rem] border px-4 py-4 ${mainButtonTone}`}>
                <p className="text-sm font-medium text-white">{status.title}</p>
                <p className="mt-2 text-sm leading-7 opacity-90">{status.body}</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="workspace-stat"><p className="workspace-kicker">Ready for custom model</p><p className="mt-2 text-white">{readiness.readyForCustomTraining ? "Yes" : "No"}</p></div>
                <div className="workspace-stat"><p className="workspace-kicker">Ready for telecom starter path</p><p className="mt-2 text-white">{readiness.readyForTelecomPrediction ? "Yes" : "No"}</p></div>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="workspace-kicker">How to fix this</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  {blockerFixes.length ? blockerFixes.map((item) => <p key={item}>{item}</p>) : <p className="text-emerald-200">No blockers found. The setup is ready for the next phase.</p>}
                </div>
              </div>

              {confirmed && readiness.readyForCustomTraining && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="btn-primary" disabled={view.handoffing} onClick={createHandoff}>{view.handoffing ? "Preparing..." : "Prepare Phase 3 handoff"}</button>
                  <Link to="/app/training" className="btn-secondary">
                    Open Training page
                  </Link>
                </div>
              )}

              {view.handoffError && <div className="mt-4 rounded-[1.2rem] border border-amber-300/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">{view.handoffError}</div>}
            </div>

            <div className="soft-panel">
              <p className="workspace-kicker">What happens next</p>
              <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Next action for your team
              </h3>
              <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-200">
                <div className="space-y-2">{nextSteps.map((item) => <p key={item}>{item}</p>)}</div>
              </div>
              {preview && (
                <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="workspace-kicker">Training handoff preview</p>
                  <div className="mt-3 space-y-3 text-sm text-slate-200">
                    <p><span className="text-slate-400">Target column:</span> {preview.targetColumn || "-"}</p>
                    <p><span className="text-slate-400">Rows available:</span> {preview.rowCount || dataset?.rowCount || 0}</p>
                    <p className="text-slate-400">Feature mappings</p>
                    <div className="space-y-2">
                      {(preview.featureMappings || []).length ? preview.featureMappings.map((item) => (
                        <div key={`${item.sourceColumn}-${item.targetField}`} className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-3">
                          <p className="text-white">{item.sourceColumn}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{pickLabel(TARGET_LABELS, item.targetField, item.targetField)}</p>
                        </div>
                      )) : <p className="text-slate-400">No confirmed mappings yet.</p>}
                    </div>
                  </div>
                </div>
              )}

              <details className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                <summary className="cursor-pointer whitespace-nowrap text-sm text-white">See raw file preview</summary>
                {dataset?.sampleRows?.length ? <div className="mt-3 overflow-x-auto text-xs leading-6 text-slate-200"><pre>{JSON.stringify(dataset.sampleRows, null, 2)}</pre></div> : <p className="mt-3 text-sm text-slate-400">No sample rows available.</p>}
              </details>
            </div>
          </RevealSection>
        </>
      )}
    </section>
  )
}

export default CustomOnboardingPage

