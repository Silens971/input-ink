import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Keyboard, Mouse, Settings2 } from 'lucide-react';
import { ExecutionShortcut } from '@/types/recording';

interface ExecutionShortcutSelectorProps {
  shortcut: ExecutionShortcut;
  onShortcutChange: (shortcut: ExecutionShortcut) => void;
}

const KEYBOARD_OPTIONS = [
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'F5', label: 'F5' },
  { value: 'F6', label: 'F6' },
  { value: 'F7', label: 'F7' },
  { value: 'F8', label: 'F8' },
  { value: 'CapsLock', label: 'CapsLock' },
  { value: 'XButton1', label: 'Mouse 4 (Lado)' },
  { value: 'XButton2', label: 'Mouse 5 (Lado)' },
];

const MOUSE_BUTTON_OPTIONS = [
  { value: '4', label: 'Mouse 4 (Lado)' },
  { value: '5', label: 'Mouse 5 (Lado)' },
  { value: '3', label: 'Mouse 3 (Meio)' },
];

export function ExecutionShortcutSelector({ shortcut, onShortcutChange }: ExecutionShortcutSelectorProps) {
  const handleTypeChange = (type: 'keyboard' | 'mouse') => {
    onShortcutChange({
      type,
      key: type === 'keyboard' ? 'F5' : '5',
    });
  };

  const handleKeyChange = (key: string) => {
    onShortcutChange({ ...shortcut, key });
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-primary" />
        <h4 className="font-medium text-sm">Atalho de Execução</h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={shortcut.type === 'keyboard' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => handleTypeChange('keyboard')}
        >
          <Keyboard className="w-4 h-4" />
          Teclado
        </Button>
        <Button
          variant={shortcut.type === 'mouse' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => handleTypeChange('mouse')}
        >
          <Mouse className="w-4 h-4" />
          Mouse
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {shortcut.type === 'keyboard' ? 'Tecla' : 'Botão'}
        </Label>
        <Select value={shortcut.key} onValueChange={handleKeyChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(shortcut.type === 'keyboard' ? KEYBOARD_OPTIONS : MOUSE_BUTTON_OPTIONS).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Pressionar</strong> = iniciar execução<br />
        <strong>Soltar</strong> = parar imediatamente
      </p>
    </div>
  );
}
