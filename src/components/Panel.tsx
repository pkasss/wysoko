import {ReactNode} from "react";
import {cn} from "@/src/lib/utils";

export const panelClass = 'rounded-3xl p-4 bg-white border-2 border-black shadow-[6px_6px_0_#000]';
export const pressableClass = cn(
    panelClass, `font-display active:bg-[#ff3d8f] active:translate-x-0.75 active:translate-y-0.75 
    active:shadow-none cursor-pointer`
)

export function Panel({
    children, className
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <section className={cn(panelClass, className)}>
            {children}
        </section>
    )
}