// Drives Google Stitch via @google/stitch-sdk to generate OddsAway screens.
// Auth: reads STITCH_API_KEY from env. Usage:
//   STITCH_API_KEY=... node generate.mjs            # generate all screens
//   STITCH_API_KEY=... node generate.mjs landing    # generate one screen by id
//   STITCH_API_KEY=... node generate.mjs --max=1     # limit count
import { writeFile, mkdir } from "node:fs/promises";
import { stitch, StitchToolClient } from "@google/stitch-sdk";
import { STYLE_SHORT, SCREENS } from "./screens.mjs";

const OUT = new URL("./output/", import.meta.url);

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

function pickScreens() {
  const args = process.argv.slice(2);
  const maxArg = args.find((a) => a.startsWith("--max="));
  const ids = args.filter((a) => !a.startsWith("--"));
  let screens = ids.length ? SCREENS.filter((s) => ids.includes(s.id)) : SCREENS;
  if (maxArg) screens = screens.slice(0, Number(maxArg.split("=")[1]));
  return screens;
}

async function main() {
  if (!process.env.STITCH_API_KEY && !process.env.STITCH_ACCESS_TOKEN) {
    throw new Error("Set STITCH_API_KEY (or STITCH_ACCESS_TOKEN).");
  }
  await mkdir(OUT, { recursive: true });

  // Reuse a project via STITCH_PROJECT_ID, else create a new one.
  let projectId = process.env.STITCH_PROJECT_ID || null;
  if (!projectId) {
    const client = new StitchToolClient({ apiKey: process.env.STITCH_API_KEY });
    const created = await client.callTool("create_project", {
      title: "OddsAway — Modern UI",
      projectType: "TEXT_TO_UI_PRO",
      deviceType: "DESKTOP",
    });
    console.log("create_project →", JSON.stringify(created));
    await client.close();
    const name = created?.name || created?.project?.name || "";
    projectId = name.includes("/") ? name.split("/").pop() : name;
  }
  if (!projectId) {
    console.log("Could not determine project id. Stopping.");
    return;
  }
  console.log("projectId =", projectId);

  const project = stitch.project(projectId);
  const screens = pickScreens();
  const manifest = [];

  for (const s of screens) {
    const prompt = `${s.spec}\n\n${STYLE_SHORT}`;
    process.stdout.write(`Generating ${s.id} … `);
    try {
      const screen = await project.generate(prompt, s.device);
      const htmlUrl = await screen.getHtml();
      const imgUrl = await screen.getImage();
      const htmlBytes = await download(htmlUrl, new URL(`./${s.id}.html`, OUT));
      const pngBytes = await download(imgUrl, new URL(`./${s.id}.png`, OUT));
      console.log(`ok (html ${htmlBytes}b, png ${pngBytes}b)`);
      manifest.push({ id: s.id, htmlUrl, imgUrl });
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      manifest.push({ id: s.id, error: e.message });
    }
  }

  await writeFile(new URL("./manifest.json", OUT), JSON.stringify(manifest, null, 2));
  console.log("Done. Output in design/stitch/output/");
}

main().catch((e) => {
  console.error("FATAL:", e?.message || e);
  process.exit(1);
});
