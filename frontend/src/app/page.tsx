"use client"

import React, { useState, useEffect } from 'react'
import { PronunciationPractice } from '@/components/pronunciation-practice'
import { WordBankManager } from '@/components/word-bank-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordBanks } from '@/types'

export default function Home() {
  const [wordBanks, setWordBanks] = useState<WordBanks>({
    beginner: [],
    intermediate: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load word banks from backend
    const fetchWordBanks = async () => {
      try {
        // This would be replaced with actual API call to your Python backend
        const response = await fetch('/api/words')
        const data = await response.json()
        setWordBanks(data)
      } catch (error) {
        console.error('Error loading word banks:', error)
        // Fallback to default words if API fails
        setWordBanks({
          beginner: [
            { word: "你好", meaning: "hello" },
            { word: "谢谢", meaning: "thank you" },
          ],
          intermediate: [
            { word: "经济", meaning: "economy" },
            { word: "环境", meaning: "environment" },
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWordBanks()
  }, [])

  const handleSaveWordBanks = async (updatedWordBanks: WordBanks) => {
    setWordBanks(updatedWordBanks)
    
    // Save to backend
    try {
      // This would be replaced with actual API call to your Python backend
      await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedWordBanks),
      })
    } catch (error) {
      console.error('Error saving word banks:', error)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>
  }

  return (
    <main className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Chinese Learning App</h1>
      
      <Tabs defaultValue="practice" className="space-y-6">
        <TabsList>
          <TabsTrigger value="practice">Practice Pronunciation</TabsTrigger>
          <TabsTrigger value="manage">Manage Word Banks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="practice" className="space-y-4">
          <p className="text-lg">Practice your Chinese pronunciation with real-time feedback.</p>
          <PronunciationPractice wordBank={[...wordBanks.beginner, ...wordBanks.intermediate]} />
        </TabsContent>
        
        <TabsContent value="manage">
          <WordBankManager wordBanks={wordBanks} onSave={handleSaveWordBanks} />
        </TabsContent>
      </Tabs>
    </main>
  )
}