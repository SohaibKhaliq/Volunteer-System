import { useEffect, useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  height?: string;
  // Optional JSON schema to provide validation/completion when Monaco is available
  jsonSchema?: object;
  // Optional schema identifier; a unique URI used by monaco
  schemaUri?: string;
};

export default function MonacoEditor({ value, onChange, language = 'json', height = '200px' }: Props) {
  const [Editor, setEditor] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Try to dynamically import monaco editor — optional dependency.
    import('@monaco-editor/react')
      .then((mod) => {
        if (!cancelled) setEditor(() => mod.default);
      })
      .catch(() => {
        // ignore; if not installed we'll fallback to textarea
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (Editor) {
    return (
      // @ts-ignore dynamic component
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v: any) => onChange(String(v ?? ''))}
        options={{ automaticLayout: true, minimap: { enabled: false } }}
        onMount={(editor: any, monaco: any) => {
          try {
            if (language === 'json' && jsonSchema && monaco?.languages?.json) {
              const uri = schemaUri || 'inmemory://model/features-schema.json';
              monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                schemas: [
                  {
                    uri,
                    fileMatch: ['*'],
                    schema: jsonSchema
                  }
                ]
              });
            }
          } catch (e) {
            // ignore — optional integration
          }
        }}
      />
    );
  }

  return (
    <textarea
      className="w-full p-2 border rounded min-h-[160px] font-mono text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ height }}
    />
  );
}
