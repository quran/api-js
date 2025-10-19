import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const loadEnv = () => {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [key, ...rest] = line.split("=");
    if (!key) continue;
    if (process.env[key]) continue;
    const value = rest.join("=");
    process.env[key] = value;
  }
};

loadEnv();

const clientId = process.env.QF_CLIENT_ID;
const clientSecret = process.env.QF_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Missing QF_CLIENT_ID or QF_CLIENT_SECRET env vars.");
  process.exitCode = 1;
  process.exit();
}

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${url}: ${error.message}\nPayload: ${text}`,
    );
  }
  return { response, json: parsed, raw: text };
};

const requestToken = async () => {
  const tokenBody = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "content",
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`, "utf-8").toString(
    "base64",
  );

  const { response, json } = await fetchJson(
    "https://oauth2.quran.foundation/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenBody.toString(),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Token request failed with ${response.status} ${response.statusText}`,
    );
  }

  if (!json?.access_token) {
    throw new Error("Token response missing access_token");
  }

  return json.access_token;
};

const run = async () => {
  const accessToken = await requestToken();

  const baseHeaders = {
    "x-auth-token": accessToken,
    "x-client-id": clientId,
    "Content-Type": "application/json",
  };

  const endpoints = [
    {
      name: "Chapters list",
      url: "https://apis.quran.foundation/content/api/v4/chapters?language=en",
      evaluate: (json) => {
        const chapters = json?.chapters ?? [];
        if (Array.isArray(chapters) && chapters.length > 0) {
          const first = chapters[0];
          return {
            ok: true,
            detail: `received ${chapters.length} chapters (first: ${first?.name_simple ?? "unknown"})`,
          };
        }
        return {
          ok: false,
          detail: "no chapters array in response",
        };
      },
    },
    {
      name: "Single chapter",
      url: "https://apis.quran.foundation/content/api/v4/chapters/1?language=en",
      evaluate: (json) => {
        const chapter = json?.chapter;
        if (chapter?.id === 1) {
          return {
            ok: true,
            detail: `chapter 1 retrieved (${chapter.name_simple ?? "unknown"})`,
          };
        }
        return { ok: false, detail: "chapter payload missing or incorrect" };
      },
    },
    {
      name: "Chapter verses",
      url: "https://apis.quran.foundation/content/api/v4/verses/by_chapter/1?language=en&per_page=5",
      evaluate: (json) => {
        const verses = json?.verses ?? [];
        if (Array.isArray(verses) && verses.length > 0) {
          return {
            ok: true,
            detail: `retrieved ${verses.length} verses (sample key: ${verses[0]?.verse_key ?? "n/a"})`,
          };
        }
        return { ok: false, detail: "no verses returned" };
      },
    },
    {
      name: "Recitations",
      url: "https://apis.quran.foundation/content/api/v4/resources/recitations?language=en",
      evaluate: (json) => {
        const recitations = json?.recitations ?? [];
        if (Array.isArray(recitations) && recitations.length > 0) {
          return {
            ok: true,
            detail: `retrieved ${recitations.length} recitations (first: ${recitations[0]?.reciter_name ?? "unknown"})`,
          };
        }
        return { ok: false, detail: "no recitations returned" };
      },
    },
    {
      name: "Search",
      url: "https://apis.quran.foundation/content/api/v4/search?q=mercy&language=en&size=3",
      evaluate: (json) => {
        const search = json?.search;
        if (search?.results && search.results.length >= 0) {
          return {
            ok: true,
            detail: `search returned ${search.totalResults ?? 0} total results (page ${search.currentPage ?? "?"})`,
          };
        }
        return { ok: false, detail: "search payload missing" };
      },
    },
    {
      name: "Audio by chapter",
      url: "https://apis.quran.foundation/content/api/v4/recitations/1/by_chapter/1?language=en",
      evaluate: (json) => {
        const audioFiles = json?.audio_files ?? json?.audioFiles ?? [];
        if (Array.isArray(audioFiles) && audioFiles.length > 0) {
          return {
            ok: true,
            detail: `retrieved ${audioFiles.length} audio files (first id: ${audioFiles[0]?.id ?? "n/a"})`,
          };
        }
        return { ok: false, detail: "no audio files returned" };
      },
    },
  ];

  let failures = 0;

  for (const endpoint of endpoints) {
    try {
      const { response, json, raw } = await fetchJson(endpoint.url, {
        headers: baseHeaders,
      });

      if (!response.ok) {
        failures++;
        const bodySnippet = raw?.slice(0, 200) ?? "";
        console.error(
          `❌ ${endpoint.name}: ${response.status} ${response.statusText} - ${bodySnippet}`,
        );
        continue;
      }

      const result = endpoint.evaluate(json);
      if (result.ok) {
        console.log(`✅ ${endpoint.name}: ${result.detail}`);
      } else {
        failures++;
        console.error(`❌ ${endpoint.name}: ${result.detail}`);
      }
    } catch (error) {
      failures++;
      console.error(`❌ ${endpoint.name}: ${(error)?.message ?? error}`);
    }
  }

  if (failures > 0) {
    console.error(`Smoke test finished with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log("Smoke test finished successfully.");
  }
};

run().catch((error) => {
  console.error(`Smoke test crashed: ${(error)?.message ?? error}`);
  process.exitCode = 1;
});
