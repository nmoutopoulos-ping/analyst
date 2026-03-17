import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, FileText, Settings, LogOut } from 'lucide-react'
import { getStoredAuth, clearStoredAuth } from '../lib/auth'

const tabs = [
  { to: '/analysis', label: 'Analysis', icon: Plus,     exact: false },
  { to: '/deals',    label: 'Deals',    icon: FileText,  exact: false },
  { to: '/settings', label: 'Settings', icon: Settings,  exact: false },
]

export default function TopNav({ onSignOut }) {
  const { userName } = getStoredAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    clearStoredAuth()
    onSignOut()
  }

  return (
    <nav className="bg-[#1a1f2e] sticky top-0 z-50 flex items-center px-5 h-12 gap-1">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center text-xs">🏘</div>
        <span className="text-white font-bold text-sm">Ping Analyst</span>
      </div>

      {/* Tabs */}
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
             ${isActive
               ? 'bg-[#2d3348] text-white'
               : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`
          }
        >
          {({ isActive }) => (
            <>
              {to === '/analysis'
                ? <span className={`text-white/60 ${isActive ? 'text-white/90' : ''}`}>+</span>
                : <Icon size={13} />
              }
              {label}
            </>
          )}
        </NavLink>
      ))}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        {userName && (
          <span className="text-white/40 text-xs">{userName}</span>
        )}
        <span className="text-white/30 text-xs">v3.0</span>
        <button
          onClick={handleSignOut}
          className="text-white/50 hover:text-white text-xs transition-colors flex items-center gap-1"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
