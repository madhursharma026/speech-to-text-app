import { useState } from 'react'
import style from '../styles/Home.module.css'

export default function Home() {
  const [file, setFile] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [animatedText, setAnimatedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const ASSEMBLYAI_API_KEY = '3c717c5ebcf44f37a3060587a3a158c1'

  const animateText = (fullText) => {
    let index = 0
    setAnimatedText('')
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setAnimatedText((prev) => prev + fullText.charAt(index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 25)
  }

  const uploadAndTranscribe = async () => {
    if (!file) return alert('Please upload an audio file.')
    setLoading(true)
    setTranscript('')
    setAnimatedText('')
    setShowTranscript(false)

    try {
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          'transfer-encoding': 'chunked',
        },
        body: file,
      })

      const uploadData = await uploadRes.json()
      const audioUrl = uploadData.upload_url

      const transcriptRes = await fetch(
        'https://api.assemblyai.com/v2/transcript',
        {
          method: 'POST',
          headers: {
            authorization: ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audio_url: audioUrl }),
        }
      )

      const transcriptData = await transcriptRes.json()
      const transcriptId = transcriptData.id

      let completed = false
      while (!completed) {
        await new Promise((r) => setTimeout(r, 3000))
        const pollingRes = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              authorization: ASSEMBLYAI_API_KEY,
            },
          }
        )
        const pollingData = await pollingRes.json()

        if (pollingData.status === 'completed') {
          if (!pollingData.text || pollingData.text.trim() === '') {
            const unclearMsg = 'Undefined: Could not clarify the voice note.'
            setTranscript(unclearMsg)
            setAnimatedText(unclearMsg)
          } else {
            setTranscript(pollingData.text)
            animateText(pollingData.text)
          }
          setShowTranscript(true)
          setLoading(false)
          completed = true
        }
      }
    } catch (error) {
      setLoading(false)
      setTranscript('Error: ' + error.message)
      setAnimatedText('Error: ' + error.message)
      setShowTranscript(true)
    }
  }

  return (
    <div className={style.containerWidth}>
      <div className={style.box}>
        <h1>Voice Note To Text</h1>
        <p>Upload an audio file and get the transcription. Super easy!</p>

        <label htmlFor="file-upload" className="py-2">
          Upload an Audio File
        </label>

        <div className={style.fileRow}>
          <label
            htmlFor="file-upload"
            className={`${style.chooseBtn} ${loading ? 'disabled' : ''}`}
          >
            CHOOSE FILE
          </label>
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={loading}
            className={style.fileInput}
          />
          <button
            onClick={uploadAndTranscribe}
            disabled={loading || !file}
            className={`${style.uploadBtn} ${
              loading || !file ? 'disabled' : ''
            }`}
          >
            {loading ? 'UPLOADING...' : 'UPLOAD'}
          </button>
        </div>

        {showTranscript && (
          <>
            <label htmlFor="transcript" className={style.label}>
              Transcript:
            </label>
            <textarea
              id="transcript"
              readOnly
              value={animatedText}
              rows={10}
              className={style.textarea}
            />
          </>
        )}
      </div>
    </div>
  )
}
