// Production checks never create, update, publish, or delete CMS content.
import { checkAdminSite } from "./check-public-readonly.mjs";
try {
  console.log(
    "Admin production read-only check passed.",
    await checkAdminSite({ baseUrl: process.env.ADMIN_APP_URL }),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
