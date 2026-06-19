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
checkClientDocsMentionSectionPublicPageLinks();
checkClientManualUsesPublishButtonForPublicUpdates();
checkClientSupportRequestDetails();
checkImageFieldUsesFriendlyRemoveCopy();
checkImageRemoveRequiresConfirmation();
checkSiteSettingsUrlValidation();
checkSocialNoticeUrlValidation();
checkPublicSocialNoticeUrlFiltering();
checkCmsSmokeSocialNoticeUrlValidation();
checkCmsSmokeExternalUrlValidation();
checkCmsSmokeSiteSettingsUrlValidation();
checkCmsSmokeValidatesFacebookEventSourceIds();
checkAdminEditorShowsFocusTips();
checkPreviewChecklistIsSectionSpecific();
checkAdminValidationNoticeNamesFields();
checkAdminSaveFlowExplainsPublishBehavior();
checkAdminDraftSaveDoesNotClaimPublicPublish();
checkAdminErrorsExplainWhatToTellSupport();
checkPublishWaitCopyIsSpecific();
checkPublicConfirmationGuidanceIsComplete();
checkFacebookEventPreviewMessages();
checkFacebookEventPreviewParsingFallbacks();
checkFacebookEventFetchParsingFallbacks();
checkFacebookEventImportPanel();
checkFacebookEventHandoffDocs();
checkFacebookEventUrlParserHandlesNestedPaths();
checkAdminEventTimeValidation();
checkCalendarSyncPrefersManagedFacebookEvents();
checkCalendarSyncBlocksWarnings();
checkProductionHandoffCommands();
checkProductionUrlEnvDocs();
checkProductionCalendarSyncDocsMatchOutput();
checkAdminReadmeLinksHandoffDocs();
checkAdminReadmeCalendarRequestVerification();
checkAdminPublishFlowShowsPublicSiteLink();
checkAdminEditorShowsSectionPublicPageLinks();
checkAdminPublishNoticeShowsConfirmationSteps();
checkDocsIndexBoundaries();
checkLegacyDeliveryManualMarkedAsOld();
checkMicrocmsSetupChecklistUsesCurrentDocs();
checkMicrocmsSchemaUsesManagedSiteSettings();
checkAdminSchemaDocsMatch();
checkAdminSchemaFieldsAreDocumented();
checkAdminFieldDocsRequiredFlags();
checkMicrocmsSetupChecklistFieldDetails();
checkTopImagesAreManagedByHeroSlides();
checkMaintainerOnlyFieldsAreClear();
checkSiteSettingsPlaceholdersUseCurrentCopy();
checkMenuDescriptionExplainsSupplementalUse();
checkMenuPublishRequiresPriceAndImage();
checkNumberFieldsUseWholeNumberValidation();
checkCmsSmokeValidatesDisplayOrderNumbers();
checkEventFieldDocsExplainCalendarSync();
checkMicrocmsSetupChecklistIncludesFacebookEventFields();
checkLegacyMicrocmsSchemaIncludesFacebookEventFields();
checkAdminSchemaEndpointsMatch();
checkAdminSchemaKeepsEventsCalendarFocused();
checkCmsSmokeCoversAdminEndpoints();
checkCmsSmokeValidatesPublishedMenuItems();
checkCmsSmokeTimeValidation();
checkCmsSmokeValidatesPublishedTextDepth();
checkDocsExplainPublishedTextDepth();
checkAdminValidatesPublishedTextDepth();
checkSeedDataCoversAdminEndpoints();
checkSeedDataKeepsEventsCalendarFocused();
checkSeedDataMatchesPublishRules();
checkPublicCmsFallbackGuards();
checkAssetPathKeepsExternalUrls();
checkSampleContentUsesCurrentCopy();
checkSampleContentMatchesPublishRules();
checkEventDateIsDateOnlyGuidance();
checkGoogleBusinessProfileChecklistUsesCurrentCopy();
checkPackageScript("dev:admin-app");
checkPackageScript("build:admin-app");
checkPackageScript("typecheck:admin-app");
checkPackageScript("check:admin-app");
checkPackageScript("sync:calendar:dry");
checkPackageScript("sync:calendar:check");
checkPackageScript("smoke:content");
checkContentSmokeCoversMenuRegression();
checkLinkSmokeValidatesMapEmbeds();
checkSeoSmokeRejectsTemporaryUrls();
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

function checkContentSmokeCoversMenuRegression() {
  const file = "scripts/smoke-content.mjs";
  if (!existsSync(file)) {
    add("content smoke covers menu regression", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "menuRegressionTerms",
    "DRINK&FOOD MENU",
    "FOOD MENU",
    "Drink Menu 4",
    "fuzz-curry.jpg",
    "tacos-potato.jpg",
    "daily-pasta.jpg"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("content smoke covers menu regression", missing.length === 0, missing.join(", "));
}

function checkLinkSmokeValidatesMapEmbeds() {
  const file = "scripts/smoke-links.mjs";
  if (!existsSync(file)) {
    add("link smoke validates Google Map embeds", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "function validateMapEmbed",
    "output=embed",
    "/maps/embed",
    "/maps/search",
    "/maps/dir",
    "may be refused by the browser"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("link smoke validates Google Map embeds", missing.length === 0, missing.join(", "));
}

function checkSeoSmokeRejectsTemporaryUrls() {
  const file = "scripts/smoke-seo.mjs";
  if (!existsSync(file)) {
    add("SEO smoke rejects temporary URLs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "forbiddenSeoUrlFragments",
    "https://token08.github.io/bassic",
    "/index.html",
    "Unexpected SEO URL fragment",
    "Unexpected sitemap URL fragment"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("SEO smoke rejects temporary URLs", missing.length === 0, missing.join(", "));
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
  const requiredSheetTerms = ["公開サイト", "管理画面", "ログイン方法", "パスワード", "困った時の連絡先", "Google Calendar反映依頼先", "スマホでAccessページ", "スマホでTOPページのSNS欄", "1〜2箇所", "スクリーンショット"];
  const missingSheetTerms = requiredSheetTerms.filter((term) => !sheetText.includes(term));
  const checklistMentionsSheet = checklistText.includes("引き渡しメモ");
  const requiredChecklistTerms = ["リンクを開いて確認", "画像を開いて確認", "1〜2箇所ずつ変更", "スクリーンショット"];
  const missingChecklistTerms = requiredChecklistTerms.filter((term) => !checklistText.includes(term));
  const manualFile = "docs/delivery-admin-manual.md";
  const manualText = existsSync(manualFile) ? readFileSync(manualFile, "utf8") : "";
  const missingManualTerms = ["画像を外す", "編集している内容に合わせて確認項目が変わります", "画面に出るURL例", "1〜2箇所ずつ変更", "スクリーンショット"].filter((term) => !manualText.includes(term));
  const manualUpdateMapTerms = [
    "更新したい内容",
    "管理画面で選ぶ項目",
    "確認するページ",
    "TOPのSNS欄",
    "住所、電話、営業時間、喫煙、チャージ",
    "| 貸切、二次会 | 貸切 | Party & Rental |",
    "| 機材レンタル、PDFリンク | 機材 | Party & Rental |"
  ];
  const missingManualUpdateMapTerms = manualUpdateMapTerms.filter((term) => !manualText.includes(term));
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
    ...missingManualUpdateMapTerms.map((term) => `${manualFile} missing ${term}`),
    ...missingSocialUrlTerms
  ];

  add("client handoff checklist references handoff sheet", problems.length === 0, problems.join(", "));
}

function checkClientDocsMentionSectionPublicPageLinks() {
  const files = [
    { path: "docs/delivery-admin-manual.md", terms: ["確認するページ", "該当ページを開く", "イベントならイベントページ", "メニューならメニューページ"] },
    { path: "docs/client-handoff-checklist.md", terms: ["確認するページ", "該当ページを開き", "反映を確認する"] },
    { path: "docs/client-handoff-sheet.md", terms: ["確認するページ", "公開ページを開き", "該当ページを開いたか"] }
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

  add("client docs mention section public page links", missing.length === 0, missing.join(", "));
}

function checkClientManualUsesPublishButtonForPublicUpdates() {
  const file = "docs/delivery-admin-manual.md";
  if (!existsSync(file)) {
    add("client manual uses publish button for public updates", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "6. プレビューして公開する",
    "5. プレビューして公開する",
    "7. プレビューして公開する"
  ];
  const stale = [
    "6. 保存する",
    "5. 保存する",
    "7. 保存する"
  ].filter((term) => text.includes(term));
  const missing = required.filter((term) => !text.includes(term));
  const problems = [
    ...missing.map((term) => `missing ${term}`),
    ...stale.map((term) => `stale ${term}`)
  ];

  add("client manual uses publish button for public updates", problems.length === 0, problems.join(", "));
}

function checkClientSupportRequestDetails() {
  const files = ["docs/delivery-admin-manual.md", "docs/client-handoff-sheet.md", "docs/client-handoff-checklist.md"];
  const requiredTerms = ["どのページ", "何を変更", "画面に出たメッセージ", "スクリーンショット"];
  const templateFiles = ["docs/delivery-admin-manual.md", "docs/client-handoff-sheet.md"];
  const templateTerms = ["直したページ:", "変更した内容:", "押したボタン:", "押した時間:", "画面に出たメッセージ:", "スクリーンショット: あり / なし"];
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

  for (const file of templateFiles) {
    if (!existsSync(file)) {
      missing.push(`${file}: missing`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of templateTerms) {
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
  const required = [
    "aria-label=\"この画像を外す\"",
    "画像を外す",
    "画像をアップロードしました。まだ公開サイトには反映されていません。",
    "画像を開いて確認し、下書き保存またはプレビューして公開してください。"
  ];
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

function checkSiteSettingsUrlValidation() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin validates site settings URLs by field", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "function isGoogleMapUrl",
    "function getSiteSettingsUrlError",
    "section.id === \"site-settings\"",
    "Google MapのURLを入力してください。",
    "Instagram URLは instagram.com のURLを入力してください。",
    "Facebook URLは facebook.com のURLを入力してください。",
    "X URLは x.com または twitter.com のURLを入力してください。",
    "\"googleMapsUrl\"",
    "\"directionsUrl\"",
    "\"instagramUrl\"",
    "\"facebookUrl\"",
    "\"xUrl\""
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("admin validates site settings URLs by field", missing.length === 0, missing.join(", "));
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
    "選んだSNSとURLの種類は合っています。",
    "リンクURLを入れると、SNSの種類が合っているかここに表示します。",
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

function checkCmsSmokeExternalUrlValidation() {
  const file = "scripts/smoke-cms.mjs";
  if (!existsSync(file)) {
    add("CMS smoke validates external URLs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "function requiredExternalUrl",
    "function isValidExternalUrl",
    "external URL must start with https://",
    "social notice URLs must be full https:// URLs",
    'requiredExternalUrl(siteSettings, field, "site-settings")',
    'requiredExternalUrl(home, "instagramWidgetSrc", "home")'
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates external URLs", missing.length === 0, missing.join(", "));
}

function checkCmsSmokeSiteSettingsUrlValidation() {
  const file = "scripts/smoke-cms.mjs";
  if (!existsSync(file)) {
    add("CMS smoke validates site settings URLs by field", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "requiredSiteSettingsUrl",
    "field === \"googleMapsUrl\"",
    "field === \"directionsUrl\"",
    "field === \"instagramUrl\"",
    "field === \"facebookUrl\"",
    "field === \"xUrl\"",
    "Google Map URLs must use google.com",
    "Instagram URL must use instagram.com",
    "Facebook URL must use facebook.com",
    "X URL must use x.com or twitter.com"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates site settings URLs by field", missing.length === 0, missing.join(", "));
}

function checkCmsSmokeValidatesFacebookEventSourceIds() {
  const file = "scripts/smoke-cms.mjs";
  if (!existsSync(file)) {
    add("CMS smoke validates Facebook event source IDs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "optionalFacebookSourceIdMatchesUrl",
    "getFacebookEventId(item?.sourceUrl)",
    "sourceId !== eventId",
    "Facebook event ID should match the sourceUrl event ID"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("CMS smoke validates Facebook event source IDs", missing.length === 0, missing.join(", "));
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
    "説明は12文字以上で、料金・人数・利用内容が分かる",
    "PDFリンクを開いて確認した",
    "タイトル6文字以上、説明10文字以上で内容が伝わる",
    "選んだSNSとリンクURLの種類が合っている",
    "公開後にスマホのTOPページでSNS欄を確認する",
    "section.id === \"custom-sections\"",
    "タイトル6文字以上、本文20文字以上で内容が伝わる",
    "getPublishChecklistItems(section).map"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin preview checklist is section specific", missing.length === 0, missing.join(", "));
}

function checkAdminEditorShowsFocusTips() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin editor shows section focus tips before editing", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "function getEditorFocusTips",
    "function EditorFocusTips",
    "先に見るポイント",
    "営業時間、喫煙、テーブル・チャージは来店判断に直結します。",
    "FacebookイベントURLは、イベント一覧ではなく個別イベントページのURLを入れます。",
    "フードを公開する時は、名前、料金、画像の3点をそろえます。",
    "ドリンク表は、クリック前と拡大表示の両方で文字が読める画像を使います。",
    "Instagram、Facebook、Xの種類とリンクURLが合っているか確認します。",
    "<EditorFocusTips section={section} />"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin editor shows section focus tips before editing", missing.length === 0, missing.join(", "));
}

function checkAdminValidationNoticeNamesFields() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin validation notice names fields to fix", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "function getValidationNoticeMessage",
    "直す項目:",
    "section.fields.find((field) => field.key === key)?.label",
    "入力内容を直してから確認してください。",
    "入力内容を直してください。",
    "Object.keys(nextErrors).length"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin validation notice names fields to fix", missing.length === 0, missing.join(", "));
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
    "途中保存や後で確認したい時",
    "公開後はPCだけでなくスマホでも見てください",
    "最後にスマホでも表示を確認します",
    "current-edit-summary",
    "現在編集中の内容",
    "公開するON",
    "window.addEventListener(\"beforeunload\"",
    "event.returnValue = \"\""
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

function checkPublicConfirmationGuidanceIsComplete() {
  const requiredByFile = {
    "admin-app/app/admin-client.tsx": [
      "確認するページ",
      "公開ページを開く",
      "1〜3分ほど待ってから公開サイトを再読み込みして確認してください",
      "最後にスマホでも表示を確認します"
    ],
    "docs/delivery-admin-manual.md": ["公開後の確認", "確認するページ", "公開ページ", "1〜3分", "再読み込み", "スマホ", "TOPのSNS欄", "Google Calendar", "スクリーンショット"],
    "docs/client-handoff-sheet.md": ["確認するページ", "公開ページ", "1〜3分", "再読み込み", "スマホ"],
    "docs/client-handoff-checklist.md": ["確認するページ", "1〜3分", "再読み込み", "スマホ"]
  };
  const missing = [];

  for (const [file, terms] of Object.entries(requiredByFile)) {
    if (!existsSync(file)) {
      missing.push(`${file}: missing`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of terms) {
      if (!text.includes(term)) {
        missing.push(`${file}: ${term}`);
      }
    }
  }

  add(
    "admin and handoff docs explain public confirmation after publish",
    missing.length === 0,
    missing.join(", ")
  );
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
    "^(\\d{1,2}):(\\d{2})$",
    "hours <= 23",
    "minutes <= 59",
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
    [syncFile, syncText, "function isValidClockTime"],
    [syncFile, syncText, "hours <= 23"],
    [syncFile, syncText, "minutes <= 59"],
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
  const requiredTerms = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_PUBLIC_SITE_URL",
    "公開サイトの本番URLと揃えてください",
    "ユーザーが開く本番URL",
    "検索エンジン向けの正規URL",
    "canonical、sitemap、OGP、JSON-LD、hreflang",
    "NEXT_PUBLIC_BASE_PATH",
    "Remove-Item Env:\\NEXT_PUBLIC_BASE_PATH",
    "公開後24時間以内に見ること",
    "https://www.bassic.jp/index.html",
    "下部固定CTA（電話、地図、Instagram、予約）",
    "Google Mapで `public bar Bassic.`",
    "機材PDFリンク",
    "Search Consoleで `https://www.bassic.jp/sitemap.xml`",
    "確認するページ"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));
  add("production checklist explains public URL envs", missing.length === 0, missing.join(", "));
}

function checkProductionHandoffCommands() {
  const file = "docs/production-handoff-checklist.md";
  if (!existsSync(file)) {
    add("production checklist lists current verification commands", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredCommands = [
    "npm run typecheck",
    "npm run typecheck:admin-app",
    "npm run check:admin-app",
    "npm run build",
    "npm run build:admin-app",
    "npm run smoke:links",
    "npm run smoke:content",
    "npm run smoke:seo",
    "npm run smoke:cms",
    "npm run sync:calendar:check"
  ];
  const requiredGuidance = [
    "毎回実行するもの",
    "microCMS接続情報を設定した後だけ実行するもの",
    "本物のmicroCMS接続情報で一度通します",
    "FacebookイベントをGoogle Calendarへ反映する前に実行するもの",
    "Google Calendarへ書き込まず",
    "警告が出た場合は同期せず"
  ];
  const missing = [...requiredCommands, ...requiredGuidance].filter((term) => !text.includes(term));

  add("production checklist lists current verification commands", missing.length === 0, missing.join(", "));
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

function checkAdminEditorShowsSectionPublicPageLinks() {
  const file = "admin-app/app/admin-client.tsx";
  if (!existsSync(file)) {
    add("admin editor shows section public page links", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "publicPagePaths",
    "getPublicPageUrl(section)",
    "確認するページ",
    "公開ページを開く",
    "events: \"/events/\"",
    "\"drink-menu-sheets\": \"/menu/\"",
    "\"equipment-rental\": \"/party/\""
  ];
  const missing = required.filter((item) => !text.includes(item));

  add("admin editor shows section public page links", missing.length === 0, missing.join(", "));
}

function checkAdminPublishNoticeShowsConfirmationSteps() {
  const clientFile = "admin-app/app/admin-client.tsx";
  const cssFile = "admin-app/app/globals.css";
  if (!existsSync(clientFile) || !existsSync(cssFile)) {
    add("admin publish notice shows confirmation steps", false, `${clientFile} or ${cssFile} missing`);
    return;
  }

  const clientText = readFileSync(clientFile, "utf8");
  const cssText = readFileSync(cssFile, "utf8");
  const required = [
    [clientFile, clientText, "confirmationSteps?: string[]"],
    [clientFile, clientText, "getPostPublishSteps(section)"],
    [clientFile, clientText, "1〜3分待ってから公開ページを再読み込み"],
    [clientFile, clientText, "スマホでも同じページを確認"],
    [clientFile, clientText, "TOPページのSNS欄を確認"],
    [clientFile, clientText, "Event ScheduleページとGoogle Calendar欄を確認"],
    [clientFile, clientText, "メニューページの画像・価格・チャージ表記を確認"],
    [clientFile, clientText, "Partyページの機材レンタル欄とPDFリンクを確認"],
    [clientFile, clientText, "Accessページで住所・電話・Google Mapを確認"],
    [clientFile, clientText, "notice-checklist"],
    [cssFile, cssText, ".notice-checklist"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("admin publish notice shows confirmation steps", missing.length === 0, missing.join(", "));
}

function checkDocsIndexBoundaries() {
  const file = "docs/admin-docs-index.md";
  if (!existsSync(file)) {
    add("admin docs index separates client and maintainer docs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "## 初回セットアップで見る順番",
    "## 納品先へ渡す資料",
    "## 制作者・保守担当だけが見る資料",
    "## 旧版・控え",
    "docs/microcms-current-status.md",
    "docs/microcms-field-definitions-v1.md",
    "docs/cms-sample-content-v1.json",
    "docs/microcms-setup-checklist.md",
    "docs/production-handoff-checklist.md",
    "docs/facebook-event-sync.md",
    "docs/delivery-admin-manual.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md",
    "日常更新用と保守用の切り分け",
    "公開後24時間以内の確認",
    "3つだけを店舗側へ渡す",
    "sync:calendar:check",
    "smoke:content"
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
    "`custom-sections`",
    "最初から全部を店舗側に見せる必要はありません",
    "日常更新できる状態を優先",
    "`page-copy`、`page-sections`、`custom-sections` は保守担当者向け",
    "作成順の目安",
    "`site-settings`: 住所、電話、営業時間、喫煙、テーブル・チャージを先に固める",
    "`hero-slides`: TOP、Events、Menu、Party、Accessの背景画像を入れる",
    "`events`: 直近イベント、FacebookイベントURL、Google Calendar依頼用情報を入れる"
  ];
  const stale = ["docs/cms-sample-content.json"].filter((term) => text.includes(term));
  const missing = required.filter((term) => !text.includes(term));
  const problems = [...missing.map((term) => `missing ${term}`), ...stale.map((term) => `stale ${term}`)];

  add("microCMS setup checklist uses current docs", problems.length === 0, problems.join(", "));
}

function checkMicrocmsSchemaUsesManagedSiteSettings() {
  const schemaFile = "docs/microcms-schema.md";
  const manualFile = "docs/delivery-admin-manual.md";
  if (!existsSync(schemaFile) || !existsSync(manualFile)) {
    add("microCMS schema uses managed site settings", false, `${schemaFile} or ${manualFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const manualText = readFileSync(manualFile, "utf8");
  const required = [
    [schemaFile, schemaText, "## site-settings"],
    [schemaFile, schemaText, "googleMapsUrl"],
    [schemaFile, schemaText, "directionsUrl"],
    [schemaFile, schemaText, "instagramUrl"],
    [schemaFile, schemaText, "facebookUrl"],
    [schemaFile, schemaText, "xUrl"],
    [schemaFile, schemaText, "Google Map欄にSNS URLを入れる"],
    [schemaFile, schemaText, "営業時間、Google Map URL、SNS URLは `site-settings` で管理します"],
    [manualFile, manualText, "違う種類のURLを入れると管理画面でエラーが出ます。"]
  ];
  const stale = [[schemaFile, schemaText, "営業時間やGoogle Map URLはCMSではなく"]];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);
  const staleFound = stale.filter(([, text, term]) => text.includes(term)).map(([file, , term]) => `${file}: stale ${term}`);

  add("microCMS schema uses managed site settings", missing.length === 0 && staleFound.length === 0, [...missing, ...staleFound].join(", "));
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

function checkAdminSchemaFieldsAreDocumented() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const docsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(schemaFile) || !existsSync(docsFile)) {
    add("admin schema fields are documented", false, `${schemaFile} or ${docsFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const keys = [...schemaText.matchAll(/key:\s*"([^"]+)"/g)].map((match) => match[1]);
  const missing = [...new Set(keys)].filter((key) => !docsText.includes(`\`${key}\``));

  add("admin schema fields are documented", missing.length === 0, missing.join(", "));
}

function checkAdminFieldDocsRequiredFlags() {
  const docsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(docsFile)) {
    add("admin field docs required flags match safe defaults", false, `${docsFile} missing`);
    return;
  }

  const text = readFileSync(docsFile, "utf8");
  const required = [
    "| 喫煙について | `smokingLabel` | テキストエリア | no |",
    "| テーブル・チャージ | `chargeLabel` | テキスト | no |",
    "| 初回来店説明文 | `firstVisitLead` | テキストエリア | no |",
    "| アクセス補足 | `accessNote` | テキストエリア | no |",
    "`firstVisitLead` と `accessNote` は未入力でも公開サイトの既存文言を使います。"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("admin field docs required flags match safe defaults", missing.length === 0, missing.join(", "));
}

function checkMicrocmsSetupChecklistFieldDetails() {
  const file = "docs/microcms-setup-checklist.md";
  if (!existsSync(file)) {
    add("microCMS setup checklist field details are current", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "| `firstVisitLead` | 初めての方向け説明 | テキストエリア | 任意 |",
    "| `accessNote` | アクセス補足 | テキストエリア | 任意 |",
    "`firstVisitLead` と `accessNote` は未入力でも公開サイトの既存文言を使います。",
    "## 5. drink-menu-sheets",
    "| `image` | メニュー表画像 | 画像 | 必須 |",
    "## 7. equipment-rental",
    "| `pdfUrl` | PDFリンク | テキストフィールド | 任意 |",
    "## 11. 接続確認"
  ];
  const stale = [
    "| `firstVisitLead` | 初めての方向け説明 | テキストエリア | 必須 |",
    "| `accessNote` | アクセス補足 | テキストエリア | 必須 |",
    "## 7. FacebookイベントとGoogle Calendar連携の注意",
    "## 9. 接続確認"
  ];
  const missing = required.filter((term) => !text.includes(term)).map((term) => `missing ${term}`);
  const staleFound = stale.filter((term) => text.includes(term)).map((term) => `stale ${term}`);

  add("microCMS setup checklist field details are current", missing.length === 0 && staleFound.length === 0, [...missing, ...staleFound].join(", "));
}

function checkTopImagesAreManagedByHeroSlides() {
  const adminSchema = "admin-app/lib/admin-schema.ts";
  const seedFile = "scripts/microcms-seed-data.mjs";
  const fieldDocs = "docs/microcms-field-definitions-v1.md";
  const setupDocs = "docs/microcms-setup-checklist.md";
  const files = [adminSchema, seedFile, fieldDocs, setupDocs];
  const missingFiles = files.filter((file) => !existsSync(file));
  if (missingFiles.length) {
    add("TOP images are managed only through hero-slides", false, `${missingFiles.join(", ")} missing`);
    return;
  }

  const adminText = readFileSync(adminSchema, "utf8");
  const seedText = readFileSync(seedFile, "utf8");
  const fieldText = readFileSync(fieldDocs, "utf8");
  const setupText = readFileSync(setupDocs, "utf8");
  const problems = [];

  if (adminText.includes('key: "heroImage"')) {
    problems.push("admin schema still exposes home.heroImage");
  }
  if (seedText.includes("heroImage:")) {
    problems.push("seed data still writes home.heroImage");
  }
  if (fieldText.includes("| TOP画像 | `heroImage`")) {
    problems.push("field docs still instruct home.heroImage");
  }
  if (!fieldText.includes("`hero-slides`") || !setupText.includes("`hero-slides` の `page = home`")) {
    problems.push("docs should direct TOP画像 to hero-slides page = home");
  }

  add("TOP images are managed only through hero-slides", problems.length === 0, problems.join(", "));
}

function checkMaintainerOnlyFieldsAreClear() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const docsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(schemaFile) || !existsSync(docsFile)) {
    add("maintainer-only page settings are clear", false, `${schemaFile} or ${docsFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const problems = [];

  if (schemaText.includes('key: "listTitle"') || schemaText.includes('key: "listEyebrow"')) {
    problems.push("unused list copy fields should not appear in admin schema");
  }
  if (docsText.includes("`listTitle`") || docsText.includes("`listEyebrow`")) {
    problems.push("unused list copy fields should not appear in field docs");
  }
  if (!schemaText.includes('title: "ページ文言（保守用）"') || !schemaText.includes('title: "セクション表示（保守用）"')) {
    problems.push("admin schema should label page copy and section settings as maintainer-facing");
  }
  if (!docsText.includes("保守用の文言設定") || !docsText.includes("保守用の表示切替")) {
    problems.push("field docs should explain maintainer-only page settings");
  }

  add("maintainer-only page settings are clear", problems.length === 0, problems.join(", "));
}

function checkSiteSettingsPlaceholdersUseCurrentCopy() {
  const file = "admin-app/lib/admin-schema.ts";
  if (!existsSync(file)) {
    add("site settings placeholders use current copy", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "通常営業 20:00 OPEN / L.O. 1:30 / 2:00 CLOSE",
    "イベントがある日は 22:30 から通常営業",
    "※イベントにより異なる場合もございます",
    "イベント終了後は 22:30 から通常営業です。",
    "店内喫煙OK（紙タバコ・電子タバコOK）",
    "※未成年の入店はお断りしております。",
    "※イベント内容によりイベント中は禁煙になる場合がございます。",
    "テーブル・チャージ 500円 / お一人様"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("site settings placeholders use current copy", missing.length === 0, missing.join(", "));
}

function checkMenuDescriptionExplainsSupplementalUse() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const publicCmsFile = "lib/microcms.ts";
  const smokeFile = "scripts/smoke-cms.mjs";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  const setupFile = "docs/microcms-setup-checklist.md";
  if (!existsSync(schemaFile) || !existsSync(publicCmsFile) || !existsSync(smokeFile) || !existsSync(fieldDocsFile) || !existsSync(setupFile)) {
    add("menu description explains supplemental use", false, `${schemaFile}, ${publicCmsFile}, ${smokeFile}, ${fieldDocsFile}, or ${setupFile} missing`);
    return;
  }

  const checks = [
    [schemaFile, readFileSync(schemaFile, "utf8"), "label: \"補足メモ\""],
    [schemaFile, readFileSync(schemaFile, "utf8"), "メニューカードは画像・名前・料金を中心に表示します"],
    [publicCmsFile, readFileSync(publicCmsFile, "utf8"), "function normalizeMenuItem"],
    [publicCmsFile, readFileSync(publicCmsFile, "utf8"), "category: item.category === \"drink\" ? \"drink\" : \"food\""],
    [smokeFile, readFileSync(smokeFile, "utf8"), "if (item.category)"],
    [fieldDocsFile, readFileSync(fieldDocsFile, "utf8"), "| 補足メモ | `description`"],
    [fieldDocsFile, readFileSync(fieldDocsFile, "utf8"), "通常のメニューカード本文としては使いません"],
    [fieldDocsFile, readFileSync(fieldDocsFile, "utf8"), "店舗側が選ぶ必要はありません"],
    [setupFile, readFileSync(setupFile, "utf8"), "`description` | 補足メモ"],
    [setupFile, readFileSync(setupFile, "utf8"), "通常のメニューカード本文としては使いません"],
    [setupFile, readFileSync(setupFile, "utf8"), "店舗側が選ぶ必要はありません"]
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
    "## 9. FacebookイベントとGoogle Calendar連携の注意",
    "## 10. 作成時のミス防止",
    "API IDは上の表と完全一致",
    "`sourceId`、`sourceType`、`category` は店舗側が普段触らない項目",
    "画像フィールドは、URL文字列ではなくmicroCMSの画像フィールド",
    "料金は `¥1,200` や `￥4,000〜 / 1名` のような表記を入れるためテキスト",
    "## 11. 接続確認"
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

function checkCmsSmokeValidatesPublishedMenuItems() {
  const smokeFile = "scripts/smoke-cms.mjs";
  if (!existsSync(smokeFile)) {
    add("CMS smoke validates published menu items", false, `${smokeFile} missing`);
    return;
  }

  const text = readFileSync(smokeFile, "utf8");
  const requiredTerms = [
    'path: "/menu?limit=100"',
    "for (const item of list.contents)",
    "item.isPublished !== false",
    'requiredString(item, "price", "menu")',
    'requiredImage(item, "image", "menu")'
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates published menu items", missing.length === 0, missing.join(", "));
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
    "function isValidTimeValue",
    "hours <= 23",
    "minutes <= 59",
    "time should be a valid HH:mm value"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates event times as HH:mm", missing.length === 0, missing.join(", "));
}

function checkCmsSmokeValidatesPublishedTextDepth() {
  const smokeFile = "scripts/smoke-cms.mjs";
  if (!existsSync(smokeFile)) {
    add("CMS smoke validates published text depth", false, `${smokeFile} missing`);
    return;
  }

  const text = readFileSync(smokeFile, "utf8");
  const requiredTerms = [
    "function requiredText",
    "function optionalText",
    "function countTextLength",
    "text is too short",
    'requiredText(item, "title", "events", 4)',
    'requiredText(item, "body", "party-plans", 12)',
    'requiredText(item, "description", "social-notices", 10)',
    'requiredText(item, "body", "custom-sections", 20)',
    "function optionalUrl",
    "function optionalLinkPair",
    'optionalUrl(item, "linkUrl", "custom-sections")',
    'optionalLinkPair(item, "linkLabel", "linkUrl", "custom-sections")'
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("CMS smoke validates published text depth", missing.length === 0, missing.join(", "));
}

function checkDocsExplainPublishedTextDepth() {
  const deliveryFile = "docs/delivery-admin-manual.md";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  const setupFile = "docs/microcms-setup-checklist.md";
  if (!existsSync(deliveryFile) || !existsSync(fieldDocsFile) || !existsSync(setupFile)) {
    add("CMS docs explain published text depth", false, `${deliveryFile}, ${fieldDocsFile}, or ${setupFile} missing`);
    return;
  }

  const deliveryText = readFileSync(deliveryFile, "utf8");
  const fieldDocsText = readFileSync(fieldDocsFile, "utf8");
  const setupText = readFileSync(setupFile, "utf8");
  const required = [
    [deliveryFile, deliveryText, "タイトルは6文字以上、説明は10文字以上"],
    [deliveryFile, deliveryText, "何のお知らせか"],
    [fieldDocsFile, fieldDocsText, "プラン名を4文字以上、説明を12文字以上"],
    [fieldDocsFile, fieldDocsText, "表示タイトルを6文字以上、説明を10文字以上"],
    [fieldDocsFile, fieldDocsText, "見出しを6文字以上、本文を20文字以上"],
    [fieldDocsFile, fieldDocsText, "リンク文言とリンクURLを両方入力"],
    [setupFile, setupText, "プラン名を4文字以上、説明を12文字以上"],
    [setupFile, setupText, "表示タイトルを6文字以上、短い説明を10文字以上"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("CMS docs explain published text depth", missing.length === 0, missing.join(", "));
}

function checkAdminValidatesPublishedTextDepth() {
  const adminFile = "admin-app/app/admin-client.tsx";
  const schemaFile = "admin-app/lib/admin-schema.ts";
  if (!existsSync(adminFile) || !existsSync(schemaFile)) {
    add("admin validates published text depth", false, `${adminFile} or ${schemaFile} missing`);
    return;
  }

  const adminText = readFileSync(adminFile, "utf8");
  const schemaText = readFileSync(schemaFile, "utf8");
  const required = [
    [adminFile, adminText, "function countTextLength"],
    [adminFile, adminText, 'section.id === "events"'],
    [adminFile, adminText, "イベント名を4文字以上"],
    [adminFile, adminText, 'section.id === "social-notices"'],
    [adminFile, adminText, "タイトルを6文字以上"],
    [adminFile, adminText, "説明を10文字以上"],
    [adminFile, adminText, 'section.id === "party-plans"'],
    [adminFile, adminText, "プラン名を4文字以上"],
    [adminFile, adminText, "説明を12文字以上"],
    [adminFile, adminText, 'section.id === "custom-sections"'],
    [adminFile, adminText, "本文を20文字以上"],
    [adminFile, adminText, "リンクURLを使う場合は、リンクボタン名も入力"],
    [adminFile, adminText, "リンクボタン名を使う場合は、リンクURLも入力"],
    [schemaFile, schemaText, "公開する場合は12文字以上"],
    [schemaFile, schemaText, "公開する場合は6文字以上"],
    [schemaFile, schemaText, "公開する場合は10文字以上"],
    [schemaFile, schemaText, "公開する場合は20文字以上"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("admin validates published text depth", missing.length === 0, missing.join(", "));
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

function checkSeedDataMatchesPublishRules() {
  const file = "scripts/microcms-seed-data.mjs";
  if (!existsSync(file)) {
    add("microCMS seed data matches publish rules", false, `${file} missing`);
    return;
  }

  let seedData;
  try {
    seedData = loadSeedDataForCheck(file);
  } catch (error) {
    add("microCMS seed data matches publish rules", false, `${file} could not be evaluated: ${error.message}`);
    return;
  }

  const lists = seedData?.lists || {};
  const problems = [];
  for (const [index, item] of (lists.menu || []).entries()) {
    if (item?.isPublished !== false && (!item?.price || !item?.image?.url)) {
      problems.push(`menu[${index}] published item needs price and image`);
    }
  }
  for (const [index, item] of (lists.events || []).entries()) {
    if (item?.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      problems.push(`events[${index}].date should be YYYY-MM-DD`);
    }
  }
  for (const [index, item] of (lists["drink-menu-sheets"] || []).entries()) {
    if (item?.isPublished !== false && !item?.image?.url) {
      problems.push(`drink-menu-sheets[${index}] published item needs image`);
    }
  }
  for (const [index, item] of (lists["party-plans"] || []).entries()) {
    if (item?.isPublished !== false && (!item?.price || typeof item?.body !== "string" || item.body.length < 12)) {
      problems.push(`party-plans[${index}] published item needs price and body`);
    }
  }
  for (const [index, item] of (lists["social-notices"] || []).entries()) {
    if (item?.isPublished !== false && (!item?.url || typeof item?.title !== "string" || item.title.length < 6 || typeof item?.description !== "string" || item.description.length < 10)) {
      problems.push(`social-notices[${index}] published item needs URL, title, and description`);
    }
  }

  add("microCMS seed data matches publish rules", problems.length === 0, problems.join(", "));
}

function loadSeedDataForCheck(file) {
  const text = readFileSync(file, "utf8");
  const marker = "export const seedData =";
  if (!text.includes(marker)) {
    throw new Error("seedData export missing");
  }

  const body = text.replace(marker, "return");
  return new Function(body)();
}

function checkPublicCmsFallbackGuards() {
  const file = "lib/microcms.ts";
  if (!existsSync(file)) {
    add("public CMS fallback guards keep partial content visible", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "const fallbackSiteSettings = fallbackContents.siteSettings as SiteSettings",
    "function mergeSiteSettings",
    "function isGoogleMapUrl",
    "function isInstagramUrl",
    "function isFacebookUrl",
    "function isXUrl",
    "address: nonEmptyString(settings?.address) || fallbackSiteSettings.address",
    "googleMapsUrl,",
    "directionsUrl,",
    "const visiblePlans",
    "visiblePlans.length ? visiblePlans",
    "const visibleSheets",
    "visibleSheets.length ? visibleSheets",
    "const fallbackNotices",
    "visibleNotices.length ? visibleNotices : fallbackNotices",
    "function hasUsableCustomSectionLink",
    "function isManagedUrl",
    "hasUsableCustomSectionLink(section)",
    "Boolean(section.title && section.body)"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));
  const stale = ['import { site } from "./site"'].filter((term) => text.includes(term));

  add("public CMS fallback guards keep partial content visible", missing.length === 0 && stale.length === 0, [...missing, ...stale.map((term) => `stale ${term}`)].join(", "));
}

function checkAssetPathKeepsExternalUrls() {
  const file = "lib/assets.ts";
  if (!existsSync(file)) {
    add("asset path helper keeps CMS/external URLs usable", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const requiredTerms = [
    "externalUrlPattern",
    "specialUrlPattern",
    "externalUrlPattern.test(path)",
    "specialUrlPattern.test(path)"
  ];
  const missing = requiredTerms.filter((term) => !text.includes(term));

  add("asset path helper keeps CMS/external URLs usable", missing.length === 0, missing.join(", "));
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

function checkSampleContentMatchesPublishRules() {
  const file = "docs/cms-sample-content-v1.json";
  if (!existsSync(file)) {
    add("CMS sample content matches publish rules", false, `${file} missing`);
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    add("CMS sample content matches publish rules", false, `${file} is not valid JSON: ${error.message}`);
    return;
  }

  const problems = [];
  validateSampleSiteSettingsUrls(data["site-settings"], problems);

  for (const [index, item] of (data.menu || []).entries()) {
    if (item?.isPublished !== false && (!item?.price || !item?.image?.url)) {
      problems.push(`menu[${index}] published item needs price and image`);
    }
  }
  for (const [index, item] of (data.events || []).entries()) {
    if (item?.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      problems.push(`events[${index}].date should be YYYY-MM-DD`);
    }
  }
  for (const [index, item] of (data["drink-menu-sheets"] || []).entries()) {
    if (item?.isPublished !== false && !item?.image?.url) {
      problems.push(`drink-menu-sheets[${index}] published item needs image`);
    }
  }
  for (const [index, item] of (data["social-notices"] || []).entries()) {
    validateSampleSocialNoticeUrl(item, index, problems);
  }

  add("CMS sample content matches publish rules", problems.length === 0, problems.join(", "));
}

function validateSampleSiteSettingsUrls(settings, problems) {
  const urlRules = [
    ["googleMapsUrl", ["google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"]],
    ["directionsUrl", ["google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"]],
    ["instagramUrl", ["instagram.com"]],
    ["facebookUrl", ["facebook.com", "m.facebook.com", "mbasic.facebook.com", "fb.me"]],
    ["xUrl", ["x.com", "twitter.com"]]
  ];

  for (const [field, hosts] of urlRules) {
    const host = getSampleUrlHost(settings?.[field]);
    if (!host || !hosts.includes(host)) {
      problems.push(`site-settings.${field} should use ${hosts.join(" or ")}`);
    }
  }
}

function validateSampleSocialNoticeUrl(item, index, problems) {
  if (!item?.url) {
    problems.push(`social-notices[${index}].url is required`);
    return;
  }

  const host = getSampleUrlHost(item.url);
  if (item.platform === "instagram" && host !== "instagram.com") {
    problems.push(`social-notices[${index}].url should use instagram.com`);
  }
  if (item.platform === "facebook" && !["facebook.com", "m.facebook.com", "mbasic.facebook.com", "fb.me"].includes(host)) {
    problems.push(`social-notices[${index}].url should use facebook.com`);
  }
  if (item.platform === "x" && !["x.com", "twitter.com"].includes(host)) {
    problems.push(`social-notices[${index}].url should use x.com or twitter.com`);
  }
}

function getSampleUrlHost(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}

function checkEventDateIsDateOnlyGuidance() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const setupFile = "docs/microcms-setup-checklist.md";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(schemaFile) || !existsSync(setupFile) || !existsSync(fieldDocsFile)) {
    add("event date field is explained as date-only", false, `${schemaFile}, ${setupFile}, or ${fieldDocsFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const setupText = readFileSync(setupFile, "utf8");
  const fieldDocsText = readFileSync(fieldDocsFile, "utf8");
  const required = [
    [schemaFile, schemaText, "開催日だけを選びます"],
    [schemaFile, schemaText, "時刻は下の時間欄に入力します"],
    [setupFile, setupText, "| `date` | 開催日 | 日付 |"],
    [setupFile, setupText, "`date` は開催日だけを入れます"],
    [fieldDocsFile, fieldDocsText, "| 日付 | `date` | 日付 |"],
    [fieldDocsFile, fieldDocsText, "`日付` は開催日のみを入れます"]
  ];
  const stale = [
    [setupFile, setupText, "| `date` | 開催日 | 日時 |"],
    [fieldDocsFile, fieldDocsText, "| 日付 | `date` | 日時 |"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);
  const staleHits = stale.filter(([, text, term]) => text.includes(term)).map(([file, , term]) => `${file}: stale ${term}`);

  add("event date field is explained as date-only", missing.length === 0 && staleHits.length === 0, [...missing, ...staleHits].join(", "));
}

function checkGoogleBusinessProfileChecklistUsesCurrentCopy() {
  const file = "docs/google-business-profile-checklist.md";
  if (!existsSync(file)) {
    add("Google Business Profile checklist uses current copy", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "https://www.bassic.jp/index.html",
    "Search Consoleやsitemapは `/` 基準",
    "イベント終了後は22:30から通常営業",
    "未成年入店不可",
    "イベント内容によりイベント中は禁煙になる場合あり",
    "テーブル・チャージ: 500円 / お一人様"
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("Google Business Profile checklist uses current copy", missing.length === 0, missing.join(", "));
}

function checkMenuPublishRequiresPriceAndImage() {
  const adminFile = "admin-app/app/admin-client.tsx";
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const setupFile = "docs/microcms-setup-checklist.md";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(adminFile) || !existsSync(schemaFile) || !existsSync(setupFile) || !existsSync(fieldDocsFile)) {
    add("menu publish requires price and image", false, `${adminFile}, ${schemaFile}, ${setupFile}, or ${fieldDocsFile} missing`);
    return;
  }

  const adminText = readFileSync(adminFile, "utf8");
  const schemaText = readFileSync(schemaFile, "utf8");
  const setupText = readFileSync(setupFile, "utf8");
  const fieldDocsText = readFileSync(fieldDocsFile, "utf8");
  const required = [
    [adminFile, adminText, "section.id === \"menu\" && nextDraft.isPublished"],
    [adminFile, adminText, "フードを公開する前に料金を入力してください。"],
    [adminFile, adminText, "フードを公開する前に画像を入れてください。"],
    [schemaFile, schemaText, "公開する場合は必ず入れます"],
    [setupFile, setupText, "公開する場合は料金と画像の入力を必須として扱います"],
    [fieldDocsFile, fieldDocsText, "公開する場合は料金と画像の入力を必須として扱います"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("menu publish requires price and image", missing.length === 0, missing.join(", "));
}

function checkNumberFieldsUseWholeNumberValidation() {
  const adminFile = "admin-app/app/admin-client.tsx";
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const setupFile = "docs/microcms-setup-checklist.md";
  const fieldDocsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(adminFile) || !existsSync(schemaFile) || !existsSync(setupFile) || !existsSync(fieldDocsFile)) {
    add("number fields use whole-number validation", false, `${adminFile}, ${schemaFile}, ${setupFile}, or ${fieldDocsFile} missing`);
    return;
  }

  const adminText = readFileSync(adminFile, "utf8");
  const schemaText = readFileSync(schemaFile, "utf8");
  const setupText = readFileSync(setupFile, "utf8");
  const fieldDocsText = readFileSync(fieldDocsFile, "utf8");
  const required = [
    [adminFile, adminText, "function isValidWholeNumber"],
    [adminFile, adminText, "field.type === \"number\" && !isValidWholeNumber"],
    [adminFile, adminText, "0以上の半角整数"],
    [schemaFile, schemaText, "0以上の半角整数"],
    [setupFile, setupText, "0以上の半角整数だけを入力します"],
    [fieldDocsFile, fieldDocsText, "0以上の半角整数だけを入力します"]
  ];
  const missing = required.filter(([, text, term]) => !text.includes(term)).map(([file, , term]) => `${file}: ${term}`);

  add("number fields use whole-number validation", missing.length === 0, missing.join(", "));
}

function checkCmsSmokeValidatesDisplayOrderNumbers() {
  const file = "scripts/smoke-cms.mjs";
  if (!existsSync(file)) {
    add("CMS smoke validates display order numbers", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "function optionalWholeNumber",
    "function validateDisplayOrderUniqueness",
    "duplicate display order",
    "Use unique numbers for published items",
    "orderGroupFields",
    'optionalWholeNumber(item, "displayOrder", "hero-slides")',
    'optionalWholeNumber(item, "displayOrder", "menu")',
    'optionalWholeNumber(item, "displayOrder", "drink-menu-sheets")',
    'optionalWholeNumber(item, "displayOrder", "party-plans")',
    'optionalWholeNumber(item, "displayOrder", "page-copy")',
    'optionalWholeNumber(item, "displayOrder", "page-sections")',
    'optionalWholeNumber(item, "displayOrder", "custom-sections")'
  ];
  const missing = required.filter((term) => !text.includes(term));

  add("CMS smoke validates display order numbers", missing.length === 0, missing.join(", "));
}
