import React, { useState } from 'react'
import {
  CheckCircle2,
  Flame,
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
import { soundAlert } from '../utils/audio'

interface DemoPanelProps {
  onRefresh: () => void
}

export const DemoPanel: React.FC<DemoPanelProps> = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAction = async (fn: () => Promise<any>, soundAction?: () => void) => {
    // Play sound immediately within the user gesture click stack
    if (soundAction) {
      soundAction()
    }
    setLoading(true)
    try {
      await fn()
      await onRefresh()
    } catch (e) {
      alert('Ошибка симуляции: ' + e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-6 z-40">
        <button
          onClick={() => {
            soundAlert.unlock()
            setIsOpen(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#E30611]" />
          <span>Демо-симуляция</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-6 z-40 max-w-xs w-full animate-in fade-in zoom-in-95 duration-100">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-xs select-none">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#E30611]" />
            Симуляция событий ITSM
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mb-3">
          Тестирование сценариев в реальном времени с воспроизведением аварийных сигналов и пушей.
        </p>

        <div className="space-y-2">
          {/* Create Critical */}
          <button
            onClick={() =>
              handleAction(demoCreateCritical, () => soundAlert.playCriticalAlert())
            }
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-[#E30611] font-bold text-xs transition-colors cursor-pointer text-left"
          >
            <Flame className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div>Критическая авария (P4)</div>
              <div className="text-[10px] font-normal text-red-500">Сирена + пуш-баннер</div>
            </div>
          </button>

          {/* Assign Coordinator */}
          <button
            onClick={() =>
              handleAction(demoAssignCoordinator, () => soundAlert.playCoordinatorAlert())
            }
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-bold text-xs transition-colors cursor-pointer text-left"
          >
            <Users className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="flex-1 min-w-0">
              <div>Передать координаторам</div>
              <div className="text-[10px] font-normal text-amber-600">Колонка «На координаторах»</div>
            </div>
          </button>

          {/* Resolve Critical */}
          <button
            onClick={() =>
              handleAction(() => demoResolveCritical(), () => soundAlert.playResolvedAlert())
            }
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold text-xs transition-colors cursor-pointer text-left"
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            <div className="flex-1 min-w-0">
              <div>Решить критический</div>
              <div className="text-[10px] font-normal text-emerald-600">Перевести в «Завершен»</div>
            </div>
          </button>

          {/* Reset */}
          <button
            onClick={() =>
              handleAction(demoResetData, () => soundAlert.playCoordinatorAlert())
            }
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs mt-2 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Сбросить данные к исходным</span>
          </button>
        </div>
      </div>
    </div>
  )
}
