import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Flame,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  RotateCcw,
  Download,
  Search,
  Check,
} from 'lucide-react'
import type { Incident } from '../types/incident'

export type SortColumn =
  | 'id'
  | 'header'
  | 'productName'
  | 'priority'
  | 'state'
  | 'assignedGroupName'
  | 'risk'

export type SortDirection = 'asc' | 'desc'

interface ColumnConfig {
  key: SortColumn
  label: string
  primaryDir: SortDirection
  ascDescription: string
  descDescription: string
  getFilterValue: (inc: Incident) => string
}

const COLUMNS: ColumnConfig[] = [
  {
    key: 'id',
    label: 'ID',
    primaryDir: 'asc',
    ascDescription: 'Сверху вниз (по возрастанию ID)',
    descDescription: 'Снизу вверх (по убыванию ID)',
    getFilterValue: (inc) => inc.id || '',
  },
  {
    key: 'header',
    label: 'Тема инцидента',
    primaryDir: 'asc',
    ascDescription: 'Сверху вниз (А → Я)',
    descDescription: 'Снизу вверх (Я → А)',
    getFilterValue: (inc) => inc.header || '',
  },
  {
    key: 'productName',
    label: 'Продукт',
    primaryDir: 'asc',
    ascDescription: 'Сверху вниз (А → Я)',
    descDescription: 'Снизу вверх (Я → А)',
    getFilterValue: (inc) => inc.productName || inc.service || 'Мобильная сеть',
  },
  {
    key: 'priority',
    label: 'Приоритет',
    primaryDir: 'desc',
    ascDescription: 'Снизу вверх (от низшего к высшему: P1 → P4)',
    descDescription: 'Сверху вниз (от высшего к низшему: P4 → P1)',
    getFilterValue: (inc) => {
      const p =
        inc.priorityId ||
        (inc.priority === 'Наивысший' || inc.priority === 'Критический'
          ? 4
          : inc.priority === 'Высокий'
          ? 3
          : inc.priority === 'Средний'
          ? 2
          : 1)
      return p === 4
        ? 'P4 • Наивысший'
        : p === 3
        ? 'P3 • Высокий'
        : p === 2
        ? 'P2 • Средний'
        : 'P1 • Низкий'
    },
  },
  {
    key: 'state',
    label: 'Статус',
    primaryDir: 'asc',
    ascDescription: 'Сверху вниз (А → Я)',
    descDescription: 'Снизу вверх (Я → А)',
    getFilterValue: (inc) => inc.state || 'Новый',
  },
  {
    key: 'assignedGroupName',
    label: 'Назначенная группа',
    primaryDir: 'asc',
    ascDescription: 'Сверху вниз (А → Я)',
    descDescription: 'Снизу вверх (Я → А)',
    getFilterValue: (inc) => inc.assignedGroupName || 'Не назначена',
  },
  {
    key: 'risk',
    label: 'SLA / Риск эскалации',
    primaryDir: 'desc',
    ascDescription: 'Снизу вверх (от минимального к критическому риску)',
    descDescription: 'Сверху вниз (от критического к минимальному риску)',
    getFilterValue: (inc) => {
      const r = Math.round(inc.aiRiskScore || 0)
      return r >= 70 ? 'Критический (>70%)' : r >= 40 ? 'Средний (40-70%)' : 'Низкий (<40%)'
    },
  },
]

const getPriorityWeight = (inc: Incident): number => {
  if (inc.priorityId) return inc.priorityId
  if (inc.priority === 'Наивысший' || inc.priority === 'Критический') return 4
  if (inc.priority === 'Высокий') return 3
  if (inc.priority === 'Средний') return 2
  return 1
}

const compareIncidents = (
  a: Incident,
  b: Incident,
  col: SortColumn,
  dir: SortDirection
): number => {
  let diff = 0
  switch (col) {
    case 'id': {
      diff = (a.id || '').localeCompare(b.id || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
      break
    }
    case 'header': {
      diff = (a.header || '').localeCompare(b.header || '', 'ru', { sensitivity: 'base' })
      break
    }
    case 'productName': {
      const pA = a.productName || a.service || 'Мобильная сеть'
      const pB = b.productName || b.service || 'Мобильная сеть'
      diff = pA.localeCompare(pB, 'ru', { sensitivity: 'base' })
      break
    }
    case 'priority': {
      diff = getPriorityWeight(a) - getPriorityWeight(b)
      break
    }
    case 'state': {
      diff = (a.state || '').localeCompare(b.state || '', 'ru', { sensitivity: 'base' })
      break
    }
    case 'assignedGroupName': {
      diff = (a.assignedGroupName || '').localeCompare(b.assignedGroupName || '', 'ru', {
        sensitivity: 'base',
      })
      break
    }
    case 'risk': {
      const rA = a.aiRiskScore || 0
      const rB = b.aiRiskScore || 0
      if (rA !== rB) {
        diff = rA - rB
      } else {
        const dA = a.deadline ? new Date(a.deadline).getTime() : 0
        const dB = b.deadline ? new Date(b.deadline).getTime() : 0
        diff = dA - dB
      }
      break
    }
  }

  // Deterministic tie-breaker by ID
  if (diff === 0) {
    diff = (a.id || '').localeCompare(b.id || '', undefined, { numeric: true })
  }

  return dir === 'asc' ? diff : -diff
}

interface IncidentTableViewProps {
  incidents: Incident[]
  onSelectIncident: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const IncidentTableView: React.FC<IncidentTableViewProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null)
  const [openFilterCol, setOpenFilterCol] = useState<SortColumn | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<SortColumn, string[]>>({
    id: [],
    header: [],
    productName: [],
    priority: [],
    state: [],
    assignedGroupName: [],
    risk: [],
  })
  const [filterSearch, setFilterSearch] = useState('')

  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // Close filter popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setOpenFilterCol(null)
        setFilterSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openFilterCol])

  // Sorting handler when clicking on column title:
  // 1st click: primary direction ("сверху вниз")
  // 2nd click: opposite direction ("снизу вверх")
  // 3rd click: reset
  const handleSort = (colKey: SortColumn) => {
    const col = COLUMNS.find((c) => c.key === colKey)
    if (!col) return

    if (sortColumn !== colKey) {
      setSortColumn(colKey)
      setSortDirection(col.primaryDir)
    } else if (sortDirection === col.primaryDir) {
      setSortDirection(col.primaryDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(null)
      setSortDirection(null)
    }
  }

  const handleExplicitSort = (colKey: SortColumn, dir: SortDirection) => {
    setSortColumn(colKey)
    setSortDirection(dir)
    setOpenFilterCol(null)
    setFilterSearch('')
  }

  const handleResetSort = () => {
    setSortColumn(null)
    setSortDirection(null)
  }

  const handleToggleColumnFilterValue = (colKey: SortColumn, val: string) => {
    setColumnFilters((prev) => {
      const current = prev[colKey] || []
      const exists = current.includes(val)
      const next = exists ? current.filter((v) => v !== val) : [...current, val]
      return { ...prev, [colKey]: next }
    })
  }

  const handleClearColumnFilter = (colKey: SortColumn) => {
    setColumnFilters((prev) => ({ ...prev, [colKey]: [] }))
    setOpenFilterCol(null)
    setFilterSearch('')
  }

  const handleResetAll = () => {
    setSortColumn(null)
    setSortDirection(null)
    setColumnFilters({
      id: [],
      header: [],
      productName: [],
      priority: [],
      state: [],
      assignedGroupName: [],
      risk: [],
    })
    setOpenFilterCol(null)
    setFilterSearch('')
  }

  // Filtered & Sorted incidents
  const processedIncidents = useMemo(() => {
    // 1. Apply column-specific filters
    let result = incidents.filter((inc) => {
      for (const col of COLUMNS) {
        const selectedValues = columnFilters[col.key]
        if (selectedValues && selectedValues.length > 0) {
          const val = col.getFilterValue(inc)
          if (!selectedValues.includes(val)) {
            return false
          }
        }
      }
      return true
    })

    // 2. Apply column sorting
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) =>
        compareIncidents(a, b, sortColumn, sortDirection)
      )
    }

    return result
  }, [incidents, sortColumn, sortDirection, columnFilters])

  // Get distinct values for the opened column filter
  const distinctValuesForOpenCol = useMemo(() => {
    if (!openFilterCol) return []
    const col = COLUMNS.find((c) => c.key === openFilterCol)
    if (!col) return []

    const map: Record<string, number> = {}
    incidents.forEach((inc) => {
      const val = col.getFilterValue(inc)
      if (val) {
        map[val] = (map[val] || 0) + 1
      }
    })

    let items = Object.entries(map).map(([value, count]) => ({ value, count }))
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase()
      items = items.filter((item) => item.value.toLowerCase().includes(q))
    }

    // Sort distinct values alphabetically or by priority
    if (openFilterCol === 'priority') {
      const order = ['P4 • Наивысший', 'P3 • Высокий', 'P2 • Средний', 'P1 • Низкий']
      items.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value))
    } else {
      items.sort((a, b) => a.value.localeCompare(b.value, 'ru'))
    }

    return items
  }, [incidents, openFilterCol, filterSearch])

  const totalActiveColumnFilters = useMemo(() => {
    return Object.values(columnFilters).reduce((acc, curr) => acc + (curr.length > 0 ? 1 : 0), 0)
  }, [columnFilters])

  const activeColumn = COLUMNS.find((c) => c.key === sortColumn)

  // Export report as CSV (compatible with Russian Excel - UTF-8 BOM, semicolon separator)
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Тема инцидента',
      'Продукт',
      'Приоритет',
      'Статус',
      'Назначенная группа',
      'SLA (осталось)',
      'Риск эскалации %',
    ]
    const rows = processedIncidents.map((inc) => {
      const risk = Math.round(inc.aiRiskScore || 0)
      const slaHours = inc.deadline
        ? `${Math.max(1, Math.round((new Date(inc.deadline).getTime() - Date.now()) / (3600 * 1000)))}ч`
        : '4ч'
      return [
        `"${(inc.id || '').replace(/"/g, '""')}"`,
        `"${(inc.header || '').replace(/"/g, '""')}"`,
        `"${(inc.productName || inc.service || 'Мобильная сеть').replace(/"/g, '""')}"`,
        `"${inc.priority || (inc.priorityId === 4 ? 'Наивысший' : inc.priorityId === 3 ? 'Высокий' : inc.priorityId === 2 ? 'Средний' : 'Низкий')}"`,
        `"${(inc.state || '').replace(/"/g, '""')}"`,
        `"${(inc.assignedGroupName || '').replace(/"/g, '""')}"`,
        `"${slaHours}"`,
        `"${risk}%"`,
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `mts_incidents_report_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPriorityBadge = (priority: string, priorityId: number) => {
    if (priorityId === 4 || priority === 'Наивысший' || priority === 'Критический') {
      return (
        <span className="bg-[#E30611] text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
          <Flame className="h-2.5 w-2.5" /> P4 • Наивысший
        </span>
      )
    }
    if (priorityId === 3 || priority === 'Высокий') {
      return (
        <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
          P3 • Высокий
        </span>
      )
    }
    if (priorityId === 2 || priority === 'Средний') {
      return (
        <span className="bg-[#EAB308] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
          P2 • Средний
        </span>
      )
    }
    return (
      <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
        P1 • Низкий
      </span>
    )
  }

  const getStateBadge = (state: string) => {
    if (state === 'Выполняется') {
      return (
        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Выполняется
        </span>
      )
    }
    if (state === 'Исследование ситуации') {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {state}
        </span>
      )
    }
    if (state === 'Завершен' || state === 'Закрыт') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {state}
        </span>
      )
    }
    return (
      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {state}
      </span>
    )
  }

  const getHeaderTooltip = (col: ColumnConfig) => {
    if (sortColumn === col.key) {
      if (sortDirection === col.primaryDir) {
        return `Текущая: ${col.descDescription}. Нажмите для сортировки в обратную сторону`
      }
      return `Текущая: ${col.ascDescription}. Нажмите для сброса сортировки`
    }
    return `Нажмите для сортировки: ${col.descDescription} / ${col.ascDescription}`
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-visible animate-in fade-in duration-200 flex flex-col">
      {/* Table Control & Active Filters Bar */}
      <div className="p-3.5 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 rounded-t-2xl">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700">
            Записей в отчете:{' '}
            <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-extrabold">
              {processedIncidents.length}
            </span>
            {processedIncidents.length !== incidents.length && (
              <span className="text-slate-400 font-normal ml-1">
                (из {incidents.length})
              </span>
            )}
          </span>

          {/* Active Sort Pill */}
          {activeColumn && sortDirection && (
            <div className="inline-flex items-center gap-1.5 bg-red-50 text-[#E30611] border border-red-200/80 px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>
                Сортировка: <strong>{activeColumn.label}</strong> (
                {sortDirection === activeColumn.primaryDir
                  ? activeColumn.primaryDir === 'desc'
                    ? 'сверху вниз'
                    : 'сверху вниз (А-Я)'
                  : 'снизу вверх'}
                )
              </span>
              <button
                onClick={handleResetSort}
                className="hover:bg-red-100 rounded-full p-0.5 ml-0.5 cursor-pointer text-[#E30611]"
                title="Сбросить сортировку"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Active Column Filter Pills */}
          {COLUMNS.map((col) => {
            const vals = columnFilters[col.key]
            if (!vals || vals.length === 0) return null
            return (
              <div
                key={col.key}
                className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-300/80 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <Filter className="h-2.5 w-2.5 text-[#E30611]" />
                <span>
                  {col.label}: <strong>{vals.join(', ')}</strong>
                </span>
                <button
                  onClick={() => handleClearColumnFilter(col.key)}
                  className="hover:bg-slate-200 rounded-full p-0.5 ml-0.5 cursor-pointer text-slate-500 hover:text-slate-800"
                  title="Очистить фильтр"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Reset All Filters & Sort Button */}
          {(sortColumn || totalActiveColumnFilters > 0) && (
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#E30611] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Сбросить всё</span>
            </button>
          )}

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Экспорт отчета в Excel / CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Экспорт в CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-2xs select-none">
            <tr className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              {COLUMNS.map((col) => {
                const isSorted = sortColumn === col.key
                const filterCount = columnFilters[col.key]?.length || 0

                return (
                  <th
                    key={col.key}
                    className={`py-3.5 px-4 transition-colors relative group ${
                      isSorted
                        ? 'bg-red-50/80 text-[#E30611] font-black'
                        : 'hover:bg-slate-100/90 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      {/* Column Title Button: Direct click toggles sort ("сверху вниз" / "снизу вверх") */}
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1.5 cursor-pointer text-left focus:outline-none flex-1 py-0.5"
                        title={getHeaderTooltip(col)}
                      >
                        <span className="tracking-wider">{col.label}</span>
                        <span className="inline-flex items-center justify-center">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-[#E30611] transition-transform" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-[#E30611] transition-transform" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      </button>

                      {/* Classic Filter Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenFilterCol(openFilterCol === col.key ? null : col.key)
                          setFilterSearch('')
                        }}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          filterCount > 0
                            ? 'bg-[#E30611] text-white shadow-2xs'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 opacity-40 group-hover:opacity-100'
                        }`}
                        title={`Фильтр по столбцу «${col.label}»`}
                      >
                        <Filter className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Excel-style Classic Filter Dropdown Menu */}
                    {openFilterCol === col.key && (
                      <div
                        ref={filterDropdownRef}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2.5 text-xs normal-case tracking-normal text-slate-800 animate-in fade-in zoom-in-95 w-64 ${
                          col.key === 'risk' || col.key === 'assignedGroupName'
                            ? 'right-2'
                            : 'left-2'
                        }`}
                      >
                        {/* Quick Sort Options */}
                        <div className="pb-2 border-b border-slate-100 space-y-1">
                          <button
                            type="button"
                            onClick={() => handleExplicitSort(col.key, 'desc')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                              isSorted && sortDirection === 'desc'
                                ? 'bg-red-50 text-[#E30611] font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <ArrowDown className="h-3.5 w-3.5 text-[#E30611]" />
                              <span>{col.descDescription}</span>
                            </span>
                            {isSorted && sortDirection === 'desc' && (
                              <Check className="h-3.5 w-3.5 text-[#E30611]" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExplicitSort(col.key, 'asc')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                              isSorted && sortDirection === 'asc'
                                ? 'bg-red-50 text-[#E30611] font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <ArrowUp className="h-3.5 w-3.5 text-[#E30611]" />
                              <span>{col.ascDescription}</span>
                            </span>
                            {isSorted && sortDirection === 'asc' && (
                              <Check className="h-3.5 w-3.5 text-[#E30611]" />
                            )}
                          </button>

                          {isSorted && (
                            <button
                              type="button"
                              onClick={() => {
                                handleResetSort()
                                setOpenFilterCol(null)
                              }}
                              className="w-full text-left px-2.5 py-1 text-slate-500 hover:text-[#E30611] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer text-[11px]"
                            >
                              Сбросить сортировку
                            </button>
                          )}
                        </div>

                        {/* Distinct Value Filters */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between pb-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Фильтр значений
                            </span>
                            {filterCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleClearColumnFilter(col.key)}
                                className="text-[10px] text-[#E30611] hover:underline font-semibold cursor-pointer"
                              >
                                Очистить
                              </button>
                            )}
                          </div>

                          {/* Quick Search inside values */}
                          {distinctValuesForOpenCol.length > 5 && (
                            <div className="relative mb-2">
                              <Search className="h-3 w-3 absolute left-2 top-2 text-slate-400" />
                              <input
                                type="text"
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                placeholder="Поиск значения..."
                                className="w-full pl-7 pr-2 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                              />
                            </div>
                          )}

                          {/* List of distinct checkboxes */}
                          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                            {distinctValuesForOpenCol.length === 0 ? (
                              <div className="text-slate-400 text-center py-2 text-[11px]">
                                Нет совпадений
                              </div>
                            ) : (
                              distinctValuesForOpenCol.map(({ value, count }) => {
                                const checked = (columnFilters[col.key] || []).includes(value)
                                return (
                                  <label
                                    key={value}
                                    className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          handleToggleColumnFilterValue(col.key, value)
                                        }
                                        className="rounded text-[#E30611] focus:ring-0 cursor-pointer h-3.5 w-3.5 accent-[#E30611]"
                                      />
                                      <span
                                        className={`truncate ${
                                          checked ? 'font-bold text-slate-900' : 'text-slate-700'
                                        }`}
                                      >
                                        {value}
                                      </span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono ml-1">
                                      {count}
                                    </span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {processedIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="h-6 w-6 text-slate-300" />
                    <span>Нет инцидентов, соответствующих выбранным фильтрам</span>
                    <button
                      onClick={handleResetAll}
                      className="mt-1 text-xs font-semibold text-[#E30611] hover:underline cursor-pointer"
                    >
                      Сбросить фильтры и сортировку
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedIncidents.map((inc) => {
                const risk = Math.round(inc.aiRiskScore || 0)
                return (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    <td
                      className={`py-3.5 px-4 font-mono font-semibold transition-colors ${
                        sortColumn === 'id'
                          ? 'bg-red-50/20 text-slate-900 font-bold'
                          : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {inc.id}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate transition-colors ${
                        sortColumn === 'header' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {inc.header}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-slate-600 transition-colors ${
                        sortColumn === 'productName' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {inc.productName || inc.service || 'Мобильная сеть'}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 transition-colors ${
                        sortColumn === 'priority' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {getPriorityBadge(inc.priority, inc.priorityId)}
                    </td>
                    <td
                      className={`py-3.5 px-4 transition-colors ${
                        sortColumn === 'state' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {getStateBadge(inc.state)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate transition-colors ${
                        sortColumn === 'assignedGroupName' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {inc.assignedGroupName}
                    </td>
                    <td
                      className={`py-3.5 px-4 transition-colors ${
                        sortColumn === 'risk' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600">
                          {inc.deadline
                            ? `${Math.max(
                                1,
                                Math.round(
                                  (new Date(inc.deadline).getTime() - Date.now()) /
                                    (3600 * 1000)
                                )
                              )}ч`
                            : '4ч'}
                        </span>
                        {risk > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              risk >= 70
                                ? 'bg-red-50 text-[#E30611] border border-red-200'
                                : risk >= 40
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Риск эскалации: {risk}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
