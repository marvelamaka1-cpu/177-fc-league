import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function LoginPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setError('Wrong email or password.')
      setLoading(false)
    }
    // Success: Supabase triggers onAuthStateChange automatically
  }

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center', 
      color: 'white', 
      backgroundColor: '#0a0a0a', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ marginBottom: '30px' }}>
        <img src="/fc-logo.jpg" alt="177 FC Logo" style={{ width: '80px', borderRadius: '13px', border: '1px solid var(--border)', marginBottom: '15px' }} />
        <h2 style={{ color: 'var(--gold)', margin: '10px 0' }}>Admin Login</h2>
        <p style={{ color: 'var(--muted)' }}>177 FC Street League</p>
      </div>
      
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '350px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ 
            display: 'block', 
            margin: '10px auto', 
            padding: '14px', 
            width: '100%', 
            borderRadius: '10px', 
            border: '1px solid var(--border)', 
            backgroundColor: '#111', 
            color: 'white',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ 
            display: 'block', 
            margin: '10px auto', 
            padding: '14px', 
            width: '100%', 
            borderRadius: '10px', 
            border: '1px solid var(--border)', 
            backgroundColor: '#111', 
            color: 'white',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            marginTop: '20px', 
            backgroundColor: 'var(--gold)', 
            color: '#080808', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontWeight: '900', 
            fontSize: '16px' 
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {error && <p style={{ color: '#ff8b8b', marginTop: '20px' }}>{error}</p>}

      <button 
        onClick={onBack}
        style={{ 
          marginTop: '30px', 
          padding: '12px 24px', 
          backgroundColor: 'transparent', 
          color: 'var(--muted)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        ← Back to Public Site
      </button>
    </div>
  )
}