import {cn} from "@/src/lib/utils";
import {enterClass, pressableClass} from "@/src/components/Panel";
import Link from "next/link";

export function LogInButton({competitionSlug}: {competitionSlug: string}) {
    return (
        <Link
            href={`/login?next=/zawody/${competitionSlug}/wyniki`}
            className={cn(enterClass, pressableClass, 'delay-100 gap-2 text-center text-4xl block')}
        >
            Startujesz? Zaloguj się!
        </Link>
    )
}