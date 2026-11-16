import {cn} from "@/src/lib/utils";

export function StatTile({label, value, className}: {label:string, value: string | number, className?: string}) {
    return (
        <div className={cn('rounded-lg px-3 py-2 border-2 border-black', className)}>
            <p className={'font-semibold text-sm'}>{label}</p>
            <p className={'font-display text-4xl'}>{value}</p>
        </div>
    )
}