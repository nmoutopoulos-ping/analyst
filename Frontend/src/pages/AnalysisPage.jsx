import React, { useState, useEffect } from 'react'
import { Plus, MapPin, Search, MoreHorizontal, Star, Trash2, Edit2, Copy } from 'lucide-react'
import { getTemplates, deleteTemplate, setDefaultTemplate, saveTemplate, newTemplateId } from '../lib/templates'
import NewAnalysisModal from '../components/NewAnalysisModal'

function TemplateCard({ template, onEdit, onDelete, onSetDefault, onRun }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const selectedCombos = Object.entries(template.combos || {})
  const totalUnits = selectedCombos.reduce((s, [, u]) => s + u, 0)
  const hasCommercial = (template.commercial || []).length > 0

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-tight">{template.templateName || template.address}</h3>
          {template.isDefault && (
            <span className="inline-block mt-1.5 text-[11px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Default</span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 text-sm"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button onClick={() => { onRun(template); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 font-medium">Run Analysis</button>
              <button onClick={() => { onEdit(template); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-600 flex items-center gap-2"><Edit2 size={13} /> Edit Template</button>
              {!template.isDefault && (
                <button onClick={() => { onSetDefault(template.id); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-600 flex items-center gap-2"><Star size={13} /> Set as Default</button>
              )}
              <button
                onClick={() => {
                  const copy = { ...template, id: newTemplateId(), templateName: `${template.templateName} (copy)`, isDefault: false }
                  saveTemplate(copy)
                  setMenuOpen(false)
                  window.location.reload() // simple refresh
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-600 flex items-center gap-2"
              >
                <Copy size={13} /> Duplicate
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button onClick={() => { onDelete(template.id); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={13} /> Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 mb-3" onClick={() => onRun(template)}>
        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Property Address</div>
          <div className="text-sm font-medium text-slate-800">{template.address}</div>
          {template.lat && template.lng && (
            <div className="text-xs text-emerald-600 mt-0.5">{template.lat}, {template.lng}</div>
          )}
        </div>
      </div>

      {/* Price / Improvements / SQFT */}
      <div className="grid grid-cols-3 gap-3 mb-3 text-xs" onClick={() => onRun(template)}>
        {[
          ['Price', template.price ? `$${Number(String(template.price).replace(/[^0-9]/,'')).toLocaleString()}` : '—'],
          ['Improvements', template.improvements ? `$${Number(String(template.improvements).replace(/[^0-9]/,'')).toLocaleString()}` : '—'],
          ['Sqft', template.sqft || '—'],
        ].map(([label, val]) => (
          <div key={label}>
            <div className="text-slate-400 mb-0.5">{label}</div>
            <div className="font-semibold text-slate-800">{val}</div>
          </div>
        ))}
      </div>

      {/* Unit Mix */}
      {selectedCombos.length > 0 && (
        <div className="flex items-center justify-between mb-2 text-xs" onClick={() => onRun(template)}>
          <span className="text-slate-500">Unit Mix<br /><span className="font-semibold text-slate-800 text-sm">{totalUnits} Total Units</span></span>
          <span className="bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">{selectedCombos.length} Selected</span>
        </div>
      )}

      {/* Commercial */}
      {hasCommercial && (
        <div className="flex items-center gap-2 mb-2 text-xs" onClick={() => onRun(template)}>
          <span className="text-slate-500">Commercial Spaces</span>
          <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[11px]">Enabled</span>
        </div>
      )}

      {/* Search params */}
      {(template.radius || template.minComps || template.maxComps) && (
        <div onClick={() => onRun(template)}>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
            <Search size={10} /> Search Parameters
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              ['Radius', `${template.radius || 10} mi`],
              ['Min', template.minComps || 40],
              ['Max', template.maxComps || 60],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-slate-400">{l}</div>
                <div className="font-semibold text-slate-700">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {template.status && (
        <div className="mt-3 text-xs" onClick={() => onRun(template)}>
          <div className="text-slate-400 mb-0.5">Status</div>
          <div className="font-semibold text-slate-700">{template.status}</div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const [templates,   setTemplates]   = useState([])
  const [search,      setSearch]      = useState('')
  const [showModal,   setShowModal]   = useState(false)
  const [editingTpl,  setEditingTpl]  = useState(null)
  const [toast,       setToast]       = useState('')

  useEffect(() => { setTemplates(getTemplates()) }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleDelete(id) {
    setTemplates(deleteTemplate(id))
    showToast('Template deleted')
  }

  function handleSetDefault(id) {
    setTemplates(setDefaultTemplate(id))
    showToast('Default template updated')
  }

  function handleEdit(tpl) {
    setEditingTpl(tpl)
    setShowModal(true)
  }

  function handleRun(tpl) {
    setEditingTpl(tpl)
    setShowModal(true)
  }

  function handleSubmitted(res) {
    showToast(`Analysis started — ${res.searchId || 'check Deals'}`)
    setTemplates(getTemplates())
  }

  function handleModalClose() {
    setShowModal(false)
    setEditingTpl(null)
    setTemplates(getTemplates())
  }

  const filtered = templates.filter(t =>
    !search ||
    (t.templateName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.address || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-7">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-8">
        <input
          className="input flex-1 max-w-lg"
          placeholder="Enter Search Name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => { setEditingTpl(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={15} /> New Search
        </button>
      </div>

      {/* Templates section */}
      {filtered.length > 0 && (
        <>
          <h2 className="text-base font-bold text-slate-900 mb-4">Search Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onRun={handleRun}
              />
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 && !search && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🏘</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No saved searches yet</h3>
          <p className="text-sm text-slate-400 mb-5">Click <strong>New Search</strong> to run your first analysis and save it as a template.</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={14} /> New Search
          </button>
        </div>
      )}

      {showModal && (
        <NewAnalysisModal
          initial={editingTpl}
          onClose={handleModalClose}
          onSubmitted={handleSubmitted}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
