import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExportBar from '../components/ExportBar.jsx'
import GapReport from '../components/GapReport.jsx'
import JDInput from '../components/JDInput.jsx'
import Nav from '../components/Nav.jsx'
import ResumeDiff from '../components/ResumeDiff.jsx'
import { approveResume, atsScoreResume, getTailorResume, tailorResume } from '../services/api.js'
import { useProfile } from '../hooks/useProfile.js'

const AI_STEPS = [
  { label: 'Analyzing job description', sub: 'Extracting required skills, responsibilities, and seniority' },
  { label: 'Tailoring your resume',     sub: 'Rewriting bullets and projects to match JD language' },
  { label: 'Fact-checking & gap analysis', sub: 'Verifying claims and identifying skill gaps' },
]

const STATUS = {
  draft:    { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
  approved: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  exported: { bg: 'var(--color-info-bg)',    text: 'var(--color-info)' },
  archived: { bg: 'var(--color-surface-raised)', text: 'var(--color-text-3)' },
}

export default function Tailor() {
  const { id: resumeIdParam } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()

  const [view, setView] = useState(resumeIdParam ? 'loading' : 'input')
  const [jdForm, setJdForm] = useState({ jdText: '', jobTitle: '', company: '' })
  const [currentStep, setCurrentStep] = useState(0)
  const [resume, setResume] = useState(null)
  const [error, setError] = useState(null)

  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)
  const mainRef = useRef(null)

  const [atsScoring, setAtsScoring] = useState(false)
  const [atsError, setAtsError] = useState(null)

  useEffect(() => {
    if (resumeIdParam) {
      getTailorResume(resumeIdParam)
        .then((r) => { setResume(r); setView('result') })
        .catch(() => setView('input'))
    }
  }, [resumeIdParam])

  useEffect(() => {
    if (view !== 'result') return
    const el = mainRef.current
    if (!el) return
    const check = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const maxScroll = scrollHeight - clientHeight
      const pct = maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 100
      setScrollProgress(pct)
      if (pct >= 85) setHasScrolled(true)
    }
    setTimeout(() => {
      const { scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight + 200) { setHasScrolled(true); setScrollProgress(100) }
    }, 600)
    el.addEventListener('scroll', check)
    return () => el.removeEventListener('scroll', check)
  }, [view, resume])

  const handleSubmit = async () => {
    setError(null)
    setCurrentStep(0)
    setView('running')
    const timer = setInterval(() => {
      setCurrentStep((s) => { if (s < AI_STEPS.length - 1) return s + 1; clearInterval(timer); return s })
    }, 4000)
    try {
      const result = await tailorResume({ jd_text: jdForm.jdText, job_title: jdForm.jobTitle, company: jdForm.company })
      clearInterval(timer)
      setResume(result)
      setView('result')
    } catch (err) {
      clearInterval(timer)
      setError(err.message)
      setView('input')
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    setApproveError(null)
    try {
      const updated = await approveResume(resume.id, true)
      setResume(updated)
    } catch (err) { setApproveError(err.message) }
    finally { setApproving(false) }
  }

  const handleAtsScore = async () => {
    setAtsScoring(true)
    setAtsError(null)
    try {
      const result = await atsScoreResume(resume.id)
      setResume(result.resume)
    } catch (err) { setAtsError(err.message) }
    finally { setAtsScoring(false) }
  }

  const resetToInput = () => {
    setView('input'); setResume(null); setHasScrolled(false)
    setScrollProgress(0); setError(null); setApproveError(null); setAtsError(null)
  }

  return (
    <div className="app-shell">
      <Nav />
      <main className="page-main" ref={mainRef}>
        <div className={view === 'result' ? 'page-content--wide' : 'page-content'}>

          {/* ── Input ── */}
          {view === 'input' && (
            <>
              {error && <div style={t.error}>{error}</div>}
              <JDInput value={jdForm} onChange={setJdForm} onSubmit={handleSubmit} />
            </>
          )}

          {/* ── Running ── */}
          {view === 'running' && (
            <div style={t.centeredWrap}>
              <div style={t.runCard}>
                <div style={t.spinner} />
                <h2 style={t.runTitle}>Tailoring your resume</h2>
                <p style={t.runHint}>This takes 20–40 seconds. Don't close this tab.</p>
                <div style={t.steps}>
                  {AI_STEPS.map((step, i) => {
                    const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'
                    return (
                      <div key={i} style={{ ...t.step, ...t[`step_${state}`] }}>
                        <div style={{ ...t.stepDot, ...(state === 'done' ? t.stepDotDone : state === 'active' ? t.stepDotActive : t.stepDotPending) }}>
                          {state === 'done' ? (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          ) : state === 'active' ? (
                            <span style={t.activePulse} />
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 700 }}>{i + 1}</span>
                          )}
                        </div>
                        <div>
                          <div style={t.stepLabel}>{step.label}</div>
                          <div style={t.stepSub}>{step.sub}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Loading existing resume ── */}
          {view === 'loading' && (
            <div style={t.centeredWrap}>
              <div style={t.spinner} />
            </div>
          )}

          {/* ── Result ── */}
          {view === 'result' && resume && (
            <div style={{ animation: 'fadeIn 0.25s ease-out' }}>

              {/* Page header */}
              <header style={t.pageHeader}>
                <div>
                  {!resumeIdParam && (
                    <button style={t.backBtn} onClick={resetToInput}>← New tailor</button>
                  )}
                  {resumeIdParam && (
                    <button style={t.backBtn} onClick={() => navigate('/versions')}>← All versions</button>
                  )}
                  <h1 style={t.resultTitle}>{resume.job_title}</h1>
                  <p style={t.resultCompany}>{resume.company}</p>
                </div>
                <div style={t.resultMeta}>
                  <span style={{ ...t.badge, ...STATUS[resume.status] }}>{resume.status}</span>
                  <span style={{ ...t.matchScore, color: scoreColor(resume.match_score) }}>
                    {resume.match_score}% match
                  </span>
                </div>
              </header>

              {/* Two-column body */}
              <div className="tailor-body">

                {/* ── Left: content ── */}
                <div>
                  {resume.flagged_claims?.length > 0 && (
                    <div style={t.flagBanner}>
                      <span style={t.flagIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </span>
                      <span>
                        <strong>{resume.flagged_claims.length} flagged claim{resume.flagged_claims.length > 1 ? 's' : ''}.</strong>{' '}
                        The AI couldn't trace these to your profile. Review the highlighted items in the diff before approving.
                      </span>
                    </div>
                  )}
                  <ResumeDiff resume={resume} originalProfile={profile || {}} />
                  <GapReport gapReport={resume.gap_report} matchScore={resume.match_score} />
                </div>

                {/* ── Right: sticky action panel ── */}
                <aside className="tailor-aside">

                  {/* Approve card */}
                  {resume.status === 'draft' && (
                    <div style={t.actionCard}>
                      <div style={t.actionCardTitle}>Approve resume</div>
                      <p style={t.actionCardHint}>
                        {hasScrolled
                          ? 'Looking good. Approve to unlock DOCX and PDF export.'
                          : 'Scroll through the full diff to enable approval.'}
                      </p>
                      <div style={t.progressTrack}>
                        <div style={{ ...t.progressBar, width: `${scrollProgress}%`, background: hasScrolled ? 'var(--color-success)' : 'var(--color-accent)' }} />
                      </div>
                      {approveError && <p style={t.approveError}>{approveError}</p>}
                      <button
                        data-testid="approve-resume"
                        style={{ ...t.approveBtn, opacity: hasScrolled && !approving ? 1 : 0.4 }}
                        disabled={!hasScrolled || approving}
                        onClick={handleApprove}
                      >
                        {approving ? 'Approving…' : 'Approve & unlock export'}
                      </button>
                    </div>
                  )}

                  {/* Export card */}
                  {(resume.status === 'approved' || resume.status === 'exported') && (
                    <ExportBar resumeId={resume.id} status={resume.status} compact />
                  )}

                  {/* ATS score */}
                  <AtsScorePanel
                    atsScore={resume.ats_score}
                    loading={atsScoring}
                    error={atsError}
                    onScore={handleAtsScore}
                  />
                </aside>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

/* ── ATS Score Panel ────────────────────────────────────────────────────────── */
function AtsScorePanel({ atsScore, loading, error, onScore }) {
  const score = atsScore?.score
  const breakdown = atsScore?.breakdown || {}
  const breakdownDefs = [
    { key: 'keywords',        label: 'Keywords',        max: 25 },
    { key: 'formatting',      label: 'Formatting',      max: 20 },
    { key: 'structure',       label: 'Structure',       max: 20 },
    { key: 'content_quality', label: 'Content quality', max: 20 },
    { key: 'contact',         label: 'Contact info',    max: 15 },
  ]

  return (
    <div style={t.atsCard}>
      <div style={t.atsHead}>
        <div>
          <div style={t.atsTitle}>ATS score</div>
          <div style={t.atsSub}>How an ATS system reads your CV</div>
        </div>
        <button style={{ ...t.atsBtn, opacity: loading ? 0.6 : 1 }} onClick={onScore} disabled={loading}>
          {loading ? 'Scoring…' : score != null ? 'Re-score' : 'Score CV'}
        </button>
      </div>

      {error && <p style={t.atsError}>{error}</p>}

      {score != null && (
        <div style={t.atsBody}>
          <div style={t.atsBigRow}>
            <span style={{ ...t.atsBigNum, color: atsColor(score) }}>{score}</span>
            <div style={t.atsBigRight}>
              <span style={t.atsBigOf}>/100</span>
              <span style={{ ...t.atsGrade, color: atsColor(score) }}>{atsGrade(score)}</span>
            </div>
          </div>

          <div style={t.atsBreakdown}>
            {breakdownDefs.map(({ key, label, max }) => {
              const val = breakdown[key] ?? 0
              const pct = Math.round((val / max) * 100)
              return (
                <div key={key} style={t.atsBarRow}>
                  <span style={t.atsBarLabel}>{label}</span>
                  <div style={t.atsBarTrack}>
                    <div style={{ ...t.atsBarFill, width: `${pct}%`, background: atsColor(pct) }} />
                  </div>
                  <span style={t.atsBarScore}>{val}/{max}</span>
                </div>
              )
            })}
          </div>

          {atsScore.strengths?.length > 0 && (
            <AtsSection title="Strengths" items={atsScore.strengths} color="var(--color-success)" prefix="✓" />
          )}
          {atsScore.issues?.length > 0 && (
            <AtsSection title="Issues" items={atsScore.issues} color="var(--color-error)" prefix="✗" />
          )}
          {atsScore.recommendations?.length > 0 && (
            <AtsSection title="Recommendations" items={atsScore.recommendations} color="var(--color-info)" prefix="→" />
          )}
        </div>
      )}
    </div>
  )
}

function AtsSection({ title, items, color, prefix }) {
  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      <div style={t.atsSectionTitle}>{title}</div>
      {items.map((s, i) => (
        <div key={i} style={{ ...t.atsItem, color }}>{prefix} {s}</div>
      ))}
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 75) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-error)'
}

function atsColor(score) {
  if (score >= 75) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-error)'
}

function atsGrade(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs work'
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const t = {
  error: {
    background: 'var(--color-error-bg)',
    border: '1px solid oklch(88% 0.08 22)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    color: 'var(--color-error)',
    fontSize: '13px',
    marginBottom: 'var(--space-5)',
  },

  /* Running */
  centeredWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  runCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl, 16px)',
    padding: 'var(--space-12) var(--space-10)',
    textAlign: 'center',
    maxWidth: '480px',
    width: '100%',
    boxShadow: 'var(--shadow-md)',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '2.5px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    margin: '0 auto var(--space-6)',
  },
  runTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700,
    color: 'var(--color-text)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em',
  },
  runHint: { fontSize: '13.5px', color: 'var(--color-text-3)', marginBottom: 'var(--space-8)' },
  steps: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  step: {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', transition: 'background 0.3s',
  },
  step_active:  { background: 'var(--color-accent-subtle)' },
  step_done:    { background: 'var(--color-success-bg)' },
  step_pending: { background: 'transparent', opacity: 0.45 },
  stepDot: {
    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:    { background: 'var(--color-success)', color: 'white' },
  stepDotActive:  { background: 'var(--color-accent)', color: 'white' },
  stepDotPending: { background: 'var(--color-border)', color: 'var(--color-text-3)' },
  activePulse: {
    display: 'block', width: '8px', height: '8px', borderRadius: '50%',
    background: 'white', animation: 'pulse 1.2s ease-in-out infinite',
  },
  stepLabel: { fontWeight: 600, fontSize: '13.5px', color: 'var(--color-text)', marginBottom: '2px' },
  stepSub:   { fontSize: '12px', color: 'var(--color-text-3)' },

  /* Result header */
  pageHeader: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 'var(--space-8)', gap: 'var(--space-4)', flexWrap: 'wrap',
  },
  backBtn: {
    background: 'none', border: 'none', padding: 0,
    fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-3)',
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
    marginBottom: 'var(--space-2)', display: 'block',
    letterSpacing: '0.01em',
  },
  resultTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700,
    color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 'var(--space-1)',
  },
  resultCompany: { fontSize: '14px', color: 'var(--color-text-3)' },
  resultMeta: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 },
  badge: {
    padding: '3px 10px', borderRadius: 'var(--radius-full)',
    fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
  },
  matchScore: { fontSize: '15px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },

  /* Flag banner */
  flagBanner: {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
    background: 'var(--color-error-bg)', border: '1px solid oklch(88% 0.08 22)',
    borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
    fontSize: '13px', color: 'var(--color-error)', marginBottom: 'var(--space-5)', lineHeight: '1.6',
  },
  flagIcon: { flexShrink: 0, marginTop: '1px' },

  /* Action cards (aside) */
  actionCard: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
  },
  actionCardTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700,
    color: 'var(--color-text)', marginBottom: 'var(--space-2)', letterSpacing: '-0.01em',
  },
  actionCardHint: {
    fontSize: '12.5px', color: 'var(--color-text-3)', lineHeight: '1.55',
    marginBottom: 'var(--space-4)',
  },
  progressTrack: {
    height: '4px', background: 'var(--color-border)', borderRadius: '2px',
    overflow: 'hidden', marginBottom: 'var(--space-4)',
  },
  progressBar: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease, background 0.5s ease' },
  approveError: { fontSize: '12.5px', color: 'var(--color-error)', marginBottom: 'var(--space-3)' },
  approveBtn: {
    background: 'var(--color-success)', color: 'white', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '10px var(--space-4)',
    fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', width: '100%', transition: 'opacity 0.15s',
    letterSpacing: '-0.01em',
  },

  /* ATS card */
  atsCard: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
  },
  atsHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' },
  atsTitle: { fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: 'var(--color-text)', letterSpacing: '-0.01em' },
  atsSub:   { fontSize: '11.5px', color: 'var(--color-text-3)', marginTop: '2px' },
  atsBtn: {
    background: 'var(--color-accent)', color: 'white', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '6px var(--space-3)',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', flexShrink: 0, whiteSpace: 'nowrap',
  },
  atsError: { fontSize: '12.5px', color: 'var(--color-error)', marginBottom: 'var(--space-3)' },
  atsBody: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  atsBigRow: { display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' },
  atsBigNum: { fontSize: '44px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  atsBigRight: { display: 'flex', flexDirection: 'column', gap: '2px' },
  atsBigOf: { fontSize: '16px', color: 'var(--color-text-3)', fontWeight: 600 },
  atsGrade: { fontSize: '13px', fontWeight: 700 },
  atsBreakdown: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  atsBarRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  atsBarLabel: { fontSize: '11.5px', fontWeight: 500, color: 'var(--color-text-2)', width: '96px', flexShrink: 0 },
  atsBarTrack: { flex: 1, height: '5px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' },
  atsBarFill:  { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  atsBarScore: { fontSize: '11px', color: 'var(--color-text-3)', width: '30px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  atsSectionTitle: {
    fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--color-text-3)', marginBottom: 'var(--space-1)',
  },
  atsItem: { fontSize: '12.5px', marginBottom: 'var(--space-1)', lineHeight: '1.5' },
}
