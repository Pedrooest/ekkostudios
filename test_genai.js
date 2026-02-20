
import fs from 'fs';

const key = "AIzaSyAiAh6lYU8CogQeQlulw44hXkrxQegKigI";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function check() {
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            fs.writeFileSync('gemini_models.json', JSON.stringify(data.error, null, 2));
            return;
        }

        fs.writeFileSync('gemini_models.json', JSON.stringify(data.models || [], null, 2));

    } catch (e) {
        fs.writeFileSync('gemini_models.json', JSON.stringify({ error: e.message }, null, 2));
    }
}

check();
