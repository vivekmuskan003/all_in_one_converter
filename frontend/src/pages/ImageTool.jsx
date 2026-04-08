import { Image } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'
import { convertFile } from '../utils/api'

const formats = [
  { value: 'jpg', label: 'JPG / JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'bmp', label: 'BMP' },
  { value: 'tiff', label: 'TIFF' },
]

export default function ImageTool() {
  const handleConvert = (file, outputFormat, extra, onProgress) =>
    convertFile('/image/compress', file, outputFormat, extra, onProgress)

  return (
    <ToolLayout
      title="Image Converter & Compressor"
      description="Convert and compress images with quality control"
      icon={Image}
      iconGradient="from-pink-500 to-rose-600"
      acceptedTypes={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.svg'] }}
      formats={formats}
      onConvert={handleConvert}
      outputLabel="Output Format"
      extraControls={({ values, onChange }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quality: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{values.quality || 80}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={values.quality || 80}
            onChange={e => onChange('quality', e.target.value)}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>10% (Smallest file)</span>
            <span>100% (Best quality)</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Note: PNG uses lossless compression — lower quality = higher compression ratio.
          </p>
        </div>
      )}
    />
  )
}
