import React, { useState, useRef, useEffect } from 'react'
import { Activity, Calendar, ChevronDown, Layers, Users, X } from 'lucide-react'

interface ToolbarFiltersProps {
  title?: string
  dateFilter: string
  onDateFilterChange: (val: string) => void
  productFilter: string
  onProductFilterChange: (val: string) => void
  products: string[]
  teamFilter: string
  onTeamFilterChange: (val: string) => void
  teams: string[]
  statusFilter: string
  onStatusFilterChange: (val: string) => void
  statuses: string[]
  onClearFilters: () => void
  activeFiltersCount: number
}

export const ToolbarFilters: React.FC<ToolbarFiltersProps> = ({
  title,
  dateFilter,
  onDateFilterChange,
  productFilter,
  onProductFilterChange,
  products,
  teamFilter,
  onTeamFilterChange,
  teams,
  statusFilter,
  onStatusFilterChange,
  statuses,
  onClearFilters,
  activeFiltersCount,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'date' | 'product' | 'team' | 'status' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dateOptions = [
    { label: 'Все время', value: 'all' },
    { label: 'Сегодня', value: 'today' },
    { label: 'За 24 часа', value: '24h' },
    { label: 'За 7 дней', value: '7d' },
  ]

  const getDateLabel = () => {
    const found = dateOptions.find((d) => d.value === dateFilter)
    return found ? found.label : 'Дата'
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row md:items-center justify-between gap-3 select-none flex-1 min-w-0"
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title || 'Инциденты'}
        </h1>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#E30611] bg-slate-100 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
          >
            <span>Сбросить ({activeFiltersCount})</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Date Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              dateFilter !== 'all'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-800 bg-white hover:bg-slate-50 text-slate-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{getDateLabel()}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
          </button>

          {openDropdown === 'date' && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95">
              {dateOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onDateFilterChange(opt.value)
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                    dateFilter === opt.value ? 'font-bold text-[#E30611]' : 'text-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {dateFilter === opt.value && <span className="text-[#E30611]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              productFilter
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-800 bg-white hover:bg-slate-50 text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{productFilter || 'Продукт'}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
          </button>

          {openDropdown === 'product' && (
            <div className="absolute right-0 mt-1.5 w-56 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onProductFilterChange('')
                  setOpenDropdown(null)
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                  !productFilter ? 'font-bold text-[#E30611]' : 'text-slate-700'
                }`}
              >
                <span>Все продукты</span>
                {!productFilter && <span className="text-[#E30611]">✓</span>}
              </button>
              {products.map((prod) => (
                <button
                  key={prod}
                  onClick={() => {
                    onProductFilterChange(prod)
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between truncate cursor-pointer ${
                    productFilter === prod ? 'font-bold text-[#E30611]' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{prod}</span>
                  {productFilter === prod && <span className="text-[#E30611] ml-2">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Team Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'team' ? null : 'team')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              teamFilter
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-800 bg-white hover:bg-slate-50 text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{teamFilter || 'Команда'}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
          </button>

          {openDropdown === 'team' && (
            <div className="absolute right-0 mt-1.5 w-64 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onTeamFilterChange('')
                  setOpenDropdown(null)
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                  !teamFilter ? 'font-bold text-[#E30611]' : 'text-slate-700'
                }`}
              >
                <span>Все команды</span>
                {!teamFilter && <span className="text-[#E30611]">✓</span>}
              </button>
              {teams.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onTeamFilterChange(t)
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between truncate cursor-pointer ${
                    teamFilter === t ? 'font-bold text-[#E30611]' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{t}</span>
                  {teamFilter === t && <span className="text-[#E30611] ml-2">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              statusFilter
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-800 bg-white hover:bg-slate-50 text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{statusFilter || 'Статус'}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
          </button>

          {openDropdown === 'status' && (
            <div className="absolute right-0 mt-1.5 w-56 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onStatusFilterChange('')
                  setOpenDropdown(null)
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                  !statusFilter ? 'font-bold text-[#E30611]' : 'text-slate-700'
                }`}
              >
                <span>Все статусы</span>
                {!statusFilter && <span className="text-[#E30611]">✓</span>}
              </button>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    onStatusFilterChange(st)
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between truncate cursor-pointer ${
                    statusFilter === st ? 'font-bold text-[#E30611]' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{st}</span>
                  {statusFilter === st && <span className="text-[#E30611] ml-2">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
