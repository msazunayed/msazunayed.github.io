// Builds latest.json (GitHub repos + YouTube videos) for the portfolio AI agent.
// Run by .github/workflows/update-latest.yml; needs secret YT_API_KEY.
import { writeFileSync } from "node:fs";
const GH_USER = "msazunayed", YT_HANDLE = "@zunkode", KEY = process.env.YT_API_KEY;
const j = async (u, h = {}) => { const r = await fetch(u, { headers: h }); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); };
const out = { updated: new Date().toISOString(), github: [], youtube: [] };
try {
  const repos = await j(`https://api.github.com/users/${GH_USER}/repos?sort=pushed&per_page=30`, process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {});
  out.github = repos.filter(r => !r.fork).map(r => ({ title: r.name, url: r.html_url, desc: r.description || "", date: r.pushed_at, repo: { name: r.name, description: r.description, language: r.language, topics: r.topics } }));
} catch (e) { console.error("github:", e.message); }
try {
  const ch = await j(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(YT_HANDLE)}&key=${KEY}`);
  const up = ch.items[0].contentDetails.relatedPlaylists.uploads;
  const pl = await j(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${up}&key=${KEY}`);
  out.youtube = pl.items.map(i => { const t = (i.snippet.description || "").replace(/\s+/g, " ").trim(); return { title: i.snippet.title, url: "https://www.youtube.com/watch?v=" + i.snippet.resourceId.videoId, desc: t.slice(0, 200), full: t, date: i.snippet.publishedAt }; });
} catch (e) { console.error("youtube:", e.message); }
if (!out.github.length && !out.youtube.length) process.exit(1); // keep old file on total failure
writeFileSync("latest.json", JSON.stringify(out, null, 1));
