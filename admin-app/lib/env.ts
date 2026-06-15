export type AdminEnvCheck = {
  key: string;
  label: string;
  present: boolean;
  requiredFor: "login" | "save" | "publish";
};

const envDefinitions: Array<Omit<AdminEnvCheck, "present">> = [
  { key: "ADMIN_PASSWORD", label: "管理画面パスワード", requiredFor: "login" },
  { key: "ADMIN_SESSION_SECRET", label: "ログイン保持用シークレット", requiredFor: "login" },
  { key: "MICROCMS_SERVICE_DOMAIN", label: "microCMSサービスID", requiredFor: "save" },
  { key: "MICROCMS_API_KEY", label: "microCMS APIキー", requiredFor: "save" },
  { key: "GITHUB_DISPATCH_TOKEN", label: "GitHub反映用トークン", requiredFor: "publish" }
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
