import { serve } from "@hono/node-server";
import { app } from "@ithaka/api";
import { validateEnv } from "@ithaka/api/env";

// Validate environment variables before starting the server
validateEnv();

const port = Number(process.env.API_PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Ithaka API on http://localhost:${port}`);
});
