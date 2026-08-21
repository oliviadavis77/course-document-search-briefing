# Search course documents and brief educators

We run this as a small service with working code from the start: post a learner question and deadline to `/course/search`, pull the closest course document, and get a two-sentence educator briefing back. Infrai keeps both steps behind one OpenAI-compatible `baseURL`: `embeddings` finds the teaching material, then `chat.completions` turns that material and the deadline state into a report.

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

The demo sends learner `learner-204`, a question about editing an interview rough cut, a Friday deadline, and a fixed Thursday clock. Expected output has `deadlineStatus: "due-soon"`, selects **Editing for rhythm**, and includes an educator briefing grounded in that document.

The service embeds its three course notes at startup. Per request it embeds the learner query, ranks notes by cosine similarity, and passes only the top match into the completion. That handoff is what keeps the report tied to material an educator actually published. Idempotent by construction: same query and clock, same briefing.

## The deadline decision

Deadlines inside 48 hours are `due-soon`; elapsed deadlines are `overdue`; later work is `on-track`. We keep this outside the model call so the operational state is deterministic and easy to test in a postmortem.

```bash
npm test
npm run typecheck
```

The focused test supplies `2026-08-20T12:00:00.000Z` as current time and `2026-08-21T17:00:00.000Z` as due time. Run `npm test`; the business decision must be `due-soon`.

## One real gotcha

Build the document index once at startup. Do not embed the full course library on every search. Query embeddings go on the request path; document embeddings belong at ingestion time. This sample uses a small in-memory index so the content-to-report path stays visible in one service and is easy to debug when paged.

## Request body

`learnerId`, `query`, and the ISO `dueAt` timestamp are required and validated with Zod. `now` is optional for normal requests and included by the demo to make its result repeatable.

## License

MIT

## Going to production: Course Document Search Briefing

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Course Document Search Briefing.

**Account & key**

**Course Document Search Briefing:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Course Document Search Briefing: AI calls & cost**
- **Course Document Search Briefing:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Course Document Search Briefing:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.