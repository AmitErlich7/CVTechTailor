import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { deleteResume, downloadBlob, exportDocx, exportPdf, getTailorVersions } from '../services/api.js'

const STATUS = {
  draft:    { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
  approved: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  exported: { bg: 'var(--color-info-bg)',    text: 'var(--color-info)' },
  archived: { bg: 'var(--color-surface-raised)', text: 'var(--color-text-3)' },
}

export default function Versions() {
  const navigate = useNavigate()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    getTailorVersions()
      .then(setVersions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const setAction = (id, action, val) =>
    setActionLoading((prev) => ({ ...prev, [`${id}_${action}`]: val }))
  const isAction = (id, action) => !!actionLoading[`${id}_${action}`]

  const handleDocx = async (v) => {
    setAction(v.id, 'docx', true)
    try {
      const { blob, filename } = await exportDocx(v.id)
      downloadBlob(blob, filename)
      setVersions((prev) => prev.map((r) => r.id === v.id ? { ...r, status: 'exported' } : r))
    } catch (err) { alert(`Export failed: ${err.message}`) }
    finally { setAction(v.id, 'docx', false) }
  }

  const handlePdf = async (v) => {
    setAction(v.id, 'pdf', true)
    try {
      const { blob, filename } = await exportPdf(v.id)
      downloadBlob(blob, filename)
      setVersions((prev) => prev.map((r) => r.id === v.id ? { ...r, status: 'exported' } : r))
    } catch (err) { alert(`Export failed: ${err.message}`) }
    finally { setAction(v.id, 'pdf', false) }
  }

  const handleDelete = async (v) => {
    if (!window.confirm(`Archive "${v.job_title} @ ${v.company}"? This is reversible.`)) return
    setAction(v.id, 'del', true)
    try {
      await deleteResume(v.id)
      setVersions((prev) => prev.filter((r) => r.id !== v.id))
    } catch (err) { alert(`Delete failed: ${err.message}`) }
    finally { setAction(v.id, 'del', false) }
  }

  return (
    <div className="app-shell">
      <Nav />
      <main className="page-main">
        <div className="page-content--wide">

          <header style={v.header}>
            <div>
              <h1 style={v.h1}>Versions</h1>
              <p style={v.sub}>All tailored resumes, ready to view or export.</p>
            </div>
            <button style={v.primaryBtn} onClick={() => navigate('/tailor')}>
              Tailor new
            </button>
          </header>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div style={v.empty}>
              <p style={v.emptyText}>No tailored resumes yet.</p>
              <button style={v.primaryBtn} onClick={() => navigate('/tailor')}>
                Tailor your first resume
              </button>
            </div>
          )}

          {versions.length > 0 && (
            <div style={v.tableWrap}>
              <table style={v.table}>
                <thead>
                  <tr>
                    {['Role', 'Company', 'Match', 'Status', 'Date', ''].map((h) => (
                      <th key={h} style={v.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {versions.map((r, idx) => {
                    const st = STATUS[r.status] || STATUS.archived
                    return (
                      <tr key={r.id} style={{ ...v.tr, ...(idx % 2 === 0 ? {} : { background: 'var(--color-surface-raised)' }) }}>
                        <td style={v.td}><span style={v.roleText}>{r.job_title}</span></td>
                        <td style={v.td}>{r.company}</td>
                        <td style={v.td}>
                          <span style={{ ...v.score, color: scoreColor(r.match_score) }}>{r.match_score}%</span>
                        </td>
                        <td style={v.td}>
                          <span style={{ ...v.badge, background: st.bg, color: st.text }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={v.td}>{fmtDate(r.created_at)}</td>
                        <td style={v.tdActions}>
                          <div style={v.actions}>
                            <button style={v.actionBtn} onClick={() => navigate(`/tailor/${r.id}`)}>View</button>
                            {(r.status === 'approved' || r.status === 'exported') && (
                              <>
                                <button
                                  style={{ ...v.actionBtn, ...v.actionBtnAccent }}
                                  onClick={() => handleDocx(r)}
                                  disabled={isAction(r.id, 'docx')}
                                >
                                  {isAction(r.id, 'docx') ? '…' : 'DOCX'}
                                </button>
                                <button
                                  style={{ ...v.actionBtn, ...v.actionBtnDark }}
                                  onClick={() => handlePdf(r)}
                                  disabled={isAction(r.id, 'pdf')}
                                >
                                  {isAction(r.id, 'pdf') ? '…' : 'PDF'}
                                </button>
                              </>
                            )}
                            <button
                              style={{ ...v.actionBtn, ...v.actionBtnDanger }}
                              onClick={() => handleDelete(r)}
                              disabled={isAction(r.id, 'del')}
                            >
                              {isAction(r.id, 'del') ? '…' : 'Archive'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreColor(score) {
  if (score >= 75) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-error)'
}

const v = {
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-8)',
    flexWrap: 'wrap',
    gap: 'var(--space-4)',
  },
  h1: {
    fontFamily: 'var(--font-heading)',
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.02em',
    marginBottom: 'var(--space-1)',
  },
  sub: { fontSize: '14px', color: 'var(--color-text-3)' },
  primaryBtn: {
    background: 'var(--color-accent)',
    color: 'var(--color-surface)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-5)',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    letterSpacing: '-0.01em',
  },
  error: {
    background: 'var(--color-error-bg)',
    border: '1px solid oklch(88% 0.08 22)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: '13px',
    color: 'var(--color-error)',
  },
  empty: {
    textAlign: 'center',
    padding: 'var(--space-12) 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-5)',
  },
  emptyText: { fontSize: '15px', color: 'var(--color-text-3)' },
  tableWrap: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: 'var(--space-3) var(--space-4)',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--color-text-3)',
    background: 'var(--color-surface-raised)',
    borderBottom: '1px solid var(--color-border)',
  },
  tr: {
    borderBottom: '1px solid var(--color-border-subtle)',
    transition: 'background 0.1s',
  },
  td: {
    padding: '13px var(--space-4)',
    fontSize: '13.5px',
    color: 'var(--color-text)',
    verticalAlign: 'middle',
  },
  tdActions: {
    padding: '10px var(--space-4)',
    verticalAlign: 'middle',
  },
  roleText: { fontWeight: 600 },
  score: { fontWeight: 700, fontSize: '14px', fontVariantNumeric: 'tabular-nums' },
  badge: {
    display: 'inline-block',
    padding: '2px 9px',
    borderRadius: 'var(--radius-full)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  actions: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' },
  actionBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    transition: 'border-color 0.1s',
  },
  actionBtnAccent: { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' },
  actionBtnDark: { borderColor: 'var(--color-text-2)', color: 'var(--color-text)' },
  actionBtnDanger: { borderColor: 'oklch(80% 0.12 22)', color: 'var(--color-error)' },
}
