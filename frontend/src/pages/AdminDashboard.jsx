import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Video, FileText, Image, Archive, Activity, LogOut, TrendingUp } from 'lucide-react'
import { adminRequest } from '../utils/api'

const toolCards = [
  { key: 'audio', label: 'Audio', icon: Music, gradient: 'from-violet-500 to-purple-600' },
  { key: 'video', label: 'Video', icon: Video, gradient: 'from-blue-500 to-cyan-600' },
  { key: 'document', label: 'Documents', icon: FileText, gradient: 'from-orange-500 to-amber-600' },
  { key: 'image', label: 'Images', icon: Image, gradient: 'from-pink-500 to-rose-600' },
  { key: 'compression', label: 'Compression', icon: Archive, gradient: 'from-green-500 to-emerald-600' },
]

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/adminsetup'
    if (!token) { navigate(ADMIN_PATH); return }

    adminRequest('get', '/admin/dashboard', null, token)
      .then(r => setData(r))
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken')
          navigate(ADMIN_PATH)
        } else {
          setError(err.response?.data?.error || 'Failed to load dashboard')
        }
      })
  }, [navigate])

  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/adminsetup'

  const logout = () => {
    localStorage.removeItem('adminToken')
    navigate(ADMIN_PATH)
  }

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-red-500">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalToolUsage = Object.values(data.toolUsage || {}).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time usage statistics</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm shadow-sm"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={20} className="text-indigo-500" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">Total Requests</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{data.totalRequests || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-green-500" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">Tools Used</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{totalToolUsage}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={20} className="text-purple-500" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">Active Tools</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">5</p>
        </div>
      </div>

      {/* Tool Usage */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-gray-900 dark:text-white font-semibold mb-6">Tool-wise Usage</h2>
        <div className="space-y-4">
          {toolCards.map(({ key, label, icon: Icon, gradient }) => {
            const count = data.toolUsage?.[key] || 0
            const pct = totalToolUsage > 0 ? Math.round((count / totalToolUsage) * 100) : 0
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
                    <span className="text-gray-400 text-sm">{pct}%</span>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm w-8 text-right">{count}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
