import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseShekelInput, shekelInputFromAgorot } from '@/utils/currency'

interface MoneyInputProps {
  label: string
  valueAgorot: number
  onChangeAgorot: (agorot: number) => void
  id?: string
}

export function MoneyInput({ label, valueAgorot, onChangeAgorot, id }: MoneyInputProps) {
  const [local, setLocal] = useState(() => shekelInputFromAgorot(valueAgorot))

  useEffect(() => {
    setLocal(shekelInputFromAgorot(valueAgorot))
  }, [valueAgorot])

  const commit = (): void => {
    onChangeAgorot(parseShekelInput(local))
  }

  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        dir="ltr"
        className="text-left tabular-nums"
      />
    </div>
  )
}
