import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/cookie-policy.css'

export default function CookiePolicyPage() {
  const copy = useStorefrontCopy()

  useEffect(() => {
    document.title = `${copy.cookiePolicy} | Zetruv`
  }, [copy.cookiePolicy])

  useEffect(() => {
    if (window.location.hash === '#manage-cookies') {
      document.getElementById('manage-cookies')?.scrollIntoView()
    }
  }, [])

  return (
    <div className="site-shell site-shell--homepage-final cookie-policy-page">
      <Navbar variant="legal" homepageMobileMenu />
      <main className="container cookie-policy">
        <a className="cookie-policy__back" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          {copy.homepage}
        </a>
        <article className="cookie-policy__document">
          <header>
            <h1>{copy.cookiePolicy}</h1>
            <p>{copy.cookiePolicyIntro}</p>
          </header>
          <section>
            <h2>{copy.cookiePolicyDefinitionTitle}</h2>
            <p>{copy.cookiePolicyDefinition}</p>
          </section>
          <section>
            <h2>{copy.cookiePolicyUseTitle}</h2>
            <dl>
              <dt>{copy.cookiePolicySessionLabel}</dt>
              <dd>{copy.cookiePolicySession}</dd>
              <dt>{copy.cookiePolicyStorageLabel}</dt>
              <dd>{copy.cookiePolicyStorage}</dd>
            </dl>
          </section>
          <section id="manage-cookies">
            <h2>{copy.cookiePolicyManageTitle}</h2>
            <p>{copy.cookiePolicyManage}</p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
