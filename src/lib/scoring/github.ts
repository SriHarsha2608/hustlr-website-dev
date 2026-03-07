/**
 * GitHub API helper — fetches repo & contributor data for scoring.
 *
 * Uses GITHUB_TOKEN for authenticated requests (5000 req/hr).
 * All responses are returned raw for scorers/Gemini to consume.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE = "https://api.github.com";

async function ghFetch(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${path} — ${text}`);
  }
  return res.json();
}

/** Parse "owner/repo" from various GitHub URL formats */
export function parseRepoSlug(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("github.com")) return null;
    // Remove .git suffix, trailing slashes, tree/branch paths
    const parts = u.pathname.replace(/\.git$/, "").replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return null;
  } catch {
    return null;
  }
}

/** Parse GitHub username from profile URL */
export function parseGithubUsername(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || null;
  } catch {
    return null;
  }
}

export interface RepoData {
  slug: string;
  stars: number;
  forks: number;
  language: string | null;
  languages: Record<string, number>;
  size: number;
  created_at: string;
  updated_at: string;
  readme: string | null;
  contributors: { login: string; contributions: number }[];
}

/** Fetch repo metadata, languages, README, and contributors */
export async function fetchRepoData(repoUrl: string): Promise<RepoData | null> {
  const slug = parseRepoSlug(repoUrl);
  if (!slug) return null;

  try {
    const repo = await ghFetch(`/repos/${slug}`);
    if (!repo) return null;

    // Parallel fetches for supplementary data
    const [languagesData, readmeData, contributorsData] = await Promise.allSettled([
      ghFetch(`/repos/${slug}/languages`),
      ghFetch(`/repos/${slug}/readme`),
      ghFetch(`/repos/${slug}/contributors?per_page=30`),
    ]);

    const languages = languagesData.status === "fulfilled" && languagesData.value
      ? languagesData.value
      : {};

    let readme: string | null = null;
    if (readmeData.status === "fulfilled" && readmeData.value?.content) {
      try {
        readme = Buffer.from(readmeData.value.content, "base64").toString("utf-8");
        // Truncate long READMEs for Gemini context
        if (readme.length > 4000) readme = readme.slice(0, 4000) + "\n... [truncated]";
      } catch {
        readme = null;
      }
    }

    const contributors = contributorsData.status === "fulfilled" && Array.isArray(contributorsData.value)
      ? contributorsData.value.map((c: any) => ({
          login: c.login as string,
          contributions: c.contributions as number,
        }))
      : [];

    return {
      slug,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      language: repo.language ?? null,
      languages,
      size: repo.size ?? 0,
      created_at: repo.created_at ?? "",
      updated_at: repo.updated_at ?? "",
      readme,
      contributors,
    };
  } catch (err) {
    console.error(`[GitHub] Error fetching ${slug}:`, err);
    return null;
  }
}

export interface ProfileData {
  username: string;
  followers: number;
  public_repos: number;
  created_at: string;
  bio: string | null;
}

/** Fetch GitHub profile data */
export async function fetchProfileData(profileUrl: string): Promise<ProfileData | null> {
  const username = parseGithubUsername(profileUrl);
  if (!username) return null;

  try {
    const user = await ghFetch(`/users/${username}`);
    if (!user) return null;

    return {
      username: user.login,
      followers: user.followers ?? 0,
      public_repos: user.public_repos ?? 0,
      created_at: user.created_at ?? "",
      bio: user.bio ?? null,
    };
  } catch (err) {
    console.error(`[GitHub] Error fetching profile ${username}:`, err);
    return null;
  }
}

/**
 * Calculate a contributor's commit percentage for a repo.
 * Returns 0-100 percentage or null if not found.
 */
export function getCommitPercentage(
  contributors: { login: string; contributions: number }[],
  username: string
): number | null {
  if (!contributors.length || !username) return null;
  const total = contributors.reduce((sum, c) => sum + c.contributions, 0);
  if (total === 0) return null;
  const userEntry = contributors.find(
    (c) => c.login.toLowerCase() === username.toLowerCase()
  );
  if (!userEntry) return 0;
  return Math.round((userEntry.contributions / total) * 100);
}
