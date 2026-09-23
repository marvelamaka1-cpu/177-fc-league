import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './LoginPage'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [rankings, setRankings] = useState([])
  const [potw, setPotw] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setShowLogin(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchData() {
      // 1. Get ALL players from the database
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, name, jersey_number')

      // 2. Get all the stats
      const { data: statsData } = await supabase
        .from('player_gameweek_stats')
        .select('points, goals, assists, appearance, player_id')

      // 3. Start with all players having 0 points
      const totals = {}
      if (allPlayers) {
        allPlayers.forEach((p) => {
          totals[p.id] = { id: p.id, name: p.name, jersey: p.jersey_number, pts: 0, g: 0, a: 0, app: 0 }
        })
      }

      // 4. Add the stats to the players
      if (statsData) {
        statsData.forEach((row) => {
          const pId = row.player_id
          if (totals[pId]) {
            totals[pId].pts += row.points || 0
            totals[pId].g += row.goals || 0
            totals[pId].a += row.assists || 0
            if (row.appearance) totals[pId].app += 1
          }
        })
      }

      const sorted = Object.values(totals).sort((a, b) => b.pts - a.pts)
      setRankings(sorted)
      
      if (sorted.length > 0 && sorted[0].pts > 0) {
        setPotw(sorted[0])
      } else {
        setPotw(null)
      }
      
      setDataLoading(false)
    }
    fetchData()
  }, [])

  // Show login page
  if (showLogin && !session) {
    return <LoginPage onBack={() => setShowLogin(false)} />
  }

  // Still checking auth
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading...</div>
  }

  // User IS logged in - Show Admin Dashboard
  if (session) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <img src="/fc-logo.jpg" alt="177 FC Logo" />
            <div>
              <h2>177 FC</h2>
              <span>STREET LEAGUE</span>
            </div>
          </div>
          
          <nav>
            <button 
              className="nav-item" 
              onClick={() => {
                setSession(null)
                setShowLogin(false)
              }}
            >
              <span>📊</span> View Public Site
            </button>
            <button className="nav-item active">
              <span>⚙️</span> Control Room
            </button>
          </nav>

          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              setSession(null)
              setShowLogin(false)
            }}
            style={{
              position: 'absolute',
              bottom: '28px',
              right: '16px',
              padding: '10px 15px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            Logout
          </button>
        </aside>

        <main className="main">
          <AdminDashboard />
        </main>
      </div>
    )
  }

  // User is NOT logged in - Show Public Site
  if (dataLoading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading scores...</div>
  }

  const totalGoals = rankings.reduce((sum, p) => sum + p.g, 0)
  const totalAssists = rankings.reduce((sum, p) => sum + p.a, 0)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="/fc-logo.jpg" alt="177 FC Logo" />
          <div>
            <h2>177 FC</h2>
            <span>STREET LEAGUE</span>
          </div>
        </div>
        
        <nav>
          <button className="nav-item active">
            <span>📊</span> Rankings
          </button>
          <button 
            className="nav-item" 
            onClick={() => setShowLogin(true)}
          >
            <span>🔒</span> Admin Login
          </button>
        </nav>

        <div className="sidebar-footer">
          <strong>ROAD TO</strong>
          <span>DIVISION ONE</span>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <span className="eyebrow">177 FC • STREET LEAGUE</span>
            <h1>Road to <span>Division One.</span></h1>
            <p>Every game counts. Every performance matters.</p>
          </div>
          <div className="gameweek-badge">
  <small>NEXT GAME</small>
  <strong>GW01</strong>
  <span style={{ fontSize: '9px', color: 'var(--gold)', display: 'block', marginTop: '5px' }}>
    {(() => {
      const today = new Date();
      const nextThursday = new Date(today);
      nextThursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7 || 7));
      return nextThursday.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    })()}
  </span>
</div>
        </header>

        <div className="hero-grid">
          <div className="hero-card main-hero">
            <span className="card-label">TOTAL PLAYERS</span>
            <div className="hero-number">{rankings.length}</div>
            <div className="gold-line"></div>
            <div className="hero-stats">
              <div><strong>{totalGoals}</strong><span>GOALS</span></div>
              <div><strong>{totalAssists}</strong><span>ASSISTS</span></div>
            </div>
          </div>

          <div className="hero-card award-card">
            <span className="card-label">PLAYER OF THE WEEK</span>
            {potw ? (
              <>
                <h3>{potw.name}</h3>
                <p>#{potw.jersey} • {potw.pts} pts</p>
              </>
            ) : (
              <div className="waiting">Awaiting stats...</div>
            )}
          </div>

          <div className="hero-card award-card">
            <span className="card-label">DEFENDER OF THE WEEK</span>
            <div className="waiting">Awaiting stats...</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">COMPETITION TABLE</span>
              <h2>Overall Rankings</h2>
              <p>Rankings change with performance. Jersey numbers never do.</p>
            </div>
            <span className="live-pill">LIVE</span>
          </div>

          <div className="table-heading table-row">
            <span>RANK</span>
            <span>PLAYER</span>
            <span>G</span>
            <span>A</span>
            <span>APP</span>
            <span>PTS</span>
          </div>

          {rankings.map((player, index) => (
            <div key={player.id} className="table-row">
              <span className="rank">{index + 1}</span>
              <div className="player">
                <div className="player-number">{player.jersey}</div>
                <div>
                  <strong>{player.name}</strong>
                  <small>Player #{player.jersey}</small>
                </div>
              </div>
              <span>{player.g}</span>
              <span>{player.a}</span>
              <span>{player.app}</span>
              <span className="points">{player.pts}</span>
            </div>
          ))}
        </div>

                {/* MOBILE NAVIGATION BAR (Only shows on phones) */}
        <div className="mobile-nav">
          <button className="active">
            <span></span>
            Rankings
          </button>
          <button onClick={() => setShowLogin(true)}>
            <span>🔒</span>
            Admin
          </button>
        </div>
      </main>
    </div>
  )
}