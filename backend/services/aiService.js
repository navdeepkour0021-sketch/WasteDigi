import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility to handle OpenAI errors gracefully
function handleAIError(error, context) {
  console.error(`${context} error:`, error);

  if (error.code === 'insufficient_quota') {
    return { status: 429, message: 'AI quota exceeded. Please check billing.' };
  }

  if (error.status === 429) {
    return { status: 429, message: 'Rate limit exceeded. Try again later.' };
  }

  if (error.message.includes('API key')) {
    return { status: 500, message: 'AI service not configured. Please contact administrator.' };
  }

  return { status: 500, message: `Failed to ${context}` };
}

export const getWasteReductionSuggestions = async (inventoryData, wasteData) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
As an AI assistant for a restaurant waste management system, analyze the following data and provide actionable suggestions to reduce food waste:

Inventory Data:
${JSON.stringify(inventoryData, null, 2)}

Recent Waste Data:
${JSON.stringify(wasteData, null, 2)}

Please provide:
1. Top 3 specific recommendations to reduce waste
2. Patterns you notice in the waste data
3. Inventory management improvements
4. Cost-saving opportunities

Keep responses practical and restaurant-focused. Limit to 300 words.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert restaurant waste management consultant. Provide practical, actionable advice to reduce food waste and improve inventory management."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    throw handleAIError(error, 'generate AI suggestions');
  }
};

export const analyzeExpiryPatterns = async (inventoryItems) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analyze these inventory items and their expiry dates to identify patterns and provide recommendations:

${JSON.stringify(inventoryItems, null, 2)}

Focus on:
1. Items that expire frequently
2. Ordering pattern recommendations
3. Storage optimization suggestions
4. Seasonal considerations

Provide a brief, actionable analysis in 200 words or less.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a food inventory management expert. Analyze expiry patterns and provide practical recommendations."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.6,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    throw handleAIError(error, 'analyze expiry patterns');
  }
};

export const searchAIKnowledgeBase = async (query, inventoryItems, wasteLogs) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
You are an expert restaurant waste management consultant. Answer the following question based on the provided inventory and waste data:

Question: ${query}

Current Inventory:
${JSON.stringify(inventoryItems, null, 2)}

Recent Waste Logs:
${JSON.stringify(wasteLogs, null, 2)}

Provide a helpful, specific answer that takes into account the user's current situation. If the question is about general food waste management, provide expert advice. If it's specific to their data, reference their actual inventory and waste patterns.

Keep the response practical and actionable, limited to 250 words.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert restaurant waste management consultant. Provide practical, actionable advice based on the user's specific data and questions."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 350,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    throw handleAIError(error, 'search AI knowledge base');
  }
};
