const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEEPSEEK_API_KEY",
  "DASHSCOPE_API_KEY",
  "YOUTUBE_API_KEY",
] as const;

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing required automation environment variables: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Automation environment is ready (${required.length} required variables present).`);
}
