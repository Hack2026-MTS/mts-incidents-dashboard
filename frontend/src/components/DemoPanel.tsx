import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Play,
  RotateCcw,
  Users,
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
  const [isOpen, setIsOpen] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleAction = async (name: string, fn: () => Promise<any>) => {
    setLoadingAction(name)
    try {
      await fn()
      onRefresh()
    } catch (e) {
      alert('Ошибка симуляции: ' + e)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="fixed bottom-3 right-6 z-40 max-w-xl w-full">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Toggle header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-200">
              Панель живой демонстрации (для защиты кейса)
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-200">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        {isOpen && (
          <div className="p-3 bg-slate-900/90 text-xs">
            <p className="text-[11px] text-slate-400 mb-2.5">
              Сценарии мгновенной проверки реакции дашборда через SSE (слайд 10 требований):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Simulate Critical */}
              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction('critical', demoCreateCritical)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/80 text-red-200 text-center transition-all disabled:opacity-50"
              >
                <Flame className="h-4 w-4 text-red-400 mb-1" />
                <span className="font-semibold text-[11px] leading-tight">1. Критический сбой (KION)</span>
              </button>

              {/* 2. Assign to coordinator */}
              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction('coordinator', demoAssignCoordinator)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/80 text-amber-200 text-center transition-all disabled:opacity-50"
              >
                <Users className="h-4 w-4 text-amber-400 mb-1" />
                <span className="font-semibold text-[11px] leading-tight">2. На координатора</span>
              </button>

              {/* 3. Resolve Critical */}
              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction('resolve', () => demoResolveCritical())}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-200 text-center transition-all disabled:opacity-50"
              >
                <Play className="h-4 w-4 text-emerald-400 mb-1" />
                <span className="font-semibold text-[11px] leading-tight">3. Решить инцидент</span>
              </button>

              {/* 4. Reset Data */}
              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction('reset', demoResetData)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-center transition-all disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 text-slate-400 mb-1" />
                <span className="font-semibold text-[11px] leading-tight">Сброс данных</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
