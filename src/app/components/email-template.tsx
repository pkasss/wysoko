import * as React from 'react';

interface EmailTemplateProps {
    firstName: string;
    url: string;
}

export function EmailTemplate({firstName, url} : EmailTemplateProps) {
    return (
        <div>
            <h1>Welcome, {firstName}!</h1>
            <a href={url}>link jakiś</a>
        </div>
    )
}