import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const initialForm = {
  appearance: true,
  full_game: false,
  goals: 0,
  assists: 0,
  clean_sheet: false,
  motm: false,
  yellow_cards: 0,
  red_cards: 0,
};

export default function AdminDashboard() {
  const [gameweeks, setGameweeks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentGW, setCurrentGW] = useState(null);

  const [selectedGameweek, setSelectedGameweek] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [potw, setPotw] = useState(null);
  const [loadingPotw, setLoadingPotw] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: gwData } = await supabase
        .from("gameweeks")
        .select("*")
        .order("number", { ascending: true });

      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .order("jersey_number", { ascending: true });

      setGameweeks(gwData || []);
      setPlayers(playerData || []);

      if (gwData?.length) {
        const current = gwData.find(gw => gw.is_current) || gwData[0];
        setCurrentGW(current);
        setSelectedGameweek(current.id);
      }
      if (playerData?.length) {
        setSelectedPlayer(playerData[0].id);
      }
    }

    loadData();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const totalPoints =
    (form.appearance ? 1 : 0) +
    (form.full_game ? 1 : 0) +
    Number(form.goals || 0) * 4 +
    Number(form.assists || 0) * 3 +
    (form.clean_sheet ? 4 : 0) +
    (form.motm ? 4 : 0) -
    Number(form.yellow_cards || 0) -
    Number(form.red_cards || 0) * 3;

  async function savePerformance() {
    if (!selectedGameweek || !selectedPlayer) {
      setMessage("Please select a gameweek and player.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("player_gameweek_stats")
      .upsert(
        {
          player_id: selectedPlayer,
          gameweek_id: selectedGameweek,
          appearance: form.appearance,
          full_game: form.full_game,
          goals: Number(form.goals || 0),
          assists: Number(form.assists || 0),
          clean_sheet: form.clean_sheet,
          motm: form.motm,
          yellow_cards: Number(form.yellow_cards || 0),
          red_cards: Number(form.red_cards || 0),
          points: totalPoints,
        },
        {
          onConflict: "player_id,gameweek_id",
        }
      );

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Performance saved successfully!");
      setPotw(null);
    }

    setSaving(false);
  }

  // NEW: Delete player stats for selected gameweek
  async function deletePlayerStats() {
    if (!selectedGameweek || !selectedPlayer) {
      setMessage("Please select a gameweek and player to delete.");
      return;
    }

    if (!window.confirm("Delete all stats for this player in this gameweek?")) {
      return;
    }

    setMessage("");
    const { error } = await supabase
      .from("player_gameweek_stats")
      .delete()
      .eq("player_id", selectedPlayer)
      .eq("gameweek_id", selectedGameweek);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Stats deleted successfully!");
      setForm(initialForm);
    }
  }

  // NEW: Clear ALL stats for current gameweek
  async function clearAllStats() {
    if (!currentGW) return;
    
    if (!window.confirm(`Clear ALL stats for ${currentGW.name}? This cannot be undone!`)) {
      return;
    }

    setMessage("");
    const { error } = await supabase
      .from("player_gameweek_stats")
      .delete()
      .eq("gameweek_id", currentGW.id);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage(`All stats for ${currentGW.name} cleared!`);
      setForm(initialForm);
    }
  }

  async function calculatePotw() {
    if (!selectedGameweek) {
      setMessage("Please select a gameweek first.");
      return;
    }

    setLoadingPotw(true);
    setMessage("");

    const { data, error } = await supabase
      .from("player_gameweek_stats")
      .select(`points, player:players(name, jersey_number)`)
      .eq("gameweek_id", selectedGameweek)
      .order("points", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      setMessage("No stats found for this week. Save some performances first!");
    } else {
      setPotw(data.player);
      setMessage(` ${data.player.name} is the Player of the Week with ${data.points} points!`);
    }
    setLoadingPotw(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Calculate next Thursday
  const getNextThursday = () => {
    const today = new Date();
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7 || 7));
    return nextThursday.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <button
        onClick={handleLogout}
        style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#ff4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '12px'
        }}
      >
        Logout
      </button>

      <section className="admin-page">
        
        {/* DATE DISPLAY */}
        <div className="admin-card" style={{ marginBottom: '20px', background: 'linear-gradient(145deg, rgba(244, 200, 74, 0.1), rgba(20, 18, 14, 0.96))' }}>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block', marginBottom: '5px' }}>NEXT GAMEWEEK</span>
            <strong style={{ color: 'var(--gold)', fontSize: '20px' }}>{getNextThursday()}</strong>
            <span style={{ color: 'var(--muted)', fontSize: '11px', marginLeft: '10px' }}>(Every Thursday)</span>
          </div>
        </div>

        {/* PLAYER OF THE WEEK CARD */}
        <div className="admin-card" style={{ marginBottom: '20px', borderColor: 'var(--gold)' }}>
          <div className="section-heading">
            <span className="eyebrow">AUTOMATION</span>
            <h2>Player of the Week</h2>
          </div>

          {potw ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h3 style={{ fontSize: '28px', color: 'var(--gold)', margin: '0 0 10px 0' }}>
                🏆 {potw.name} <span style={{ fontSize: '16px', color: 'var(--muted)' }}>#{potw.jersey_number}</span>
              </h3>
              <p style={{ color: 'var(--muted)', marginBottom: '15px' }}>Highest points for the selected gameweek!</p>
              <button 
                onClick={() => setPotw(null)} 
                style={{ padding: '10px 20px', backgroundColor: 'var(--panel-2)', color: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
              >
                Calculate Again
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--muted)', marginBottom: '15px' }}>Select a gameweek above, then click below to find the winner.</p>
              <button 
                onClick={calculatePotw} 
                disabled={loadingPotw}
                style={{ padding: '12px 24px', backgroundColor: 'var(--gold)', color: '#080808', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '14px' }}
              >
                {loadingPotw ? "Calculating..." : "Find Player of the Week"}
              </button>
            </div>
          )}
        </div>

        <div className="section-heading">
          <span className="eyebrow">CONTROL ROOM</span>
          <h2>Admin Dashboard</h2>
          <p>Enter weekly player performance.</p>
        </div>

        <div className="admin-card">
          {/* GAMEWEEK */}
          <div className="form-group">
            <label>GAMEWEEK</label>
            <select
              value={selectedGameweek}
              onChange={(e) => {
                setSelectedGameweek(e.target.value);
                setPotw(null);
              }}
            >
              {gameweeks.map((gameweek) => (
                <option key={gameweek.id} value={gameweek.id}>
                  {gameweek.name || `Gameweek ${gameweek.number}`}
                </option>
              ))}
            </select>
          </div>

          {/* PLAYER */}
          <div className="form-group">
            <label>PLAYER</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  #{player.jersey_number} — {player.name}
                </option>
              ))}
            </select>
          </div>

          {/* PERFORMANCE */}
          <div className="performance-section">
            <h3>PERFORMANCE</h3>

            <label className="toggle-row">
              <span>Appearance</span>
              <input
                type="checkbox"
                checked={form.appearance}
                onChange={(e) => updateField("appearance", e.target.checked)}
              />
            </label>

            <label className="toggle-row">
              <span>Full Game</span>
              <input
                type="checkbox"
                checked={form.full_game}
                onChange={(e) => updateField("full_game", e.target.checked)}
              />
            </label>

            <div className="number-grid">
              <div className="form-group">
                <label>GOALS</label>
                <input
                  type="number"
                  min="0"
                  value={form.goals}
                  onChange={(e) => updateField("goals", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>ASSISTS</label>
                <input
                  type="number"
                  min="0"
                  value={form.assists}
                  onChange={(e) => updateField("assists", e.target.value)}
                />
              </div>
            </div>

            <label className="toggle-row">
              <span>Clean Sheet</span>
              <input
                type="checkbox"
                checked={form.clean_sheet}
                onChange={(e) => updateField("clean_sheet", e.target.checked)}
              />
            </label>

            <label className="toggle-row">
              <span>Man of the Match</span>
              <input
                type="checkbox"
                checked={form.motm}
                onChange={(e) => updateField("motm", e.target.checked)}
              />
            </label>

            <div className="number-grid">
              <div className="form-group">
                <label>YELLOW CARDS</label>
                <input
                  type="number"
                  min="0"
                  value={form.yellow_cards}
                  onChange={(e) => updateField("yellow_cards", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>RED CARDS</label>
                <input
                  type="number"
                  min="0"
                  value={form.red_cards}
                  onChange={(e) => updateField("red_cards", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TOTAL POINTS */}
          <div className="points-preview">
            <span>TOTAL POINTS</span>
            <strong>{totalPoints}</strong>
            <small>Calculated automatically from performance.</small>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px' }}>
            <button
              className="save-performance"
              onClick={savePerformance}
              disabled={saving}
            >
              {saving ? "SAVING..." : "SAVE PERFORMANCE"}
            </button>
            
            <button
              onClick={deletePlayerStats}
              style={{
                padding: '15px',
                border: '1px solid #ff4444',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                color: '#ff4444',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              DELETE STATS
            </button>
          </div>

          {/* CLEAR ALL BUTTON */}
          <button
            onClick={clearAllStats}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🗑️ Clear All Stats for {currentGW?.name || 'Current GW'}
          </button>

          {message && (
            <div className="admin-message" style={{ 
              color: message.includes("successfully") || message.includes("🏆") ? '#4ade80' : '#ff8b8b',
              background: message.includes("successfully") || message.includes("🏆") ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 139, 139, 0.1)'
            }}>
              {message}
            </div>
          )}
        </div>

                {/* MANAGE PLAYERS SECTION */}
        <div className="admin-card" style={{ marginTop: '30px' }}>
          <div className="section-heading">
            <span className="eyebrow">MANAGEMENT</span>
            <h2>Manage Players</h2>
            <p>Remove players from the league.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {players.map((player) => (
              <div 
                key={player.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}
              >
                <span style={{ color: 'var(--white)', fontWeight: 'bold' }}>
                  #{player.jersey_number} {player.name}
                </span>
                <button
                  onClick={() => deletePlayer(player.id, player.name)}
                  style={{ 
                    padding: '8px 14px', 
                    background: '#ff4444', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}