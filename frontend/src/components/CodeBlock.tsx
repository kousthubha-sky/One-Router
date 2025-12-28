'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: 'bash' | 'typescript' | 'python';
}

export function CodeComponent({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 overflow-x-auto">
        <code className={`text-sm ${language === 'bash' ? 'text-green-400' : 'text-cyan-400'}`}>
          {code}
        </code>
      </pre>
      <button
        onCopy={handleCopy}
        className="absolute top-2 right-2 p-2 bg-[#1a1a1a] hover:bg-cyan-500 rounded transition-colors"
      >
        <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : 'text-white'}`} />
      </button>
    </div>
  );
}

export function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  return <CodeComponent code={code} language={language} />;
}
