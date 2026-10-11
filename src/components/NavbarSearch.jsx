import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronRight, RotateCcw, Search, X } from 'lucide-react'
import { assets } from '../data/assets'
import { getCatalogProducts } from '../services/catalogService'
import { groupSearchProducts, searchProductHref, searchProductMeta } from '../services/navbarSearchHelpers'

const MIN_CHARS = 3
const DEBOUNCE_MS = 300
const SKELETON_DELAY_MS = 160

function ResultItem({ product, id, selected, onSelect, onHover }) {
  const meta = searchProductMeta(product)
  const fallback = meta.fallbackImage
  return (
    <a
      className={`navbar-search-result${selected ? ' is-selected' : ''}`}
      href={searchProductHref(product)}
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onMouseEnter={onHover}
      onClick={onSelect}
    >
      <img
        className="navbar-search-result__image"
        src={product.thumbnailUrl || fallback}
        alt=""
        loading="lazy"
        decoding="async"
        onError={(event) => {
          const image = event.currentTarget
          if (image.dataset.fallback !== 'true') {
            image.dataset.fallback = 'true'
            image.src = fallback
          }
        }}
      />
      <span className="navbar-search-result__details">
        <span className="navbar-search-result__title">
          <strong>{product.name}</strong>
          <span className="navbar-search-result__badge">{meta.badge}</span>
        </span>
        <small>{meta.subtitle}{product.gameName && product.kind !== 'TopUpGame' ? ` · ${product.gameName}` : ''}</small>
      </span>
      <ChevronRight className="navbar-search-result__chevron" size={20} aria-hidden="true" />
    </a>
  )
}

function SearchSkeleton({ query, showSkeleton }) {
  return (
    <div className="navbar-search-dropdown__loading" role="status" aria-live="polite">
      <p className="navbar-search-dropdown__loading-label">
        <span className="navbar-search-dropdown__spinner" aria-hidden="true" />
        Searching for “{query}”...
      </p>
      {showSkeleton && Array.from({ length: 2 }, (_, index) => (
        <div className="navbar-search-dropdown__skeleton" key={index} aria-hidden="true">
          <span className="navbar-search-dropdown__skeleton-image" />
          <span className="navbar-search-dropdown__skeleton-content">
            <span /><span />
          </span>
        </div>
      ))}
    </div>
  )
}

export default function NavbarSearch({ placeholder, initialQuery = '' }) {
  const popupId = useId()
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const requestVersion = useRef(0)
  const [query, setQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [resolvedQuery, setResolvedQuery] = useState('')
  const [products, setProducts] = useState([])
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [retryIndex, setRetryIndex] = useState(0)
  const trimmed = query.trim()
  const valid = trimmed.length >= MIN_CHARS
  const ready = valid && resolvedQuery === trimmed && phase === 'success'
  const failed = valid && resolvedQuery === trimmed && phase === 'error'
  const groups = useMemo(
    () => ready ? groupSearchProducts(products, trimmed) : { best: [], suggestions: [] },
    [ready, products, trimmed],
  )
  const options = useMemo(() => [...groups.best, ...groups.suggestions], [groups])
  const showResults = ready && options.length > 0
  const resultState = !valid ? 'hint' : failed ? 'error' : ready ? showResults ? 'results' : 'empty' : 'loading'

  // Opening an empty field is instantaneous and makes no network request.
  // The per-query cleanup cancels both the timer and in-flight fetch.
  useEffect(() => {
    if (!isOpen || !valid) {
      requestVersion.current += 1
      setShowSkeleton(false)
      setActiveIndex(-1)
      return undefined
    }

    const version = ++requestVersion.current
    const controller = new AbortController()
    let alive = true
    let skeletonTimer = null

    setPhase('debouncing')
    setActiveIndex(-1)
    setShowSkeleton(false)

    const debounceTimer = window.setTimeout(async () => {
      if (!alive) return
      setPhase('loading')
      skeletonTimer = window.setTimeout(() => {
        if (alive && requestVersion.current === version) setShowSkeleton(true)
      }, SKELETON_DELAY_MS)
      try {
        // Search ALL kinds. No hardcoded products, no calls before 3 chars.
        const response = await getCatalogProducts({
          search: trimmed,
          page: 1,
          pageSize: 50,
          signal: controller.signal,
        })
        if (!alive || requestVersion.current !== version) return
        setProducts(Array.isArray(response?.items) ? response.items : [])
        setResolvedQuery(trimmed)
        setPhase('success')
      } catch (error) {
        if (!alive || controller.signal.aborted || requestVersion.current !== version) return
        setProducts([])
        setResolvedQuery(trimmed)
        setPhase('error')
      } finally {
        if (skeletonTimer) window.clearTimeout(skeletonTimer)
      }
    }, DEBOUNCE_MS)

    return () => {
      alive = false
      controller.abort()
      window.clearTimeout(debounceTimer)
      if (skeletonTimer) window.clearTimeout(skeletonTimer)
    }
  }, [isOpen, trimmed, valid, retryIndex])

  useEffect(() => {
    if (!isOpen) return undefined
    function onPointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    function onEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  function navigateToSearch(event) {
    event.preventDefault()
    if (!valid) {
      setIsOpen(true)
      inputRef.current?.focus()
      return
    }
    window.location.assign(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function handleInputKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }
    if (isOpen && showResults && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => (index + delta + options.length) % options.length)
      return
    }
    if (event.key === 'Enter' && isOpen && showResults && activeIndex >= 0) {
      event.preventDefault()
      const item = options[activeIndex]
      if (item) window.location.assign(searchProductHref(item))
    }
  }

  function clearQuery() {
    setQuery('')
    setProducts([])
    setResolvedQuery('')
    setPhase('idle')
    setActiveIndex(-1)
    setIsOpen(true)
    inputRef.current?.focus()
  }

  return (
    <form
      ref={containerRef}
      className={`searchbox navbar-searchbox${isOpen ? ' navbar-searchbox--open' : ''}`}
      role="search"
      action="/search"
      method="get"
      autoComplete="off"
      onSubmit={navigateToSearch}
    >
      <img src={assets.search} alt="" onClick={() => inputRef.current?.focus()} />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(-1)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleInputKey}
        placeholder={placeholder}
        aria-label="Search games, vouchers, or products"
        aria-autocomplete="list"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popupId : undefined}
        aria-activedescendant={isOpen && showResults && activeIndex >= 0 ? `${popupId}-option-${activeIndex}` : undefined}
        maxLength={100}
        spellCheck={false}
      />
      {query.length > 0 && (
        <button
          className="navbar-searchbox__clear"
          type="button"
          aria-label="Clear search"
          onClick={clearQuery}
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div
          className={`navbar-search-dropdown navbar-search-dropdown--${resultState}`}
          id={popupId}
          aria-label="Search suggestions"
          onMouseDown={(event) => {
            // Keep input focus while clicking options or controls in the popup.
            if (event.target.closest('a, button')) return
            event.preventDefault()
          }}
        >
          {resultState === 'hint' && (
            <div className="navbar-search-dropdown__hint" role="status">
              <strong>Searches</strong>
              <p>{trimmed.length === 0
                ? 'Type a game, voucher, or service to search.'
                : 'Ketik minimal 3 karakter untuk mencari.'}</p>
            </div>
          )}
          {resultState === 'loading' && <SearchSkeleton query={trimmed} showSkeleton={showSkeleton} />}
          {resultState === 'results' && (
            <>
              <div className="navbar-search-dropdown__list" role="listbox" aria-label="Search results">
                {groups.best.length > 0 && (
                  <div className="navbar-search-dropdown__group" role="group" aria-label="Best match">
                    <h3>Best match</h3>
                    {groups.best.map((product, index) => (
                      <ResultItem
                        key={product.id}
                        product={product}
                        id={`${popupId}-option-${index}`}
                        selected={activeIndex === index}
                        onHover={() => setActiveIndex(index)}
                        onSelect={() => setIsOpen(false)}
                      />
                    ))}
                  </div>
                )}
                {groups.suggestions.length > 0 && (
                  <div className="navbar-search-dropdown__group" role="group" aria-label="Suggestions">
                    <h3>Suggestions</h3>
                    {groups.suggestions.map((product, index) => {
                      const optionIndex = groups.best.length + index
                      return <ResultItem
                        key={product.id}
                        product={product}
                        id={`${popupId}-option-${optionIndex}`}
                        selected={activeIndex === optionIndex}
                        onHover={() => setActiveIndex(optionIndex)}
                        onSelect={() => setIsOpen(false)}
                      />
                    })}
                  </div>
                )}
              </div>
              <a className="navbar-search-dropdown__view-all" href={`/search?q=${encodeURIComponent(trimmed)}`}>
                View all results <ChevronRight size={18} aria-hidden="true" />
              </a>
            </>
          )}
          {resultState === 'empty' && (
            <div className="navbar-search-dropdown__empty" role="status">
              <span className="navbar-search-dropdown__empty-icon"><Search size={25} aria-hidden="true" /></span>
              <strong>No results found</strong>
              <p>We couldn't find “{trimmed}”. Try another game, voucher, or service.</p>
              <a href="/search">Browse all categories →</a>
            </div>
          )}
          {resultState === 'error' && (
            <div className="navbar-search-dropdown__empty" role="alert">
              <span className="navbar-search-dropdown__empty-icon"><Search size={25} aria-hidden="true" /></span>
              <strong>Search unavailable</strong>
              <p>We couldn't load results right now. Please try again.</p>
              <button type="button" className="navbar-search-dropdown__retry" onClick={() => setRetryIndex(value => value + 1)}>
                <RotateCcw size={15} aria-hidden="true" /> Try again
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
