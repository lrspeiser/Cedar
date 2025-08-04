import React, { useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

interface UploadStatus {
  type: 'info' | 'success' | 'error'
  message: string
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<UploadStatus | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setStatus({ type: 'info', message: `Selected file: ${file.name} (${file.size} bytes)` })
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setStatus({ type: 'info', message: `Dropped file: ${file.name} (${file.size} bytes)` })
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Please select a file first' })
      return
    }

    setUploading(true)
    setStatus({ type: 'info', message: 'Uploading file...' })

    try {
      // Check if Tauri is available
      console.log('🔍 Checking Tauri availability...')
      console.log('window object:', typeof window)
      console.log('window.__TAURI_IPC__:', typeof window.__TAURI_IPC__)
      console.log('window.__TAURI_IPC__ value:', window.__TAURI_IPC__)
      
      if (typeof window !== 'undefined' && typeof window.__TAURI_IPC__ === 'function') {
        console.log('✅ Tauri IPC is available')
      } else {
        console.log('❌ Tauri IPC is not available')
        console.log('Available window properties:', Object.keys(window).filter(key => key.includes('TAURI')))
        setStatus({ 
          type: 'error', 
          message: 'Tauri runtime is not available. This app must be run as a desktop application.' 
        })
        return
      }

      // Read file content
      const content = await readFileAsText(selectedFile)
      
      console.log('📁 Frontend: Starting file upload', {
        filename: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      })

      // Call the backend upload function
      const result = await invoke('upload_data_file', {
        request: {
          project_id: 'test-project',
          filename: selectedFile.name,
          content: content,
          file_type: selectedFile.type || null
        }
      })

      console.log('✅ Frontend: Upload successful', result)
      setStatus({ type: 'success', message: `File uploaded successfully! Result: ${JSON.stringify(result)}` })
      
      // Clear the selection
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('❌ Frontend: Upload failed', error)
      setStatus({ 
        type: 'error', 
        message: `Upload failed: ${error instanceof Error ? error.message : String(error)}` 
      })
    } finally {
      setUploading(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="container">
      <h1>🧪 Cedar - Simple Upload Test</h1>
      <p>This is a minimal frontend to test the data upload functionality.</p>

      <div 
        className={`upload-section ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3>📁 File Upload</h3>
        <p>Drag and drop a file here, or click the button below to select a file.</p>
        
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          onChange={handleFileSelect}
          accept=".csv,.json,.txt,.tsv"
        />
        
        <button 
          className="button" 
          onClick={triggerFileSelect}
          disabled={uploading}
        >
          Select File
        </button>

        {selectedFile && (
          <div>
            <p><strong>Selected:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {selectedFile.size} bytes</p>
            <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
            
            <button 
              className="button" 
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}
      </div>

      {status && (
        <div className={`status ${status.type}`}>
          <strong>{status.type.toUpperCase()}:</strong> {status.message}
        </div>
      )}

      <div className="card">
        <h3>🔧 Test Instructions</h3>
        <ol style={{ textAlign: 'left' }}>
          <li>Select or drag a CSV, JSON, or text file</li>
          <li>Click "Upload File" to test the backend upload function</li>
          <li>Check the console for detailed logs</li>
          <li>Look for success/error messages above</li>
        </ol>
      </div>

      <div className="card">
        <h3>📊 Backend Status</h3>
        <p>This will test the <code>upload_data_file</code> Tauri command.</p>
        <p>If the upload fails, check that the backend endpoints are enabled.</p>
      </div>
    </div>
  )
}

export default App 