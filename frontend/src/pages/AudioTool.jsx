import { Music } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'
import { convertFile } from '../utils/api'
import SearchableSelect from '../components/SearchableSelect'

const formats = [
  { value: 'mp3',  label: 'MP3' },
  { value: 'wav',  label: 'WAV' },
  { value: 'aac',  label: 'AAC' },
  { value: 'ogg',  label: 'OGG' },
  { value: 'flac', label: 'FLAC' },
  { value: 'm4a',  label: 'M4A' },
  { value: 'wma',  label: 'WMA' },
  { value: 'aiff', label: 'AIFF' },
  { value: 'amr',  label: 'AMR' },
]

const bitrateOptions = [
  { value: '64k',  label: '64 kbps (Low)' },
  { value: '128k', label: '128 kbps (Standard)' },
  { value: '192k', label: '192 kbps (Good)' },
  { value: '256k', label: '256 kbps (High)' },
  { value: '320k', label: '320 kbps (Best)' },
]

export default function AudioTool() {
  const handleConvert = (file, outputFormat, extra, onProgress) =>
    convertFile('/audio/convert', file, outputFormat, extra, onProgress)

  return (
    <ToolLayout
      title="Audio Converter"
      description="Convert between MP3, WAV, AAC, OGG, FLAC and more — max 100MB"
      icon={Music}
      iconGradient="from-violet-500 to-purple-600"
      acceptedTypes={{ 'audio/*': ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a', '.wma', '.aiff', '.amr'] }}
      formats={formats}
      onConvert={handleConvert}
      outputLabel="Output Format"
      showCompressTip={true}
      extraControls={({ values, onChange }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bitrate</label>
          <SearchableSelect
            options={bitrateOptions}
            value={values.bitrate || '192k'}
            onChange={v => onChange('bitrate', v)}
            placeholder="Search bitrate..."
          />
        </div>
      )}
    />
  )
}
