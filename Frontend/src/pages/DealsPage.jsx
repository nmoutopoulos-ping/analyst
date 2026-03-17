import React, { useState, useEffect, useMemo } from 'react'
import { Search, Settings, MapPin, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchDeals } from '../lib/api'
import StageBadge from '../components/StageBadge'

const COLUMNS = [
  { id: 'New',          label: 'New' },
  { id: 'Active',       label: 'Active' },
  { id: 'Under Review', label: 'Under Review' },
  { id: 'Closed',       label: 'Closed' },
]

// Map legacy stage names to new kanban columns
function normalizeStage(stage) {
  const map = {
    'New':      'New',
    'Review':   'Active',
    'Offer':    'Under Review',
    'Contract': 'Under Review',
    'Closed':   'Closed',
    'Pass':     'Closed',
    'Active':   'Active',
    'Under Review': 'Under Review',
  }
  return map[stage] || 'New'
}

function formatUSD(v) {
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? '—' : '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function DealCard({ deal, onClick }) {
  const meta = deal.search_meta || {}
  const combos = meta.combos || []
  const totalUnits = combos.reduce((s, c) => s + (c.units || 1), 0) || meta.total_units || '—'

  const unitsLabel = (() => {
    if (!combos.length) return totalUnits
    // e.g. "6 units" or "7 units"
    return `${totalUnits} units`
  })()

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Search ID */}
      <div className="mb-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search ID</div>
        <div className="font-bold text-sm text-slate-900 font-mono">{deal.search_id}</div>
        <div className="text-xs text-slate-400">{formatDate(deal.created_at)}</div>
      </div>

      {/* Property */}
      <div className="flex items-start gap-1.5 mb-3">
        <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Property</div>
          <div className="text-sm text-slate-700 leading-snug">{meta.address || deal.address || '—'}</div>
        </div>
      </div>

      {/* Units + Price */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <Building2 size={10} /> Units
          </div>
          <div className="font-bold text-sm text-slate-900">{unitsLabel}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">$ Price</div>
          <div className="font-bold text-sm text-slate-900">{formatUSD(meta.listing_price || meta.price)}</div>
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
        <StageBadge stage={deal.stage || 'New'} />
      </div>
    </div>
  )
}

export default function DealsPage() {
  const [deals,   setDeals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [query,   setQuery]   = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchDeals()
      .then(d => setDeals(Array.isArray(d) ? d : (d.deals || [])))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query) return deals
    const q = query.toLowerCase()
    return deals.filter(d => {
      const addr = ((d.search_meta?.address || d.address) || '').toLowerCase()
      const id   = (d.search_id || '').toLowerCase()
      return addr.includes(q) || id.includes(q)
    })
  }, [deals, query])

  const columns = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      deals: filtered.filter(d => normalizeStage(d.stage || 'New') === col.id),
    }))
  }, [filtered])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading…</div>

  return (
    <div className="px-6 py-7">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
        <p className="text-sm text-slate-500 mt-0.5">All submitted analyses stored and secure.</p>
      </div>

      {/* Search bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-6 shadow-sm">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          className="flex-1 text-sm outline-none placeholder:text-slate-400 bg-transparent"
          placeholder="Search by address or ID..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Settings size={16} />
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col.id}>
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">{col.label}</span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full">
                {col.deals.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {col.deals.map(deal => (
                <DealCard
                  key={deal.search_id}
                  deal={deal}
                  onClick={() => navigate(`/deals/${deal.search_id}`)}
                />
              ))}
              {col.deals.length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {deals.length === 0 && !error && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🏘</div>
          <div className="font-semibold text-slate-600 mb-1">No deals yet</div>
          <div className="text-xs text-slate-400">Run an analysis from the Analysis tab to get started.</div>
        </div>
      )}
    </div>
  )
}
