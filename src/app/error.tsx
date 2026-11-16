'use client';

import {useEffect} from 'react';
import Link from 'next/link';
import {Panel, pressableClass} from '@/src/components/Panel';
import {cn} from '@/src/lib/utils';

export default function Error({error, reset}: { error: Error & { digest?: string }, reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className={'mx-auto flex max-w-xl flex-col gap-3 px-4 pt-10'}>
            <Panel className={'flex flex-col gap-4'}>
                <h1 className={'font-display text-6xl leading-none'}>Coś poszło nie tak</h1>
                <p className={'text-black/70'}>
                    Spróbuj ponownie. Jeśli logowanie było z linku w mailu, mógł on już zostać użyty albo wygasnąć.
                </p>
                <div className={'flex flex-wrap gap-3'}>
                    <button
                        type={'button'}
                        onClick={reset}
                        className={cn(pressableClass, 'rounded-full bg-black px-5 py-2 text-white')}
                    >
                        Spróbuj ponownie
                    </button>
                    <Link href={'/login'} className={cn(pressableClass, 'rounded-full px-5 py-2')}>
                        Zaloguj się jeszcze raz
                    </Link>
                    <Link href={'/'} className={cn(pressableClass, 'rounded-full px-5 py-2')}>
                        Strona zawodów
                    </Link>
                </div>
            </Panel>
        </main>
    );
}