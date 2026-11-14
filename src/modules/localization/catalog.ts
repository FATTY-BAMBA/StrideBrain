import type { Locale } from "./config";

export const messageKeys = [
  "app.name",
  "app.byline",
  "app.demoStatus",
  "nav.home",
  "nav.projects",
  "nav.knowledge",
  "nav.stridebrain",
  "nav.settings",
  "nav.overview",
  "nav.compare",
  "nav.commercial",
  "nav.evidence",
  "nav.actions",
  "language.zhTw",
  "language.en",
  "home.eyebrow",
  "home.title",
  "home.description",
  "home.foundationTitle",
  "home.foundationDescription",
  "home.nextTitle",
  "home.nextDescription",
  "projects.eyebrow",
  "projects.title",
  "projects.description",
  "knowledge.eyebrow",
  "knowledge.title",
  "knowledge.description",
  "stridebrain.eyebrow",
  "stridebrain.title",
  "stridebrain.description",
  "settings.eyebrow",
  "settings.title",
  "settings.description",
  "project.eyebrow",
  "project.unavailableTitle",
  "project.unavailableDescription",
  "project.requestedKey",
  "project.foundationTitle",
  "project.foundationDescription",
  "state.notConnected",
  "state.stageZero",
  "action.viewArchitecture",
  "footer.dataBoundary",
  "footer.releaseBoundary",
] as const;

export type MessageKey = (typeof messageKeys)[number];
export type Catalog = Record<MessageKey, string>;

const zhTw: Catalog = {
  "app.name": "StrideBrain",
  "app.byline": "PRIMESTRIDE AI",
  "app.demoStatus": "產品基礎建置中",
  "nav.home": "首頁",
  "nav.projects": "專案",
  "nav.knowledge": "知識",
  "nav.stridebrain": "StrideBrain",
  "nav.settings": "設定",
  "nav.overview": "總覽",
  "nav.compare": "比較",
  "nav.commercial": "商務資料",
  "nav.evidence": "資料依據",
  "nav.actions": "行動事項",
  "language.zhTw": "繁中",
  "language.en": "EN",
  "home.eyebrow": "STRIDEBRAIN v0.1",
  "home.title": "讓每一個完成的專案，都能幫助下一個專案。",
  "home.description":
    "StrideBrain 將專案、文件、報價、供應商與公司知識連結成可查證、可採取行動的營運智慧。",
  "home.foundationTitle": "目前階段：產品與品質基礎",
  "home.foundationDescription":
    "此版本建立正式應用程式架構、雙語導覽、權限與資料邊界；尚未載入專案資料，也不會顯示模擬 AI 結論。",
  "home.nextTitle": "第一個完整成果",
  "home.nextDescription":
    "接下來將以「我們以前做過類似的案子嗎？」為核心，建立可解釋的歷史專案比較、資料依據與內部審查事項。",
  "projects.eyebrow": "專案工作區",
  "projects.title": "專案將成為 StrideBrain 的營運核心。",
  "projects.description":
    "Stage 0 尚未連接專案資料庫。下一階段會以正式資料模型建立禾序空間設計的示範組織與專案。",
  "knowledge.eyebrow": "組織知識",
  "knowledge.title": "連結公司知道的事，而不只是管理檔案。",
  "knowledge.description":
    "知識功能將連結專案、文件版本、報價、成本、供應商、材料與資料依據；目前尚未啟用資料匯入。",
  "stridebrain.eyebrow": "營運智慧介面",
  "stridebrain.title": "StrideBrain 不是另一個一般聊天機器人。",
  "stridebrain.description":
    "正式版本會先取得已授權的工作脈絡與資料依據，再提供結構化比較、說明與受控行動；Stage 0 不會連接 AI 模型。",
  "settings.eyebrow": "組織設定",
  "settings.title": "身份、權限、語言與整合將在伺服器端治理。",
  "settings.description":
    "Stage 0 僅顯示真實的產品邊界，不模擬尚未完成的帳號、角色或整合管理功能。",
  "project.eyebrow": "專案工作區結構",
  "project.unavailableTitle": "此專案目前無法使用。",
  "project.unavailableDescription":
    "Stage 0 尚未連接專案儲存庫。這個頁面只驗證正式專案工作區的導覽與失敗狀態，不會建立假的專案資料。",
  "project.requestedKey": "要求的專案識別碼",
  "project.foundationTitle": "已建立的專案區域",
  "project.foundationDescription":
    "總覽、比較、商務資料、資料依據與行動事項已納入資訊架構；功能會依照已核准的建置順序逐步啟用。",
  "state.notConnected": "資料尚未連接",
  "state.stageZero": "Stage 0 · 應用程式基礎",
  "action.viewArchitecture": "查看建置規格",
  "footer.dataBoundary": "僅限產品基礎 · 無客戶資料 · 無 AI 模型",
  "footer.releaseBoundary": "尚未連接正式示範網域",
};

const en: Catalog = {
  "app.name": "StrideBrain",
  "app.byline": "BY PRIMESTRIDE AI",
  "app.demoStatus": "Product foundation in progress",
  "nav.home": "Home",
  "nav.projects": "Projects",
  "nav.knowledge": "Knowledge",
  "nav.stridebrain": "StrideBrain",
  "nav.settings": "Settings",
  "nav.overview": "Overview",
  "nav.compare": "Compare",
  "nav.commercial": "Commercial",
  "nav.evidence": "Evidence",
  "nav.actions": "Actions",
  "language.zhTw": "繁中",
  "language.en": "EN",
  "home.eyebrow": "STRIDEBRAIN v0.1",
  "home.title": "Every completed project should make the next project easier.",
  "home.description":
    "StrideBrain connects projects, documents, quotations, suppliers, and company knowledge into evidence-backed operating intelligence and governed action.",
  "home.foundationTitle": "Current stage: product and quality foundation",
  "home.foundationDescription":
    "This build establishes the real application architecture, bilingual navigation, and permission/data boundaries. No project data or simulated AI conclusion is shown yet.",
  "home.nextTitle": "First complete outcome",
  "home.nextDescription":
    "The first vertical slice will answer “Have we done something like this before?” with explainable historical comparisons, inspectable evidence, and an internal review action.",
  "projects.eyebrow": "PROJECT WORKSPACE",
  "projects.title": "Projects will be the operating center of StrideBrain.",
  "projects.description":
    "Stage 0 does not connect a project repository. The next stage will seed the Horizon Atelier demonstration organization through the production-shaped data model.",
  "knowledge.eyebrow": "ORGANIZATIONAL KNOWLEDGE",
  "knowledge.title": "Connect what the company knows—not just where files are stored.",
  "knowledge.description":
    "Knowledge will connect projects, document versions, quotes, costs, suppliers, materials, and evidence. Data ingestion is not active in Stage 0.",
  "stridebrain.eyebrow": "OPERATING INTELLIGENCE",
  "stridebrain.title": "StrideBrain is not another generic chatbot.",
  "stridebrain.description":
    "The product will resolve authorized context and evidence before producing structured comparisons, explanations, and controlled actions. Stage 0 does not connect an AI model.",
  "settings.eyebrow": "ORGANIZATION SETTINGS",
  "settings.title":
    "Identity, permissions, language, and integrations will be governed server-side.",
  "settings.description":
    "Stage 0 shows the honest product boundary and does not simulate unfinished account, role, or integration administration.",
  "project.eyebrow": "PROJECT WORKSPACE STRUCTURE",
  "project.unavailableTitle": "This project is currently unavailable.",
  "project.unavailableDescription":
    "Stage 0 does not connect the project repository. This route verifies the approved workspace navigation and failure state without inventing project records.",
  "project.requestedKey": "Requested project key",
  "project.foundationTitle": "Approved project areas",
  "project.foundationDescription":
    "Overview, Compare, Commercial, Evidence, and Actions are part of the information architecture and will be activated in the accepted implementation sequence.",
  "state.notConnected": "Data not connected",
  "state.stageZero": "Stage 0 · Application foundation",
  "action.viewArchitecture": "View build specification",
  "footer.dataBoundary": "Foundation only · No customer data · No AI model",
  "footer.releaseBoundary": "Not connected to the live demo domain",
};

export const catalogs: Record<Locale, Catalog> = {
  "zh-TW": zhTw,
  en,
};

export function getCatalog(locale: Locale): Catalog {
  return catalogs[locale];
}
