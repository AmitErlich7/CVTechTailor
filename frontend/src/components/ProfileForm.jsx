import { useState } from 'react'
import { patchSection } from '../services/api.js'

/* ── Shared primitives ─────────────────────────────────────────────────── */

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={f.field}>
      <label style={f.label}>{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={f.input}
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div style={f.field}>
      <label style={f.label}>{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{ ...f.input, resize: 'vertical' }}
      />
    </div>
  )
}

function SectionHeader({ title, onSave, saving, saved, error, sectionId }) {
  return (
    <div style={f.sectionHeader}>
      <h3 style={f.sectionTitle}>{title}</h3>
      <div style={f.sectionActions}>
        {error && <span style={f.errTxt}>{error}</span>}
        {saved && <span style={f.savedTxt}>Saved</span>}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{ ...f.saveBtn, opacity: saving ? 0.6 : 1 }}
          data-testid={`${sectionId}-save`}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function useSectionSave(section, getData) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await patchSection(section, getData())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, saved, error }
}

/* ── Contact ───────────────────────────────────────────────────────────── */

export function ContactSection({ data, onChange }) {
  const { save, saving, saved, error } = useSectionSave('contact', () => data)
  return (
    <div style={f.section} data-testid="section-contact">
      <SectionHeader title="Contact information" onSave={save} saving={saving} saved={saved} error={error} sectionId="contact" />
      <div style={f.grid2}>
        <Field label="Full name" value={data.name} onChange={(v) => onChange({ ...data, name: v })} placeholder="Jane Doe" />
        <Field label="Email" value={data.email} onChange={(v) => onChange({ ...data, email: v })} type="email" placeholder="jane@example.com" />
        <Field label="Phone" value={data.phone} onChange={(v) => onChange({ ...data, phone: v })} placeholder="+1 555 000 0000" />
        <Field label="Location" value={data.location} onChange={(v) => onChange({ ...data, location: v })} placeholder="San Francisco, CA" />
        <Field label="LinkedIn URL" value={data.linkedin} onChange={(v) => onChange({ ...data, linkedin: v })} placeholder="https://linkedin.com/in/..." />
        <Field label="GitHub URL" value={data.github} onChange={(v) => onChange({ ...data, github: v })} placeholder="https://github.com/..." />
      </div>
    </div>
  )
}

/* ── Summary ───────────────────────────────────────────────────────────── */

export function SummarySection({ data, onChange }) {
  const { save, saving, saved, error } = useSectionSave('summary', () => data)
  return (
    <div style={f.section} data-testid="section-summary">
      <SectionHeader title="Professional summary" onSave={save} saving={saving} saved={saved} error={error} sectionId="summary" />
      <TextareaField
        label="Summary"
        value={data}
        onChange={onChange}
        rows={5}
        placeholder="Write a short summary of your professional background and key strengths…"
      />
    </div>
  )
}

/* ── Skills ────────────────────────────────────────────────────────────── */

export function SkillsSection({ data, onChange }) {
  const { save, saving, saved, error } = useSectionSave('skills', () => data)
  const [input, setInput] = useState('')

  const addSkill = () => {
    const trimmed = input.trim()
    if (trimmed && !data.includes(trimmed)) onChange([...data, trimmed])
    setInput('')
  }

  const removeSkill = (skill) => onChange(data.filter((s) => s !== skill))

  return (
    <div style={f.section} data-testid="section-skills">
      <SectionHeader title="Skills" onSave={save} saving={saving} saved={saved} error={error} sectionId="skills" />
      <div style={f.tagRow}>
        {data.map((skill) => (
          <span key={skill} style={f.tag}>
            {skill}
            <button onClick={() => removeSkill(skill)} style={f.tagRemove} aria-label={`Remove ${skill}`}>×</button>
          </span>
        ))}
      </div>
      <div style={f.addRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          placeholder="Add a skill and press Enter"
          style={{ ...f.input, flex: 1 }}
        />
        <button onClick={addSkill} style={f.addBtn}>Add</button>
      </div>
    </div>
  )
}

/* ── Experience ────────────────────────────────────────────────────────── */

export function ExperienceSection({ data, onChange }) {
  const { save, saving, saved, error } = useSectionSave('experiences', () => data)

  const addExp = () => onChange([...data, {
    id: crypto.randomUUID(),
    company: '', title: '', location: '', start_date: '', end_date: '', bullets: [],
  }])
  const updateExp = (id, patch) => onChange(data.map((e) => e.id === id ? { ...e, ...patch } : e))
  const removeExp = (id) => onChange(data.filter((e) => e.id !== id))
  const addBullet = (id) => updateExp(id, { bullets: [...(data.find((e) => e.id === id)?.bullets || []), ''] })
  const updateBullet = (id, idx, val) => {
    const exp = data.find((e) => e.id === id)
    const bullets = [...exp.bullets]
    bullets[idx] = val
    updateExp(id, { bullets })
  }
  const removeBullet = (id, idx) => {
    const exp = data.find((e) => e.id === id)
    updateExp(id, { bullets: exp.bullets.filter((_, i) => i !== idx) })
  }

  return (
    <div style={f.section} data-testid="section-experiences">
      <SectionHeader title="Work experience" onSave={save} saving={saving} saved={saved} error={error} sectionId="experiences" />
      {data.map((exp) => (
        <div key={exp.id} style={f.card}>
          <div style={f.cardHead}>
            <span style={f.cardTitle}>{exp.title || 'New role'}{exp.company ? ` — ${exp.company}` : ''}</span>
            <button onClick={() => removeExp(exp.id)} style={f.removeBtn}>Remove</button>
          </div>
          <div style={f.grid2}>
            <Field label="Job title" value={exp.title} onChange={(v) => updateExp(exp.id, { title: v })} placeholder="Software Engineer" />
            <Field label="Company" value={exp.company} onChange={(v) => updateExp(exp.id, { company: v })} placeholder="Acme Corp" />
            <Field label="Location" value={exp.location} onChange={(v) => updateExp(exp.id, { location: v })} placeholder="Remote" />
            <div />
            <Field label="Start date" value={exp.start_date} onChange={(v) => updateExp(exp.id, { start_date: v })} placeholder="Jan 2022" />
            <Field label="End date" value={exp.end_date} onChange={(v) => updateExp(exp.id, { end_date: v })} placeholder="Present" />
          </div>
          <div style={f.subsectionLabel}>Bullet points</div>
          {exp.bullets.map((b, i) => (
            <div key={i} style={f.bulletRow}>
              <input
                value={b}
                onChange={(e) => updateBullet(exp.id, i, e.target.value)}
                style={{ ...f.input, flex: 1 }}
                placeholder="Describe an achievement or responsibility…"
              />
              <button onClick={() => removeBullet(exp.id, i)} style={f.iconBtn} aria-label="Remove bullet">×</button>
            </div>
          ))}
          <button onClick={() => addBullet(exp.id)} style={f.ghostBtn}>+ Add bullet</button>
        </div>
      ))}
      <button onClick={addExp} style={f.ghostBtn}>+ Add experience</button>
    </div>
  )
}

/* ── Education ─────────────────────────────────────────────────────────── */

export function EducationSection({ data, onChange }) {
  const { save, saving, saved, error } = useSectionSave('education', () => data)

  const addEdu = () => onChange([...data, { id: crypto.randomUUID(), school: '', degree: '', field: '', year: '' }])
  const updateEdu = (id, patch) => onChange(data.map((e) => e.id === id ? { ...e, ...patch } : e))
  const removeEdu = (id) => onChange(data.filter((e) => e.id !== id))

  return (
    <div style={f.section} data-testid="section-education">
      <SectionHeader title="Education" onSave={save} saving={saving} saved={saved} error={error} sectionId="education" />
      {data.map((edu) => (
        <div key={edu.id} style={f.card}>
          <div style={f.cardHead}>
            <span style={f.cardTitle}>{edu.degree || 'New degree'}{edu.school ? ` — ${edu.school}` : ''}</span>
            <button onClick={() => removeEdu(edu.id)} style={f.removeBtn}>Remove</button>
          </div>
          <div style={f.grid2}>
            <Field label="School / University" value={edu.school} onChange={(v) => updateEdu(edu.id, { school: v })} placeholder="MIT" />
            <Field label="Degree" value={edu.degree} onChange={(v) => updateEdu(edu.id, { degree: v })} placeholder="Bachelor of Science" />
            <Field label="Field of study" value={edu.field} onChange={(v) => updateEdu(edu.id, { field: v })} placeholder="Computer Science" />
            <Field label="Graduation year" value={edu.year} onChange={(v) => updateEdu(edu.id, { year: v })} placeholder="2024" />
          </div>
        </div>
      ))}
      <button onClick={addEdu} style={f.ghostBtn}>+ Add education</button>
    </div>
  )
}

/* ── Volunteering ──────────────────────────────────────────────────────── */

export function VolunteeringSection({ data, onChange }) {
  const { save, saving, saved, error } = useSectionSave('volunteering', () => data)

  const addEntry = () => onChange([...data, {
    id: crypto.randomUUID(),
    organization: '', role: '', location: '', start_date: '', end_date: '', bullets: [],
  }])
  const update = (id, patch) => onChange(data.map((e) => e.id === id ? { ...e, ...patch } : e))
  const remove = (id) => onChange(data.filter((e) => e.id !== id))
  const addBullet = (id) => update(id, { bullets: [...(data.find((e) => e.id === id)?.bullets || []), ''] })
  const updateBullet = (id, idx, val) => {
    const entry = data.find((e) => e.id === id)
    const bullets = [...entry.bullets]
    bullets[idx] = val
    update(id, { bullets })
  }
  const removeBullet = (id, idx) => {
    const entry = data.find((e) => e.id === id)
    update(id, { bullets: entry.bullets.filter((_, i) => i !== idx) })
  }

  return (
    <div style={f.section} data-testid="section-volunteering">
      <SectionHeader title="Volunteering" onSave={save} saving={saving} saved={saved} error={error} sectionId="volunteering" />
      {data.map((entry) => (
        <div key={entry.id} style={f.card}>
          <div style={f.cardHead}>
            <span style={f.cardTitle}>{entry.role || 'New role'}{entry.organization ? ` — ${entry.organization}` : ''}</span>
            <button onClick={() => remove(entry.id)} style={f.removeBtn}>Remove</button>
          </div>
          <div style={f.grid2}>
            <Field label="Organization" value={entry.organization} onChange={(v) => update(entry.id, { organization: v })} placeholder="Red Cross" />
            <Field label="Role" value={entry.role} onChange={(v) => update(entry.id, { role: v })} placeholder="Event Coordinator" />
            <Field label="Location" value={entry.location} onChange={(v) => update(entry.id, { location: v })} placeholder="New York, NY" />
            <div />
            <Field label="Start date" value={entry.start_date} onChange={(v) => update(entry.id, { start_date: v })} placeholder="Jun 2023" />
            <Field label="End date" value={entry.end_date} onChange={(v) => update(entry.id, { end_date: v })} placeholder="Present" />
          </div>
          <div style={f.subsectionLabel}>What you did</div>
          {entry.bullets.map((b, i) => (
            <div key={i} style={f.bulletRow}>
              <input
                value={b}
                onChange={(e) => updateBullet(entry.id, i, e.target.value)}
                style={{ ...f.input, flex: 1 }}
                placeholder="Describe your contribution or impact…"
              />
              <button onClick={() => removeBullet(entry.id, i)} style={f.iconBtn} aria-label="Remove bullet">×</button>
            </div>
          ))}
          <button onClick={() => addBullet(entry.id)} style={f.ghostBtn}>+ Add bullet</button>
        </div>
      ))}
      <button onClick={addEntry} style={f.ghostBtn}>+ Add volunteering</button>
    </div>
  )
}

/* ── Projects ──────────────────────────────────────────────────────────── */

export function ProjectsSection({ data, onChange, onOpenGitHubImport }) {
  const { save, saving, saved, error } = useSectionSave('projects', () => data)

  const addProject = () => onChange([...data, {
    id: crypto.randomUUID(),
    name: '', repo_url: '', tech_stack: [], purpose: '',
    your_role: 'solo_builder', scale: 'personal', key_features: [], source: 'manual',
  }])
  const updateProj = (id, patch) => onChange(data.map((p) => p.id === id ? { ...p, ...patch } : p))
  const removeProj = (id) => onChange(data.filter((p) => p.id !== id))

  return (
    <div style={f.section} data-testid="section-projects">
      <SectionHeader title="Projects" onSave={save} saving={saving} saved={saved} error={error} sectionId="projects" />
      {data.map((proj) => (
        <div key={proj.id} style={f.card}>
          <div style={f.cardHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={f.cardTitle}>{proj.name || 'New project'}</span>
              {proj.source === 'github' && <span style={f.ghBadge}>GitHub</span>}
            </div>
            <button onClick={() => removeProj(proj.id)} style={f.removeBtn}>Remove</button>
          </div>
          <div style={f.grid2}>
            <Field label="Project name" value={proj.name} onChange={(v) => updateProj(proj.id, { name: v })} placeholder="My Awesome App" />
            <Field label="Repo URL (optional)" value={proj.repo_url} onChange={(v) => updateProj(proj.id, { repo_url: v })} placeholder="https://github.com/..." />
            <div style={f.field}>
              <label style={f.label}>Your role</label>
              <select value={proj.your_role} onChange={(e) => updateProj(proj.id, { your_role: e.target.value })} style={f.select}>
                <option value="solo_builder">Solo Builder</option>
                <option value="contributor">Contributor</option>
                <option value="maintainer">Maintainer</option>
                <option value="team_lead">Team Lead</option>
              </select>
            </div>
            <div style={f.field}>
              <label style={f.label}>Scale</label>
              <select value={proj.scale} onChange={(e) => updateProj(proj.id, { scale: e.target.value })} style={f.select}>
                <option value="personal">Personal</option>
                <option value="team">Team</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
          <TextareaField label="Purpose / Description" value={proj.purpose} onChange={(v) => updateProj(proj.id, { purpose: v })} rows={2} placeholder="What does this project do and what problem does it solve?" />
          <div style={f.field}>
            <label style={f.label}>Tech stack (comma-separated)</label>
            <input
              value={(proj.tech_stack || []).join(', ')}
              onChange={(e) => updateProj(proj.id, { tech_stack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              style={f.input}
              placeholder="React, FastAPI, PostgreSQL"
            />
          </div>
          <div style={f.subsectionLabel}>Key features</div>
          {(proj.key_features || []).map((feat, i) => (
            <div key={i} style={f.bulletRow}>
              <input
                value={feat}
                onChange={(e) => {
                  const kf = [...proj.key_features]
                  kf[i] = e.target.value
                  updateProj(proj.id, { key_features: kf })
                }}
                style={{ ...f.input, flex: 1 }}
                placeholder="Key feature or accomplishment"
              />
              <button
                onClick={() => updateProj(proj.id, { key_features: proj.key_features.filter((_, j) => j !== i) })}
                style={f.iconBtn}
                aria-label="Remove feature"
              >×</button>
            </div>
          ))}
          <button
            onClick={() => updateProj(proj.id, { key_features: [...(proj.key_features || []), ''] })}
            style={f.ghostBtn}
          >+ Add feature</button>
        </div>
      ))}
      <div style={f.projectActions}>
        <button onClick={addProject} style={f.ghostBtn}>+ Add manually</button>
        <button onClick={onOpenGitHubImport} style={f.importBtn}>Import from GitHub</button>
      </div>
    </div>
  )
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const f = {
  section: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-5)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-5)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.01em',
  },
  sectionActions: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  saveBtn: {
    background: 'var(--color-accent)',
    color: 'var(--color-surface)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '6px var(--space-4)',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    transition: 'opacity 0.12s',
  },
  savedTxt: { fontSize: '12.5px', color: 'var(--color-success)', fontWeight: 600 },
  errTxt: { fontSize: '12.5px', color: 'var(--color-error)', maxWidth: '240px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' },
  field: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  label: {
    fontSize: '11.5px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--color-text-3)',
  },
  input: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-3)',
    fontSize: '13.5px',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-ui)',
    background: 'var(--color-bg)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.12s',
  },
  select: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-3)',
    fontSize: '13.5px',
    color: 'var(--color-text)',
    background: 'var(--color-bg)',
    fontFamily: 'var(--font-ui)',
    width: '100%',
  },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    background: 'var(--color-accent-subtle)',
    color: 'var(--color-accent-text)',
    borderRadius: 'var(--radius-full)',
    padding: '3px 10px',
    fontSize: '13px',
    fontWeight: 500,
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-accent)',
    fontSize: '15px',
    lineHeight: 1,
    padding: 0,
    opacity: 0.7,
  },
  addRow: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center' },
  addBtn: {
    background: 'var(--color-accent)',
    color: 'var(--color-surface)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-4)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    flexShrink: 0,
  },
  ghostBtn: {
    background: 'none',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '7px var(--space-4)',
    fontSize: '13px',
    color: 'var(--color-text-3)',
    cursor: 'pointer',
    marginTop: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    transition: 'border-color 0.12s',
  },
  importBtn: {
    background: 'none',
    border: '1px dashed var(--color-accent)',
    borderRadius: 'var(--radius-md)',
    padding: '7px var(--space-4)',
    fontSize: '13px',
    color: 'var(--color-accent)',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
  },
  card: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    marginBottom: 'var(--space-4)',
    background: 'var(--color-surface-raised)',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-4)',
  },
  cardTitle: { fontWeight: 600, fontSize: '13.5px', color: 'var(--color-text)' },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-3)',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: 500,
    fontFamily: 'var(--font-ui)',
  },
  subsectionLabel: {
    fontSize: '11.5px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--color-text-3)',
    marginBottom: 'var(--space-2)',
    marginTop: 'var(--space-1)',
  },
  bulletRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-3)',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    padding: '4px',
    flexShrink: 0,
  },
  ghBadge: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    borderRadius: 'var(--radius-sm)',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: 600,
  },
  projectActions: { display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' },
}
