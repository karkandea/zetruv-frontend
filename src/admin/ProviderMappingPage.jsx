import { useEffect, useMemo, useState } from 'react'
import { cmsRequest } from './api'
import './provider-mapping.css'

const money = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

function Status({ active, ready }) {
  const label = ready ? 'Ready' : active ? 'Mapped' : 'Not mapped'
  return <span className={`provider-map-status provider-map-status--${ready ? 'ready' : active ? 'mapped' : 'empty'}`}>{label}</span>
}

export default function ProviderMappingPage() {
  const [games, setGames] = useState([])
  const [drafts, setDrafts] = useState({})
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setError('')
    try {
      const data = await cmsRequest('/provider-mappings')
      setGames(data)
      setDrafts(Object.fromEntries(data.map((game) => [game.gameId, {
        providerCode: game.providerCode || '',
        nicknameCheckEnabled: Boolean(game.nicknameCheckEnabled),
        mappingActive: Boolean(game.mappingActive),
        skus: Object.fromEntries(game.skus.map((sku) => [sku.variantId, {
          providerSku: sku.providerSku || '',
          mappingActive: Boolean(sku.mappingActive),
        }]))
      }])))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  const totalVariants = useMemo(
    () => games.reduce((sum, game) => sum + game.skus.length, 0),
    [games]
  )

  function setGameDraft(gameId, key, value) {
    setDrafts((old) => ({
      ...old,
      [gameId]: { ...old[gameId], [key]: value },
    }))
  }

  function setSkuDraft(gameId, variantId, key, value) {
    setDrafts((old) => ({
      ...old,
      [gameId]: {
        ...old[gameId],
        skus: {
          ...old[gameId]?.skus,
          [variantId]: { ...old[gameId]?.skus?.[variantId], [key]: value },
        },
      },
    }))
  }

  async function saveGame(game) {
    const draft = drafts[game.gameId]
    if (!draft?.providerCode?.trim()) {
      setError(`Provider code untuk ${game.gameName} wajib diisi.`)
      return
    }

    const key = `game:${game.gameId}`
    setBusy(key); setError(''); setNotice('')
    try {
      await cmsRequest(`/provider-mappings/games/${game.gameId}`, {
        method: 'PUT',
        body: JSON.stringify({
          providerCode: draft.providerCode.trim(),
          nicknameCheckEnabled: draft.nicknameCheckEnabled,
          isActive: draft.mappingActive,
        }),
      })
      setNotice(`Mapping ${game.gameName} tersimpan.`)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function saveSku(game, sku) {
    const draft = drafts[game.gameId]?.skus?.[sku.variantId]
    if (!game.mappingId) {
      setError(`Simpan provider ${game.gameName} terlebih dahulu sebelum mapping SKU.`)
      return
    }
    if (!draft?.providerSku?.trim()) {
      setError(`Provider SKU untuk ${sku.nominal} wajib diisi.`)
      return
    }

    const key = `sku:${sku.variantId}`
    setBusy(key); setError(''); setNotice('')
    try {
      await cmsRequest(`/provider-mappings/variants/${sku.variantId}`, {
        method: 'PUT',
        body: JSON.stringify({
          providerSku: draft.providerSku.trim(),
          isActive: draft.mappingActive,
        }),
      })
      setNotice(`${sku.productName} · ${sku.nominal} berhasil dimapping.`)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return <div className="admin-page provider-map-page">
    <header className="admin-page-header">
      <div>
        <small>COMMERCE MANAGEMENT</small>
        <h1>Provider Mapping</h1>
        <p>Hubungkan game Via ID dan setiap nominal Zetruv ke SKU milik satu provider utama.</p>
      </div>
      <div className="provider-map-summary">
        <strong>{games.length}</strong><span>games</span>
        <strong>{totalVariants}</strong><span>variants</span>
      </div>
    </header>

    {error && <div className="admin-error">{error}</div>}
    {notice && <div className="admin-notice">{notice}</div>}

    {games.length === 0 && !error && <div className="admin-empty">Belum ada produk AUTO_ID yang bisa dimapping.</div>}

    <div className="provider-map-stack">
      {games.map((game) => {
        const draft = drafts[game.gameId] || { providerCode: '', nicknameCheckEnabled: false, mappingActive: false, skus: {} }
        return <section className="admin-panel provider-map-card" key={game.gameId}>
          <header>
            <div>
              <h2>{game.gameName}</h2>
              <p>Fulfillment: {game.fulfillmentMethod} · {game.mappingId ? 'mapping tersimpan' : 'belum dikonfigurasi'}</p>
            </div>
            <Status active={game.mappingActive} ready={game.mappingActive && game.skus.length > 0 && game.skus.every((sku) => sku.isOperational)} />
          </header>

          <div className="provider-map-game-form">
            <label className="admin-field">
              <span>Provider</span>
              <input
                value={draft.providerCode}
                placeholder="contoh: mock / digiflazz"
                onChange={(event) => setGameDraft(game.gameId, 'providerCode', event.target.value)}
              />
            </label>
            <label className="provider-map-check">
              <input
                type="checkbox"
                checked={draft.nicknameCheckEnabled}
                onChange={(event) => setGameDraft(game.gameId, 'nicknameCheckEnabled', event.target.checked)}
              />
              <span>Nickname check supported</span>
            </label>
            <label className="provider-map-check">
              <input
                type="checkbox"
                checked={draft.mappingActive}
                onChange={(event) => setGameDraft(game.gameId, 'mappingActive', event.target.checked)}
              />
              <span>Mapping active</span>
            </label>
            <button
              className="admin-button admin-button--primary"
              type="button"
              disabled={busy === `game:${game.gameId}`}
              onClick={() => saveGame(game)}
            >{busy === `game:${game.gameId}` ? 'Saving…' : 'Save provider'}</button>
          </div>

          <div className="admin-table-wrap provider-map-table">
            <table>
              <thead><tr><th>Zetruv product</th><th>Nominal</th><th>Zetruv SKU</th><th>Provider SKU</th><th>Selling price</th><th>Status</th><th /></tr></thead>
              <tbody>
                {game.skus.map((sku) => {
                  const skuDraft = draft.skus?.[sku.variantId] || { providerSku: '', mappingActive: false }
                  return <tr key={sku.variantId}>
                    <td><strong>{sku.productName}</strong></td>
                    <td>{sku.nominal}</td>
                    <td><code>{sku.zetruvSku}</code></td>
                    <td><input className="provider-map-sku-input" value={skuDraft.providerSku} placeholder="Provider SKU" onChange={(event) => setSkuDraft(game.gameId, sku.variantId, 'providerSku', event.target.value)} /></td>
                    <td>{money(sku.sellingPrice)}</td>
                    <td>
                      <label className="provider-map-inline-toggle">
                        <input type="checkbox" checked={skuDraft.mappingActive} onChange={(event) => setSkuDraft(game.gameId, sku.variantId, 'mappingActive', event.target.checked)} />
                        <Status active={sku.mappingActive} ready={sku.isOperational} />
                      </label>
                    </td>
                    <td><button className="admin-button admin-button--ghost" type="button" disabled={busy === `sku:${sku.variantId}` || !game.mappingId} onClick={() => saveSku(game, sku)}>{busy === `sku:${sku.variantId}` ? 'Saving…' : 'Save'}</button></td>
                  </tr>
                })}
                {game.skus.length === 0 && <tr><td colSpan="7"><div className="admin-empty">Belum ada nominal/variant untuk game ini.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      })}
    </div>
  </div>
}
