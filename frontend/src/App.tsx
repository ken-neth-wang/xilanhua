"use client"

import { useState, useEffect } from 'react';
import { PronunciationPractice } from '@/components/pronunciation-practice';
import { WordBankManager } from '@/components/word-bank-manager';
import { WordBanks } from '@/types';
import { api } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function App() {
    const [wordBanks, setWordBanks] = useState<WordBanks>({ beginner: [], intermediate: [] });
    const [activeTab, setActiveTab] = useState<string>("practice");

    useEffect(() => {
        loadWordBanks();
    }, []);

    const loadWordBanks = async () => {
        const banks = await api.loadWordBanks();
        setWordBanks(banks);
    };

    const handleSaveWordBanks = async (newBanks: WordBanks) => {
        await api.saveWordBanks(newBanks);
        setWordBanks(newBanks);
    };

    return (
        <div className="container mx-auto p-4">
            <header className="py-4 mb-6">
                <h1 className="text-2xl font-bold">Chinese Learning App</h1>
            </header>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="practice">
                <TabsList className="mb-4">
                    <TabsTrigger value="practice">Practice Pronunciation</TabsTrigger>
                    <TabsTrigger value="manage">Manage Words</TabsTrigger>
                </TabsList>

                <TabsContent value="practice">
                    <PronunciationPractice
                        wordBank={[...wordBanks.beginner, ...wordBanks.intermediate]}
                    />
                </TabsContent>

                <TabsContent value="manage">
                    <WordBankManager
                        wordBanks={wordBanks}
                        onSave={handleSaveWordBanks}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}