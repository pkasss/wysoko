import {BOULDER_STATUSES, statusStyle} from "@/src/lib/boulders-state";
import {cn} from "@/src/lib/utils";

export function StatusLegend() {
    return (
        <div className={'flex flex-wrap text-md gap-x-3 gap-y-1.5'}>
            {BOULDER_STATUSES.map(status => (
                <span key={status} className={'flex items-center gap-x-1.5 font-heading'}>
                    <span className={cn('size-5 border-2 border-black rounded-sm', statusStyle[status].className)}>
                    </span>
                    {statusStyle[status].label}
                </span>
            ))}
            <div className={'gap-1 text-sm font-heading'}>Stuknij kafelek, aby zmienić wynik.</div>
        </div>
    )
}