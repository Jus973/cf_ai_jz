# cf_ai_justin_zhang

#### AI Email Personalizer that takes in a LinkedIn URL or job description, and the app generates a summary of the profile/job and a personalized email targeted at that person/company.

### [Project Link](https://cf_ai_jz.justinzhang20711.workers.dev)

### Project Outline
- AI-powered application on Cloudflare
- Uses llama-3.2-1b-instruct


### Pipelines
- Fetches webpage using Cloudflare Workers
- Extracts text through boilerplate removal
- Sends content to Llama-3.2
- Generates necessary information
- Stores summary + drafts using Durable Objects as memory
- UI on Cloudflare Pages allows for user interaction