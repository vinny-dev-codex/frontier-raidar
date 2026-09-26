import { DEMO_ITEMS } from "./demo-data";

export function searchDemoItems(query: string, status = "all") {
  const normalized = query.trim().toLowerCase();
  return DEMO_ITEMS.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (!normalized) return true;
    const searchable = [
      item.title,
      item.sourceName,
      item.summaryZh ?? "",
      item.tags.join(" "),
      item.people.join(" "),
      item.companies.join(" "),
      item.terms.map((term) => `${term.zh} ${term.en}`).join(" "),
      item.claims?.map((claim) => claim.titleZh).join(" ") ?? "",
      item.claims
        ?.flatMap((claim) => claim.evidence.map((evidence) => evidence.quote))
        .join(" ") ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(normalized);
  });
}
