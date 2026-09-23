import type { OperationScopes } from "@/generated/contracts";
import { operationCatalog } from "@/generated/contracts";
import { LEGACY_PREFIXES } from "@/lib/service-config";
import { ensureLeadingSlash, normalizePathTemplate } from "@/lib/url";
import type { ApiService } from "@/types";

/**
 * Resolve an operation's content scopes from a request path.
 *
 * Granular mode needs to know which scope a call requires. When a call goes through a generated
 * raw operation the descriptor is available directly, but the typed convenience facades
 * (`client.content.v4.chapters.list()` and friends) call `fetcher.fetch(url)` with a plain URL and
 * carry no descriptor. Without this lookup, granular mode throws on the documented public API.
 *
 * The lookup is deterministic and reads only the pinned operation catalog: a literal path always
 * wins over a templated one, and nothing is inferred from the shape of the scope string or the
 * service name. If a path is genuinely not in the contract the caller still gets `undefined` and
 * the explicit error, rather than a silent fall back to a broad scope.
 */

type CatalogEntry = {
  path: string;
  method: string;
  scopes: OperationScopes;
};

type CompiledEntry = CatalogEntry & {
  pattern: RegExp;
  segments: number;
};

const TEMPLATE_SEGMENT = /\{[^}]+\}/gu;

const compile = (path: string): RegExp => {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/gu, (match) =>
    match === "{" || match === "}" ? match : `\\${match}`,
  );
  // A path parameter matches exactly one non-empty segment, so `/chapters/{id}` cannot swallow
  // `/chapters/1/info`.
  return new RegExp(`^${escaped.replace(TEMPLATE_SEGMENT, "[^/]+")}$`, "u");
};

const buildIndex = () => {
  const literals = new Map<string, CatalogEntry>();
  const templated: CompiledEntry[] = [];

  // Only the content catalog carries content scope metadata. Non-content services keep their own
  // separately approved permissions and are deliberately absent.
  for (const operation of Object.values(operationCatalog.content.v4.operations)) {
    if (!operation.scopes) continue;

    const entry: CatalogEntry = {
      method: operation.method.toUpperCase(),
      path: operation.path,
      scopes: operation.scopes,
    };

    if (operation.path.includes("{")) {
      templated.push({
        ...entry,
        pattern: compile(operation.path),
        segments: operation.path.split("/").length,
      });
    } else {
      literals.set(`${entry.method} ${operation.path}`, entry);
    }
  }

  return { literals, templated };
};

let index: ReturnType<typeof buildIndex> | undefined;

const getIndex = () => {
  index ??= buildIndex();
  return index;
};

/**
 * Candidate catalog-relative paths for a request pathname.
 *
 * The catalog stores content operations relative to the service (`/chapters`) but the five public
 * QuranReflect reads with their full path (`/quran-reflect/v1/posts/feed`), because that is how the
 * content OpenAPI document declares them. Both forms are tried, so either shape resolves.
 *
 * @param {ApiService} service - service the request is going to.
 * @param {string} pathname - request pathname.
 * @returns {string[]} candidate paths, most specific first.
 */
const candidatePaths = (service: ApiService, pathname: string): string[] => {
  const normalized = ensureLeadingSlash(normalizePathTemplate(pathname));
  const candidates = [normalized];

  const prefixes: readonly string[] = LEGACY_PREFIXES[service];
  for (const prefix of prefixes) {
    if (normalized === prefix) {
      candidates.push("/");
    } else if (normalized.startsWith(`${prefix}/`)) {
      candidates.push(ensureLeadingSlash(normalized.slice(prefix.length)));
    }
  }

  return candidates;
};

/**
 * Content scopes for a request, or `undefined` when the path is not in the pinned contract.
 *
 * @param {ApiService} service - service the request is going to.
 * @param {string} method - HTTP method.
 * @param {string} pathname - request pathname, without query string.
 * @returns {OperationScopes | undefined} the operation's scopes, when known.
 */
export const lookupContentScopes = (
  service: ApiService,
  method: string,
  pathname: string,
): OperationScopes | undefined => {
  const { literals, templated } = getIndex();
  const upperMethod = method.toUpperCase();
  const candidates = candidatePaths(service, pathname);

  // Literal paths first: a concrete route always shadows a templated sibling, matching how the
  // gateway resolves exact keys before dynamic ones.
  for (const candidate of candidates) {
    const literal = literals.get(`${upperMethod} ${candidate}`);
    if (literal) return literal.scopes;
  }

  for (const candidate of candidates) {
    const matches = templated.filter(
      (entry) => entry.method === upperMethod && entry.pattern.test(candidate),
    );
    if (matches.length === 0) continue;

    // Prefer the most specific template, so a longer path never resolves via a shorter one.
    matches.sort((a, b) => b.segments - a.segments || a.path.length - b.path.length);
    return matches[0].scopes;
  }

  return undefined;
};
