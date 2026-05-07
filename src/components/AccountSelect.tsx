import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import type { Tables } from "#/lib/database.types"

interface AccountSelectProps {
    accounts: Tables<"accounts">[]
    value: number | undefined
    onChange: (id: number) => void
}

export default function AccountSelect({ accounts, value, onChange }: AccountSelectProps) {
    return (
        <div>
            <Select value={value ? String(value) : ""} onValueChange={v => onChange(Number(v))}>
                <SelectTrigger className="w-full max-w-48">
                    <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                    {accounts.map(account => (
                        <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
