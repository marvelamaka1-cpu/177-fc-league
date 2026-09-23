import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PublicDashboard() {
  const [rankings, setRankings] = useState([])
  const [potw, setPotw] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch all stats
      const { data: statsData, error } = await supabase
        .from('player_gameweek_stats')
        .select(`
          points, goals, assists, appearance,
          player:players(id, name, jersey_number)
        `)

      if (error) {
        console.error("Error:", error)
        setLoading(false)
        return
      }

      // 2. Calculate totals for each player
      const totals = {}
      statsData.forEach((row) => {
        const p = row.player
        if (!totals[p.id]) {
          totals[p.id] = {
            id: p.id,
            name: p.name,
            jersey: p.jersey_number,
            pts: 0, g: 0, a: 0, app: 0
          }
        }
        totals[p.id].pts += row.points || 0
        totals[p.id].g += row.goals || 0
        totals[p.id].a += row.assists || 0
        if (row.appearance) totals[p.id].app += 1
      })

      // 3. Sort by points
      const sorted = Object.values(totals).sort((a, b) => b.pts - a.pts)
      setRankings(sorted)

      // 4. Find Player of the Week (highest points)
      if (sorted.length > 0) {
        setPotw(sorted[0])
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading scores...</div>
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px' }}>
            177 FC • STREET LEAGUE
          </div>
          <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', lineHeight: '1.1' }}>
            Road to <span style={{ color: '#d4af37' }}>Division One.</span>
          </h1>
          <p style={{ color: '#888', margin: 0 }}>Every game counts. Every performance matters.</p>
        </div>

        {/* TOP CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          
          {/* Gameweek Card */}
          <div style={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
            <div style={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px' }}>OPENING GAMEWEEK</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>GW01</div>
            <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '14px' }}>
              <div><span style={{ color: 'white', fontWeight: 'bold' }}>{rankings.length}</span> Players</div>
              <div><span style={{ color: 'white', fontWeight: 'bold' }}>1</span> Match</div>
            </div>
          </div>

          {/* Player of the Week Card */}
          <div style={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
            <div style={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px' }}>PLAYER OF THE WEEK</div>
            {potw ? (
              <>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{potw.name}</div>
                <div style={{ color: '#888', fontSize: '14px' }}>#{potw.jersey} • {potw.pts} pts</div>
              </>
            ) : (
              <div style={{ color: '#888' }}>Awaiting stats...</div>
            )}
          </div>

          {/* Defender of the Week Card */}
          <div style={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
            <div style={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px' }}>DEFENDER OF THE WEEK</div>
            <div style={{ color: '#888' }}>Awaiting stats...</div>
          </div>
        </div>

        {/* COMPETITION TABLE */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' }}>COMPETITION TABLE</div>
            <h2 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>Overall Rankings</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Rankings change with performance. Jersey numbers never do.</p>
          </div>

          <div style={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px 60px 60px 80px', padding: '15px 20px', borderBottom: '1px solid #222', color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
              <div>RANK</div>
              <div>PLAYER</div>
              <div style={{ textAlign: 'center' }}>G</div>
              <div style={{ textAlign: 'center' }}>A</div>
              <div style={{ textAlign: 'center' }}>APP</div>
              <div style={{ textAlign: 'center' }}>PTS</div>
            </div>

            {/* Table Rows */}
            {rankings.map((player, index) => (
              <div
                key={player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 60px 60px 60px 80px',
                  padding: '15px 20px',
                  borderBottom: '1px solid #222',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: 'bold', color: index < 3 ? '#d4af37' : 'white' }}>{index + 1}</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{player.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Player #{player.jersey}</div>
                </div>
                <div style={{ textAlign: 'center' }}>{player.g}</div>
                <div style={{ textAlign: 'center' }}>{player.a}</div>
                <div style={{ textAlign: 'center' }}>{player.app}</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#d4af37' }}>{player.pts}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}