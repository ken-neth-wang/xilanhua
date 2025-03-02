import { useState } from 'react';
import { 
  Table, 
  Button, 
  TextInput, 
  Select, 
  Stack,
  Group,
  Paper
} from '@mantine/core';
import { WordBanks, WordData } from '../types';

interface Props {
  wordBanks: WordBanks;
  onSave: (wordBanks: WordBanks) => void;
}

export function WordBankManager({ wordBanks, onSave }: Props) {
  const [level, setLevel] = useState<'beginner' | 'intermediate'>('beginner');
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  const addWord = () => {
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
    <Paper p="md" shadow="sm">
      <Stack>
        <Select
          label="Level"
          value={level}
          onChange={(value: 'beginner' | 'intermediate') => setLevel(value)}
          data={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' }
          ]}
        />

        <Group grow>
          <TextInput
            label="Chinese Word"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <TextInput
            label="English Meaning"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
          />
          <Button onClick={addWord}>Add Word</Button>
        </Group>

        <Table>
          <thead>
            <tr>
              <th>Chinese</th>
              <th>English</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {wordBanks[level].map((word, index) => (
              <tr key={index}>
                <td>{word.word}</td>
                <td>{word.meaning}</td>
                <td>
                  <Button 
                    color="red" 
                    onClick={() => removeWord(index)}
                    size="xs"
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Stack>
    </Paper>
  );
}