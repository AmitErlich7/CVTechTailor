/**
 * Tailor page — three-step flow:
 *  Step 1: JD input form
 *  Step 2: Loading with step indicators
 *  Step 3: Diff view + gap report + approve / export
 *
 * Also handles viewing a previously tailored resume by ID
 * (route: /tailor/:id).
 */
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ExportBar from '../components/ExportBar.jsx'
import GapReport from '../components/GapReport.jsx'
import JDInput from '../components/JDInput.jsx'
import Nav from '../components/Nav.jsx'
import ResumeDiff from '../components/ResumeDiff.jsx'
import { approveResume, atsScoreResume, getTailorResume, tailorResume } from '../services/api.js'
import { useProfile } from '../hooks/useProfile.js'

const AI_STEPS = [
  { label: 'Analyzing job description', sublabel: 'Extracting required skills, responsibilities, and seniority' },
  { label: 'Tailoring your resume', sublabel: 'Rewriting bullets and projects to match JD language' },
  { label: 'Fact-checking & gap analysis', sublabel: 'Verifying claims and identifying skill gaps' },
]

export default function Tailor() {
  const { id: resumeIdParam } = useParams()
  const { profile } = useProfile()

  const [view, setView] = useState(resumeIdParam ? 'loading' : 'input') // 'input' | 'running' | 'result' | 'loading'
  const [jdForm, setJdForm] = useState({ jdText: '', jobTitle: '', company: '' })
  const [currentStep, setCurrentStep] = useState(0)
  const [resume, setResume] = useState(null)
  const [error, setError] = useState(null)

  // Approve state
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const diffRef = useRef(null)

  // ATS score state
  const [atsScoring, setAtsScoring] = useState(false)
  const [atsError, setAtsError] = useState(null)

  // Load existing resume by ID
  useEffect(() => {
    if (resumeIdParam) {
      getTailorResume(resumeIdParam)
        .then((r) => {
          setResume(r)
          setView('result')
        })
        .catch((err) => {
          setError(err.message)
          setView('input')
        })
    }
  }, [resumeIdParam])

  // Scroll detection for enabling the Approve button
  useEffect(() => {
    if (view !== 'result') return
    const el = diffRef.current
    if (!el) return
    const handler = () => {
      const scrollable = el.querySelector('[data-scroll]')
      if (!scrollable) {
        setHasScrolled(true)
        return
      }
      const { scrollTop, scrollHeight, clientHeight } = scrollable
      if (scrollHeight - scrollTop - clientHeight < 80) {
        setHasScrolled(true)
      }
    }
    // If content is short, allow approve immediately
    setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 200) setHasScrolled(true)
    }, 500)
    el.addEventListener('scroll', handler, true)
    return () => el.removeEventListener('scroll', handler, true)
  }, [view, resume])

  const handleSubmit = async () => {
    setError(null)
    setCurrentStep(0)
    setView('running')

    // Simulate step progression (we don't have streaming, so we advance on a timer)
    const stepTimer = setInterval(() => {
      setCurrentStep((s) => {
        if (s < AI_STEPS.length - 1) return s + 1
        clearInterval(stepTimer)
        return s
      })
    }, 4000)

    try {
      const result = await tailorResume({
        jd_text: jdForm.jdText,
        job_title: jdForm.jobTitle,
        company: jdForm.company,
      })
      clearInterval(stepTimer)
      setResume(result)
      setView('result')
    } catch (err) {
      clearInterval(stepTimer)
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
    } catch (err) {
      setApproveError(err.message)
    } finally {
      setApproving(false)
    }
  }

  const handleAtsScore = async () => {
    setAtsScoring(true)
    setAtsError(null)
    try {
      const result = await atsScoreResume(resume.id)
      setResume(result.resume)
    } catch (err) {
      setAtsError(err.message)
    } finally {
      setAtsScoring(false)
    }
  }

  return (
    <div style={t.page}>
      <Nav />
      <main style={t.main} ref={diffRef}>

        {/* Step 1: JD Input */}
        {view === 'input' && (
          <>
            {error && <div style={t.error}>{error}</div>}
            <JDInput
              value={jdForm}
              onChange={setJdForm}
              onSubmit={handleSubmit}
              loading={false}
            />
          </>
        )}

        {/* Step 2: Running — step indicators */}
        {view === 'running' && (
          <div style={t.runningWrap}>
            <div style={t.runningCard}>
              <div style={t.spinner} />
              <h2 style={t.runningTitle}>Tailoring your resume…</h2>
              <p style={t.runningHint}>This takes about 20-40 seconds. Please don't close this tab.</p>
              <div style={t.steps}>
                {AI_STEPS.map((step, i) => (
                  <div key={i} style={{ ...t.step, ...(i === currentStep ? t.stepActive : i < currentStep ? t.stepDone : t.stepPending) }}>
                    <div style={t.stepDot}>
                      {i < currentStep ? '✓' : i === currentStep ? '…' : i + 1}
                    </div>
                    <div>
                      <div style={t.stepLabel}>{step.label}</div>
                      <div style={t.stepSub}>{step.sublabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading existing resume */}
        {view === 'loading' && (
          <div style={t.runningWrap}>
            <div style={t.spinner} />
          </div>
        )}

        {/* Step 3: Results */}
        {view === 'result' && resume && (
          <div>
            <div style={t.resultHeader}>
              <div>
                <h1 style={t.resultTitle}>{resume.job_title}</h1>
                <p style={t.resultCompany}>@ {resume.company}</p>
              </div>
              <div style={{ ...t.statusBadge, ...statusStyle(resume.status) }}>
                {resume.status}
              </div>
            </div>

            {/* Match score */}
            <div style={t.scoreBar}>
              <span style={t.scoreLabel}>ATS Match Score</span>
              <div style={t.scoreTrack}>
                <div style={{ ...t.scoreFill, width: `${resume.match_score}%`, background: scoreColor(resume.match_score) }} />
              </div>
              <span style={{ ...t.scoreNum, color: scoreColor(resume.match_score) }}>{resume.match_score}%</span>
            </div>

            {/* Flagged claims warning */}
            {resume.flagged_claims?.length > 0 && (
              <div style={t.flaggedBanner}>
                ⚠️ <strong>{resume.flagged_claims.length} flagged claim{resume.flagged_claims.length > 1 ? 's' : ''}:</strong> The AI could not trace these to your original profile. Review them carefully in the diff below (highlighted in red) before approving.
              </div>
            )}

            {/* Split diff view */}
            <ResumeDiff
              resume={resume}
              originalProfile={profile || {}}
            />

            {/* Gap report */}
            <GapReport
              gapReport={resume.gap_report}
              matchScore={resume.match_score}
            />

            {/* Approve / Export */}
            {resume.status === 'draft' && (
              <div style={t.approveSection}>
                {!hasScrolled && (
                  <p style={t.scrollHint}>Scroll through the full diff above to enable approval.</p>
                )}
                {approveError && <p style={t.approveError}>{approveError}</p>}
                <button
                  data-testid="approve-resume"
                  style={{ ...t.approveBtn, opacity: hasScrolled && !approving ? 1 : 0.4 }}
                  disabled={!hasScrolled || approving}
                  onClick={handleApprove}
                >
                  {approving ? 'Approving…' : '✓ Approve & Unlock Export'}
                </button>
              </div>
            )}

            {/* ATS Score panel */}
            <AtsScorePanel
              atsScore={resume.ats_score}
              loading={atsScoring}
              error={atsError}
              onScore={handleAtsScore}
            />

            <ExportBar resumeId={resume.id} status={resume.status} />

            {/* Tailor another */}
            {!resumeIdParam && (
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <button style={t.anotherBtn} onClick={() => { setView('input'); setResume(null); setHasScrolled(false) }}>
                  ← Tailor Another Resume
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function AtsScorePanel({ atsScore, loading, error, onScore }) {
  const score = atsScore?.score
  const breakdown = atsScore?.breakdown || {}
  const breakdownDefs = [
    { key: 'keywords', label: 'Keywords', max: 25 },
    { key: 'formatting', label: 'Formatting', max: 20 },
    { key: 'structure', label: 'Structure', max: 20 },
    { key: 'content_quality', label: 'Content Quality', max: 20 },
    { key: 'contact', label: 'Contact Info', max: 15 },
  ]

  return (
    <div style={t.atsPanel}>
      <div style={t.atsPanelHeader}>
        <div>
          <div style={t.atsPanelTitle}>ATS Compatibility Score</div>
          <div style={t.atsPanelSub}>AI agent scans your CV like an ATS system would</div>
        </div>
        <button
          style={{ ...t.atsBtn, opacity: loading ? 0.6 : 1 }}
          onClick={onScore}
          disabled={loading}
        >
          {loading ? 'Scoring…' : score != null ? '↻ Re-score' : 'Score my CV'}
        </button>
      </div>

      {error && <div style={t.atsError}>{error}</div>}

      {score != null && (
        <div style={t.atsBody}>
          {/* Big score */}
          <div style={t.atsBigScore}>
            <div style={{ ...t.atsBigNum, color: atsColor(score) }}>{score}</div>
            <div style={t.atsBigLabel}>/ 100</div>
            <div style={{ ...t.atsBigGrade, color: atsColor(score) }}>{atsGrade(score)}</div>
          </div>

          {/* Breakdown bars */}
          <div style={t.atsBreakdown}>
            {breakdownDefs.map(({ key, label, max }) => {
              const val = breakdown[key] ?? 0
              const pct = Math.round((val / max) * 100)
              return (
                <div key={key} style={t.atsBarRow}>
                  <div style={t.atsBarLabel}>{label}</div>
                  <div style={t.atsBarTrack}>
                    <div style={{ ...t.atsBarFill, width: `${pct}%`, background: atsColor(pct) }} />
                  </div>
                  <div style={t.atsBarScore}>{val}/{max}</div>
                </div>
              )
            })}
          </div>

          {/* Strengths */}
          {atsScore.strengths?.length > 0 && (
            <div style={t.atsSection}>
              <div style={t.atsSectionTitle}>Strengths</div>
              {atsScore.strengths.map((s, i) => (
                <div key={i} style={t.atsItem}>✓ {s}</div>
              ))}
            </div>
          )}

          {/* Issues */}
          {atsScore.issues?.length > 0 && (
            <div style={t.atsSection}>
              <div style={t.atsSectionTitle}>Issues</div>
              {atsScore.issues.map((s, i) => (
                <div key={i} style={{ ...t.atsItem, color: '#dc2626' }}>✗ {s}</div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {atsScore.recommendations?.length > 0 && (
            <div style={t.atsSection}>
              <div style={t.atsSectionTitle}>Recommendations</div>
              {atsScore.recommendations.map((s, i) => (
                <div key={i} style={{ ...t.atsItem, color: '#2563eb' }}>→ {s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function atsColor(score) {
  if (score >= 75) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function atsGrade(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs Work'
}

function statusStyle(status) {
  const map = {
    draft: { background: '#fef9c3', color: '#854d0e' },
    approved: { background: '#dcfce7', color: '#166534' },
    exported: { background: '#dbeafe', color: '#1e40af' },
    archived: { background: '#f1f5f9', color: '#64748b' },
  }
  return map[status] || {}
}

function scoreColor(score) {
  if (score >= 75) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

const t = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '20px',
  },
  runningWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  runningCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '48px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 24px',
  },
  runningTitle: { fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
  runningHint: { fontSize: '14px', color: '#64748b', marginBottom: '32px' },
  steps: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    transition: 'background 0.3s',
  },
  stepActive: { background: '#eff6ff' },
  stepDone: { background: '#f0fdf4' },
  stepPending: { background: '#f8fafc', opacity: 0.5 },
  stepDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#2563eb',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
  stepLabel: { fontWeight: '600', fontSize: '14px', color: '#1e293b' },
  stepSub: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  resultHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  resultTitle: { fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' },
  resultCompany: { fontSize: '16px', color: '#64748b' },
  statusBadge: {
    padding: '4px 14px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scoreBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  scoreLabel: { fontSize: '13px', fontWeight: '600', color: '#64748b', minWidth: '130px' },
  scoreTrack: { flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: '4px', transition: 'width 0.6s ease' },
  scoreNum: { fontWeight: '700', fontSize: '16px', minWidth: '44px', textAlign: 'right' },
  flaggedBanner: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#991b1b',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  approveSection: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '24px',
    textAlign: 'center',
  },
  scrollHint: { fontSize: '13px', color: '#94a3b8', marginBottom: '12px' },
  approveError: { fontSize: '13px', color: '#dc2626', marginBottom: '12px' },
  approveBtn: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  anotherBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
  },
  atsPanel: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px 24px',
    marginTop: '24px',
  },
  atsPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  atsPanelTitle: { fontWeight: '700', fontSize: '15px', color: '#1e293b' },
  atsPanelSub: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  atsBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  atsError: { color: '#dc2626', fontSize: '13px', marginBottom: '12px' },
  atsBody: { display: 'flex', flexDirection: 'column', gap: '20px' },
  atsBigScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  atsBigNum: { fontSize: '48px', fontWeight: '800', lineHeight: 1 },
  atsBigLabel: { fontSize: '20px', color: '#94a3b8', fontWeight: '600' },
  atsBigGrade: { fontSize: '16px', fontWeight: '700', marginLeft: '8px' },
  atsBreakdown: { display: 'flex', flexDirection: 'column', gap: '6px' },
  atsBarRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  atsBarLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', width: '110px', flexShrink: 0 },
  atsBarTrack: { flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' },
  atsBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  atsBarScore: { fontSize: '11px', color: '#94a3b8', width: '36px', textAlign: 'right', flexShrink: 0 },
  atsSection: {},
  atsSectionTitle: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  atsItem: { fontSize: '13px', color: '#374151', marginBottom: '4px', lineHeight: '1.5' },
}
