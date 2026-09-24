import { useEffect, useState } from 'react'
import { cmsRequest } from './api'
import { ACCOUNT_ATTRIBUTE_TYPES, accountDefinitionPayload, accountListingPayload, isChoiceType } from './gameAccountValues'

const blankDefinition = {
  key: '', label: '', type: 'Text', optionsText: '', isRequired: false,
  isActive: true, showOnCard: false, sortOrder: 0,
}
const schemaPath = (gameId) => `/catalog/games/${gameId}/account-attributes`
const detailPath = (productId) => `/catalog/products/${productId}/game-account-details`

function DefinitionForm({ item, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() => item
    ? { ...item, optionsText: (item.options || []).join('\n') }
    : blankDefinition)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const choice = isChoiceType(form.type)
  return <form className="admin-account-form admin-form-grid" onSubmit={(event) => {
    event.preventDefault()
    onSave(accountDefinitionPayload(form))
  }}>
    <h3 className="admin-field--wide">{item ? `Edit ${item.label}` : 'New account attribute'}</h3>
    <label className="admin-field"><span>Field key</span><input value={form.key}
      onChange={(event) => set('key', event.target.value)} disabled={Boolean(item)}
      minLength={2} maxLength={50} pattern="[a-z][A-Za-z0-9_]{1,49}"
      placeholder="e.g. starlight, mmr, arcana" required />
      <small>Stable key for this game; cannot be renamed after creation.</small></label>
    <label className="admin-field"><span>Label</span><input value={form.label}
      onChange={(event) => set('label', event.target.value)} maxLength={100} required
      placeholder="e.g. Status Starlight" /></label>
    <label className="admin-field"><span>Input type</span><select value={form.type}
      onChange={(event) => set('type', event.target.value)}>
      {ACCOUNT_ATTRIBUTE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
    </select></label>
    <label className="admin-field"><span>Sort order</span><input type="number"
      value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} /></label>
    {choice && <label className="admin-field admin-field--wide"><span>Options</span>
      <textarea rows={3} value={form.optionsText} onChange={(event) => set('optionsText', event.target.value)}
        placeholder="One option per line, e.g. Mythic, Legend" required />
      <small>Maximum 20 distinct options. Changing options cannot invalidate existing listings.</small>
    </label>}
    <label className="admin-toggle"><input type="checkbox" checked={form.isRequired}
      onChange={(event) => set('isRequired', event.target.checked)} /><span /><b>Required</b></label>
    <label className="admin-toggle"><input type="checkbox" checked={form.showOnCard}
      onChange={(event) => set('showOnCard', event.target.checked)} /><span /><b>Show on card</b></label>
    <label className="admin-toggle"><input type="checkbox" checked={form.isActive}
      onChange={(event) => set('isActive', event.target.checked)} /><span /><b>Active</b></label>
    <div className="admin-form-actions"><button className="admin-button admin-button--ghost"
      type="button" onClick={onCancel}>Cancel</button>
      <button className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Saving…' : 'Save attribute'}</button></div>
  </form>
}

export function GameAccountSchemaEditor({ game }) {
  const [definitions, setDefinitions] = useState([])
  const [editing, setEditing] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function load() {
    setLoading(true)
    try { setDefinitions(await cmsRequest(schemaPath(game.id))); setError('') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [game.id])
  async function save(payload) {
    setError(''); setNotice(''); setBusy(true)
    try {
      await cmsRequest(editing?.id ? `${schemaPath(game.id)}/${editing.id}` : schemaPath(game.id), {
        method: editing?.id ? 'PUT' : 'POST', body: JSON.stringify(payload),
      })
      setEditing(undefined); await load()
      setNotice('Attribute saved. Existing account listings keep their own values.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function deactivate(item) {
    if (!window.confirm(`Deactivate ${item.label}? Saved listing values will be retained.`)) return
    setError(''); setNotice('')
    try {
      await cmsRequest(`${schemaPath(game.id)}/${item.id}`, { method: 'DELETE' })
      await load()
      setNotice('Attribute deactivated; historical values remain stored.')
    } catch (err) { setError(err.message) }
  }
  return <div className="admin-account-schema">
    <div className="admin-account-guidance">Define the fields once for <strong>{game.name}</strong>.
      Every account listing for this game gets its own values. This is different from customer checkout input fields.
      Up to 30 fields per game, including inactive ones.</div>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {notice && <div className="admin-account-saved" role="status">{notice}</div>}
    <div className="admin-account-schema__header"><div><strong>{definitions.length} / 30 attributes</strong>
      <p>Choose the type, required state, display order and card visibility.</p></div>
      <button className="admin-button admin-button--primary" type="button"
        disabled={definitions.length >= 30 || editing !== undefined || loading}
        onClick={() => setEditing(null)}>+ Add attribute</button>
    </div>
    {loading ? <div className="admin-loading">Loading game attributes…</div> : definitions.length === 0
      ? <div className="admin-empty">No attributes yet. Create fields such as Starlight, MMR or Rank to start.</div>
      : definitions.map((item) => <div className="admin-account-definition" key={item.id}>
        <div><strong>{item.label} {item.isRequired ? '*' : ''}</strong>
          <small>{item.key} · {item.type}{item.options?.length ? ` · ${item.options.join(', ')}` : ''}</small></div>
        <div className="admin-account-definition__actions">
          <code>{item.showOnCard ? 'Card + detail' : 'Detail only'}</code>
          <code>{item.isActive ? 'Active' : 'Inactive'}</code>
          <button className="admin-button admin-button--ghost" type="button"
            onClick={() => setEditing(item)}>Edit</button>
          {item.isActive && <button className="admin-button admin-button--danger" type="button"
            onClick={() => deactivate(item)}>Deactivate</button>}
        </div>
      </div>)}
    {editing !== undefined && <DefinitionForm key={editing?.id || 'new'}
      item={editing} onSave={save} onCancel={() => { setEditing(undefined); setError('') }} busy={busy} />}
  </div>
}

function AccountValueField({ field, value, onChange }) {
  const help = `${field.type}${field.isRequired ? ' · Required' : ' · Optional'}${field.showOnCard ? ' · Visible on card' : ''}`
  return <div className="admin-account-value"><strong>{field.label}{field.isRequired && ' *'}</strong>
    <small>{help}</small>
    {field.type === 'Text' && <input type="text" maxLength={250} value={value ?? ''}
      onChange={(event) => onChange(event.target.value)} required={field.isRequired} />}
    {field.type === 'Number' && <input type="number" min="0" max="999999999.99" step="0.01"
      value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={field.isRequired} />}
    {field.type === 'Boolean' && <select value={value === true ? 'true' : value === false ? 'false' : ''}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')}
      required={field.isRequired}><option value="">Not set</option>
      <option value="true">Yes</option><option value="false">No</option></select>}
    {field.type === 'Select' && <select value={value ?? ''} required={field.isRequired}
      onChange={(event) => onChange(event.target.value)}>
      <option value="">Choose an option</option>
      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>}
    {field.type === 'MultiSelect' && <div className="admin-account-multiselect">
      {field.options.map((option) => <label key={option}><input type="checkbox"
        checked={Array.isArray(value) && value.includes(option)}
        onChange={(event) => onChange(event.target.checked
          ? [...(Array.isArray(value) ? value : []), option]
          : (Array.isArray(value) ? value : []).filter((choice) => choice !== option))} />{option}</label>)}
    </div>}
    <small>Key: {field.key}</small>
  </div>
}

export function GameAccountListingEditor({ productId }) {
  const [editor, setEditor] = useState(null)
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function load() {
    setLoading(true)
    try {
      const result = await cmsRequest(detailPath(productId))
      setEditor(result)
      setValues(result.values || {})
      setError('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [productId])
  async function save(event) {
    event.preventDefault()
    setError(''); setNotice(''); setBusy(true)
    try {
      const payload = accountListingPayload(editor.schema, values)
      await cmsRequest(detailPath(productId), { method: 'PUT', body: JSON.stringify(payload) })
      await load()
      setNotice('Account attributes saved for this listing.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const active = editor?.schema?.filter((field) => field.isActive) || []
  const archived = editor?.schema?.filter((field) => !field.isActive) || []
  return <section className="admin-panel admin-account-schema"><header><div>
    <h2>Account attributes</h2><p>Values for this listing only. Configure attribute definitions under Catalog → Games.</p>
  </div></header>
    {loading && <div className="admin-loading">Loading account attributes…</div>}
    {error && <div className="admin-error" role="alert">{error}</div>}
    {notice && <div className="admin-account-saved" role="status">{notice}</div>}
    {!loading && editor?.isLegacyUnlinked && <div className="admin-account-guidance">
      This historical listing has no game. Previous values remain readable, but editing is disabled.
      Create a new listing linked to a game to use dynamic attributes.</div>}
    {!loading && !editor?.isLegacyUnlinked && editor && <>
      {active.length === 0 ? <div className="admin-account-guidance">
        No active attributes configured for this game. Go to Catalog → Games → Account fields first.</div>
      : <form className="admin-form-grid" onSubmit={save}>
        {active.map((field) => <AccountValueField key={field.id} field={field}
          value={values[field.key]}
          onChange={(value) => setValues((old) => ({ ...old, [field.key]: value }))} />)}
        <div className="admin-form-actions"><button className="admin-button admin-button--ghost"
          type="button" onClick={load} disabled={busy}>Reset</button>
          <button className="admin-button admin-button--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save account attributes'}</button></div>
      </form>}
      {archived.length > 0 && <div className="admin-account-guidance">
        {archived.length} inactive field(s) are hidden publicly; existing saved values remain archived.
        Reactivate them from Catalog → Games if needed.</div>}
    </>}
  </section>
}
