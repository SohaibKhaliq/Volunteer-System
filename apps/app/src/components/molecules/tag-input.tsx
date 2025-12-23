import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { publicApi } from '@/lib/api/publicApi';

type TagInputProps = {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
};

export default function TagInput({ value = [], onChange, placeholder, id }: TagInputProps) {
  const [tags, setTags] = useState<string[]>(() => value || []);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setTags(value || []);
  }, [value]);

  const pushTag = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...tags, ...parts]));
    setTags(next);
    onChange && onChange(next);
  };

  const removeTag = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    setTags(next);
    onChange && onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) {
        pushTag(input);
        setInput('');
      }
    } else if (e.key === 'Backspace' && input === '') {
      // remove last
      if (tags.length > 0) removeTag(tags.length - 1);
    }
  };

  // Fetch suggestions when input changes (debounced)
  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await publicApi.searchSkills(q);
        const data = (res && (res.data ?? res)) || [];
        const names = Array.isArray(data) ? data.map((d: any) => d.name) : [];
        // exclude already selected
        const filtered = names.filter((n: string) => !tags.includes(n));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (e) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [input, tags]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, idx) => (
          <Badge key={idx} variant="outline" className="inline-flex items-center gap-2">
            <span>{t}</span>
            <Button size="sm" variant="ghost" onClick={() => removeTag(idx)} aria-label={`Remove ${t}`} className="p-0">
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Input
        id={id}
        ref={inputRef}
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) {
            pushTag(input);
            setInput('');
          }
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-1 bg-white border rounded shadow-sm max-h-40 overflow-auto z-20">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={(e) => {
                // prevent blur from firing before click
                e.preventDefault();
                pushTag(s);
                setInput('');
                setShowSuggestions(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
