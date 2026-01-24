import assembleReleasePlan from "@changesets/assemble-release-plan";
import readChangesets from "@changesets/read";
import { read } from "@changesets/config";
import { getPackages } from "@manypkg/get-packages";
import { readPreState } from "@changesets/pre";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const root = path.resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Get new version string from changesets */
export async function getNewVersion(): Promise<string> {
  const packages = await getPackages(root);
  const preState = await readPreState(root);
  const config = await read(root, packages);
  const changesets = await readChangesets(root);

  const releasePlan = assembleReleasePlan(
    changesets,
    packages,
    config,
    preState,
  );

  return releasePlan.releases.find(
    ({ name }) => name === "eslint-plugin-json-schema-validator",
  )!.newVersion;
}
