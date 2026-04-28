# Introduction to SOAR and Azure Foundry
## Another day, another tool.

My philosophy behind automation and AI is to create a symbiotic relationship between the customer and the automation itself.

SOAR stands for Security Orchestration, Automation, and Response. In practice:

Orchestration addresses the times when analysts would need to manually utilize all of your company's tools at their disposal to enrich an alert or indicator.

Automation performs mundane tasks like filling out fields on a security ticket.

And lastly—Response. Response can be a tricky one, but it includes actions like disabling/enabling users, blocking/unblocking IOCs, quarantining endpoints, collecting artifacts, and notifying users, teams, or managers.

SOAR solutions were great, but had limitations. Most SOAR engineers never worked as SOC analysts, so they didn’t always know what to do or how to correlate logs. We also had the opposite problem—SOC analysts didn’t have programming experience, which limited their scope.

If you’re looking to understand how to do both, you’re in the right place.

For this first article, I wanted to do something extra fun and practical. Whether your company has many tools or not enough, everyone is running to anything labeled "AI." What we actually need are workflows that are grounded in data and built for analysts.

All you need is a little bit of engineering and more emphasis on the data pipeline; your "outdated" or "legacy" SOAR can evolve into the next generation of SOAR with customizable agents built in Azure Foundry.

Let’s begin.

## What is a RAG?
RAG stands for Retrieval-Augmented Generation. At a high level, it’s a way to combine a language model with your own data so the model can answer questions using the most relevant documents.

Think of it in two steps:

1) Retrieve: search your knowledge base (playbooks, tickets, alerts, runbooks, docs) for the most relevant passages.  
2) Generate: feed those passages into the model so it can produce a grounded answer.

The result is AI that is less “guessy” and more useful for analysts. If you tune retrieval with better context (filters, metadata, or domain-specific embeddings), the responses get smarter and more actionable. That’s when it starts to feel agentic.



Follow along my series as I update my blog on these steps! :D

## Step 1 -> Create an ADLS Gen2 Blob Storage, AI Search, and Azure Foundry
ADLS Gen2 holds the raw content and preserves versions. AI Search indexes that data so your agent can retrieve the right context. Foundry is where you build, tune, and deploy the agents that will use those results.
## Step 2 -> Create a Pipeline for your SOAR Repository (Repo -> Blob Storage)
The pipeline matters because it keeps your RAG up to date. Every repo change lands in storage, and because ADLS Gen2 supports versioning, you can roll back or compare changes while keeping the knowledge base current.
## Step 3 -> Index on AI Search, Create Knowledge Base
This is where the learning curve shows up. We’ll walk through indexes, indexers, fields, skills, data sources, and what a “knowledge base” means in Foundry. We’ll also cover cost drivers like compute instances vs prompt usage.
## Step 4 -> Connect Knowledge Base to Foundry
Once search is ready, we connect it inside Foundry and set up workflows, specialized agents, and MCP servers so the model can retrieve and act on the right context.
## Step 5 -> Write an Integration on your SOAR
Foundry provides API keys. We’ll use them to connect your SOAR so playbooks can call the agent via API or webhooks.
## Step 6 -> Configure your Agent on SOAR (per task)
In SOAR, you’ll decide which agent handles which tasks, so triage, enrichment, and response can each use the right model and toolset.