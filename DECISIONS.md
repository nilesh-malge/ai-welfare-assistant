# Decisions

## What I deliberately left out

I tried to keep this implementation around the core problem rather than adding features just to make the project look bigger.

I did not build authentication for the staff dashboard. For the assessment I assumed it is an internal staff view. In a real system this would be one of the first things I would add because the conversations contain student information and should not be publicly accessible.

I also did not use embeddings or a vector database for the knowledge base. There are only a small number of supplied resources, so I used keyword matches as the main signal and the triage category as a secondary signal. For this size of knowledge base I found that easier to understand and test.

I left out things like notifications, background jobs and a more complete staff management workflow as well. I preferred spending the time on triage, safeguarding behaviour, escalation and case claiming.

## Another approach I considered

The main alternative I considered was semantic search for the knowledge base.

Embeddings would be better at matching students who describe the same problem using very different wording. That would probably be the better direction if the amount of university content became much larger.

For this version it also means another service and another part of the system that can behave unexpectedly. With a small fixed knowledge base, I preferred a simple lookup where I can see why a resource matched. The downside is that keyword matching will eventually miss valid questions, so I would not expect this approach to scale indefinitely.

## What I expect to cause problems first

The part I would watch first in a real launch is the AI provider.

While building this I saw some Gemini requests take too long or time out. I added timeouts, validation and a safe fallback so a provider problem does not become a safety problem. The downside is that if the provider starts failing frequently, more conversations will be escalated and staff could end up with unnecessary cases.

I would monitor AI response time, timeout and error rates, invalid structured responses, fallback usage and escalation rates. A sudden change in any of these would be an early indication that something is wrong.

I would also watch how often the knowledge lookup fails to find a resource. Real student messages will be much less predictable than the test cases. If valid questions are regularly missing the right resource, that would be the point where I would move beyond the current keyword approach.
