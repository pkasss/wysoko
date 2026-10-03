import {db} from '@/src/db';
import {Resend} from "resend";
import {betterAuth} from "better-auth";
import * as schema from '../db/auth-schema'
import {magicLink} from "better-auth/plugins";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {EmailTemplate} from "@/src/app/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    plugins: [
        magicLink({
            sendMagicLink: async ({email, url}) => {
                await resend.emails.send({
                    from: 'Test <onboarding@resend.dev>',
                    to: email,
                    subject: 'Hello world',
                    react: EmailTemplate({ firstName: 'Kacper', url: url }),
                });
            }
        })
    ]
});
