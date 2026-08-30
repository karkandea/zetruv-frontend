import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SupportChat from '../components/SupportChat'
import { assets } from '../data/assets'
import '../styles/leaderboard.css'

const podium = [
  { place: '2nd', name: 'Rizky', medal: '🥈', amount: 'Rp 10.000.000', className: 'second' },
  { place: '1st', name: 'Gilang', medal: '🥇', amount: 'Rp 310.000.000', className: 'first' },
  { place: '3rd', name: 'Agus', medal: '🥉', amount: 'Rp 900.000', className: 'third' },
]

const weeklyUsers = [
  { rank: 4, name: 'Wildan', amount: 'Rp 800.000' },
  { rank: 5, name: 'Rizky', amount: 'Rp 750.000' },
  { rank: 6, name: 'Dewi', amount: 'Rp 700.000' },
  { rank: 7, name: 'Budi', amount: 'Rp 650.000' },
  { rank: 8, name: 'Sari', amount: 'Rp 600.000' },
  { rank: 9, name: 'Andi', amount: 'Rp 550.000' },
  { rank: 10, name: 'Nina', amount: 'Rp 500.000' },
]

const monthlyUsers = [
  { rank: 1, name: 'Rizal', amount: 'Rp 1.250.000' },
  { rank: 2, name: 'Siti', amount: 'Rp 1.750.000' },
  { rank: 3, name: 'Agus', amount: 'Rp 2.500.000' },
  { rank: 4, name: 'Putri', amount: 'Rp 2.750.000' },
  { rank: 5, name: 'Hendra', amount: 'Rp 3.000.000' },
  { rank: 6, name: 'Diana', amount: 'Rp 1.500.000' },
  { rank: 7, name: 'Fajar', amount: 'Rp 2.000.000' },
  { rank: 8, name: 'Yuni', amount: 'Rp 2.200.000' },
  { rank: 9, name: 'Rina', amount: 'Rp 2.800.000' },
  { rank: 10, name: 'Eko', amount: 'Rp 1.900.000' },
]

function PodiumCard({ entry }) {
  return (
    <div className={`leaderboard-podium__entry leaderboard-podium__entry--${entry.className}`}>
      <strong className="leaderboard-podium__name"><span>{entry.medal}</span>{entry.name}</strong>
      <div className="leaderboard-podium__stand">
        <div className="leaderboard-podium__result">
          <strong>{entry.place}</strong>
          <span>{entry.amount}</span>
        </div>
      </div>
    </div>
  )
}

function RankingCard({ title, items, className = '' }) {
  return (
    <section className={`leaderboard-ranking-card ${className}`}>
      <div className="leaderboard-ranking-card__title">
        <img src={assets.leaderboard} alt="" />
        <h3>{title}</h3>
      </div>
      <div className="leaderboard-ranking-list">
        {items.map((item) => (
          <div className="leaderboard-ranking-row" key={`${title}-${item.rank}-${item.name}`}>
            <span>{item.rank}.</span>
            <strong>{item.name}</strong>
            <span>{item.amount}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function LeaderboardPage() {
  return (
    <div className="leaderboard-shell">
      <Navbar variant="leaderboard" />

      <main className="leaderboard-main">
        <section className="leaderboard-podium" aria-label="Top three Zetruv users">
          {podium.map((entry) => <PodiumCard entry={entry} key={entry.place} />)}
        </section>

        <section className="leaderboard-board">
          <div className="leaderboard-board__intro">
            <h1>Top 10 Most Purchased Items on Zetruv</h1>
            <p>Here is a list of the 10 most purchased items by our customers. This data is taken from our system and is regularly updated.</p>
          </div>

          <div className="leaderboard-board__lists">
            <RankingCard title="Top 10 User This Week" items={weeklyUsers} className="leaderboard-ranking-card--weekly" />
            <RankingCard title="Top 10 User This Month" items={monthlyUsers} className="leaderboard-ranking-card--monthly" />
          </div>
        </section>
      </main>

      <Footer />
      <SupportChat />
    </div>
  )
}
