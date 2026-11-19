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
  "projects.open",
  "projects.active",
  "projects.unavailableTitle",
  "projects.unavailableDescription",
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
  "app.demoStatus": "受控虛構資料示範",
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
  "home.foundationTitle": "目前階段：第一個完整智慧工作流程",
  "home.foundationDescription":
    "此版本已建立雙語專案工作區、權限治理、可解釋的歷史專案排序，以及報價與實際成本分開的商務比較。所有資料皆為禾序空間設計的虛構示範資料。",
  "home.nextTitle": "目前可展示的核心成果",
  "home.nextDescription":
    "從信義旗艦店專案提出「我們以前做過類似的案子嗎？」，查看可解釋的歷史專案、商務差異，並開啟精確資料依據與計算過程。內部審查事項將依建置順序啟用。",
  "projects.eyebrow": "專案工作區",
  "projects.title": "專案",
  "projects.description": "開啟您有權限查看的專案工作區。",
  "projects.open": "開啟專案",
  "projects.active": "進行中",
  "projects.unavailableTitle": "目前沒有可開啟的專案",
  "projects.unavailableDescription": "請確認您的登入狀態與專案存取權限，或稍後再試。",
  "knowledge.eyebrow": "組織知識",
  "knowledge.title": "連結公司知道的事，而不只是管理檔案。",
  "knowledge.description":
    "目前的比較流程已使用專案、報價版本、成本、供應商、材料與資料依據。完整知識探索與任意文件匯入尚未啟用。",
  "stridebrain.eyebrow": "營運智慧介面",
  "stridebrain.title": "StrideBrain 不是另一個一般聊天機器人。",
  "stridebrain.description":
    "目前版本先取得已授權的工作脈絡，再以固定規則產生專案排序、商務比較與誠實的資料不足狀態。模型說明不是主要流程的必要條件。",
  "settings.eyebrow": "組織設定",
  "settings.title": "身份、權限、語言與資料邊界由伺服器端治理。",
  "settings.description":
    "受控示範已驗證角色、專案指派與資料遮蔽；完整帳號管理、整合與正式客戶資料生命週期尚未啟用。",
  "project.eyebrow": "專案工作區",
  "project.unavailableTitle": "此專案或區域目前無法使用。",
  "project.unavailableDescription":
    "目前的授權脈絡無法開啟此專案，或此專案區域尚未在第一個完整流程中啟用。系統不會以假資料取代失敗狀態。",
  "project.requestedKey": "要求的專案識別碼",
  "project.foundationTitle": "已核准的專案區域",
  "project.foundationDescription":
    "專案總覽、比較與資料依據已連接正式資料與權限邊界。商務資料專頁與行動事項會依照已核准的建置順序逐步啟用。",
  "state.notConnected": "此區域尚未啟用",
  "state.stageZero": "v0.1 · 受控示範",
  "action.viewArchitecture": "查看建置規格",
  "footer.dataBoundary": "僅使用虛構示範資料 · 無真實客戶資料",
  "footer.releaseBoundary": "尚未切換正式示範網域",
};

const en: Catalog = {
  "app.name": "StrideBrain",
  "app.byline": "BY PRIMESTRIDE AI",
  "app.demoStatus": "Controlled synthetic demo",
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
  "home.foundationTitle": "Current stage: first complete intelligence workflow",
  "home.foundationDescription":
    "This build includes a bilingual Project Workspace, governed authorization, explainable historical-project ranking, and a commercial comparison that keeps quoted price and actual cost distinct. All records belong to the fictional Horizon Atelier demo organization.",
  "home.nextTitle": "What the controlled demo can show now",
  "home.nextDescription":
    "Open the Xinyi Flagship project and ask “Have we done something like this before?” to see explainable precedents, commercial differences, and exact supporting evidence and calculation traces. The governed internal review action follows in the accepted build sequence.",
  "projects.eyebrow": "PROJECT WORKSPACE",
  "projects.title": "Projects",
  "projects.description": "Open a project workspace available to your account.",
  "projects.open": "Open project",
  "projects.active": "Active",
  "projects.unavailableTitle": "No projects available to open",
  "projects.unavailableDescription": "Check your sign-in and project access, or try again later.",
  "knowledge.eyebrow": "ORGANIZATIONAL KNOWLEDGE",
  "knowledge.title": "Connect what the company knows—not just where files are stored.",
  "knowledge.description":
    "The comparison workflow already uses projects, quote versions, costs, suppliers, materials, and evidence. Full knowledge exploration and arbitrary document ingestion are not active yet.",
  "stridebrain.eyebrow": "OPERATING INTELLIGENCE",
  "stridebrain.title": "StrideBrain is not another generic chatbot.",
  "stridebrain.description":
    "The current build resolves authorized work context first, then produces deterministic project ranking, commercial comparison, and honest insufficiency states. Model-written explanation is not required for the critical workflow.",
  "settings.eyebrow": "ORGANIZATION SETTINGS",
  "settings.title":
    "Identity, permissions, language, and data boundaries are governed server-side.",
  "settings.description":
    "The controlled demo validates roles, project assignments, and redaction. Full account administration, integrations, and real-customer data lifecycle controls are not active yet.",
  "project.eyebrow": "PROJECT WORKSPACE",
  "project.unavailableTitle": "This project or project area is currently unavailable.",
  "project.unavailableDescription":
    "The current authorization context cannot open this project, or the requested area is not active in the first complete workflow. The application does not replace unavailable states with invented records.",
  "project.requestedKey": "Requested project key",
  "project.foundationTitle": "Approved project areas",
  "project.foundationDescription":
    "Project Overview, Compare, and claim-level Evidence use the real data and authorization boundaries. Commercial detail pages and Actions activate through the accepted implementation sequence.",
  "state.notConnected": "This area is not active yet",
  "state.stageZero": "v0.1 · Controlled demo",
  "action.viewArchitecture": "View build specification",
  "footer.dataBoundary": "Synthetic demo data only · No real customer data",
  "footer.releaseBoundary": "Live demo-domain cutover has not occurred",
};

export const catalogs: Record<Locale, Catalog> = {
  "zh-TW": zhTw,
  en,
};

export function getCatalog(locale: Locale): Catalog {
  return catalogs[locale];
}
