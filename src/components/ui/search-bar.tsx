"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

export interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
  className?: string
  showClearButton?: boolean
}

export function SearchBar({
  placeholder = "Cari...",
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  className,
  showClearButton = true,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState(
    controlledValue ?? ""
  )
  const value = controlledValue ?? internalValue
  const debouncedValue = useDebounce(value, debounceMs)

  React.useEffect(() => {
    if (onSearch && debouncedValue !== "") {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue("")
    }
    onChange?.("")
    onSearch?.("")
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={cn("pl-10", showClearButton && value && "pr-10")}
        aria-label="Cari"
      />
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Hapus pencarian"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
