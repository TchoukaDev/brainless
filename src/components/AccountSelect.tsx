import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import type { Tables } from "#/lib/database.types"

interface AccountSelectProps {
    accounts: Tables<"accounts">[]
    value: number | undefined
    onChange: (id: number) => void
    isFetching?: boolean
}

export default function AccountSelect({ accounts, value, onChange, isFetching }: AccountSelectProps) {
    return (
        <div className="relative">
            <Select value={value ? String(value) : ""} onValueChange={v => onChange(Number(v))}>
                <SelectTrigger className="w-full max-w-48">
                    {isFetching
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : <SelectValue placeholder="Choisir un compte" />
                    }
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
