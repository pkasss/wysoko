import {db} from '@/src/db';

import {Resend} from "resend";
import * as schema from "@/src/db/auth-schema";

import {betterAuth} from "better-auth";
import {magicLink} from "better-auth/plugins";
import {getUserEmail} from "@/src/db/queries/users";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {EmailTemplate} from "@/src/components/email-template";
import {linkCompetitorsToUser} from "@/src/db/mutations/competitors";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    databaseHooks: {
        session: {
            create: {
                after: async (session) => {
                    try {
                        const email = await getUserEmail(session.userId);
                        if (!email) {
                            return;
                        }

                        await linkCompetitorsToUser(session.userId, email);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({email, url}) => {
                const {error} = await resend.emails.send({
                    from: 'KRAK\'EM ALL <zawody@app.myavatar.pl>',
                    to: email,
                    subject: 'Twój link do logowania - KRAK\'EM ALL',
                    react: EmailTemplate({url}),
                });
                if (error) {
                    console.error(error);
                    throw new Error(`Nie udało się wysłać miala: ${error.message}`);
                }
            },
            expiresIn: 900
        })
    ],
    rateLimit: {
        enabled: true,
        storage: 'database',
        window: 60,
        max: 100,
        customRules: {
            '/sign-in/magic-link': {window: 60, max: 20},
        },
    }
});
