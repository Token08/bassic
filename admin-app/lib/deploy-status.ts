/** The deployment API contract shared by both editor screens. */
export type PublishStatus = {
  state: "pending" | "published" | "failed" | "unconfirmed";
  actionsUrl?: string;
};
