import {ReactNode} from "react";
import {cn} from "@/src/lib/utils";

export function Panel({
    children, className
} : {
    children: ReactNode
    className?: string
}) {
    return (
        <section className={cn('rounded-3xl p-4 bg-white border-2 border-black shadow-[6px_6px_0_#000]', className)}>
            {children}
        </section>
    )
}