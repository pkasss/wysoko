import * as React from 'react';

interface EmailTemplateProps {
    url: string;
    competitionName?: string;
}

const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function EmailTemplate({url, competitionName = "KRAK'EM ALL"}: EmailTemplateProps) {
    return (
        <div style={{backgroundColor: '#f4f4f4', padding: '32px 16px', fontFamily}}>
            <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{maxWidth: 480, margin: '0 auto', backgroundColor: '#ffffff', border: '2px solid #000000'}}
            >
                <tbody>
                <tr>
                    <td style={{backgroundColor: '#000000', padding: '16px 24px'}}>
                        <p style={{margin: 0, color: '#ffffff', fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase'}}>
                            {competitionName}
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style={{padding: '32px 24px'}}>
                        <h1 style={{margin: '0 0 16px', fontSize: 28, lineHeight: 1.1, fontWeight: 800, color: '#000000'}}>
                            Twój link do logowania
                        </h1>
                        <p style={{margin: '0 0 24px', fontSize: 16, lineHeight: 1.5, color: '#222222'}}>
                            Kliknij przycisk, żeby zalogować się i wpisywać wyniki.
                        </p>
                        <table role="presentation" cellPadding={0} cellSpacing={0}>
                            <tbody>
                            <tr>
                                <td style={{backgroundColor: '#000000'}}>
                                    <a
                                        href={url}
                                        style={{display: 'inline-block', padding: '14px 28px', color: '#ffffff', fontSize: 16, fontWeight: 700, textDecoration: 'none'}}
                                    >
                                        Zaloguj się
                                    </a>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <p style={{margin: '24px 0 0', fontSize: 14, lineHeight: 1.5, color: '#444444'}}>
                            Link jest ważny przez 15 minut i działa tylko raz. Zalogujesz się na tym urządzeniu, na którym go otworzysz.
                        </p>
                        <p style={{margin: '16px 0 0', fontSize: 13, lineHeight: 1.5, color: '#666666'}}>
                            Przycisk nie działa? Skopiuj ten adres do przeglądarki:
                            <br/>
                            <a href={url} style={{color: '#000000', wordBreak: 'break-all'}}>{url}</a>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style={{borderTop: '1px solid #e5e5e5', padding: '16px 24px'}}>
                        <p style={{margin: 0, fontSize: 12, lineHeight: 1.5, color: '#888888'}}>
                            Jeśli to nie Ty prosiłeś o link, po prostu zignoruj tę wiadomość.
                        </p>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}