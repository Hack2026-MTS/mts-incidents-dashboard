import React, { useState } from 'react'
import {
  Flame,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import {
  demoAssignCoordinator,
  demoCreateCritical,
  demoResetData,
  demoResolveCritical,
} from '../services/api'

interface DemoPanelProps {
  onRefresh: () => void
}

export const DemoPanel: React.FC<DemoPanelProps> = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAction = async (fn: () => Promise<any>) => {
    setLoading(true)
    try {
      await fn()
      onRefresh()
    } catch (e) {
      alert('Ошибка: ' + e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-2 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700/80 text-[11px] font-medium shadow-lg backdrop-blur transition-all"
        >
          <Sparkles className="h-3 w-3 text-red-400" />
          <span>Демо-симуляция</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-2 right-4 z-40 max-w-sm w-full animate-in fade-in zoom-in-95 duration-100">
      <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md p-3 text-xs">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-red-400" />
            Симуляция событий ITSM
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            disabled={loading}
            onClick={() => handleAction(demoCreateCritical)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-800 text-red-200 font-medium text-[11px] disabled:opacity-50"
          >
            <Flame className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
            <span className="truncate">+ Критический</span>
          </button>

          <button
            disabled={loading}
            onClick={() => handleAction(demoAssignCoordinator)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800 text-amber-200 font-medium text-[11px] disabled:opacity-50"
          >
            <Users className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">+ На координатора</span>
          </button>

          <button
            disabled={loading}
            onClick={() => handleAction(() => demoResolveCritical())}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-200 font-medium text-[11px] disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Решить инцидент</span>
          </button>

          <button
            disabled={loading}
            onClick={() => handleAction(demoResetData)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-[11px] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">Сброс</span>
          </button>
        </div>
      </div>
    </div>
  )
}
