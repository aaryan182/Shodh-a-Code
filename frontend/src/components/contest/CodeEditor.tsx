'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Maximize2, 
  Minimize2,
  Code,
  FileText,
  Type,
  Palette,
  Keyboard,
  RotateCcw,
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ProgrammingLanguage, SubmissionStatusResponse, SubmissionStatus } from '../../types';
import { Button } from '../ui/Button';
import { submissionAPI, apiUtils } from '../../utils/api';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: ProgrammingLanguage;
  onLanguageChange: (language: ProgrammingLanguage) => void;
  onSubmit?: (code: string, language: ProgrammingLanguage) => Promise<{ submissionId: number }> | void;
  onRun?: () => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
  isSubmitting?: boolean;
  isRunning?: boolean;
  problemId?: number;
  contestId?: number;
  userId?: number;
  autoSave?: boolean;
  showSubmissionStatus?: boolean;
}

const LANGUAGE_CONFIG = {
  JAVA: {
    monacoLanguage: 'java',
    label: 'Java',
    extension: '.java',
    template: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        Scanner scanner = new Scanner(System.in);
        // Your code here
        scanner.close();
    }
}`,
  },
  PYTHON: {
    monacoLanguage: 'python',
    label: 'Python',
    extension: '.py',
    template: `import sys
from collections import *
from math import *

def solve():
    # Your code here
    pass

if __name__ == "__main__":
    solve()`,
  },
  CPP: {
    monacoLanguage: 'cpp',
    label: 'C++',
    extension: '.cpp',
    template: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <set>
#include <queue>
#include <stack>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your code here
    
    return 0;
}`,
  },
  C: {
    monacoLanguage: 'c',
    label: 'C',
    extension: '.c',
    template: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

int main() {
    // Your code here
    return 0;
}`,
  },
  JAVASCRIPT: {
    monacoLanguage: 'javascript',
    label: 'JavaScript',
    extension: '.js',
    template: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function solve(input) {
    // Your code here
    const lines = input.trim().split('\\n');
    
}

let input = '';
rl.on('line', (line) => {
    input += line + '\\n';
});

rl.on('close', () => {
    solve(input);
});`,
  },
};

const EDITOR_THEMES = {
  'vs': { label: 'Light', value: 'vs' },
  'vs-dark': { label: 'Dark', value: 'vs-dark' },
  'hc-black': { label: 'High Contrast', value: 'hc-black' },
};

const KEY_BINDING_OPTIONS = {
  'default': { label: 'Default', value: 'default' },
  'vim': { label: 'Vim', value: 'vim' },
  'emacs': { label: 'Emacs', value: 'emacs' },
};

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 28, 32];

// Status color mapping
const getStatusColor = (status: SubmissionStatus): string => {
  switch (status) {
    case 'ACCEPTED': return 'text-green-600';
    case 'WRONG_ANSWER': return 'text-red-600';
    case 'TIME_LIMIT_EXCEEDED': return 'text-orange-600';
    case 'MEMORY_LIMIT_EXCEEDED': return 'text-purple-600';
    case 'RUNTIME_ERROR': return 'text-red-500';
    case 'COMPILATION_ERROR': return 'text-red-700';
    case 'SYSTEM_ERROR': return 'text-gray-600';
    case 'PENDING': case 'QUEUED': case 'RUNNING': return 'text-blue-600';
    default: return 'text-gray-600';
  }
};

const getStatusIcon = (status: SubmissionStatus) => {
  switch (status) {
    case 'ACCEPTED': return <Check className="h-4 w-4" />;
    case 'WRONG_ANSWER': case 'RUNTIME_ERROR': case 'COMPILATION_ERROR': 
      return <X className="h-4 w-4" />;
    case 'TIME_LIMIT_EXCEEDED': case 'MEMORY_LIMIT_EXCEEDED': 
      return <Clock className="h-4 w-4" />;
    case 'SYSTEM_ERROR': return <AlertCircle className="h-4 w-4" />;
    case 'PENDING': case 'QUEUED': case 'RUNNING': 
      return <Loader2 className="h-4 w-4 animate-spin" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  onSubmit,
  onRun,
  readOnly = false,
  height = '600px',
  className = '',
  isSubmitting = false,
  isRunning = false,
  problemId,
  contestId,
  userId,
  autoSave = true,
  showSubmissionStatus = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<keyof typeof EDITOR_THEMES>('vs');
  const [fontSize, setFontSize] = useState(14);
  const [keyBinding, setKeyBinding] = useState<keyof typeof KEY_BINDING_OPTIONS>('default');
  const [showSettings, setShowSettings] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatusResponse | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<any>(null);

  // Auto-save functionality
  const saveToLocalStorage = useCallback(() => {
    if (autoSave && problemId) {
      const key = `code_${problemId}_${language}`;
      localStorage.setItem(key, value);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [autoSave, problemId, language, value]);

  // Load from localStorage on mount and language change
  useEffect(() => {
    if (autoSave && problemId) {
      const key = `code_${problemId}_${language}`;
      const savedCode = localStorage.getItem(key);
      if (savedCode && savedCode !== value) {
        onChange(savedCode);
        setLastSaved(new Date());
      }
    }
  }, [problemId, language, autoSave]);

  // Auto-save with debouncing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (value && hasUnsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveToLocalStorage();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [value, hasUnsavedChanges, saveToLocalStorage]);

  // Handle code changes
  const handleCodeChange = useCallback((newValue: string | undefined) => {
    const code = newValue || '';
    onChange(code);
    setHasUnsavedChanges(true);
  }, [onChange]);

  // Submission handling with polling
  const handleSubmit = useCallback(async () => {
    if (!onSubmit || !value.trim() || isSubmitting) return;

    try {
      const result = await onSubmit(value, language);
      if (result && 'submissionId' in result) {
        setCurrentSubmissionId(result.submissionId);
        setIsPolling(true);
        
        // Start polling for submission status
        pollingRef.current = apiUtils.pollSubmissionStatus(
          result.submissionId,
          {
            interval: 2000,
            maxAttempts: 30,
            onUpdate: (status) => {
              setSubmissionStatus(status);
            }
          }
        ).then((finalStatus) => {
          setSubmissionStatus(finalStatus);
          setIsPolling(false);
        }).catch((error) => {
          console.error('Polling error:', error);
          setIsPolling(false);
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
    }
  }, [onSubmit, value, language, isSubmitting]);

  // Manual save
  const handleManualSave = useCallback(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: true },
      wordWrap: 'on',
      fontSize: fontSize,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
    });

    // Configure key bindings
    if (keyBinding === 'vim') {
      // Note: Monaco doesn't have built-in Vim support
      // This would require additional packages like monaco-vim
      console.log('Vim mode would require additional setup');
    } else if (keyBinding === 'emacs') {
      // Similarly for Emacs
      console.log('Emacs mode would require additional setup');
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSubmit();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun && !isRunning) {
        onRun();
      }
    });

    // Format code shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument').run();
    });

    // Manual save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
      handleManualSave();
    });
  };

  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    if (newLanguage !== language) {
      // Save current code before switching
      if (autoSave && problemId && value.trim()) {
        const currentKey = `code_${problemId}_${language}`;
        localStorage.setItem(currentKey, value);
      }

      onLanguageChange(newLanguage);
      
      // Try to load saved code for new language, otherwise use template
      if (autoSave && problemId) {
        const newKey = `code_${problemId}_${newLanguage}`;
        const savedCode = localStorage.getItem(newKey);
        if (savedCode) {
          onChange(savedCode);
        } else {
          onChange(LANGUAGE_CONFIG[newLanguage]?.template || '');
        }
      } else {
        // If current code is empty or matches template, load new template
        const currentTemplate = LANGUAGE_CONFIG[language]?.template || '';
        if (!value.trim() || value.trim() === currentTemplate.trim()) {
          onChange(LANGUAGE_CONFIG[newLanguage]?.template || '');
        }
      }
    }
  };

  const handleTemplateLoad = () => {
    const template = LANGUAGE_CONFIG[language]?.template || '';
    onChange(template);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onChange(content);
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileDownload = () => {
    const config = LANGUAGE_CONFIG[language];
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution${config?.extension || '.txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleThemeChange = (newTheme: keyof typeof EDITOR_THEMES) => {
    setEditorTheme(newTheme);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: newSize });
    }
  };

  const handleKeyBindingChange = (newBinding: keyof typeof KEY_BINDING_OPTIONS) => {
    setKeyBinding(newBinding);
    // Key binding changes would require remounting the editor or additional setup
    if (editorRef.current && monacoRef.current) {
      // This is a placeholder - actual implementation would need monaco-vim or similar
      console.log(`Key binding changed to: ${newBinding}`);
    }
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const resetCode = () => {
    const template = LANGUAGE_CONFIG[language]?.template || '';
    onChange(template);
    setHasUnsavedChanges(true);
  };

  // Handle fullscreen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            if (e.altKey) {
              // Ctrl+Alt+S for manual save
              e.preventDefault();
              handleManualSave();
            } else {
              // Ctrl+S for submit
              e.preventDefault();
              handleSubmit();
            }
            break;
          case 'Enter':
            if (onRun && !isRunning) {
              e.preventDefault();
              onRun();
            }
            break;
        }
      }
      
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, handleSubmit, handleManualSave, onRun, isRunning]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        // Cancel polling if component unmounts
        pollingRef.current = null;
      }
    };
  }, []);

  const editorComponent = (
    <div className={`flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Left side - Language selection and tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={readOnly}
            >
              {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTemplateLoad}
                title="Load template"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCode}
                title="Reset to template"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={formatCode}
                title="Format code (Ctrl+Shift+F)"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Upload file"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileDownload}
                title="Download file"
                disabled={!value.trim()}
              >
                <Download className="h-4 w-4" />
              </Button>
              {autoSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSave}
                  title={`Manual save (Ctrl+Alt+S)${lastSaved ? ` - Last saved: ${lastSaved.toLocaleTimeString()}` : ''}`}
                  className={hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Center - Auto-save status */}
        {autoSave && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {hasUnsavedChanges ? (
              <span className="text-orange-600">Unsaved changes</span>
            ) : lastSaved ? (
              <span className="text-green-600">Saved at {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>Auto-save enabled</span>
            )}
          </div>
        )}

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Settings */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              title="Editor Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-20 min-w-64">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      <Palette className="h-3 w-3 inline mr-1" />
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(EDITOR_THEMES).map(([key, theme]) => (
                        <button
                          key={key}
                          onClick={() => handleThemeChange(key as keyof typeof EDITOR_THEMES)}
                          className={`text-xs px-2 py-1 border rounded transition-colors ${
                            editorTheme === key
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      <Type className="h-3 w-3 inline mr-1" />
                      Font Size
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white w-full"
                    >
                      {FONT_SIZES.map(size => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      <Keyboard className="h-3 w-3 inline mr-1" />
                      Key Bindings
                    </label>
                    <select
                      value={keyBinding}
                      onChange={(e) => handleKeyBindingChange(e.target.value as keyof typeof KEY_BINDING_OPTIONS)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white w-full"
                    >
                      {Object.entries(KEY_BINDING_OPTIONS).map(([key, option]) => (
                        <option key={key} value={key}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Run and Submit buttons */}
          {!readOnly && (
            <>
              {onRun && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRun}
                  disabled={isRunning || !value.trim()}
                  loading={isRunning}
                  title="Run code (Ctrl+Enter)"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
              )}
              {onSubmit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !value.trim()}
                  loading={isSubmitting || isPolling}
                  title="Submit solution (Ctrl+S)"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isPolling ? 'Judging...' : 'Submit'}
                </Button>
              )}
            </>
          )}

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1" style={{ height: isFullscreen ? 'calc(100vh - 180px)' : height }}>
        <Editor
          value={value}
          onChange={handleCodeChange}
          language={LANGUAGE_CONFIG[language]?.monacoLanguage || 'plaintext'}
          theme={editorTheme}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: !isFullscreen },
            wordWrap: 'on',
            fontSize: fontSize,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            contextmenu: true,
            selectOnLineNumbers: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: { enabled: true },
            wordBasedSuggestions: true,
            codeLens: true,
            folding: true,
            foldingHighlight: true,
            showFoldingControls: 'mouseover',
            matchBrackets: 'always',
            renderWhitespace: 'selection',
            rulers: [80, 120],
          }}
        />
      </div>

      {/* Submission Status Display */}
      {showSubmissionStatus && submissionStatus && (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(submissionStatus.status)}`}>
                {getStatusIcon(submissionStatus.status)}
                {submissionStatus.status.replace('_', ' ')}
              </span>
              {submissionStatus.result && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {submissionStatus.result}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Submission #{currentSubmissionId}</span>
              <span>{new Date(submissionStatus.updatedAt).toLocaleTimeString()}</span>
              {isPolling && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Polling...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".java,.py,.cpp,.c,.js,.go,.rs,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
        {editorComponent}
      </div>
    );
  }

  return editorComponent;
};

export default CodeEditor;
