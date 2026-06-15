export type AdminEnvCheck = {
  key: string;
  label: string;
  present: boolean;
  requiredFor: "login" | "save" | "publish";
};

const envDefinitions: Array<Omit<AdminEnvCheck, "present">> = [
  { key: "ADMIN_PASSWORD", label: "管理画面パスワード", requiredFor: "login" },
  { key: "ADMIN_SESSION_SECRET", label: "ログイン保持設定", requiredFor: "login" },
  { key: "MICROCMS_SERVICE_DOMAIN", label: "保存先サービス設定", requiredFor: "save" },
  { key: "MICROCMS_API_KEY", label: "保存先接続設定", requiredFor: "save" },
  { key: "GITHUB_DISPATCH_TOKEN", label: "公開反映設定", requiredFor: "publish" }
];

export function getAdminEnvChecks(): AdminEnvCheck[] {
  return envDefinitions.map((definition) => ({
    ...definition,
    present: Boolean(process.env[definition.key])
  }));
}

export function getMissingAdminEnv() {
  return getAdminEnvChecks().filter((check) => !check.present);
}
