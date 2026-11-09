import { useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import './TextField.css'

type CommonProps = {
  label: string
  hint?: string
  error?: string
}

type InputFieldProps = CommonProps &
  InputHTMLAttributes<HTMLInputElement> & { multiline?: false }
type TextareaFieldProps = CommonProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true }

export type TextFieldProps = InputFieldProps | TextareaFieldProps

export function TextField(props: TextFieldProps) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  const messageId = `${id}-message`
  const message = props.error ?? props.hint
  const describedBy = message ? messageId : undefined
  const className = ['text-field', props.error && 'text-field--invalid'].filter(Boolean).join(' ')

  let control
  if (props.multiline) {
    const { label: _l, hint: _h, error: _e, multiline: _m, ...rest } = props
    control = (
      <textarea
        {...rest}
        id={id}
        className="text-field__control text-field__control--multiline"
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
      />
    )
  } else {
    const { label: _l, hint: _h, error: _e, multiline: _m, ...rest } = props
    control = (
      <input
        {...rest}
        id={id}
        className="text-field__control"
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
      />
    )
  }

  return (
    <div className={className}>
      <label className="text-field__label" htmlFor={id}>
        {props.label}
      </label>
      {control}
      {message && (
        <p id={messageId} className="text-field__message">
          {message}
        </p>
      )}
    </div>
  )
}
