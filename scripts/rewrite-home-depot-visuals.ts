import { createServiceSupabaseClient } from "../src/lib/supabase";

const itemId = "36076be8-00c6-4327-8444-593e06292d57";

const timeline = [
  { locator: "1978", label: "Bernie 与 Arthur 被 Handy Dan 解雇；创立家得宝", claimId: "C03" },
  { locator: "1979", label: "首两家家得宝门店在亚特兰大开业", claimId: "C02" },
  { locator: "1981", label: "家得宝以 3,200 万美元市值上市", claimId: "C01" },
  { locator: "1989", label: "家得宝超越 Lowe's，成为最大的家居改善零售商", claimId: "C02" },
  { locator: "2000", label: "Bob Nardelli 出任首席执行官", claimId: "C06" },
  { locator: "2007", label: "Frank Blake 出任首席执行官；Bob Nardelli 离任", claimId: "C07" },
  { locator: "2009", label: "建设快速配送中心，推动电商业务", claimId: "C08" },
  { locator: "2020", label: "新冠疫情带动营收升至 1,600 亿美元", claimId: "C08" },
];

const tree = {
  label: "家得宝成功因素",
  children: [
    { label: "创始团队", children: [{ label: "Bernie Marcus" }, { label: "Arthur Blank" }, { label: "Ken Langone" }, { label: "Pat Farrah" }] },
    { label: "商业模式", children: [{ label: "仓储门店形式" }, { label: "低毛利" }, { label: "高商品种类" }, { label: "供应商融资" }] },
    { label: "客户服务", children: [{ label: "技工担任店员" }, { label: "把教学与产品绑定" }] },
    { label: "增长策略", children: [{ label: "城市密集布局" }, { label: "电商物流" }, { label: "拓展专业客户市场" }] },
  ],
};

const comparison = [
  {
    question: "家得宝的商业模式与 Costco 有何不同？",
    viewA: "Home Depot：专业零售商；商品种类更多（门店约 35,000、线上约 100 万）；毛利率约 33%；提供安装与教学服务。",
    viewB: "Costco：综合商品零售商；商品种类较少（约 4,000）；毛利率很低；服务有限，依赖会员费。",
    evidenceIds: ["E04", "E05", "E06", "E07"],
  },
  {
    question: "Bob Nardelli 与 Frank Blake 的管理方式有何不同？",
    viewA: "Bob Nardelli：集中运营、引入六西格玛、减少门店员工、偏好大学学历的经理，并扩张到相邻业务。",
    viewB: "Frank Blake：把决策还给一线、修复文化、停止开新店、投资电商与供应链，并让薪酬与股价表现挂钩。",
    evidenceIds: ["E17", "E18", "E19", "E20", "E21", "E22", "E23", "E24"],
  },
];

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");
  const { error } = await database.from("visuals").update({ timeline, tree, comparison }).eq("item_id", itemId);
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, itemId, timelineEvents: timeline.length, comparisonRows: comparison.length }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
