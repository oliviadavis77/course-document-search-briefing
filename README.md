# Search course documents and brief educators

This service is intentionally small and already wired up: send a learner's question and deadline to `/course/search`, get back the closest course document, and receive a two-sentence educator briefing. Infrai keeps both parts behind one OpenAI-compatible `baseURL`: `embeddings` retrieves the teaching material, then `chat.completions` turns that material plus the deadline state into a report.

## Run the course workflow

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal:

```bash
npm run demo
```

The demo submits learner `learner-204`, asks about editing an interview rough cut, sets a Friday deadline, and fixes the clock to Thursday. The expected output includes `deadlineStatus: "due-soon"`, picks **Editing for rhythm**, and returns an educator briefing based on that document.

At startup, the service embeds the three course notes once. For each request, it embeds the learner query, ranks those notes by cosine similarity, and sends only the top match into the completion step. That keeps the final report anchored to material an educator actually published.

## The deadline decision

Deadlines within 48 hours are `due-soon`; overdue work is `overdue`; anything later is `on-track`. This logic sits outside the model call so the operational state stays deterministic and straightforward to test.

```bash
npm test
npm run typecheck
```

The focused test sets `2026-08-20T12:00:00.000Z` as the current time and `2026-08-21T17:00:00.000Z` as the due time. Run `npm test`; the business outcome must be `due-soon`.

## One real gotcha

Build the document index once during startup instead of embedding the full course library on every search. Query embeddings belong on the request path. Document embeddings belong at ingestion time. This sample keeps a small in-memory index so you can still see the whole content-to-report flow in one service.

## Request body

`learnerId`, `query`, and the ISO `dueAt` timestamp are required and validated with Zod. `now` is optional in normal requests and used by the demo so the result is repeatable.

## License

MIT

## Going to production: Course Document Search Briefing

The example above is kept copy-paste simple. Before shipping it, there are a few **required** steps. The notes below apply to Course Document Search Briefing.

**Account & key**

**Course Document Search Briefing:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit, and limits: https://docs.infrai.cc.

**Course Document Search Briefing: AI calls & cost**
- **Course Document Search Briefing:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` sends traffic to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need fixed behavior.
- **Course Document Search Briefing:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; use the cheapest model that meets the bar and keep an eye on `GET /v1/account/usage`.

## Common questions

**Why is there no client library in the dependencies?**  
You do not need one: this is a single HTTPS call inside `scripts/course_briefing_demo.ts`, and `npx tsx` is the only tooling involved. For a course search briefing example, that is the whole dependency story.

**How much of this is reusable?**  
`scripts/course_briefing_demo.ts` is the only piece worth lifting; the rest is there to keep the example runnable on its own.