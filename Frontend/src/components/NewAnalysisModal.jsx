import React, { useState, useEffect, useRef } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { triggerAnalysis } from '../lib/api'
import { getStoredAuth } from '../lib/auth'
import { saveTemplate, newTemplateId } from '../lib/templates'

const UNIT_TYPES = [
  { label: 'Studio (0bd)', beds: 0 },
  { label: 'Single (1bd)', beds: 1 },
  { label: 'Duplex (2bd)', beds: 2 },
  { label: 'Triplex (3bd)', beds: 3 },
  { label: 'Fourplex (4bd)', beds: 4 },
  { label: 'Multiplex (5bd+)', beds: 5 },
]
const BATH_COUNTS = [1, 2, 3, 4, 5]

const COMM_TYPES = ['Retail', 'Office', 'Storage', 'Other']

const EMPTY_FORM = {
  templateName: '',
  address: '',
  lat: '',
  lng: '',
  price: '',
  improvements: '',
  sqft: '',
  combos: {},         // key: "beds_baths" → units count
  commercial: [],     // [{type, sqft, rentPerSF}]
  radius: 10,
  minComps: 40,
  maxComps: 60,
  status: 'Active',
}

function geocode(addr) {
  return fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`,
    { headers: { 'Accept-Language': 'en-US,en', 'User-Agent': 'PingAnalystCRM/1.0' } }
  ).then(r => r.json())
}

export default function NewAnalysisModal({ initial = null, onClose, onSubmitted }) {
  const [form,        setForm]        = useState(initial ? { ...EMPTY_FORM, ...initial } : { ...EMPTY_FORM })
  const [geocoding,   setGeocoding]   = useState(false)
  const [geoError,    setGeoError]    = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')
  const addrTimer = useRef(null)

  const { apiKey } = getStoredAuth()

  // Auto-geocode when address changes
  useEffect(() => {
    if (!form.address || form.address.length < 8) return
    clearTimeout(addrTimer.current)
    addrTimer.current = setTimeout(async () => {
      setGeocoding(true); setGeoError('')
      try {
        const results = await geocode(form.address)
        if (results[0]) {
          setForm(f => ({ ...f, lat: parseFloat(results[0].lat).toFixed(5), lng: parseFloat(results[0].lon).toFixed(5) }))
        } else {
          setGeoError('Address not found')
        }
      } catch { setGeoError('Geocode failed') }
      finally { setGeocoding(false) }
    }, 700)
  }, [form.address])

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleCombo(beds, baths) {
    const key = `${beds}_${baths}`
    setForm(f => {
      const combos = { ...f.combos }
      if (combos[key]) delete combos[key]
      else combos[key] = 1
      return { ...f, combos }
    })
  }

  function setComboUnits(beds, baths, units) {
    const key = `${beds}_${baths}`
    setForm(f => ({ ...f, combos: { ...f.combos, [key]: Math.max(1, parseInt(units) || 1) } }))
  }

  function addCommRow() {
    setForm(f => ({ ...f, commercial: [...f.commercial, { type: COMM_TYPES[0], sqft: '', rentPerSF: '' }] }))
  }
  function removeCommRow(i) {
    setForm(f => ({ ...f, commercial: f.commercial.filter((_, idx) => idx !== i) }))
  }
  function setCommField(i, k, v) {
    setForm(f => {
      const commercial = [...f.commercial]
      commercial[i] = { ...commercial[i], [k]: v }
      return { ...f, commercial }
    })
  }

  const selectedCombos = Object.entries(form.combos)
    .map(([key, units]) => {
      const [beds, baths] = key.split('_').map(Number)
      return { beds, baths, units }
    })

  const totalUnits = selectedCombos.reduce((s, c) => s + c.units, 0)

  async function handleSaveTemplate() {
    const tpl = {
      id: initial?.id || newTemplateId(),
      templateName: form.templateName || form.address || 'Untitled',
      ...form,
      isDefault: initial?.isDefault || false,
    }
    saveTemplate(tpl)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.address) { setSubmitError('Address is required'); return }
    if (selectedCombos.length === 0) { setSubmitError('Select at least one unit type'); return }

    setSubmitting(true); setSubmitError('')

    // Save as template
    await handleSaveTemplate()

    const body = {
      api_key:    apiKey,
      address:    form.address,
      lat:        parseFloat(form.lat) || 0,
      lng:        parseFloat(form.lng) || 0,
      price:      parseFloat(String(form.price).replace(/[^0-9.]/g,'')) || 0,
      cost:       parseFloat(String(form.improvements).replace(/[^0-9.]/g,'')) || 0,
      sqft:       parseFloat(form.sqft) || 0,
      combos:     selectedCombos,
      commercial: form.commercial.filter(c => c.sqft && c.rentPerSF),
      radius:     parseFloat(form.radius) || 10,
      minComps:   parseInt(form.minComps) || 40,
      maxComps:   parseInt(form.maxComps) || 60,
      status:     form.status,
    }

    try {
      const res = await triggerAnalysis(body)
      onSubmitted?.(res)
      onClose()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="w-full mr-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Template Name</label>
            <input
              className="w-full text-base font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Albany Pearl Street"
              value={form.templateName}
              onChange={e => setField('templateName', e.target.value)}
            />
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-7">
          {/* Property Information */}
          <section>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              <MapPin size={12} /> Property Information
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label">Property Address <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  placeholder="123 Main St, Albany NY 12207"
                  value={form.address}
                  onChange={e => setField('address', e.target.value)}
                />
              </div>

              {/* Geocoords */}
              {(form.lat && form.lng) ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <MapPin size={12} className="shrink-0" />
                  {form.lat}, {form.lng}
                </div>
              ) : geocoding ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Loader2 size={12} className="animate-spin" /> Geocoding…
                </div>
              ) : geoError ? (
                <p className="text-xs text-red-500">{geoError}</p>
              ) : null}

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Price', 'price', 'optional', '$1,200,000'],
                  ['Improvements', 'improvements', 'optional', '$75,000'],
                  ['Building SQFT', 'sqft', 'optional', '8500'],
                ].map(([label, key, note, ph]) => (
                  <div key={key}>
                    <label className="form-label">{label} <span className="text-slate-400 normal-case font-normal">({note})</span></label>
                    <input className="input" placeholder={ph} value={form[key]} onChange={e => setField(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Unit Mix */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">Unit Mix <span className="text-red-500">*</span></label>
              {selectedCombos.length > 0 && (
                <span className="text-xs bg-blue-600 text-white font-semibold px-2.5 py-1 rounded-full">
                  {selectedCombos.length} Selected
                </span>
              )}
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Type</th>
                    {BATH_COUNTS.map(b => (
                      <th key={b} className="px-3 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center">{b}BA</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {UNIT_TYPES.map(({ label, beds }) => (
                    <tr key={beds} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 text-sm text-slate-700 font-medium">{label}</td>
                      {BATH_COUNTS.map(baths => {
                        const key = `${beds}_${baths}`
                        const checked = !!form.combos[key]
                        return (
                          <td key={baths} className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCombo(beds, baths)}
                              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected combos — unit count editor */}
            {selectedCombos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCombos.map(({ beds, baths, units }) => (
                  <div key={`${beds}_${baths}`} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="text-slate-600 font-medium">{beds}bd/{baths}ba</span>
                    <input
                      type="number"
                      min="1"
                      value={units}
                      onChange={e => setComboUnits(beds, baths, e.target.value)}
                      className="w-10 border border-slate-200 rounded px-1.5 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-slate-400">units</span>
                  </div>
                ))}
                <div className="flex items-center text-xs text-slate-400 px-1">
                  = {totalUnits} total
                </div>
              </div>
            )}
          </section>

          {/* Commercial Spaces */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">Commercial Spaces</label>
              <button type="button" onClick={addCommRow} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add</button>
            </div>
            {form.commercial.length === 0 ? (
              <p className="text-xs text-slate-400">No commercial spaces. Click + Add to include retail/office units.</p>
            ) : (
              <div className="space-y-2">
                {form.commercial.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_100px_100px_24px] gap-2 items-center">
                    <select className="input text-sm" value={row.type} onChange={e => setCommField(i, 'type', e.target.value)}>
                      {COMM_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input className="input text-sm" placeholder="SQFT" value={row.sqft} onChange={e => setCommField(i, 'sqft', e.target.value)} />
                    <input className="input text-sm" placeholder="$/SF" value={row.rentPerSF} onChange={e => setCommField(i, 'rentPerSF', e.target.value)} />
                    <button type="button" onClick={() => removeCommRow(i)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Search Parameters */}
          <section>
            <label className="form-label">Search Parameters</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Radius (mi)', 'radius', '10'],
                ['Min Comps', 'minComps', '40'],
                ['Max Comps', 'maxComps', '60'],
              ].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="block text-[11px] text-slate-500 mb-1">{label}</label>
                  <input type="number" className="input" placeholder={ph} value={form[key]} onChange={e => setField(key, e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {submitError && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting
                ? <><Loader2 size={13} className="animate-spin" /> Running…</>
                : 'Run Analysis'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
