import React from 'react'
import { FieldError, FieldErrors } from 'react-hook-form'

interface ValidationErrorDisplayProps {
  error?: FieldError | string
  className?: string
}

interface ValidationSummaryProps {
  errors: FieldErrors
  title?: string
  className?: string
  showFieldNames?: boolean
}

interface FormFieldProps {
  label: string
  error?: FieldError | string
  required?: boolean
  children: React.ReactNode
  className?: string
  helpText?: string
}

/**
 * Display individual field validation error
 */
export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  error,
  className = '',
}) => {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message

  return (
    <div className={`mt-1 flex items-center text-sm text-red-600 ${className}`}>
      <svg
        className="mr-1 h-4 w-4 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  )
}

/**
 * Display summary of all form validation errors
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  title = 'Please fix the following errors:',
  className = '',
  showFieldNames = true,
}) => {
  const errorEntries = Object.entries(errors)

  if (errorEntries.length === 0) return null

  return (
    <div
      className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2">
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
              {errorEntries.map(([fieldName, error]) => {
                const message =
                  typeof error === 'object' && error?.message
                    ? error.message
                    : String(error)

                return (
                  <li key={fieldName}>
                    {showFieldNames && (
                      <span className="font-medium capitalize">
                        {fieldName.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                    )}{' '}
                    {message}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Form field wrapper with label, error display, and help text
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  className = '',
  helpText,
}) => {
  const hasError = !!error

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className={hasError ? 'relative' : ''}>
        {children}
        {hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      <ValidationErrorDisplay error={error} />

      {helpText && !hasError && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  )
}

/**
 * Enhanced input component with validation styling
 */
interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError | string
  label?: string
  helpText?: string
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  error,
  label,
  helpText,
  className = '',
  required,
  ...inputProps
}) => {
  const hasError = !!error
  const baseClassName = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-1 sm:text-sm
  `

  const errorClassName = hasError
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'

  const input = (
    <input
      {...inputProps}
      className={`${baseClassName} ${errorClassName} ${className}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${inputProps.id}-error` : undefined}
    />
  )

  if (label) {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        helpText={helpText}
      >
        {input}
      </FormField>
    )
  }

  return (
    <>
      {input}
      <ValidationErrorDisplay error={error} />
    </>
  )
}

/**
 * Enhanced textarea component with validation styling
 */
interface ValidatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldError | string
  label?: string
  helpText?: string
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  error,
  label,
  helpText,
  className = '',
  required,
  ...textareaProps
}) => {
  const hasError = !!error
  const baseClassName = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-1 sm:text-sm resize-vertical
  `

  const errorClassName = hasError
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'

  const textarea = (
    <textarea
      {...textareaProps}
      className={`${baseClassName} ${errorClassName} ${className}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${textareaProps.id}-error` : undefined}
    />
  )

  if (label) {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        helpText={helpText}
      >
        {textarea}
      </FormField>
    )
  }

  return (
    <>
      {textarea}
      <ValidationErrorDisplay error={error} />
    </>
  )
}

/**
 * Enhanced select component with validation styling
 */
interface ValidatedSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: FieldError | string
  label?: string
  helpText?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  error,
  label,
  helpText,
  className = '',
  required,
  options,
  placeholder,
  ...selectProps
}) => {
  const hasError = !!error
  const baseClassName = `
    block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none 
    focus:ring-1 sm:text-sm bg-white
  `

  const errorClassName = hasError
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'

  const select = (
    <select
      {...selectProps}
      className={`${baseClassName} ${errorClassName} ${className}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${selectProps.id}-error` : undefined}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )

  if (label) {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        helpText={helpText}
      >
        {select}
      </FormField>
    )
  }

  return (
    <>
      {select}
      <ValidationErrorDisplay error={error} />
    </>
  )
}
