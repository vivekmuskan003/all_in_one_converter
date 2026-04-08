import { Video } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'
import { convertFile } from '../utils/api'
import SearchableSelect from '../components/SearchableSelect'

const formats = [
  { value: 'mp4',  label: 'MP4' },
  { value: 'avi',  label: 'AVI' },
  { value: 'mkv',  label: 'MKV' },
  { value: 'mov',  label: 'MOV' },
  { value: 'wmv',  label: 'WMV' },
  { value: 'flv',  label: 'FLV' },
  { value: 'webm', label: 'WebM' },
  { value: 'mpeg', label: 'MPEG' },
  { value: '3gp',  label: '3GP' },
]

const resolutionOptions = [
  { value: 'original', label: 'Original Resolution' },
  { value: '360p',     label: '360p (smallest)' },
  { value: '480p',     label: '480p' },
  { value: '720p',     label: '720p (HD)' },
  { value: '1080p',    label: '1080p (Full HD)' },
  { value: '4k',       label: '4K (Ultra HD)' },
]

const crfOptions = [
  { value: '',   label: 'Default (balanced)' },
  { value: '18', label: 'High quality (larger file)' },
  { value: '23', label: 'Balanced' },
  { value: '28', label: 'Compressed (smaller file)' },
  { value: '35', label: 'Highly compressed (smallest)' },
]

export default function VideoTool() {
  const handleConvert = (file, outputFormat, extra, onProgress) =>
    convertFile('/video/convert', file, outputFormat, extra, onProgress)

  return (
    <ToolLayout
      title="Video Converter"
      description="Convert between MP4, AVI, MKV, MOV, WebM and more — max 100MB"
      icon={Video}
      iconGradient="from-blue-500 to-cyan-600"
      acceptedTypes={{ 'video/*': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.mpeg', '.mpg', '.3gp'] }}
      formats={formats}
      onConvert={handleConvert}
      outputLabel="Output Format"
      showCompressTip={true}
      extraControls={({ values, onChange }) => (
        <div className="space-y-4">
          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resolution
            </label>
            <SearchableSelect
              options={resolutionOptions}
              value={values.resolution || 'original'}
              onChange={v => onChange('resolution', v)}
              placeholder="Search resolution..."
            />
          </div>

          {/* Optional compression */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compression <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Reduce file size by adjusting quality
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange('enableCompression', !values.enableCompression)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  values.enableCompression
                    ? 'bg-indigo-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    values.enableCompression ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {values.enableCompression && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Quality / File Size
                  </label>
                  <SearchableSelect
                    options={crfOptions}
                    value={values.crf || ''}
                    onChange={v => onChange('crf', v)}
                    placeholder="Select compression level..."
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Lower quality = smaller file size. "Highly compressed" can reduce size by 60–80%.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    />
  )
}
