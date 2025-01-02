import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch, { Headers } from 'node-fetch';

dotenv.config();

// Check for missing environment variables early
if (!process.env.TELEGRAM_TOKEN) {
    console.error("Error: TELEGRAM_TOKEN environment variable is missing.");
    process.exit(1);
}
if (!process.env.GOOGLE_API_KEY) {
    console.error("Error: GOOGLE_API_KEY environment variable is missing.");
    process.exit(1);
}

// Make fetch and Headers available globally (if needed by your environment)
global.fetch = fetch;
global.Headers = Headers;

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

bot.start((ctx) => {
    ctx.reply('puch le jo tujhe puchna hai ');
});

bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    try {
        // Send the message text directly as input to the model
        const result = await model.generateContent(messageText);

        // Check the response for the candidates array and extract the content
        if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
            // Inspect the first candidate's content
            const candidate = result.response.candidates[0];
            
            // Check if candidate contains content and parts
            if (candidate && candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
                const parts = candidate.content.parts;
                
                // Extract the text from the first part
                if (parts.length > 0 && parts[0].text) {
                    const generatedText = parts[0].text;

                    // Ensure that the generated content is a string
                    if (typeof generatedText === 'string') {
                        ctx.reply(generatedText);
                    } else {
                        ctx.reply("Error: The generated content is not a string.");
                        console.error("Generated content is not a string:", generatedText);
                    }
                } else {
                    ctx.reply("Error: No valid text content found in the parts.");
                    console.error("No valid text found in parts:", parts);
                }
            } else {
                ctx.reply("Error: No valid content found in the response.");
                console.error("No valid content found in candidate:", candidate);
            }
        } else if (result && result.response && result.response.promptFeedback && result.response.promptFeedback.blockReason) {
            ctx.reply(`Your prompt was blocked due to: ${result.response.promptFeedback.blockReason}`);
        } else {
            ctx.reply("Sorry, I couldn't generate a response. The response from the model was unexpected.");
            console.error("Unexpected response from Gemini:", result);
        }
    } catch (error) {
        console.error("Error generating content:", error);
        ctx.reply("Error: Something went wrong while generating content.");
    }
});

bot.launch()
    .then(() => {
        console.log('Telegram bot is running...');
    })
    .catch((error) => {
        console.error('Error launching bot:', error);
    });
