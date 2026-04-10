import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Music, Video, Image, Archive,
  Activity, LogOut, TrendingUp, BarChart2,
  Calendar, RefreshCw, Trash2, Download,
  ChevronUp, ChevronDown, Filter, AlertTriangle
} from 'lucide-react'
import { adminRequest } from '../utils/api'

const TOOLS = [
  { key: 'audio',       label: 'Audio',       icon: Music,    gradient: 'from-violet-500 to-purple-600', color: '#8b5cf6' },
  { key: 'video',       label: 'Video',       icon: Video,    gradient: 'from-blue-500 to-cyan-600',    color: '#06b6d4' },
  { key: 'image',       label: 'Images',      icon: Image,    gradient: 'from-pink-500 to-rose-600',    color: '#f43f5e' },
  { key: 'compression', label: 'Compression', icon: Archive,  gradient: 'from-green-500 to-emerald-600',color: '#10b981' },
]

// Simple bar chart using divs (no external chart lib needed)
function MiniBarChart({ data, tools }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
      No data for selected range
    </div>
  )
  const max = Math.max(...data.map(d => d.total || 0), 1)
  return (
    <div className="flex items-end gap-1 h-32 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-1 min-w-[28px] flex-1">
          <div className="w-full flex flex-col-reverse gap-px" style={{ height: '96px' }}>
            {tools.map(t => {
              const val = d[t.key] || 0
              const h   = max > 0 ? (val / max) * 96 : 0
              return h > 0 ? (
                <div
                  key={t.key}
                  title={`${t.label}: ${val}`}
                  style={{ height: `${h}px`, backgroundColor: t.color, minHeight: '2px' }}
                  className="w-full rounded-sm opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                />
              ) : null
            })}
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-xs rotate-45 origin-left whitespace-nowrap" style={{ fontSize: '9px' }}>
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Stat card with trend indicator
function StatCard({ icon: Icon, iconColor, label, value, sub, trend }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {trend >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</p>
      <p className="text-gray-500 dark:text-gray-400 text-xs">{label}</p>
      {sub && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/adminsetup'
  const token     = localStorage.getItem('adminToken')

  const [data,        setData]        = useState(null)
  const [stats,       setStats]       = useState(null)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [statsLoading,setStatsLoading]= useState(false)
  const [resetConfirm,setResetConfirm]= useState(false)
  const [resetMsg,    setResetMsg]    = useState('')

  // Filters
  const today    = new Date().toISOString().slice(0, 10)
  const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const [from,   setFrom]   = useState(weekAgo)
  const [to,     setTo]     = useState(today)
  const [toolFilter, setToolFilter] = useState('all')
  const [activeTab,  setActiveTab]  = useState('overview') // overview | chart | logs

  const logout = () => { localStorage.removeItem('adminToken'); navigate(ADMIN_PATH) }

  const fetchDashboard = useCallback(async () => {
    if (!token) { navigate(ADMIN_PATH); return }
    try {
      const r = await adminRequest('get', '/admin/dashboard', null, token)
      setData(r)
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('adminToken'); navigate(ADMIN_PATH) }
      else setError(err.response?.data?.error || 'Failed to load')
    } finally { setLoading(false) }
  }, [token, navigate, ADMIN_PATH])

  const fetchStats = useCallback(async () => {
    if (!token) return
    setStatsLoading(true)
    try {
      const params = new URLSearchParams({ from, to, tool: toolFilter })
      const r = await adminRequest('get', `/admin/stats?${params}`, null, token)
      setStats(r)
    } catch {}
    finally { setStatsLoading(false) }
  }, [token, from, to, toolFilter])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleReset = async () => {
    try {
      await adminRequest('post', '/admin/reset', {}, token)
      setResetMsg('All stats have been reset.')
      setResetConfirm(false)
      fetchDashboard()
      fetchStats()
    } catch { setResetMsg('Reset failed.') }
  }

  const exportCSV = () => {
    if (!stats?.daily?.length) return
    const rows = [['Date', ...TOOLS.map(t => t.label), 'Total']]
    stats.daily.forEach(d => {
      rows.push([d.date, ...TOOLS.map(t => d[t.key] || 0), d.total || 0])
    })
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `fileforge-stats-${from}-to-${to}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-red-500">{error}</div>
  )

  const totalUsage  = Object.values(data?.toolUsage || {}).reduce((a, b) => a + b, 0)
  const topTool     = TOOLS.reduce((best, t) => (data?.toolUsage?.[t.key] || 0) > (data?.toolUsage?.[best.key] || 0) ? t : best, TOOLS[0])
  const filteredTotal = stats ? Object.values(stats.totals || {}).reduce((a, b) => a + b, 0) : 0

  const tabs = [
    { id: 'overview', label: 'Overview',   icon: Activity },
    { id: 'chart',    label: 'Trends',     icon: BarChart2 },
    { id: 'filter',   label: 'Filter',     icon: Filter },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">FileForge analytics & management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDashboard} title="Refresh"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={exportCSV} title="Export CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">
            <Download size={15} /> Export
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500 text-sm transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Activity}   iconColor="bg-indigo-500"  label="Total Requests"  value={data?.totalRequests || 0} />
        <StatCard icon={TrendingUp} iconColor="bg-green-500"   label="Total Conversions" value={totalUsage} />
        <StatCard icon={BarChart2}  iconColor="bg-amber-500"   label="Most Used Tool"  value={topTool.label} sub={`${data?.toolUsage?.[topTool.key] || 0} uses`} />
        <StatCard icon={Calendar}   iconColor="bg-purple-500"  label="Filtered Period" value={filteredTotal} sub={`${from} → ${to}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tool usage bars */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-gray-900 dark:text-white font-semibold mb-5">All-time Tool Usage</h2>
            <div className="space-y-4">
              {TOOLS.map(({ key, label, icon: Icon, gradient }) => {
                const count = data?.toolUsage?.[key] || 0
                const pct   = totalUsage > 0 ? Math.round((count / totalUsage) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Icon size={14} className="text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">{pct}%</span>
                        <span className="text-gray-900 dark:text-white font-semibold text-sm w-8 text-right">{count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tool breakdown cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TOOLS.map(({ key, label, icon: Icon, gradient, color }) => {
              const count = data?.toolUsage?.[key] || 0
              const pct   = totalUsage > 0 ? Math.round((count / totalUsage) * 100) : 0
              return (
                <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{label}</p>
                  <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${gradient} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {/* Date range quick selectors */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <h2 className="text-gray-900 dark:text-white font-semibold flex-1">Daily Trends</h2>
              {[
                { label: '7 days',  days: 7 },
                { label: '14 days', days: 14 },
                { label: '30 days', days: 30 },
              ].map(({ label, days }) => (
                <button key={days}
                  onClick={() => {
                    setFrom(new Date(Date.now() - days * 86400000).toISOString().slice(0, 10))
                    setTo(today)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Last {label}
                </button>
              ))}
            </div>

            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MiniBarChart data={stats?.daily || []} tools={TOOLS} />
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {TOOLS.map(t => (
                <div key={t.key} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily table */}
          {stats?.daily?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">Date</th>
                      {TOOLS.map(t => (
                        <th key={t.key} className="text-right px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">{t.label}</th>
                      ))}
                      <th className="text-right px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.daily].reverse().map((d, i) => (
                      <tr key={d.date} className={`border-t border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">{d.date}</td>
                        {TOOLS.map(t => (
                          <td key={t.key} className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">
                            {d[t.key] || 0}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white">{d.total || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FILTER TAB ── */}
      {activeTab === 'filter' && (
        <div className="space-y-6">
          {/* Filter controls */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-gray-900 dark:text-white font-semibold mb-5">Filter & Analyse</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">From Date</label>
                <input type="date" value={from} max={to}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">To Date</label>
                <input type="date" value={to} min={from} max={today}
                  onChange={e => setTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tool</label>
                <select value={toolFilter} onChange={e => setToolFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="all">All Tools</option>
                  {TOOLS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={fetchStats}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              Apply Filter
            </button>
          </div>

          {/* Filtered results */}
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TOOLS.map(({ key, label, icon: Icon, gradient }) => {
                const count = stats.totals?.[key] || 0
                const pct   = filteredTotal > 0 ? Math.round((count / filteredTotal) * 100) : 0
                return (
                  <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm text-center">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{label}</p>
                    <p className="text-indigo-500 text-xs font-medium mt-0.5">{pct}%</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Export */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-white font-medium text-sm">Export filtered data</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Download as CSV for spreadsheet analysis</p>
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              <Download size={15} /> Download CSV
            </button>
          </div>

          {/* Danger zone */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-red-500" />
                  <p className="text-red-700 dark:text-red-400 font-semibold text-sm">Reset All Statistics</p>
                </div>
                <p className="text-red-600 dark:text-red-400 text-xs">This permanently deletes all analytics data. Cannot be undone.</p>
                {resetMsg && <p className="text-green-600 dark:text-green-400 text-xs mt-1">{resetMsg}</p>}
              </div>
              {!resetConfirm ? (
                <button onClick={() => setResetConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium transition-colors whitespace-nowrap">
                  <Trash2 size={14} /> Reset
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleReset}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => setResetConfirm(false)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
