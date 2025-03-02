"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { WordData } from '@/types'
import { api } from '@/lib/api'
import { Mic, StopCircle } from 'lucide-react'

interface Props {
  wordBank: WordData[]
}

export function PronunciationPractice({ wordBank }: Props) {
  const [currentWord, setCurrentWord] = useState<WordData | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  const getRandomWord = () => {
    const randomWord = wordBank[Math.floor(Math.random() * wordBank.length)]
    setCurrentWord(randomWord)
    setResult(null)
  }


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' })

        // Create FormData to send the audio file to the backend
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.wav')

        try {
          // Send to your Python backend
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            setResult(`Error: ${errorData.error || 'Failed to transcribe audio'}`);
            return;
          }

          const data = await response.json()
          if (data.transcription) {
            setResult(data.transcription)
          } else {
            setResult('No transcription returned')
          }
        } catch (error) {
          console.error('Error sending audio to backend:', error)
          setResult(`Error: ${error.message || 'Unknown error occurred'}`)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setTimeout(() => {
        mediaRecorder.current?.stop()
        setIsRecording(false)
      }, 5000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pronunciation Practice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={getRandomWord} variant="outline">
          Get Random Word
        </Button>

        {currentWord && (
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              {currentWord.word} ({currentWord.meaning})
            </div>
            <Button
              onClick={startRecording}
              disabled={isRecording}
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Recording...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <Alert variant={result === currentWord?.word ? "default" : "destructive"}>
            <AlertTitle>Result</AlertTitle>
            <AlertDescription>
              You said: {result}
              {result === currentWord?.word
                ? ' - Perfect pronunciation!'
                : ' - Try again!'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}