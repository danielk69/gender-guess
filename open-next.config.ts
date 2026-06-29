import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  buildCommand: "next build",
  ...defineCloudflareConfig(),
};
