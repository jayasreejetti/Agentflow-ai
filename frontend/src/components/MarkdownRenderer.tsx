import React from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) return null;

  // Split lines and parse blocks cleanly
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (tableHeader.length > 0) {
      renderedElements.push(
        <div key={key} className="overflow-x-auto my-6 border border-slate-800 rounded-xl bg-slate-900/40">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-200 border-b border-slate-700">
              <tr>
                {tableHeader.map((th, i) => (
                  <th key={i} className="px-4 py-3 font-semibold">{th.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tableRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 font-normal text-slate-300">
                      {parseInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushCode = (key: string) => {
    renderedElements.push(
      <div key={key} className="my-5 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400 font-mono">
          <span>{codeLanguage || 'code'}</span>
          <button
            onClick={() => navigator.clipboard.writeText(codeBuffer.join('\n'))}
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
          {codeBuffer.join('\n')}
        </pre>
      </div>
    );
    codeBuffer = [];
    codeLanguage = '';
    inCodeBlock = false;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Code block fences
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode(`code-${idx}`);
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().replace('```', '');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      // Check for separator row | --- | --- |
      if (line.includes('---')) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(`table-${idx}`);
    }

    // Headings
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-8 mb-4 border-b border-slate-800 pb-3">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={idx} className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-7 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-emerald-500 rounded-full inline-block"></span>
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={idx} className="text-lg font-semibold text-slate-200 mt-5 mb-2">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote key={idx} className="border-l-4 border-emerald-500/80 pl-4 py-2 my-4 bg-emerald-500/5 rounded-r-lg text-slate-300 italic text-sm">
          {parseInlineFormatting(line.replace('> ', ''))}
        </blockquote>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      renderedElements.push(
        <li key={idx} className="ml-5 list-disc text-sm text-slate-300 my-1 leading-relaxed">
          {parseInlineFormatting(line.trim().substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '');
      renderedElements.push(
        <li key={idx} className="ml-5 list-decimal text-sm text-slate-300 my-1 leading-relaxed">
          {parseInlineFormatting(text)}
        </li>
      );
    } else if (line.trim() === '---') {
      renderedElements.push(<hr key={idx} className="border-slate-800 my-6" />);
    } else if (line.trim().length > 0) {
      renderedElements.push(
        <p key={idx} className="text-sm text-slate-300 leading-relaxed my-2.5">
          {parseInlineFormatting(line)}
        </p>
      );
    }
  }

  if (inCodeBlock) flushCode('code-final');
  if (inTable) flushTable('table-final');

  return (
    <div className="relative">
      <div className="absolute top-0 right-0">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Markdown' : 'Copy Content'}</span>
        </button>
      </div>
      <div className="prose prose-invert max-w-none">
        {renderedElements}
      </div>
    </div>
  );
};

function parseInlineFormatting(text: string): React.ReactNode {
  // Handle links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(parseBoldAndCode(text.substring(lastIndex, match.index)));
    }
    const label = match[1];
    const url = match[2];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium"
      >
        <span>{label}</span>
        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(parseBoldAndCode(text.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : text;
}

function parseBoldAndCode(str: string): React.ReactNode {
  // Simple token parser for **bold** and `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const tokens = str.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-100">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-slate-800 text-emerald-300 rounded border border-slate-700/60">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

