import {ReactNode} from "react";
import {cn} from "@/src/lib/utils";

export const panelClass = `rounded-3xl p-4 bg-white border-2 border-black shadow-[6px_6px_0_var(--color-black)]`;
export const enterClass = `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 
                           duration-1000 fill-mode-both`;
export const pressableClass = cn(
    panelClass, `font-display active:bg-top active:text-on-top active:translate-x-0.75 active:translate-y-0.75 
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