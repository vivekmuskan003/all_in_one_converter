import { Link } from 'react-router-dom'
import { Music, Video, FileText, Image, Archive, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

const tools = [
  {
    to: '/audio',
    icon: Music,
    title: 'Audio Converter',
    desc: 'Convert between MP3, WAV, AAC, OGG, FLAC, M4A and more',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-100 dark:border-violet-800/40',
    formats: ['MP3', 'WAV', 'AAC', 'FLAC', 'OGG'],
    tagColor: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
  {
    to: '/video',
    icon: Video,
    title: 'Video Converter',
    desc: 'Convert MP4, AVI, MKV, MOV, WebM and many more formats',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-100 dark:border-blue-800/40',
    formats: ['MP4', 'AVI', 'MKV', 'MOV', 'WebM'],
    tagColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  {
    to: '/document',
    icon: FileText,
    title: 'Document Converter',
    desc: 'Convert PDF, Word, PowerPoint, TXT and other documents',
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-100 dark:border-orange-800/40',
    formats: ['PDF', 'DOCX', 'PPTX', 'TXT', 'ODT'],
    tagColor: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  },
  {
    to: '/image',
    icon: Image,
    title: 'Image Converter',
    desc: 'Compress and convert JPG, PNG, WebP, GIF, BMP and more',
    gradient: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-100 dark:border-pink-800/40',
    formats: ['JPG', 'PNG', 'WebP', 'GIF', 'TIFF'],
    tagColor: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  },
  {
    to: '/compress',
    icon: Archive,
    title: 'File Compressor',
    desc: 'Compress files and create ZIP archives with custom levels',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-100 dark:border-green-800/40',
    formats: ['ZIP', 'PDF', 'Images', 'Docs'],
    tagColor: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  },
]

const features = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Powered by FFmpeg and Sharp for blazing-fast processing', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { icon: Shield, title: 'Secure & Private', desc: 'Files are auto-deleted after processing. Nothing is stored.', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40' },
  { icon: Clock, title: 'No Signup Needed', desc: 'Start converting instantly. No account required.', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
]

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/50 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-6">
          <Zap size={14} />
          All-in-One File Converter & Compressor
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          Convert & Compress
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Any File Format
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          Audio, video, documents, images — convert between 40+ formats with professional quality.
          Free, fast, and no signup required.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {tools.map(t => (
            <Link
              key={t.to}
              to={t.to}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${t.gradient} text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-md`}
            >
              <t.icon size={16} />
              {t.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {tools.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className={`rounded-2xl p-6 border ${tool.bg} ${tool.border} hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 shadow-md`}>
              <tool.icon size={22} className="text-white" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">{tool.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{tool.desc}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tool.formats.map(f => (
                <span key={f} className={`px-2 py-0.5 rounded-md text-xs font-medium ${tool.tagColor}`}>
                  {f}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
              Open Tool <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-1">{title}</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
