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
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={shekelInputFromAgorot(valueAgorot)}
        onChange={(e) => onChangeAgorot(parseShekelInput(e.target.value))}
        dir="ltr"
        className="text-left"
      />
    </div>
  )
}
