import {db} from '@/src/db';
import {Resend} from "resend";
import {betterAuth} from "better-auth";
import {username} from "better-auth/plugins";
import {magicLink} from "better-auth/plugins";
import * as schema from "@/src/db/auth-schema";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {EmailTemplate} from "@/src/components/email-template";

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
        }),
        username()
    ]
});
