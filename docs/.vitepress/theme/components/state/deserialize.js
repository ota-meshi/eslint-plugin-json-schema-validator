import pako from "pako";

/**
 * Deserialize a given serialized string then update this object.
 * @param {string} serializedString A serialized string.
 * @returns {object} The deserialized state.
 */
export function deserializeState(serializedString) {
  const state = {
    fileName: undefined,
    code: undefined,
    rules: undefined,
  };

  if (serializedString === "") {
    return state;
  }

  try {
    const decodedText = window.atob(serializedString);
    const jsonText = pako.inflate(
      Uint8Array.from(decodedText, (c) => c.charCodeAt(0)),
      { to: "string" },
    );
    const json = JSON.parse(jsonText);

    if (typeof json === "object" && json != null) {
      if (typeof json.code === "string") {
        state.code = json.code;
      }
      if (typeof json.fileName === "string") {
        state.fileName = json.fileName;
      }
      if (typeof json.rules === "object" && json.rules != null) {
        state.rules = {};
        for (const id of Object.keys(json.rules)) {
          state.rules[id] = json.rules[id] === 2 ? "error" : "off";
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console -- demo
    console.error(error);
  }

  return state;
}
