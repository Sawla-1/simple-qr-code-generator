import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function App() {
  const [text, setText] = useState('')
  const [submittedText, setSubmittedText] = useState('')

  function handleGenerate() {
    setSubmittedText(text)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
      <h1>QR Code Generator</h1>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type text or a URL"
        style={{ padding: 8, width: '80%' }}
      />
      <button onClick={handleGenerate} style={{ padding: 8, marginLeft: 8 }}>
        Generate
      </button>

      {submittedText && (
        <div style={{ marginTop: 24 }}>
          <QRCodeSVG value={submittedText} size={200} />
        </div>
      )}
    </div>
  )
}

export default App
