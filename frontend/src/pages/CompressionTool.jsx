import { Archive } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'
import { convertFile } from '../utils/api'
import SearchableSelect from '../components/SearchableSelect'

const formats = [
  { value: 'zip', label: 'ZIP Archive' },
  { value: 'compressed', label: 'Compressed (same format)' },
]

const levelOptions = [
  { value: 'low', label: 'Low (Faster, larger file)' },
  { value: 'medium', label: 'Medium (Balanced)' },
  { value: 'high', label: 'High (Slower, smallest file)' },
]

export default function CompressionTool() {
  const handleConvert = (file, outputFormat, extra, onProgress) => {
    const isZip = outputFormat === 'zip'
    return convertFile('/file/compress', file, outputFormat, { ...extra, createZip: isZip ? 'true' : 'false' }, onProgress)
  }

  return (
    <ToolLayout
      title="File Compressor"
      description="Compress files and create ZIP archives with adjustable compression levels"
      icon={Archive}
      iconGradient="from-green-500 to-emerald-600"
      acceptedTypes={{
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
        'application/zip': ['.zip'],
        'text/plain': ['.txt', '.csv'],
      }}
      formats={formats}
      onConvert={handleConvert}
      outputLabel="Compression Type"
      extraControls={({ values, onChange }) => (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Compression Level</label>
          <SearchableSelect
            options={levelOptions}
            value={values.level || 'medium'}
            onChange={v => onChange('level', v)}
            placeholder="Select level..."
          />
        </div>
      )}
    />
  )
}
