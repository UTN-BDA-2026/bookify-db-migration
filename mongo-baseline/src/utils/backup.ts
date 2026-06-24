export const MONGO_CONTAINER = "bookify-mongo";
export const MONGO_CONTAINER_BACKUP_PATH = "/tmp/bookify-mongo-backup.archive.gz";

export function getMongoContainerUri(mongoUrl: string): string {
  const dbName = mongoUrl.match(/\/([^/?]+)(?:\?|$)/)?.[1] ?? "bookify_baseline";
  return `mongodb://127.0.0.1:27017/${dbName}`;
}
