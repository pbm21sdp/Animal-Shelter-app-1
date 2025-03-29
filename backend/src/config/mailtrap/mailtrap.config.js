import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Proper path resolution for .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

export const mailtrapClient = new MailtrapClient({
    endpoint: "https://send.api.mailtrap.io", // Explicit endpoint
    token: process.env.MAILTRAP_TOKEN
});

export const sender = {
    email: process.env.MAILTRAP_SENDER_EMAIL, // Use verified sender
    name: "Animal Shelter App"
};

const recipients = [ /// Only here i can send
    {
        email: "marius.nistor@student.upt.ro"
    }
];

