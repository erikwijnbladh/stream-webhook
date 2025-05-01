import { handler } from "./check-streams";

export const config = {
  runtime: "edge",
  regions: ["iad1"], // US East (N. Virginia)
};

export default async function cron(req, res) {
  // Verify the request is from Vercel Cron
  if (req.headers["x-vercel-cron"] !== "true") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return handler(req, res);
}
