import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ImageTool from './pages/ImageTool'
import AudioTool from './pages/AudioTool'
import VideoTool from './pages/VideoTool'
import CompressionTool from './pages/CompressionTool'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/adminsetup'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/image" element={<ImageTool />} />
          <Route path="/audio" element={<AudioTool />} />
          <Route path="/video" element={<VideoTool />} />
          <Route path="/compress" element={<CompressionTool />} />
          <Route path={ADMIN_PATH} element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
