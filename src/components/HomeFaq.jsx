import { useState } from 'react'
import { ArrowUpRight, MessageCircle, Plus } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/home-faq.css'

const questions = ['Purchase', 'Payment', 'Tracking', 'WrongId', 'Delivery', 'GameItem']

export default function HomeFaq({ onContact }) {
  const copy = useStorefrontCopy()
  const [openQuestion, setOpenQuestion] = useState(null)

  return (
    <section id="faq" className="home-faq" aria-labelledby="home-faq-title">
      <h2 id="home-faq-title">{copy.faqTitle}</h2>
      <div className="home-faq__list">
        {questions.map((question) => {
          const open = question === openQuestion
          const answerId = `faq-answer-${question.toLowerCase()}`
          return (
            <article className={`home-faq__item${open ? ' is-open' : ''}`} key={question}>
              <h3>
                <button type="button" aria-expanded={open} aria-controls={answerId}
                  onClick={() => setOpenQuestion(open ? null : question)}>
                  <span>{copy[`faq${question}Question`]}</span>
                  <span className="home-faq__indicator" aria-hidden="true"><Plus size={19} /></span>
                </button>
              </h3>
              <div id={answerId} className="home-faq__answer" inert={!open} aria-hidden={!open}>
                <div className="home-faq__answer-clip">
                  <div className="home-faq__answer-copy">
                    <p>{copy[`faq${question}Answer`]}</p>
                    {question === 'Tracking' && (
                      <a href="/order-status">{copy.checkTransaction} <ArrowUpRight size={15} aria-hidden="true" /></a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="home-faq__contact">
        <p>{copy.faqMoreQuestions}</p>
        <button type="button" aria-haspopup="dialog" onClick={onContact}>
          <MessageCircle size={17} aria-hidden="true" /> {copy.faqContact}
        </button>
      </div>
    </section>
  )
}
