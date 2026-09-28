/* eslint-disable @typescript-eslint/no-require-imports -- CloudBase event functions use CommonJS handlers. */
"use strict";

const https = require("node:https");

const SELECT = "id,title,source_id,kind,status,published_at,canonical_url,summary_zh,unavailable_reason_zh,tags,people,companies,terms,sources(name),platform_versions(platform,url,duration_seconds,published_at,match_status),transcript_sources(source_kind,label,platform,url,has_timestamps,verified,selected),claims(id,claim_code,position,title_zh,information_type,assessment_zh,evidence(id,evidence_code,relation,locator,speaker,source_kind,quote,evidence_translations(translation_zh))),analyses(why_zh,horizontal_zh,cross_disciplinary_zh,application_zh,personal_zh,memory_zh),visuals(timeline,tree,comparison),knowledge_item_localizations(locale,content)";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, s-maxage=300",
};

function response(statusCode, body) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

function getLibraryUrl(supabaseUrl) {
  const url = new URL("/rest/v1/knowledge_items", supabaseUrl);
  url.searchParams.set("select", SELECT);
  url.searchParams.set("order", "published_at.desc");
  return url;
}

function requestJson(url, publicReadKey) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "GET",
      headers: {
        apikey: publicReadKey,
        authorization: `Bearer ${publicReadKey}`,
        accept: "application/json",
      },
    }, (result) => {
      const chunks = [];
      result.on("data", (chunk) => chunks.push(chunk));
      result.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if ((result.statusCode ?? 500) >= 400) {
          reject(new Error(`Supabase returned HTTP ${result.statusCode}.`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Supabase returned invalid JSON."));
        }
      });
    });
    request.setTimeout(8_000, () => request.destroy(new Error("Supabase request timed out.")));
    request.on("error", reject);
    request.end();
  });
}

exports.main = async (event = {}) => {
  if (event.httpMethod === "OPTIONS") return response(204, null);
  if (event.httpMethod && event.httpMethod !== "GET") {
    return response(405, { error: "Method not allowed." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const publicReadKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publicReadKey) {
    console.error("The library API is missing its server-side configuration.");
    return response(500, { error: "The library API is not configured." });
  }

  try {
    const items = await requestJson(getLibraryUrl(supabaseUrl), publicReadKey);
    return response(200, items);
  } catch (error) {
    console.error("Unable to load the public library.", error instanceof Error ? error.message : error);
    return response(502, { error: "The library is temporarily unavailable." });
  }
};
