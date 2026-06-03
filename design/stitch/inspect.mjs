import { StitchToolClient } from "@google/stitch-sdk";

const client = new StitchToolClient({ apiKey: process.env.STITCH_API_KEY });
const { tools } = await client.listTools();

const show = (name) => {
  const t = tools.find((x) => x.name === name);
  if (!t) return console.log(name, "NOT FOUND");
  console.log("=== " + name + " ===");
  console.log(JSON.stringify(t.inputSchema, null, 2));
  console.log("");
};

show("generate_screen_from_text");
show("create_design_system_from_design_md");
show("upload_design_md");
show("get_screen");
await client.close();
