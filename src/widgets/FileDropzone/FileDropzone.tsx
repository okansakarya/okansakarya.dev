import { useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { Button } from '../Button/Button'
import './FileDropzone.css'

type FileDropzoneProps = {
  title: string
  hint?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
  children?: ReactNode
}

export function FileDropzone({
  title,
  hint,
  accept,
  multiple = true,
  disabled,
  onFiles,
  children,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function emit(fileList: FileList | null) {
    if (!disabled && fileList && fileList.length > 0) {
      onFiles(Array.from(fileList))
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    emit(event.dataTransfer.files)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!disabled) {
      setDragging(true)
    }
  }

  const className = [
    'file-dropzone',
    dragging && 'file-dropzone--dragging',
    disabled && 'file-dropzone--disabled',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <span className="file-dropzone__icon material-symbols-outlined" aria-hidden="true">
        upload_file
      </span>
      <p className="file-dropzone__title">{title}</p>
      {hint && <p className="file-dropzone__hint">{hint}</p>}
      <Button
        variant="ghost"
        icon="folder_open"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Dosya Gözat
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        aria-label={title}
        onChange={(event) => {
          emit(event.target.files)
          event.target.value = ''
        }}
      />
      {children && <div className="file-dropzone__queue">{children}</div>}
    </div>
  )
}
