import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  FileText, Upload, X, CheckCircle, AlertCircle,
  Download, CheckCircle2, Info
} from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import { convertFile } from '../utils/api'

const MAX_SIZE = 100 * 1024 * 1024

// inputExt → supported output formats (pure JS, no system deps)
const CONVERSION_MAP = {
  txt:  ['pdf', 'docx'],
  pdf:  ['txt', 'docx'],
  doc:  ['pdf', 'txt', 'html'],
  docx: ['pdf', 'txt', 'html'],
  html: ['docx', 'pdf'],
}

const ALL_OUTPUT_FORMATS = [
  { value: 'pdf',  label: 'PDF' },
  { value: 'docx', label: 'Word (DOCX)' },
  { value: 'txt',  label: 'Plain Text (TXT)' },
  { value: 'html', label: 'HTML' },
]

const SUPPORT_ROWS = [
  { label: 'DOCX / DOC → PDF  (layout preserved via Chrome)',  ok: true },
  { label: 'DOCX / DOC → TXT / HTML',                          ok: true },
  { label: 'TXT → PDF / DOCX',                                 ok: true },
  { label: 'PDF → TXT / DOCX  (text extraction)',              ok: true },
  { label: 'HTML → PDF / DOCX',                                ok: true },
]

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function DocumentTool() {
  const [file, setFile]                 = useState(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [outputFormat, setOutputFormat] = useState('pdf')
  const [status, setStatus]             = useState('idle')
  const [progress, setProgress]         = useState(0)
  const [errorMsg, setErrorMsg]         = useState('')
  const [downloadUrl, setDownloadUrl]   = useState(null)
  const [downloadName, setDownloadName] = useState('')

  const inputExt = file ? file.name.split('.').pop().toLowerCase() : null

  // Filter formats to only show what's supported for the current input file
  const availableFormats = inputExt && CONVERSION_MAP[inputExt]
    ? ALL_OUTPUT_FORMATS.filter(f => CONVERSION_MAP[inputExt].includes(f.value))
    : ALL_OUTPUT_FORMATS

  const reset = () => {
    setStatus('idle'); setProgress(0); setErrorMsg(''); setDownloadUrl(null)
  }

  const onDrop = useCallback((accepted, rejected) => {
    reset()
    if (rejected?.length > 0 && rejected[0].errors?.[0]?.code === 'file-too-large') {
      setFileTooLarge(true); setFile(rejected[0].file); return
    }
    if (accepted[0]) {
      setFileTooLarge(false)
      setFile(accepted[0])
      // Auto-select first valid output format for this file type
      const ext = accepted[0].name.split('.').pop().toLowerCase()
      const supported = CONVERSION_MAP[ext]
      if (supported?.length) setOutputFormat(supported[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/html': ['.html'],
    },
    maxSize: MAX_SIZE,
    multiple: false,
  })

  const handleConvert = async () => {
    if (!file || fileTooLarge) return
    setStatus('loading'); setProgress(0); setErrorMsg(''); setDownloadUrl(null)
    try {
      const result = await convertFile('/document/convert', file, outputFormat, {}, p => setProgress(p))
      setDownloadUrl(result.url); setDownloadName(result.name)
      setStatus('success'); setProgress(100)
    } catch (err) {
      setStatus('error'); setErrorMsg(err.message || 'Conversion failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
          <FileText size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Converter</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            100% online — uses headless Chrome for layout-preserving PDF output
          </p>
        </div>
      </div>

      {/* Support card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">All conversions work without any install</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          {SUPPORT_ROWS.map(({ label }) => (
            <div key={label} className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ${
          isDragActive   ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
          : fileTooLarge ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
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
            <p className="text-gray-400 dark:text-gray-500 text-sm">PDF, DOC, DOCX, TXT, HTML — max 100MB</p>
          </>
        )}
      </div>

      {/* File too large */}
      {fileTooLarge && file && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-400 font-semibold text-sm">File too large</p>
            <p className="text-red-600 dark:text-red-400 text-sm">{file.name} is {formatSize(file.size)} — max 100MB.</p>
          </div>
        </div>
      )}

      {/* File info */}
      {file && !fileTooLarge && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={20} className="text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{file.name}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">{file.type || 'document'} · {formatSize(file.size)}</p>
            </div>
          </div>
          <button onClick={() => { setFile(null); reset() }} className="text-gray-400 hover:text-red-500 transition-colors ml-3 shrink-0">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Format selector */}
      {!fileTooLarge && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Convert To</label>
          <SearchableSelect
            options={availableFormats}
            value={outputFormat}
            onChange={setOutputFormat}
            placeholder="Search format..."
          />
          {inputExt && !CONVERSION_MAP[inputExt] && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              .{inputExt} files are not supported. Upload a PDF, DOC, DOCX, TXT, or HTML file.
            </p>
          )}
        </div>
      )}

      {/* Convert button */}
      {!fileTooLarge && (
        <button
          onClick={handleConvert}
          disabled={!file || status === 'loading'}
          className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 mb-6"
        >
          {status === 'loading' ? 'Converting...' : 'Convert Document'}
        </button>
      )}

      {/* Progress */}
      {status === 'loading' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Processing...</span><span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
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
