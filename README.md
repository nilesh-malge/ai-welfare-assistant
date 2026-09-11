# AI Welfare Assistant

This is my implementation of the AI Welfare Assistant technical assessment.

The application gives students a simple chat interface where they can explain what they need help with. Each message is triaged on the server and the application decides whether it can answer using the supplied knowledge base, needs to ask a follow-up question, or should pass the conversation to a member of staff.

The main thing I focused on was keeping the AI useful without making it responsible for the final safety decision.

## Running locally

Install the dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="your-postgresql-connection-string"
GEMINI_API_KEY="your-gemini-api-key"
```

Generate the Prisma contract:

```bash
npm run contract:emit
```

Initialise the database:

```bash
npx prisma db init
```

Start the development server:

```bash
npm run dev
```

The student chat is at:

```text
http://localhost:3000
```

The staff view is at:

```text
http://localhost:3000/staff
```

For a production build:

```bash
npm run build
npm run start
```

I am using the webpack build explicitly. During development I found the Turbopack build worker was unstable on my Windows environment, while the webpack production build completed reliably.

## Tech used

- Next.js / React / TypeScript
- PostgreSQL
- Prisma Next
- Google Gemini
- Zod
- Tailwind CSS

## How I approached the AI part

Every incoming student message goes through server-side triage.

Gemini returns a structured result containing the category, urgency, safeguarding flag, disposition and a short reason. I validate that result with Zod before using it.

I did not want the model to be the only thing deciding whether a case is safe to answer. After the AI result comes back, application-level rules are applied for things such as immediate danger, crisis language, worsening mental health, immigration/legal questions, vague messages, spam and prompt injection.

This means the model helps interpret the student's message, but the important safety rules still live in code.

If the model times out, fails, or returns something that does not match the expected structure, the application falls back to a safe result rather than trying to continue with unreliable output.

For immediate danger, the normal clarification flow is skipped. The student is shown the 999 and Samaritans information immediately and the case is sent to staff.

## Knowledge base answers

For questions that can be answered directly, I match the student's message against the supplied knowledge base and give the selected resource to the response generation step.

The model is told to answer from that resource rather than from its general knowledge. If I cannot find enough approved information for the question, I would rather escalate the case than let the model make up an answer.

I considered using embeddings/vector search here, but for this assessment the knowledge base is small and known in advance. A simple deterministic lookup is easier to inspect and debug, and adding a vector database would add complexity without giving much benefit at this size.

## Clarification

When there is not enough information, the assistant asks one or two focused questions instead of guessing what the student means.

The reply then comes back through the same triage flow again. This was important because something that initially looks vague can become a safeguarding or escalation case once the student gives more context.

## Staff cases

Escalated conversations appear in `/staff`.

The staff view shows the priority, safeguarding state, conversation history and current status. Cases can be moved between new, in progress and resolved.

If a resolved conversation later receives another message that needs escalation, I reopen the case rather than leaving the new concern hidden inside a resolved case.

## Preventing two staff members claiming the same case

I handle claiming at the database level rather than relying on a check in the UI.

`CaseClaim` has a unique constraint on `supportCaseId`. When someone claims a case, a claim row is inserted. If two staff members try at almost the same time, PostgreSQL only allows one of those inserts to succeed. The other request gets an already-taken response.

Without the unique constraint, both requests could read the case while it still looked unclaimed and both could think they had successfully taken it. I preferred letting the database enforce this because it is the one place all claim requests have to go through.

## Probes

Run the automated probes with:

```bash
npm run probe
```

The probes call the running application on `http://localhost:3000`.

I included the two required safety probes for the crisis message and prompt-injection message, plus the other supplied test messages so I could check the behaviour together rather than testing them manually each time.

The probes use the real model integration. They also go through the validation, safety-rule and fallback paths used by the application.

To run them against a deployed version:

```powershell
$env:PROBE_BASE_URL="https://your-deployment-url"
npm run probe
```

The command exits with a non-zero status if a probe fails.

## What I would change for 50 organisations / 10k conversations per day

The first change would be making organisation ownership explicit in the database. Conversations, cases, staff and knowledge resources would all need an organisation ID, and every query would need to be scoped by it. I would also add indexes around the fields used most often in the staff queue, especially organisation, status, urgency and creation time.

I would not keep every piece of work inside the request/response path either. Things such as notifications, analytics and other non-immediate work could move to background jobs.

On the AI side I would add better monitoring around latency, failures, fallback frequency and model usage. If the knowledge base became much larger across 50 organisations, that is also the point where I would reconsider the simple lookup used here and probably introduce a proper retrieval layer.

## Privacy and safety changes for production

The current project is an assessment implementation, so there are several things I would add before treating it as a real student welfare system.

The staff area would need authentication and role-based access rather than being publicly reachable. I would also add organisation-level access checks, audit logs for staff actions, rate limiting and a clear retention/deletion policy for student conversations.

I would keep API keys and database credentials server-side, minimise the personal data being collected, and review what conversation data is sent to the AI provider. I would also keep automated safety tests around the important rules so that changing a model or prompt does not accidentally change crisis behaviour.

## How does it decide whether to answer or escalate?

If the student's question can be answered safely from the approved university information, the assistant can respond directly. If there is a safety concern, an immigration/legal issue, not enough information, or the available knowledge is not enough to give a reliable answer, it asks for clarification or passes the conversation to a human instead of guessing.
