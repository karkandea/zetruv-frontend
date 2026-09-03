import { useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Check,
  ExternalLink,
  FileText,
  Gamepad2,
  House,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  PanelsTopLeft,
  Settings,
  ShoppingBag,
  X,
  Zap,
} from 'lucide-react'

const ICONS = {
  '⌂': LayoutDashboard,
  '◫': PanelsTopLeft,
  '▦': PackageOpen,
  '⚡': Zap,
  '✎': FileText,
  '◎': ShoppingBag,
  '⚙': Settings,
  '◇': Gamepad2,
  '↗': LogOut,
  '×': X,
  '✓': Check,
  '→': ArrowRight,
  '←': ArrowLeft,
}

const CANDIDATES = [
  '.admin-sidebar nav i',
  '.admin-stat-grid article > i',
  '.admin-promo-icon',
  '.admin-modal > header button',
  '.admin-promo-items button',
  '.admin-coverage-list span',
  '.admin-architecture > i',
  '.admin-user > button',
].join(',')

function iconMarkup(Icon, className = 'admin-lucide-icon') {
  return renderToStaticMarkup(
    <Icon className={className} aria-hidden="true" focusable="false" strokeWidth={1.8} />,
  )
}

function replaceExactTokens() {
  document.querySelectorAll(CANDIDATES).forEach((node) => {
    const token = node.textContent?.trim()
    const Icon = ICONS[token]
    if (!Icon) return
    node.innerHTML = iconMarkup(Icon)
  })
}

function replaceStorefrontLinkIcon() {
  document.querySelectorAll('.admin-topbar a').forEach((link) => {
    if (link.querySelector('svg')) return
    if (!link.textContent?.includes('↗')) return
    link.textContent = link.textContent.replace(/\s*↗\s*$/, '')
    link.insertAdjacentHTML('beforeend', iconMarkup(ExternalLink, 'admin-lucide-icon admin-lucide-icon--inline'))
  })
}

function replaceActionPrefixes() {
  const actionMap = [
    ['+ New promotion', BadgePercent],
    ['+ Add variant', PackageOpen],
    ['+ Add', PackageOpen],
  ]

  document.querySelectorAll('.admin-button').forEach((button) => {
    if (button.querySelector('svg')) return
    const label = button.textContent?.trim()
    const match = actionMap.find(([text]) => text === label)
    if (!match) return
    const [text, Icon] = match
    button.textContent = text.replace(/^\+\s*/, '')
    button.insertAdjacentHTML('afterbegin', iconMarkup(Icon, 'admin-lucide-icon admin-lucide-icon--button'))
  })
}

function hydrateLucideIcons() {
  replaceExactTokens()
  replaceStorefrontLinkIcon()
  replaceActionPrefixes()
}

export default function LucideIconLayer() {
  useEffect(() => {
    hydrateLucideIcons()

    let queued = false
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      queueMicrotask(() => {
        queued = false
        hydrateLucideIcons()
      })
    })

    observer.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
