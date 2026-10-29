import { getReleasePlan } from "@changesets/get-release-plan";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const root = path.resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Get new version string from changesets */
export async function getNewVersion(): Promise<string> {
  const releasePlan = await getReleasePlan(root);

  const newVersion = releasePlan.releases.find(
    ({ name }) => name === "eslint-plugin-json-schema-validator",
  )?.newVersion;
  if (newVersion === undefined) {
    throw new Error(
      "No release version found for eslint-plugin-json-schema-validator.",
    );
  }
  return newVersion;
}
