<template>
  <div class="app">
    <sns-bar />
    <div class="tools">
      <label class="file-name">FileName: <input v-model="fileName" /></label>

      <label>Examples: </label>
      <button @click="onClickExampleJavaScript">JavaScript</button>
      <button @click="onClickExampleJSON">JSON</button>
      <button @click="onClickExampleYAML">YAML</button>
      <button @click="onClickExampleTOML">TOML</button>
      <button @click="onClickExampleVue">Vue</button>
    </div>

    <div class="main-content">
      <rules-settings
        ref="settings"
        class="rules-settings"
        :rules.sync="rules"
      />
      <div class="editor-content">
        <pg-editor
          v-model="code"
          :rules="rules"
          :file-name="fileName"
          class="eslint-playground"
          @change="onChange"
        />
        <div class="messages">
          <ol>
            <li
              v-for="(msg, i) in messages"
              :key="msg.line + ':' + msg.column + ':' + msg.ruleId + '@' + i"
              class="message"
            >
              [{{ msg.line }}:{{ msg.column }}]: {{ msg.message }} (<a
                :href="getRule(msg.ruleId).url"
                target="_blank"
              >
                {{ msg.ruleId }} </a
              >)
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PgEditor from "./components/PgEditor.vue";
import RulesSettings from "./components/RulesSettings.vue";
import SnsBar from "./components/SnsBar.vue";
import { deserializeState, serializeState } from "./state";
import { DEFAULT_RULES_CONFIG, getRule } from "./rules";

const DEFAULT_CODE = `{
    "extends": [ 42 ],
    "env": {
        "browser": true
    },
    "rules": {
        "eqeqeq": "warn",
        "strict": "off"
    }
}
`;

const JS_CODE = `/* eslint json-schema-validator/no-invalid: [
      "error",
      "https://json.schemastore.org/eslintrc"
   ]
   -- About options: https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/no-invalid.html#options
*/
module.exports = {
    extends: [ 42 ],
    env: {
        browser: true
    },
    rules: {
        eqeqeq: "warn",
        strict: "off"
    }
}
`;
const JSON_CODE = `/* eslint json-schema-validator/no-invalid: [
      "error",
      "https://json.schemastore.org/eslintrc"
   ]
   -- About options: https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/no-invalid.html#options
*/
{
    "extends": [ 42 ],
    "env": {
        "browser": true
    },
    "rules": {
        "eqeqeq": "warn",
        "strict": "off"
    }
}
`;
const YAML_CODE = `# eslint json-schema-validator/no-invalid: [error, "https://json.schemastore.org/eslintrc"]
# -- About options: https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/no-invalid.html#options
extends:
  - 42
env:
  browser": true
rules:
  "eqeqeq": "warn"
  "strict": "off"
`;
const TOML_CODE = `# eslint json-schema-validator/no-invalid: [error, "https://json.schemastore.org/prettierrc"]
# -- About options: https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/no-invalid.html#options
trailingComma = "es3"
tabWidth = 4
semi = false
singleQuote = true
`;
// eslint-disable-next-line no-useless-escape -- ignore
const scriptEnd = `<\/script>`;
const VUE_CODE = `<i18n>
42
</i18n>
<script>
/* eslint json-schema-validator/no-invalid: [error, { schemas: [{ fileMatch: ['*.vue/*blockType=i18n*'],schema: { type: object } }] }]
 -- About options: https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/no-invalid.html#options */
${scriptEnd}
`;

export default {
  name: "PlaygroundBlock",
  components: { PgEditor, RulesSettings, SnsBar },
  data() {
    const serializedString =
      (typeof window !== "undefined" && window.location.hash.slice(1)) || "";
    const state = deserializeState(serializedString);
    return {
      fileName: state.fileName || ".eslintrc.json",
      code: state.code || DEFAULT_CODE,
      rules: state.rules || Object.assign({}, DEFAULT_RULES_CONFIG),
      messages: [],
    };
  },
  computed: {
    serializedString() {
      const defaultCode = DEFAULT_CODE;
      const defaultRules = DEFAULT_RULES_CONFIG;
      const fileName =
        this.fileName === ".eslintrc.json" ? undefined : this.fileName;
      const code = defaultCode === this.code ? undefined : this.code;
      const rules = equalsRules(defaultRules, this.rules)
        ? undefined
        : this.rules;
      const serializedString = serializeState({
        fileName,
        code,
        rules,
      });
      return serializedString;
    },
  },
  watch: {
    serializedString(serializedString) {
      if (typeof window !== "undefined") {
        window.location.replace(`#${serializedString}`);
      }
    },
  },
  mounted() {
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", this.onUrlHashChange);
    }
  },
  beforeDestroey() {
    if (typeof window !== "undefined") {
      window.removeEventListener("hashchange", this.onUrlHashChange);
    }
  },
  methods: {
    onChange({ messages }) {
      this.messages = messages;
    },
    getRule(ruleId) {
      return getRule(ruleId);
    },
    onUrlHashChange() {
      const serializedString =
        (typeof window !== "undefined" && window.location.hash.slice(1)) || "";
      if (serializedString !== this.serializedString) {
        const state = deserializeState(serializedString);
        this.fileName = state.fileName || ".eslintrc.json";
        this.code = state.code || DEFAULT_CODE;
        this.rules = state.rules || Object.assign({}, DEFAULT_RULES_CONFIG);
      }
    },
    onClickExampleJavaScript() {
      this.fileName = ".eslintrc.js";
      this.code = JS_CODE;
    },
    onClickExampleJSON() {
      this.fileName = ".eslintrc.json";
      this.code = JSON_CODE;
    },
    onClickExampleYAML() {
      this.fileName = ".eslintrc.yaml";
      this.code = YAML_CODE;
    },
    onClickExampleTOML() {
      this.fileName = ".prettierrc.toml";
      this.code = TOML_CODE;
    },
    onClickExampleVue() {
      this.fileName = "App.vue";
      this.code = VUE_CODE;
    },
  },
};

function equalsRules(a, b) {
  const akeys = Object.keys(a).filter((k) => a[k] !== "off");
  const bkeys = Object.keys(b).filter((k) => b[k] !== "off");
  if (akeys.length !== bkeys.length) {
    return false;
  }

  for (const k of akeys) {
    if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
}
</script>
<style scoped>
.tools {
  padding-top: 16px;
}

.main-content {
  display: flex;
  flex-wrap: wrap;
  height: calc(100% - 140px);
  border: 1px solid #cfd4db;
  background-color: #282c34;
  color: #f8c555;
}

.main-content > .rules-settings {
  height: 100%;
  overflow: auto;
  width: 25%;
  box-sizing: border-box;
}

.main-content > .editor-content {
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #cfd4db;
}

.main-content > .editor-content > .eslint-playground {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 3px;
}

.main-content > .editor-content > .messages {
  height: 30%;
  width: 100%;
  overflow: auto;
  box-sizing: border-box;
  border-top: 1px solid #cfd4db;
  padding: 8px;
  font-size: 12px;
}
</style>
