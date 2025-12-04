export default {
  async fetch(req, env) {
    if (req.method === "GET") {
      return new Response(`
        <html>
          <body>
            <h2>Email Generator</h2>
            <form method="POST" enctype="multipart/form-data">
              <label>Name:</label><br/>
              <input name="name" /><br/><br/>

              <label>Position:</label><br/>
              <input name="position" /><br/><br/>

              <label>Job Listing URL:</label><br/>
              <input name="contextUrl" /><br/><br/>

              <label>Resume (.txt only):</label><br/>
              <input type="file" name="resume" accept=".txt" /><br/><br/>

              <button type="submit">Generate Email</button>
            </form>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }


    if (req.method === "POST") {
      const form = await req.formData();

      const name = form.get("name");
      const position = form.get("position");
      const contextUrl = form.get("contextUrl");
      const resumeFile = form.get("resume");

      const resumeText = new TextDecoder().decode(await resumeFile.arrayBuffer());
      const contextText = await (await fetch(contextUrl)).text();

      const aiResponse = await env.AI.run("@cf/meta/llama-3.2-1b-instruct", {
        messages: [
          {
            role: "user",
            content: `
              Write a concise email introducing myself.

              Name: ${name}
              Position: ${position}

              Job listing:
              ${contextText}

              Resume:
              ${resumeText}

              Instructions:
              - Keep the message brief (two paragraphs max)
              - Use job listing keywords
              - Tie my experience from the resume to the job
              - No placeholders or brackets
              - Write as if I am actually sending this email
            `
          }
        ]
      });

      return new Response(`
        <html>
          <body>
            <h2>Generated Email</h2>
            <pre>${aiResponse.response}</pre>
            <h3>Usage</h3>
            <pre>${JSON.stringify(aiResponse.usage, null, 2)}</pre>
            <a href="/">Back</a>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};
