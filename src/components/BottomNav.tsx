'use client';

import Link from 'next/link';
import {ListChecks, Trophy, Info} from "lucide-react";
import {Panel} from "./Panel";
import {cn} from "@/src/lib/utils";
import {usePathname} from "next/navigation";

export default function BottomNav({slug}: { slug: string }) {
    const compHref = `/zawody/${slug}`;
    const links = [
        {label: 'Wyniki', href: compHref, icon: ListChecks},
        {label: 'Ranking', href: `${compHref}/ranking`, icon: Trophy},
        {label: 'Info', href: `${compHref}/info`, icon: Info},
    ];

    const pathname = usePathname();

    return (
        <nav className={'fixed inset-x-0 bottom-0 flex justify-center px-4 pb-4'}>
            <Panel className={'flex w-full max-w-lg rounded-full gap-1 p-1.5'}>
                {links.map(({label, href, icon: Icon}) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn('flex flex-1 flex-col items-center rounded-full py-2',
                            pathname === href ? 'bg-black text-white' : 'text-black/70')}
                    >
                        <Icon className={'size-7'} aria-hidden/>
                        {label}
                    </Link>
                ))}
            </Panel>
        </nav>
    )
}