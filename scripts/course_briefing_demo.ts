const response = await fetch("http://localhost:3000/course/search", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ learnerId: "learner-204", query: "What should I remember when editing the interview rough cut?", dueAt: "2026-08-21T17:00:00.000Z", now: "2026-08-20T12:00:00.000Z" })
});
const result: unknown = await response.json();
console.log(JSON.stringify(result, null, 2));
export {};
