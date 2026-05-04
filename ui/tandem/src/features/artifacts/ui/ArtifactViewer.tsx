import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/shared/ui/table';
import Papa from 'papaparse';

// Required for math styles to render correctly
import 'katex/dist/katex.min.css';

interface ArtifactViewerProps {
  content: string;
  onClose?: () => void;
  title?: string | null;
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx',
    'py': 'python', 'rb': 'ruby', 'go': 'go', 'rs': 'rust',
    'sh': 'bash', 'bash': 'bash', 'zsh': 'bash', 'bat': 'batch',
    'json': 'json', 'yml': 'yaml', 'yaml': 'yaml', 'toml': 'toml',
    'html': 'html', 'css': 'css', 'scss': 'scss', 'sql': 'sql',
    'md': 'markdown', 'csv': 'csv', 'txt': 'text'
  };
  return map[ext] || 'text';
}

export function ArtifactViewer({ content, onClose, title }: ArtifactViewerProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const isMarkdown = title?.toLowerCase().endsWith('.md') ?? false;
  const isCsv = title?.toLowerCase().endsWith('.csv') ?? false;
  const language = title ? getLanguageFromFilename(title) : 'text';

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const csvData = useMemo(() => {
    if (!isCsv) return null;
    const result = Papa.parse<string[]>(content, { skipEmptyLines: 'greedy' });
    return result.data;
  }, [content, isCsv]);

  // Allow classes for syntax highlighting and math
  const sanitizeSchema = useMemo(() => {
    return {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        code: [...(defaultSchema.attributes?.code || []), 'className'],
        span: [...(defaultSchema.attributes?.span || []), 'className', 'style'],
        div: [...(defaultSchema.attributes?.div || []), 'className'],
        math: [...(defaultSchema.attributes?.math || []), 'display'],
      },
    };
  }, []);

  const renderCodeViewer = () => {
    return (
      <div className="relative h-full flex flex-col bg-[#282c34] group">
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#21252b] border-b border-black/20 shrink-0">
          <span className="text-xs text-gray-400 font-mono lowercase">{language}</span>
          <button
            type="button"
            onClick={() => copyToClipboard(content, 'main-code')}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-white/20 opacity-0 group-hover:opacity-100"
            aria-label="Copy code"
          >
            {copied === 'main-code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="w-full">
            <SyntaxHighlighter
              style={oneDark as any}
              language={language}
              PreTag="div"
              customStyle={{ margin: 0, background: 'transparent', padding: '1rem', fontSize: '0.875rem', overflowX: 'auto', whiteSpace: 'pre' }}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderCsvTable = () => {
    if (!csvData || csvData.length === 0) return null;
    
    const headers = csvData[0];
    const rows = csvData.slice(1);
    const MAX_PREVIEW_ROWS = 100;
    const displayRows = rows.slice(0, MAX_PREVIEW_ROWS);
    const hasMore = rows.length > MAX_PREVIEW_ROWS;

    return (
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, i) => (
                  <TableHead key={i}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Showing first {MAX_PREVIEW_ROWS} rows. Toggle 'Raw CSV' to see full content.
            </p>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm truncate">{title || 'Artifact Viewer'}</h3>
        <div className="flex items-center gap-2">
          {isMarkdown && (
            <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)} className="h-8 text-xs font-medium">
              {showRaw ? 'Preview' : 'Markdown'}
            </Button>
          )}
          {isCsv && (
            <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)} className="h-8 text-xs font-medium">
              {showRaw ? 'Table' : 'Raw CSV'}
            </Button>
          )}
          {!isMarkdown && !isCsv && (
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(content, 'header')} className="h-8 text-xs font-medium gap-1.5">
              {copied === 'header' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-md">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </div>
      
      {(!isMarkdown && !isCsv) || showRaw ? (
        isMarkdown || isCsv ? (
           <ScrollArea className="flex-1">
             <div className="w-full">
               <pre className="p-6 m-0 font-mono text-sm text-foreground overflow-x-auto whitespace-pre">
                 {content}
               </pre>
             </div>
           </ScrollArea>
        ) : (
          renderCodeViewer()
        )
      ) : (
        isCsv ? (
          renderCsvTable()
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6 prose prose-sm md:prose-base dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                  rehypeKatex,
                  [rehypeSanitize, sanitizeSchema]
                ]}
                components={{
                  code({ className, children, node, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const lang = match ? match[1] : '';
                    const id = Math.random().toString(36).substring(7);
                    const isBlock = match || String(children).includes('\n');
                    
                    if (isBlock) {
                      const { ref, ...safeProps } = props as any;
                      return (
                        <div className="relative rounded-md overflow-hidden bg-[#282c34] my-4 group border border-border shadow-sm">
                          <div className="flex items-center justify-between px-4 py-1.5 bg-[#21252b] border-b border-black/20">
                            <span className="text-xs text-gray-400 font-mono lowercase">{lang || 'text'}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), id)}
                              className="text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-white/20 opacity-0 group-hover:opacity-100"
                              aria-label="Copy code"
                            >
                              {copied === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <div className="w-full">
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={lang || 'text'}
                              PreTag="div"
                              customStyle={{ margin: 0, background: 'transparent', padding: '1rem', fontSize: '0.875rem', overflowX: 'auto', whiteSpace: 'pre' }}
                              {...safeProps}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <code className={`${className || ''} bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-foreground`} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        )
      )}
    </div>
  );
}
