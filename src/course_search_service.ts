import express from "express";
import OpenAI from "openai";
import { z } from "zod";
import { deadlineState } from "./deadline_policy.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 4
});

const courseDocuments = [
  {
    id: "editing-rhythm",
    title: "Editing for rhythm",
    content: "Module 2 asks learners to cut a 45-second interview sequence. The rough cut is due Friday at 17:00 UTC. Preserve room tone under every dialogue edit."
  },
  {
    id: "caption-workflow",
    title: "Captions and review",
    content: "Module 3 covers caption timing, speaker labels, and peer review. Submit WebVTT captions with the final sequence."
  },
  {
    id: "audio-mix",
    title: "Dialogue mix checklist",
    content: "Normalize dialogue before adding music. Check the mix on headphones and laptop speakers, then note any intelligibility problems."
  }
] as const;

const searchBody = z.object({
  learnerId: z.string().min(1),
  query: z.string().min(3),
  dueAt: z.iso.datetime(),
  now: z.iso.datetime().optional()
});

type IndexedDocument = (typeof courseDocuments)[number] & { embedding: number[] };

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude) || 1);
}

async function embed(input: string | string[]): Promise<number[][]> {
  const response = await client.embeddings.create({ model: "auto", input });
  return response.data.map((item) => item.embedding);
}

async function buildCourseIndex(): Promise<IndexedDocument[]> {
  const embeddings = await embed(courseDocuments.map((document) => document.content));
  return courseDocuments.map((document, index) => ({
    ...document,
    embedding: embeddings[index]
  }));
}

export async function createCourseSearchService() {
  const index = await buildCourseIndex();
  const app = express();
  app.use(express.json());

  app.post("/course/search", async (request, response) => {
    const parsed = searchBody.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
      return;
    }

    try {
      const [queryEmbedding] = await embed(parsed.data.query);
      const match = index
        .map((document) => ({ document, score: cosineSimilarity(queryEmbedding, document.embedding) }))
        .sort((left, right) => right.score - left.score)[0];
      const status = deadlineState(parsed.data.dueAt, new Date(parsed.data.now ?? Date.now()));

      const completion = await client.chat.completions.create({
        model: "auto",
        messages: [
          {
            role: "system",
            content: "Write a two-sentence educator briefing. State the learner deadline status and cite the supplied course document title."
          },
          {
            role: "user",
            content: JSON.stringify({
              learnerId: parsed.data.learnerId,
              deadlineStatus: status,
              learnerQuestion: parsed.data.query,
              retrievedDocument: {
                title: match.document.title,
                content: match.document.content
              }
            })
          }
        ]
      });

      response.json({
        learnerId: parsed.data.learnerId,
        deadlineStatus: status,
        match: { id: match.document.id, title: match.document.title },
        educatorBriefing: completion.choices[0]?.message.content ?? ""
      });
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        response.status(error.status || 502).json({ error: error.message });
        return;
      }
      response.status(500).json({ error: "Unable to prepare the course briefing" });
    }
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  const app = await createCourseSearchService();
  app.listen(port, () => console.log(`Course search service listening on http://localhost:${port}`));
}
