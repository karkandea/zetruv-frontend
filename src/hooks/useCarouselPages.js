import { useRef, useState } from 'react'

function pageOffset(row, page, cardsPerPage) {
  const card = row.children[page * cardsPerPage]
  return Math.min(card.offsetLeft - row.firstElementChild.offsetLeft, row.scrollWidth - row.clientWidth)
}

export function useCarouselPages(cardCount, cardsPerPage = 1) {
  const rowRef = useRef(null)
  const [activePage, setActivePage] = useState(0)
  const pageCount = Math.ceil(cardCount / cardsPerPage)

  function updateActivePage(event) {
    const row = event.currentTarget
    if (pageCount < 2 || row.scrollWidth <= row.clientWidth) return

    let closestPage = 0
    let closestDistance = Infinity
    for (let page = 0; page < pageCount; page++) {
      const distance = Math.abs(row.scrollLeft - pageOffset(row, page, cardsPerPage))
      if (distance < closestDistance) {
        closestPage = page
        closestDistance = distance
      }
    }
    setActivePage(closestPage)
  }

  function showPage(page) {
    const row = rowRef.current
    row.scrollTo({ left: pageOffset(row, page, cardsPerPage) })
  }

  return { rowRef, pageCount, activePage: Math.min(activePage, Math.max(0, pageCount - 1)), updateActivePage, showPage }
}
