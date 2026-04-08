import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Info } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

export default function ToolLayout({
  title,
  description,
  icon: Icon,
  iconGradient,
  acceptedTypes,
  formats,
  onConvert,
  extraControls,
  outputLabel = 'Output Format',
  showCompressTip = false,
}) {
  const [file, setFile] = useState(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [outputFormat, setOutputFormat] = useState(formats[0]?.value || '')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState('')
  const [extraValues, setExtraValues] = useState({})

  const resetState = () => {
    setStatus('idle')
    setDownloadUrl(null)
    setErrorMsg('')
    setProgress(0)
    setFileTooLarge(false)
  }

  const onDrop = useCallback((accepted, rejected) => {
    resetState()
    if (rejected?.length > 0) {
      const err = rejected[0].errors?.[0]
      if (err?.code === 'file-too-large') {
        setFileTooLarge(true)
        setFile(rejected[0].file)
        return
      }
    }
    if (accepted[0]) {
      setFileTooLarge(false)
      setFile(accepted[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: MAX_SIZE,
    multiple: false,
    validator: (f) => {
      if (f.size > MAX_SIZE) {
        return { code: 'file-too-large', message: `File is larger than 100MB` }
      }
      return null
    }
  })

  const handleConvert = async () => {
    if (!file || fileTooLarge) return
    setStatus('loading')
    setProgress(0)
    setErrorMsg('')
    setDownloadUrl(null)

    try {
      const result = await onConvert(file, outputFormat, extraValues, (p) => setProgress(p))
      setDownloadUrl(result.url)
      setDownloadName(result.name)
      setStatus('success')
      setProgress(100)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Conversion failed')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const isLargeFile = file && file.size > 20 * 1024 * 1024 // warn if > 20MB

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg`}>
          <Icon size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : fileTooLarge
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={40} className={`mx-auto mb-3 ${fileTooLarge ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
        {isDragActive ? (
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">Drop it here...</p>
        ) : (
          <>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Drag & drop your file here</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">or click to browse — max 100MB</p>
          </>
        )}
      </div>

      {/* File Too Large Warning */}
      {fileTooLarge && file && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 dark:text-red-400 font-semibold text-sm">File too large</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-0.5">
                <span className="font-medium">{file.name}</span> is {formatSize(file.size)} — maximum allowed is 100MB.
              </p>
            </div>
          </div>
          {showCompressTip && (
            <div className="flex items-start gap-2 bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-900/50">
              <Info size={15} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                Try compressing your file first using the{' '}
                <a href="/compress" className="text-indigo-600 dark:text-indigo-400 font-medium underline">
                  File Compressor
                </a>{' '}
                tool, then come back to convert it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* File Info (valid file) */}
      {file && !fileTooLarge && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={20} className="text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  {file.type || 'Unknown type'} · {formatSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setFile(null); resetState() }}
              className="text-gray-400 hover:text-red-500 transition-colors ml-3 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Large file advisory (not too large, just big) */}
          {isLargeFile && showCompressTip && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800/40">
              <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-400 text-xs">
                Large file detected ({formatSize(file.size)}). Conversion may take a while.
                Optionally{' '}
                <a href="/compress" className="font-medium underline">compress it first</a>
                {' '}to speed things up.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Format + Extra Controls */}
      {!fileTooLarge && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{outputLabel}</label>
            <SearchableSelect
              options={formats}
              value={outputFormat}
              onChange={setOutputFormat}
              placeholder="Search format..."
            />
          </div>
          {extraControls && extraControls({ values: extraValues, onChange: (k, v) => setExtraValues(p => ({ ...p, [k]: v })) })}
        </div>
      )}

      {/* Convert Button */}
      {!fileTooLarge && (
        <button
          onClick={handleConvert}
          disabled={!file || status === 'loading'}
          className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 mb-6"
        >
          {status === 'loading' ? 'Processing...' : 'Convert / Compress'}
        </button>
      )}

      {/* Progress */}
      {status === 'loading' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Processing your file...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-center mt-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'success' && downloadUrl && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-400 font-semibold">Conversion successful!</p>
          </div>
          <a
            href={downloadUrl}
            download={downloadName}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
          >
            <Download size={18} />
            Download {downloadName}
          </a>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
