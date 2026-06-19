import { existsSync, readFileSync } from "node:fs";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv("admin-app/.env.local");

const checks = [];

checkFile("dedicated admin app package", "admin-app/package.json");
checkFile("dedicated admin app package lock", "admin-app/package-lock.json");
checkFile("Vercel config", "admin-app/vercel.json");
checkFile("dedicated admin README", "admin-app/README.md");
checkFile("client handoff manual", "docs/delivery-admin-manual.md");
checkFile("client handoff checklist", "docs/client-handoff-checklist.md");
checkFile("client handoff sheet", "docs/client-handoff-sheet.md");
checkFile("login API route", "admin-app/app/api/login/route.ts");
checkFile("content API route", "admin-app/app/api/content/[endpoint]/route.ts");
checkFile("media upload API route", "admin-app/app/api/media/route.ts");
checkFile("deploy API route", "admin-app/app/api/deploy/route.ts");
checkFile("Facebook event preview API route", "admin-app/app/api/facebook-event-preview/route.ts");
checkFile("health API route", "admin-app/app/api/health/route.ts");
checkNoMojibake();
checkNoQuestionMarkMojibake();
checkClientFacingText();
checkClientDocsText();
checkAdminDocsUseCurrentPublishButtonCopy();
checkClientDocsMentionFacebookEventFlow();
checkPageCopyPlaceholdersAvoidRemovedEventList();
checkClientHandoffDocsLinked();
checkClientSupportRequestDetails();
checkImageFieldUsesFriendlyRemoveCopy();
checkImageRemoveRequiresConfirmation();
checkSocialNoticeUrlValidation();
checkPublicSocialNoticeUrlFiltering();
checkCmsSmokeSocialNoticeUrlValidation();
checkPreviewChecklistIsSectionSpecific();
checkAdminSaveFlowExplainsPublishBehavior();
checkAdminDraftSaveDoesNotClaimPublicPublish();
checkAdminErrorsExplainWhatToTellSupport();
checkPublishWaitCopyIsSpecific();
checkFacebookEventPreviewMessages();
checkFacebookEventPreviewParsingFallbacks();
checkFacebookEventFetchParsingFallbacks();
checkFacebookEventImportPanel();
checkFacebookEventHandoffDocs();
checkFacebookEventUrlParserHandlesNestedPaths();
checkAdminEventTimeValidation();
checkCalendarSyncPrefersManagedFacebookEvents();
checkCalendarSyncBlocksWarnings();
checkProductionUrlEnvDocs();
checkProductionCalendarSyncDocsMatchOutput();
checkAdminReadmeLinksHandoffDocs();
checkAdminReadmeCalendarRequestVerification();
checkAdminPublishFlowShowsPublicSiteLink();
checkDocsIndexBoundaries();
checkLegacyDeliveryManualMarkedAsOld();
checkMicrocmsSetupChecklistUsesCurrentDocs();
checkAdminSchemaDocsMatch();
checkMenuDescriptionExplainsSupplementalUse();
checkEventFieldDocsExplainCalendarSync();
checkMicrocmsSetupChecklistIncludesFacebookEventFields();
checkLegacyMicrocmsSchemaIncludesFacebookEventFields();
checkAdminSchemaEndpointsMatch();
checkAdminSchemaKeepsEventsCalendarFocused();
checkCmsSmokeCoversAdminEndpoints();
checkCmsSmokeTimeValidation();
checkSeedDataCoversAdminEndpoints();
checkSeedDataKeepsEventsCalendarFocused();
checkSampleContentUsesCurrentCopy();
checkPackageScript("dev:admin-app");
checkPackageScript("build:admin-app");
checkPackageScript("typecheck:admin-app");
checkPackageScript("check:admin-app");
checkPackageScript("sync:calendar:dry");
checkPackageScript("sync:calendar:check");
checkLocalEnv("ADMIN_PASSWORD", "Vercel required; local optional");
checkLocalEnv("ADMIN_SESSION_SECRET", "Vercel required; local optional");
checkLocalEnv("MICROCMS_SERVICE_DOMAIN", "Vercel required; local optional");
checkLocalEnv("MICROCMS_API_KEY", "Vercel required; local optional");
checkLocalEnv("GITHUB_DISPATCH_TOKEN", "Vercel required; local optional");
checkLocalEnv("GITHUB_OWNER", "defaults to Token08 when omitted");
checkLocalEnv("GITHUB_REPO", "defaults to bassic when omitted");
checkLocalEnv("GITHUB_DISPATCH_EVENT_TYPE", "defaults to microcms_publish when omitted");
checkLocalEnv("NEXT_PUBLIC_PUBLIC_SITE_URL", "defaults to https://www.bassic.jp/ when omitted");

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "NG"} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error("\nDedicated admin app readiness check failed. Complete the NG items above, then run npm run check:admin-app again.");
  process.exit(1);
}

console.log("\nDedicated admin app readiness check passed.");

function add(label, ok, detail = "") {
  checks.push({ label, ok, detail });
}

function checkFile(label, path) {
  add(label, existsSync(path), path);
}

function checkPackageScript(scriptName) {
  if (!existsSync("package.json")) {
    add(`package script ${scriptName}`, false, "package.json missing");
    return;
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  add(`package script ${scriptName}`, Boolean(packageJson.scripts?.[scriptName]));
}

function checkLocalEnv(name, detail) {
  add(`env ${name}`, true, process.env[name] ? "set locally" : detail);
}

function checkNoMojibake() {
  const patterns = [
    "\u7e5d\uff9d",
    "\u7e67\uff70",
    "\u7e3a\uff67",
    "\u7e3a\u52b1",
    "\u8b41\uff70",
    "\u8708\uff6c",
    "\u9082\uff61",
    "\u9af1\uff62",
    "\u9021\uff7b",
    "\u83eb\u664f",
    "\u873f\u80b4",
    "\u879f\u753b"
  ];
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/app/layout.tsx",
    "admin-app/lib/admin-schema.ts",
    "admin-app/lib/env.ts",
    "admin-app/README.md",
    "docs/admin-docs-index.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md",
    "docs/delivery-admin-manual.md",
    "docs/facebook-event-sync.md",
    "docs/production-handoff-checklist.md",
    "scripts/sync-google-calendar.mjs",
    "admin-app/app/api/facebook-event-preview/route.ts"
  ];
  const hits = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        hits.push(`${file}: ${pattern}`);
      }
    }
  }

  add("admin and handoff docs have no mojibake markers", hits.length === 0, hits.join(", "));
}

function checkNoQuestionMarkMojibake() {
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/app/api/facebook-event-preview/route.ts",
    "admin-app/README.md",
    "docs/facebook-event-sync.md",
    "docs/production-handoff-checklist.md",
    "scripts/sync-google-calendar.mjs"
  ];
  const hits = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    const matches = [...text.matchAll(/\?{3,}/g)];
    if (matches.length) {
      hits.push(`${file}: ${matches.length} suspicious question-mark run(s)`);
    }
  }

  add("admin and calendar docs have no question-mark mojibake", hits.length === 0, hits.join(", "));
}

function checkClientFacingText() {
  const forbidden = ["microCMS", "GitHub", "Vercel", "APIキー", "トークン", "環境変数"];
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/app/api/content/[endpoint]/route.ts",
    "admin-app/app/api/content/[endpoint]/[id]/route.ts",
    "admin-app/app/api/deploy/route.ts",
    "admin-app/app/api/facebook-event-preview/route.ts",
    "admin-app/app/api/media/route.ts",
    "admin-app/app/api/login/route.ts",
    "admin-app/app/api/session/route.ts",
    "admin-app/app/api/social-status/route.ts"
  ];
  const leaks = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of forbidden) {
      if (text.includes(term)) {
        leaks.push(`${file}: ${term}`);
      }
    }
  }

  if (existsSync("admin-app/lib/env.ts")) {
    const envText = readFileSync("admin-app/lib/env.ts", "utf8");
    const labelMatches = [...envText.matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1]);
    for (const label of labelMatches) {
      for (const term of forbidden) {
        if (label.includes(term)) {
          leaks.push(`admin-app/lib/env.ts label: ${term}`);
        }
      }
    }
  }

  add("client-facing admin text hides technical setup terms", leaks.length === 0, leaks.join(", "));
}

function checkClientDocsText() {
  const forbidden = ["microCMS", "GitHub", "Vercel", "APIキー", "トークン", "環境変数", ".env", "canonical", "sitemap", "hreflang"];
  const files = [
    "docs/delivery-admin-manual.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md"
  ];
  const leaks = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of forbidden) {
      if (text.includes(term)) {
        leaks.push(`${file}: ${term}`);
      }
    }
  }

  add("client handoff docs hide technical setup terms", leaks.length === 0, leaks.join(", "));
}

function checkAdminDocsUseCurrentPublishButtonCopy() {
  const files = ["admin-app/README.md", "docs/dedicated-admin-app-v1.md"];
  const problems = [];

  for (const file of files) {
    if (!existsSync(file)) {
      problems.push(`${file}: missing`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    if (!text.includes("プレビューして公開")) {
      problems.push(`${file}: プレビューして公開`);
    }
    if (text.includes("公開して反映")) {
      problems.push(`${file}: stale 公開して反映`);
    }
  }

  add("admin docs use current publish button copy", problems.length === 0, problems.join(", "));
}

function checkClientDocsMentionFacebookEventFlow() {
  const files = [
    { path: "docs/delivery-admin-manual.md", terms: ["FacebookイベントURL", "個別イベントページのURL", "Google Calendarへ反映", "START", "Google Calendar反映依頼メモ", "コピーする", "Google Calendar本体は更新されません", "空欄の場合は「コピーする」が押せません"] },
    { path: "docs/client-handoff-checklist.md", terms: ["FacebookイベントURL", "個別イベントページのURL", "Google Calendar反映依頼メモ", "日付とSTART", "コピーする"] },
    { path: "docs/client-handoff-sheet.md", terms: ["FacebookイベントURL", "個別イベントページのURL", "Google Calendarにも載せたい", "STARTが空欄", "Google Calendar反映依頼メモ", "コピーする", "イベント名:", "日付:", "START:", "END:", "FacebookイベントURL:", "画像URL:", "反映されない時の連絡文", "STARTが空欄だと「コピーする」は押せない"] }
  ];
  const missing = [];

  for (const file of files) {
    if (!existsSync(file.path)) {
      missing.push(`${file.path}: missing`);
      continue;
    }

    const text = readFileSync(file.path, "utf8");
    for (const term of file.terms) {
      if (!text.includes(term)) {
        missing.push(`${file.path}: ${term}`);
      }
    }
  }

  add("client docs mention Facebook event URL flow", missing.length === 0, missing.join(", "));
}

function checkPageCopyPlaceholdersAvoidRemovedEventList() {
  const file = "admin-app/lib/admin-schema.ts";
  if (!existsSync(file)) {
    add("page copy placeholders avoid removed event list", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const stale = ["placeholder: \"Event List\"", "placeholder: \"Event Schedule\""].filter((term) => text.includes(term));

  add("page copy placeholders avoid removed event list", stale.length === 0, stale.join(", "));
}

function checkClientHandoffDocsLinked() {
  const checklistFile = "docs/client-handoff-checklist.md";
  const sheetFile = "docs/client-handoff-sheet.md";
  if (!existsSync(checklistFile) || !existsSync(sheetFile)) {
    add("client handoff checklist references handoff sheet", false, `${checklistFile} or ${sheetFile} missing`);
    return;
  }

  const checklistText = readFileSync(checklistFile, "utf8");
  const sheetText = readFileSync(sheetFile, "utf8");
  const requiredSheetTerms = ["公開サイト", "管理画面", "ログイン方法", "パスワード", "困った時の連絡先", "スマホでAccessページ", "スマホでTOPページのSNS欄"];
  const missingSheetTerms = requiredSheetTerms.filter((term) => !sheetText.includes(term));
  const checklistMentionsSheet = checklistText.includes("引き渡しメモ");
  const requiredChecklistTerms = ["リンクを開いて確認", "画像を開いて確認"];
  const missingChecklistTerms = requiredChecklistTerms.filter((term) => !checklistText.includes(term));
  const manualFile = "docs/delivery-admin-manual.md";
  const manualText = existsSync(manualFile) ? readFileSync(manualFile, "utf8") : "";
  const missingManualTerms = ["画像を外す", "編集している内容に合わせて確認項目が変わります", "画面に出るURL例"].filter((term) => !manualText.includes(term));
  const socialUrlTerms = ["instagram.com", "facebook.com", "x.com", "twitter.com"];
  const missingSocialUrlTerms = [
    ...socialUrlTerms.filter((term) => !manualText.includes(term)).map((term) => `${manualFile} missing ${term}`),
    ...socialUrlTerms.filter((term) => !checklistText.includes(term)).map((term) => `${checklistFile} missing ${term}`),
    ...socialUrlTerms.filter((term) => !sheetText.includes(term)).map((term) => `${sheetFile} missing ${term}`)
  ];
  const problems = [
    ...(checklistMentionsSheet ? [] : ["checklist missing 引き渡しメモ"]),
    ...missingSheetTerms.map((term) => `sheet missing ${term}`),
    ...missingChecklistTerms.map((term) => `checklist missing ${term}`),
    ...missingManualTerms.map((term) => `${manualFile} missing ${term}`),
    ...missingSocialUrlTerms
  ];

  add("client handoff checklist references handoff sheet", problems.length === 0, problems.join(", "));
}

function checkClientSupportRequestDetails() {
  const files = ["docs/delivery-admin-manual.md", "docs/client-handoff-sheet.md", "docs/client-handoff-checklist.md"];
  const requiredTerms = ["どのページ", "何を変更", "画面に出たメッセージ", "スクリーンショット"];
  const missing = [];

  for (const file of files) {
    if (!existsSync(file)) {
      missing.push(`${file}: missing`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of requiredTerms) {
      if (!text.includes(term)) {
        missing.push(`${file}: ${term}`);
      }
    }
  }

  add("client docs explain what to send when support is needed", missing.length === 0, missing.join(", "));
}

function checkImageFieldUsesFriendlyRemoveCopy() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin image field uses friendly remove copy", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = ["aria-label=\"この画像を外す\"", "画像を外す", "画像をアップロードしました。下書き保存または公開で反映されます。"];
  const stale = [">削除<"].filter((term) => text.includes(term));
  const missing = required.filter((term) => !text.includes(term));
  const problems = [...missing.map((term) => `missing ${term}`), ...stale.map((term) => `stale ${term}`)];

  add("admin image field uses friendly remove copy", problems.length === 0, problems.join(", "));
}

function checkImageRemoveRequiresConfirmation() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin image remove requires confirmation", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "function removeImage()",
    "この画像を外しますか？",
    "下書き保存または公開するまではサイトには反映されません",
    "onClick={removeImage}"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin image remove requires confirmation", missing.length === 0, missing.join(", "));
}

function checkSocialNoticeUrlValidation() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin validates social notice URLs by platform", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "getSocialUrlError",
    "isInstagramUrl",
    "isXUrl",
    "SocialNoticeUrlGuide",
    "SNSお知らせURLの入力例",
    "プロフィールURLか、見せたい投稿を開いた時のURL",
    "Facebookページか、見せたい投稿・イベントを開いた時のURL",
    "section.id === \"social-notices\"",
    "instagram.com",
    "facebook.com",
    "x.com"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("admin validates social notice URLs by platform", missing.length === 0, missing.join(", "));
}

function checkPublicSocialNoticeUrlFiltering() {
  const file = "lib/microcms.ts";
  if (!existsSync(file)) {
    add("public site filters social notice URLs by platform", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "isSocialNoticeUrlForPlatform",
    "notice.platform === \"instagram\"",
    "notice.platform === \"facebook\"",
    "notice.platform === \"x\"",
    "instagram.com",
    "facebook.com",
    "x.com",
    "twitter.com"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("public site filters social notice URLs by platform", missing.length === 0, missing.join(", "));
}

function checkCmsSmokeSocialNoticeUrlValidation() {
  const file = "scripts/smoke-cms.mjs";
  if (!existsSync(file)) {
    add("CMS smoke validates social notice URLs by platform", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "requiredSocialNoticeUrl",
    "platform === \"instagram\"",
    "platform === \"facebook\"",
    "platform === \"x\"",
    "instagram.com",
    "facebook.com",
    "x.com",
    "twitter.com"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates social notice URLs by platform", missing.length === 0, missing.join(", "));
}

function checkPreviewChecklistIsSectionSpecific() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin preview checklist is section specific", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "function getPublishChecklistItems",
    "section.id === \"site-settings\"",
    "Google MapとSNSの確認リンクを開いた",
    "公開後にスマホでTOPとAccessを確認する",
    "section.id === \"events\"",
    "イベント名、日付、STARTに間違いがない",
    "公開後にスマホのEvent Scheduleを確認する",
    "section.id === \"menu\"",
    "フード名、料金、写真に間違いがない",
    "section.id === \"drink-menu-sheets\"",
    "画像を開いて文字が読めるか確認した",
    "選んだSNSとリンクURLの種類が合っている",
    "公開後にスマホのTOPページでSNS欄を確認する",
    "getPublishChecklistItems(section).map"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin preview checklist is section specific", missing.length === 0, missing.join(", "));
}

function checkAdminSaveFlowExplainsPublishBehavior() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin save flow explains publish behavior", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "プレビュー確認へ進めます",
    "入力内容・リンク先・画像",
    "「公開する」がONの項目",
    "「公開する」がOFFです。このまま公開しても公開サイトには表示されません",
    "保存して反映（この項目は非表示）",
    "途中保存や後で確認したい時"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin save flow explains publish behavior", missing.length === 0, missing.join(", "));
}

function checkAdminDraftSaveDoesNotClaimPublicPublish() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin draft save does not claim public publish", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "下書き保存しました。公開するまでサイトには出ません。",
    "公開しました。1〜3分ほど待ってから公開サイトを再読み込みして確認してください。"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin draft save does not claim public publish", missing.length === 0, missing.join(", "));
}

function checkAdminErrorsExplainWhatToTellSupport() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin errors explain what to tell support", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "担当者へ「反映だけ失敗」と伝えてください",
    "担当者へこの画面の内容を伝えてください"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin errors explain what to tell support", missing.length === 0, missing.join(", "));
}

function checkPublishWaitCopyIsSpecific() {
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/README.md",
    "docs/delivery-admin-manual.md",
    "docs/dedicated-admin-app-v1.md",
    "docs/delivery-admin-manual-v1.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md"
  ];
  const missing = [];

  for (const file of files) {
    if (!existsSync(file)) {
      missing.push(`${file}: missing`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    if (!text.includes("1〜3分")) {
      missing.push(`${file}: 1〜3分`);
    }
    if (["docs/delivery-admin-manual.md", "docs/client-handoff-checklist.md", "docs/client-handoff-sheet.md"].includes(file) && !text.includes("再読み込み")) {
      missing.push(`${file}: 再読み込み`);
    }
  }

  add("publish wait copy is specific for clients", missing.length === 0, missing.join(", "));
}

function checkFacebookEventPreviewMessages() {
  const file = "admin-app/app/api/facebook-event-preview/route.ts";
  if (!existsSync(file)) {
    add("Facebook event preview messages use copyable URL examples", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const hasCopyableExample = text.includes("https://www.facebook.com/events/1234567890/");
  const hasEllipsisExample = text.includes("https://www.facebook.com/events/...");

  add(
    "Facebook event preview messages use copyable URL examples",
    hasCopyableExample && !hasEllipsisExample,
    hasEllipsisExample ? "replace events/... with a copyable event URL example" : ""
  );
}

function checkFacebookEventPreviewParsingFallbacks() {
  const file = "admin-app/app/api/facebook-event-preview/route.ts";
  if (!existsSync(file)) {
    add("Facebook event preview handles common markup fallbacks", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "&#x([0-9a-f]+);",
    "&#(\\d+);",
    "twitter:image:src",
    "jpWithoutYear",
    "inferEventYear",
    "normalizeJapaneseHour",
    "午後",
    "午前"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("Facebook event preview handles common markup fallbacks", missing.length === 0, missing.join(", "));
}

function checkFacebookEventFetchParsingFallbacks() {
  const file = "scripts/fetch-facebook-events.mjs";
  if (!existsSync(file)) {
    add("Facebook event fetch handles yearless Japanese dates", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "jpWithoutYear",
    "inferEventYear",
    "normalizeJapaneseHour",
    "午後",
    "午前"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("Facebook event fetch handles yearless Japanese dates", missing.length === 0, missing.join(", "));
}

function checkFacebookEventImportPanel() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin event editor includes Facebook import panel", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "Facebookイベントを取り込む",
    "Facebookから読み取る",
    "読み取り結果の確認",
    "FacebookイベントURL・詳細URL",
    "sourceId: data.sourceId",
    "Google Calendarへ載せたい場合",
    "Google Calendar反映依頼メモ",
    "Google Calendarにも反映してください。",
    "コピーする",
    "コピーしました。担当者へのメッセージに貼り付けてください。",
    "calendarRequestMissingLabels",
    "calendarRequestBlockingLabels",
    "calendarRequestCannotCopy",
    "コピー前に",
    "未入力があります。コピーする前に、",
    "event.currentTarget.select()",
    "イベント名",
    "日付",
    "日付またはSTARTが自動取得できませんでした",
    "START",
    "Facebookイベントを公開する前に日付を入力してください。",
    "Facebookイベントを公開する前にSTARTを入力してください。"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("admin event editor includes Facebook import panel", missing.length === 0, missing.join(", "));
}

function checkFacebookEventHandoffDocs() {
  const manualFile = "docs/delivery-admin-manual.md";
  const checklistFile = "docs/production-handoff-checklist.md";
  if (!existsSync(manualFile) || !existsSync(checklistFile)) {
    add("Facebook event handoff docs explain import checks", false, `${manualFile} or ${checklistFile} missing`);
    return;
  }

  const manualText = readFileSync(manualFile, "utf8");
  const checklistText = readFileSync(checklistFile, "utf8");
  const syncDocText = existsSync("docs/facebook-event-sync.md") ? readFileSync("docs/facebook-event-sync.md", "utf8") : "";
  const requiredManualTerms = [
    "読み取り結果のチェックリスト",
    "タイトル、画像、日付、STARTが入ったか確認",
    "個別イベントページのURL",
    "日付とSTARTの両方が入っていないと保存時に確認メッセージ",
    "Google Calendar反映依頼メモ",
    "コピーする",
    "空欄の場合は「コピーする」が押せません"
  ];
  const requiredChecklistTerms = ["FacebookイベントURL", "タイトル、画像、日付、STARTを確認", "Google Calendar反映依頼メモ", "コピーする", "sync:calendar:check"];
  const requiredSyncDocTerms = [
    "## 読み取りに失敗した時",
    "イベント名、日付、STARTを手入力する",
    "画像が取れない場合",
    "管理画面で確認・修正した内容を正として扱います",
    "Google Calendar反映依頼メモ",
    "コピーする",
    "依頼メモの `コピーする` は押せません"
  ];
  const staleTerms = ["ライヴ取得"];
  const missing = [
    ...requiredManualTerms.filter((term) => !manualText.includes(term)).map((term) => `${manualFile}: ${term}`),
    ...requiredChecklistTerms.filter((term) => !checklistText.includes(term)).map((term) => `${checklistFile}: ${term}`),
    ...requiredSyncDocTerms.filter((term) => !syncDocText.includes(term)).map((term) => `docs/facebook-event-sync.md: ${term}`),
    ...staleTerms.filter((term) => syncDocText.includes(term)).map((term) => `docs/facebook-event-sync.md stale: ${term}`)
  ];

  add("Facebook event handoff docs explain import checks", missing.length === 0, missing.join(", "));
}

function checkFacebookEventUrlParserHandlesNestedPaths() {
  const previewFile = "admin-app/app/api/facebook-event-preview/route.ts";
  const adminFile = "admin-app/app/admin-client.tsx";
  const syncFile = "scripts/sync-google-calendar.mjs";
  const smokeFile = "scripts/smoke-cms.mjs";
  if (!existsSync(previewFile) || !existsSync(adminFile) || !existsSync(syncFile) || !existsSync(smokeFile)) {
    add("Facebook event URL parser handles nested event paths", false, `${previewFile}, ${adminFile}, ${syncFile}, or ${smokeFile} missing`);
    return;
  }

  const previewText = readFileSync(previewFile, "utf8");
  const adminText = readFileSync(adminFile, "utf8");
  const syncText = readFileSync(syncFile, "utf8");
  const smokeText = readFileSync(smokeFile, "utf8");
  const parserTerms = ["split(\"/\")", "reverse()", "/^\\d{6,}$/"];
  const missing = [
    ...parserTerms.filter((term) => !previewText.includes(term)).map((term) => `${previewFile}: ${term}`),
    ...parserTerms.filter((term) => !adminText.includes(term)).map((term) => `${adminFile}: ${term}`),
    ...parserTerms.filter((term) => !syncText.includes(term)).map((term) => `${syncFile}: ${term}`),
    ...parserTerms.filter((term) => !smokeText.includes(term)).map((term) => `${smokeFile}: ${term}`)
  ];

  add("Facebook event URL parser handles nested event paths", missing.length === 0, missing.join(", "));
}

function checkAdminEventTimeValidation() {
  const adminFile = "admin-app/app/admin-client.tsx";
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const setupFile = "docs/microcms-setup-checklist.md";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(adminFile) || !existsSync(schemaFile) || !existsSync(setupFile) || !existsSync(fieldDocsFile)) {
    add("admin event times use HH:mm guidance", false, `${adminFile}, ${schemaFile}, ${setupFile}, or ${fieldDocsFile} missing`);
    return;
  }

  const text = [
    readFileSync(adminFile, "utf8"),
    readFileSync(schemaFile, "utf8"),
    readFileSync(setupFile, "utf8"),
    readFileSync(fieldDocsFile, "utf8")
  ].join("\n");
  const required = [
    "function isValidEventTime",
    "previewHasInvalidTime",
    "^\\d{1,2}:\\d{2}$",
    "OPENやSTARTの文字は不要です",
    "START/ENDは「19:00」の形で手入力してください",
    "placeholder: \"18:30\"",
    "placeholder: \"19:00\"",
    "placeholder: \"22:00\"",
    "`19:00` のように入力",
    "深夜2時終了なら"
  ];
  const stale = ["placeholder: \"OPEN 18:30\"", "placeholder: \"START 19:00\"", "placeholder: \"END 22:00\""].filter((term) => text.includes(term));
  const missing = required.filter((term) => !text.includes(term));

  add("admin event times use HH:mm guidance", missing.length === 0 && stale.length === 0, [...missing, ...stale].join(", "));
}

function checkCalendarSyncPrefersManagedFacebookEvents() {
  const syncFile = "scripts/sync-google-calendar.mjs";
  const docsFile = "docs/facebook-event-sync.md";
  if (!existsSync(syncFile) || !existsSync(docsFile)) {
    add("calendar sync prefers managed Facebook event data", false, `${syncFile} or ${docsFile} missing`);
    return;
  }

  const syncText = readFileSync(syncFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const required = [
    [syncFile, syncText, "dedupeEvents([...managedEvents, ...fileEvents])"],
    [syncFile, syncText, "facebook-${facebookEventId}"],
    [syncFile, syncText, "sourceId: event.sourceId"],
    [syncFile, syncText, "if (end <= start)"],
    [docsFile, docsText, "sourceId"],
    [docsFile, docsText, "管理画面で確認・修正した内容を優先"],
    [docsFile, docsText, "管理画面の内容を正"],
    [docsFile, docsText, "深夜またぎとして翌日の終了時刻"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("calendar sync prefers managed Facebook event data", missing.length === 0, missing.join(", "));
}

function checkCalendarSyncBlocksWarnings() {
  const syncFile = "scripts/sync-google-calendar.mjs";
  const docsFile = "docs/facebook-event-sync.md";
  if (!existsSync(syncFile) || !existsSync(docsFile)) {
    add("calendar sync blocks unresolved warnings", false, `${syncFile} or ${docsFile} missing`);
    return;
  }

  const syncText = readFileSync(syncFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const required = [
    [syncFile, syncText, "GOOGLE_CALENDAR_SYNC_ALLOW_WARNINGS"],
    [syncFile, syncText, "collectSyncWarnings(events)"],
    [syncFile, syncText, "!allowSyncWarnings"],
    [syncFile, syncText, "npm run sync:calendar:check で内容を確認"],
    [syncFile, syncText, "イベント名または日付が未入力"],
    [syncFile, syncText, "確認のみ完了: 警告"],
    [docsFile, docsText, "GOOGLE_CALENDAR_SYNC_ALLOW_WARNINGS"],
    [docsFile, docsText, "sync:calendar:check"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("calendar sync blocks unresolved warnings", missing.length === 0, missing.join(", "));
}

function checkProductionUrlEnvDocs() {
  const file = "docs/production-handoff-checklist.md";
  if (!existsSync(file)) {
    add("production checklist explains public URL envs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_PUBLIC_SITE_URL", "公開サイトの本番URLと揃えてください"];
  const missing = requiredTerms.filter((term) => !text.includes(term));
  add("production checklist explains public URL envs", missing.length === 0, missing.join(", "));
}

function checkProductionCalendarSyncDocsMatchOutput() {
  const file = "docs/production-handoff-checklist.md";
  if (!existsSync(file)) {
    add("production checklist matches calendar sync output", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = ["個別ページURL", "`description`", "`画像:`", "sync:calendar:check", "依頼されたイベント名", "`summary`"];
  const staleTerms = ["`Image:`", "dry run"];
  const missing = requiredTerms.filter((term) => !text.includes(term));
  const stale = staleTerms.filter((term) => text.includes(term));
  const problems = [...missing.map((term) => `missing ${term}`), ...stale.map((term) => `stale ${term}`)];

  add("production checklist matches calendar sync output", problems.length === 0, problems.join(", "));
}

function checkAdminReadmeLinksHandoffDocs() {
  const file = "admin-app/README.md";
  if (!existsSync(file)) {
    add("admin README links handoff docs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "docs/delivery-admin-manual.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md",
    "docs/admin-docs-index.md",
    "イベント名",
    "Google Calendarにも反映してください"
  ];
  const missing = required.filter((item) => !text.includes(item));

  add("admin README links handoff docs", missing.length === 0, missing.join(", "));
}

function checkAdminReadmeCalendarRequestVerification() {
  const file = "admin-app/README.md";
  if (!existsSync(file)) {
    add("admin README calendar request verification", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "sync:calendar:check",
    "イベント名",
    "日付",
    "START",
    "Facebook URL",
    "画像URL",
    "依頼内容",
    "読み取れない項目がある場合",
    "管理画面で手入力する"
  ];
  const missing = required.filter((item) => !text.includes(item));

  add("admin README calendar request verification", missing.length === 0, missing.join(", "));
}

function checkAdminPublishFlowShowsPublicSiteLink() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin publish flow shows public site link", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = ["publicSiteUrl", "反映状況を見る", "公開サイトを開く", "再読み込み", "deploy-status-actions", "notice-actions"];
  const missing = required.filter((item) => !text.includes(item));

  add("admin publish flow shows public site link", missing.length === 0, missing.join(", "));
}

function checkDocsIndexBoundaries() {
  const file = "docs/admin-docs-index.md";
  if (!existsSync(file)) {
    add("admin docs index separates client and maintainer docs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "## 納品先へ渡す資料",
    "## 制作者・保守担当だけが見る資料",
    "## 旧版・控え",
    "docs/microcms-field-definitions-v1.md",
    "docs/cms-sample-content-v1.json",
    "docs/microcms-setup-checklist.md",
    "docs/facebook-event-sync.md",
    "docs/delivery-admin-manual.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md",
    "sync:calendar:check"
  ];
  const missing = required.filter((heading) => !text.includes(heading));
  const stale = ["docs/cms-sample-content.json"].filter((term) => text.includes(term));
  const removedFiles = ["docs/cms-sample-content.json"].filter((path) => existsSync(path));
  const problems = [
    ...missing.map((term) => `missing ${term}`),
    ...stale.map((term) => `stale ${term}`),
    ...removedFiles.map((path) => `remove stale ${path}`)
  ];

  add("admin docs index separates client and maintainer docs", problems.length === 0, problems.join(", "));
}

function checkLegacyDeliveryManualMarkedAsOld() {
  const file = "docs/delivery-admin-manual-v1.md";
  if (!existsSync(file)) {
    add("legacy delivery manual marked as old", true);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = ["旧版の控え", "納品先へ渡す資料は `docs/delivery-admin-manual.md`"];
  const missing = required.filter((item) => !text.includes(item));

  add("legacy delivery manual marked as old", missing.length === 0, missing.join(", "));
}

function checkMicrocmsSetupChecklistUsesCurrentDocs() {
  const file = "docs/microcms-setup-checklist.md";
  if (!existsSync(file)) {
    add("microCMS setup checklist uses current docs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "docs/cms-sample-content-v1.json",
    "docs/microcms-field-definitions-v1.md",
    "`site-settings`",
    "`drink-menu-sheets`",
    "`equipment-rental`",
    "`page-copy`",
    "`page-sections`",
    "`custom-sections`"
  ];
  const stale = ["docs/cms-sample-content.json"].filter((term) => text.includes(term));
  const missing = required.filter((term) => !text.includes(term));
  const problems = [...missing.map((term) => `missing ${term}`), ...stale.map((term) => `stale ${term}`)];

  add("microCMS setup checklist uses current docs", problems.length === 0, problems.join(", "));
}

function checkAdminSchemaDocsMatch() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const docsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(schemaFile) || !existsSync(docsFile)) {
    add("admin schema sections are documented", false, `${schemaFile} or ${docsFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const sectionIds = [...schemaText.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]);
  const missing = [...new Set(sectionIds)].filter((id) => !docsText.includes(`## \`${id}\``));

  add("admin schema sections are documented", missing.length === 0, missing.join(", "));
}

function checkMenuDescriptionExplainsSupplementalUse() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  const setupFile = "docs/microcms-setup-checklist.md";
  if (!existsSync(schemaFile) || !existsSync(fieldDocsFile) || !existsSync(setupFile)) {
    add("menu description explains supplemental use", false, `${schemaFile}, ${fieldDocsFile}, or ${setupFile} missing`);
    return;
  }

  const checks = [
    [schemaFile, readFileSync(schemaFile, "utf8"), "label: \"補足メモ\""],
    [schemaFile, readFileSync(schemaFile, "utf8"), "メニューカードは画像・名前・料金を中心に表示します"],
    [fieldDocsFile, readFileSync(fieldDocsFile, "utf8"), "| 補足メモ | `description`"],
    [fieldDocsFile, readFileSync(fieldDocsFile, "utf8"), "通常のメニューカード本文としては使いません"],
    [setupFile, readFileSync(setupFile, "utf8"), "`description` | 補足メモ"],
    [setupFile, readFileSync(setupFile, "utf8"), "通常のメニューカード本文としては使いません"]
  ];
  const missing = checks.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("menu description explains supplemental use", missing.length === 0, missing.join(", "));
}

function checkEventFieldDocsExplainCalendarSync() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const docsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(schemaFile) || !existsSync(docsFile)) {
    add("event field docs explain calendar sync meaning", false, `${schemaFile} or ${docsFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const required = [
    [schemaFile, schemaText, "Google Calendarへ反映する時も、このURLが説明欄に入ります。"],
    [schemaFile, schemaText, "FacebookイベントID"],
    [docsFile, docsText, "`日付` と `START`"],
    [docsFile, docsText, "`sourceId` はFacebookイベントURLから取り込めたイベントIDです。"],
    [docsFile, docsText, "`sourceUrl` はGoogle Calendarへ反映する時の詳細リンクにも使います。"],
    [docsFile, docsText, "`image` はGoogle Calendarの説明欄に画像URLとして入ります。"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("event field docs explain calendar sync meaning", missing.length === 0, missing.join(", "));
}

function checkMicrocmsSetupChecklistIncludesFacebookEventFields() {
  const file = "docs/microcms-setup-checklist.md";
  if (!existsSync(file)) {
    add("microCMS setup checklist includes Facebook event fields", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "`sourceUrl` | FacebookイベントURL・詳細URL",
    "`sourceId` | FacebookイベントID",
    "`sourceType` | 取り込み元",
    "`sourceId` と `sourceType` は管理画面側で自動入力",
    "`date` と `startTime`",
    "## 7. FacebookイベントとGoogle Calendar連携の注意",
    "## 8. 接続確認"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("microCMS setup checklist includes Facebook event fields", missing.length === 0, missing.join(", "));
}

function checkLegacyMicrocmsSchemaIncludesFacebookEventFields() {
  const file = "docs/microcms-schema.md";
  if (!existsSync(file)) {
    add("legacy microCMS schema includes Facebook event fields", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "| sourceUrl | FacebookイベントURL・詳細URL",
    "| sourceId | FacebookイベントID",
    "| sourceType | 取り込み元",
    "`sourceId` にFacebookイベントID",
    "Google Calendarへ反映する時"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("legacy microCMS schema includes Facebook event fields", missing.length === 0, missing.join(", "));
}

function checkAdminSchemaEndpointsMatch() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const endpointFile = "admin-app/lib/microcms.ts";
  if (!existsSync(schemaFile) || !existsSync(endpointFile)) {
    add("admin schema sections match microCMS endpoints", false, `${schemaFile} or ${endpointFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const endpointText = readFileSync(endpointFile, "utf8");
  const sectionIds = [...schemaText.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]);
  const endpointIds = [...endpointText.matchAll(/\n\s{2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/g)].map((match) => match[1] || match[2]);
  const missingEndpoints = [...new Set(sectionIds)].filter((id) => !endpointIds.includes(id));
  const missingSections = [...new Set(endpointIds)].filter((id) => !sectionIds.includes(id));
  const problems = [
    ...missingEndpoints.map((id) => `missing endpoint ${id}`),
    ...missingSections.map((id) => `missing section ${id}`)
  ];

  add("admin schema sections match microCMS endpoints", problems.length === 0, problems.join(", "));
}

function checkAdminSchemaKeepsEventsCalendarFocused() {
  const file = "admin-app/lib/admin-schema.ts";
  if (!existsSync(file)) {
    add("admin section selector keeps events calendar-focused", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const offersEventList = text.includes('value: "eventList"') || text.includes("value: 'eventList'");

  add("admin section selector keeps events calendar-focused", !offersEventList, "eventList should not be offered in section selector");
}

function checkCmsSmokeCoversAdminEndpoints() {
  const endpointFile = "admin-app/lib/microcms.ts";
  const smokeFile = "scripts/smoke-cms.mjs";
  if (!existsSync(endpointFile) || !existsSync(smokeFile)) {
    add("CMS smoke test covers admin endpoints", false, `${endpointFile} or ${smokeFile} missing`);
    return;
  }

  const endpointText = readFileSync(endpointFile, "utf8");
  const smokeText = readFileSync(smokeFile, "utf8");
  const endpointIds = [...endpointText.matchAll(/\n\s{2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/g)].map((match) => match[1] || match[2]);
  const missing = [...new Set(endpointIds)].filter((id) => !smokeText.includes(`/${id}`));

  add("CMS smoke test covers admin endpoints", missing.length === 0, missing.join(", "));
}

function checkCmsSmokeTimeValidation() {
  const smokeFile = "scripts/smoke-cms.mjs";
  if (!existsSync(smokeFile)) {
    add("CMS smoke validates event times as HH:mm", false, `${smokeFile} missing`);
    return;
  }

  const text = readFileSync(smokeFile, "utf8");
  const requiredTerms = [
    "function optionalTime",
    "^\\d{1,2}:\\d{2}$",
    "time should include HH:mm"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates event times as HH:mm", missing.length === 0, missing.join(", "));
}

function checkSeedDataCoversAdminEndpoints() {
  const endpointFile = "admin-app/lib/microcms.ts";
  const seedFile = "scripts/microcms-seed-data.mjs";
  if (!existsSync(endpointFile) || !existsSync(seedFile)) {
    add("microCMS seed data covers admin endpoints", false, `${endpointFile} or ${seedFile} missing`);
    return;
  }

  const endpointText = readFileSync(endpointFile, "utf8");
  const seedText = readFileSync(seedFile, "utf8");
  const endpointIds = [...endpointText.matchAll(/\n\s{2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/g)].map((match) => match[1] || match[2]);
  const missing = [...new Set(endpointIds)].filter((id) => !seedText.includes(`"${id}"`) && !seedText.includes(`\n    ${id},`));

  add("microCMS seed data covers admin endpoints", missing.length === 0, missing.join(", "));
}

function checkSeedDataKeepsEventsCalendarFocused() {
  const file = "scripts/microcms-seed-data.mjs";
  if (!existsSync(file)) {
    add("seed data keeps events page calendar-focused", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const seedsEventList = text.includes('"eventList"') || text.includes("'eventList'");

  add("seed data keeps events page calendar-focused", !seedsEventList, "eventList should stay out of initial seed data");
}

function checkSampleContentUsesCurrentCopy() {
  const file = "docs/cms-sample-content-v1.json";
  if (!existsSync(file)) {
    add("CMS sample content uses current copy", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    add("CMS sample content uses current copy", false, `${file} is not valid JSON: ${error.message}`);
    return;
  }

  const required = [
    ["site-settings.chargeLabel", data["site-settings"]?.chargeLabel, "テーブル・チャージ"],
    ["home.heroLead", data.home?.heroLead, "ライヴ"],
    ["home.firstVisitLead", data.home?.firstVisitLead, "ライヴ"],
    ["home.accessNote", data.home?.accessNote, "徒歩約4分"]
  ];
  const staleTerms = ["ライブ", "\"chargeLabel\": \"チャージ 500円", "徒歩約6分"];
  const missing = required
    .filter(([, value, term]) => typeof value !== "string" || !value.includes(term))
    .map(([field, , term]) => `${field}: ${term}`);
  const stale = staleTerms.filter((term) => text.includes(term));
  const problems = [...missing, ...stale.map((term) => `stale ${term}`)];

  add("CMS sample content uses current copy", problems.length === 0, problems.join(", "));
}
