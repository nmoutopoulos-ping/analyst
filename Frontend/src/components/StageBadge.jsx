import React from 'react'

const stageStyles = {
  New:            'bg-emerald-100 text-emerald-700',
  Active:         'bg-amber-100 text-amber-700',
  'Under Review': 'bg-blue-100 text-blue-700',
  Closed:         'bg-slate-100 text-slate-500',
  // Legacy
  Review:         'bg-amber-100 text-amber-700',
  Offer:          'bg-violet-100 text-violet-700',
  Contract:       'bg-blue-100 text-blue-700',
  Pass:           'bg-slate-100 text-slate-400',
}

export default function StageBadge({ stage }) {
  const cls = stageStyles[stage] || stageStyles.New
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {stage}
    </span>
  )
}
