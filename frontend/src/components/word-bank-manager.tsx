"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WordBanks, WordData } from '@/types'

interface Props {
  wordBanks: WordBanks;
  onSave: (wordBanks: WordBanks) => void;
}

export function WordBankManager({ wordBanks, onSave }: Props) {
  const [level, setLevel] = useState<'beginner' | 'intermediate'>('beginner');
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  const addWord = () => {
    if (!newWord.trim() || !newMeaning.trim()) return;
    
    const updatedBanks = {
      ...wordBanks,
      [level]: [...wordBanks[level], { word: newWord, meaning: newMeaning }]
    };
    onSave(updatedBanks);
    setNewWord('');
    setNewMeaning('');
  };

  const removeWord = (index: number) => {
    const updatedBanks = {
      ...wordBanks,
      [level]: wordBanks[level].filter((_, i) => i !== index)
    };
    onSave(updatedBanks);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Bank Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Level</label>
          <Select 
            value={level} 
            onValueChange={(value: 'beginner' | 'intermediate') => setLevel(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Chinese Word"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <Input
            placeholder="English Meaning"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
          />
          <Button onClick={addWord}>Add Word</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chinese</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wordBanks[level].map((word, index) => (
              <TableRow key={index}>
                <TableCell>{word.word}</TableCell>
                <TableCell>{word.meaning}</TableCell>
                <TableCell>
                  <Button 
                    variant="destructive" 
                    onClick={() => removeWord(index)}
                    size="sm"
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}