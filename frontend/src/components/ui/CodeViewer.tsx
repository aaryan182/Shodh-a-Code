'use client'

import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneLight,
  oneDark,
} from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check } from 'lucide-react'
import { CodeViewerProps, ProgrammingLanguage } from '../../types'

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  readOnly = true,
  showLineNumbers = true,
  theme = 'light',
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false)

  const getLanguageForHighlighter = (lang: ProgrammingLanguage): string => {
    switch (lang) {
      case 'JAVA':
        return 'java'
      case 'PYTHON':
        return 'python'
      case 'CPP':
      case 'C':
        return 'cpp'
      case 'JAVASCRIPT':
        return 'javascript'
      case 'GO':
        return 'go'
      case 'RUST':
        return 'rust'
      default:
        return 'text'
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const highlighterStyle = theme === 'dark' ? oneDark : oneLight

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {language.toLowerCase()}
          </span>
          {readOnly && (
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
              Read-only
            </span>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="relative">
        <SyntaxHighlighter
          language={getLanguageForHighlighter(language)}
          style={highlighterStyle}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: theme === 'dark' ? '#1e1e1e' : '#fafafa',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          lineNumberStyle={{
            color: theme === 'dark' ? '#6e7681' : '#656d76',
            backgroundColor: theme === 'dark' ? '#161b22' : '#f6f8fa',
            paddingLeft: '0.5rem',
            paddingRight: '1rem',
            userSelect: 'none',
          }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Empty State */}
      {!code.trim() && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <div className="text-center">
            <div className="text-sm">No code to display</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeViewer
