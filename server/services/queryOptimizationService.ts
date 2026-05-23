import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QueryMetrics {
  executionTime: number;
  planningTime: number;
  rowsReturned: number;
  actualLoops: number;
  sharedHitBlocks: number;
  sharedReadBlocks: number;
  startupCost: number;
  totalCost: number;
}

export interface OptimizationResult {
  suggestedQuery: string;
  explanation: string;
}

export async function optimizeQuery(
  query: string,
  metrics: QueryMetrics,
  formattedSchema: string,
): Promise<OptimizationResult> {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `You are a PostgreSQL expert helping a developer optimize slow queries. Analyze their query and suggest an improved version.

            Database Schema: 
            ${formattedSchema}
            
            The developer ran this query:
            ${query}

            Performance Metrics: 
            - Execution Time: ${metrics.executionTime}ms
            - Planning Time: ${metrics.planningTime}ms
            - Startup Cost: ${metrics.startupCost}
            - Total Cost: ${metrics.totalCost}ms
            - Rows Returned: ${metrics.rowsReturned}
            - Actual Loops: ${metrics.actualLoops}
            - Shared Read Blocks: ${metrics.sharedReadBlocks}
            - Shared Hit Blocks: ${metrics.sharedHitBlocks}

            Suggest a specific improved query. Focus on:
            - Selecting only needed columns instead of SELECT *
            - Adding LIMIT if appropriate
            - Index-friendly WHERE clauses

            Return ONLY a JSON object, NO markdown, NO backticks, NO extra text before or after, NO explanation outside the JSON:
            {
              "suggestedQuery": "improved SQL query",
              "explanation": "why each changes was made"
            }
              `,
        },
      ],
    });
    const raw = response.choices[0].message.content ?? '';

    // Safety net in case AI returns markdown anyway
    const cleaned = raw.replace(/```json|```/g, '').trim();

    const parsed: OptimizationResult = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error('OpenAI optimization failed', error);
    throw error;
  }
}
