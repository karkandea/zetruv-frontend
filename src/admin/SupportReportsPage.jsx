import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cmsRequest } from './api'
import './support-reports.css'

const pageSize = 20
const timestamp = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

export default function SupportReportsPage() {
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  const current = result?.offset === offset && result.revision === revision ? result : null
  const reports = current?.page?.items ?? []
  const reload = () => setRevision(value => value + 1)

  useEffect(() => {
    const controller = new AbortController()
    cmsRequest(`/support/reports?offset=${offset}&limit=${pageSize}`, {
      cache: 'no-store', signal: controller.signal,
    }).then(page => {
      if (!controller.signal.aborted) setResult({ offset, revision, page })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ offset, revision, failed: true })
    })
    return () => controller.abort()
  }, [offset, revision])

  return <div className="admin-page">
    <header className="admin-page-header">
      <h1>Laporan Kendala</h1>
      <button type="button" className="admin-button admin-button--ghost support-reports-refresh" disabled={!current} onClick={reload}>
        <RefreshCw size={15} aria-hidden="true" /> Muat ulang
      </button>
    </header>
    <section className="admin-panel" aria-label="Laporan dari toko" aria-busy={!current}>
      {!current && <p className="admin-empty" role="status">Memuat laporan…</p>}
      {current?.failed && <div className="admin-empty">
        <p role="alert">Laporan belum bisa dimuat.</p>
        <button type="button" className="admin-button admin-button--ghost" onClick={reload}>Coba lagi</button>
      </div>}
      {current?.page && reports.length === 0 && <p className="admin-empty" role="status">Belum ada laporan kendala di halaman ini.</p>}
      {reports.length > 0 && <ul className="support-reports-list">
        {reports.map(report => <li key={report.id}>
          <div className="support-report-heading">
            <strong>{report.name}</strong>
            <time dateTime={report.createdAt}>{timestamp.format(new Date(report.createdAt))} WIB</time>
          </div>
          <span className="support-report-phone">{report.phone}</span>
          <p>{report.description}</p>
        </li>)}
      </ul>}
      {(offset > 0 || current?.page?.hasMore) && <nav className="support-reports-pagination" aria-label="Halaman laporan">
        <button type="button" className="admin-button admin-button--ghost" disabled={!current || offset === 0}
          onClick={() => setOffset(value => value - pageSize)}>Sebelumnya</button>
        <span>Halaman {offset / pageSize + 1}</span>
        <button type="button" className="admin-button admin-button--ghost" disabled={!current?.page?.hasMore}
          onClick={() => setOffset(value => value + pageSize)}>Berikutnya</button>
      </nav>}
    </section>
  </div>
}
