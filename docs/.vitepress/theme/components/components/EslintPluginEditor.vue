<template>
  <eslint-editor
    ref="editor"
    :linter="linter"
    :config="config"
    :code="code"
    class="eslint-code-block"
    :language="language"
    :filename="fileName"
    :dark="dark"
    :format="format"
    :fix="fix"
    @update:code="$emit('update:code', $event)"
    @change="$emit('change', $event)"
  />
</template>

<script>
import EslintEditor from "@ota-meshi/site-kit-eslint-editor-vue";
import { loadMonacoEditor } from "@ota-meshi/site-kit-monaco-editor";
import { Linter } from "eslint";
import { rules } from "../../../../../src/utils/rules";

export default {
  name: "EslintPluginEditor",
  components: { EslintEditor },
  model: {
    prop: "code",
  },
  props: {
    code: {
      type: String,
      default: "",
    },
    fix: {
      type: Boolean,
    },
    rules: {
      type: Object,
      default() {
        return {};
      },
    },
    dark: {
      type: Boolean,
    },
    fileName: {
      type: String,
      default: "a.json",
    },
  },
  emits: ["update:code", "change"],

  data() {
    return {
      espree: null,
      jsoncESLintParser: null,
      yamlESLintParser: null,
      tomlESLintParser: null,
      vueESLintParser: null,
      format: {
        insertSpaces: true,
        tabSize: 2,
      },
    };
  },

  computed: {
    language() {
      const fileName = `${this.fileName}`.toLowerCase();
      if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
        return "yaml";
      }
      if (fileName.endsWith(".toml")) {
        return "toml";
      }
      if (fileName.endsWith(".vue")) {
        return "html";
      }
      if (fileName.endsWith(".js")) {
        return "javascript";
      }
      if (fileName.endsWith(".json")) {
        return "json";
      }
      return "json";
    },
    parser() {
      return this.language === "yaml"
        ? "yaml-eslint-parser"
        : this.language === "toml"
          ? "toml-eslint-parser"
          : this.language === "html"
            ? "vue-eslint-parser"
            : this.language === "json"
              ? "jsonc-eslint-parser"
              : "espree";
    },
    config() {
      return [
        {
          files: ["*.*"],
          plugins: {
            "json-schema-validator": {
              rules: Object.fromEntries(
                rules.map((r) => [r.meta.docs.ruleName, r]),
              ),
            },
          },
          languageOptions: {
            globals: {
              // Node
              module: false,
            },
          },
          rules: this.rules,
        },
        {
          files: ["*.json", "*.jsonc", "*.json5"],
          languageOptions: {
            parser: this.jsoncESLintParser,
          },
        },
        {
          files: ["*.yml", "*.yaml"],
          languageOptions: {
            parser: this.yamlESLintParser,
          },
        },
        {
          files: ["*.toml"],
          languageOptions: {
            parser: this.tomlESLintParser,
          },
        },
        {
          files: ["*.vue"],
          languageOptions: {
            parser: this.vueESLintParser,
          },
        },
      ];
    },
    linter() {
      if (
        !this.jsoncESLintParser ||
        !this.yamlESLintParser ||
        !this.tomlESLintParser ||
        !this.vueESLintParser
      ) {
        return null;
      }
      const linter = new Linter();

      return linter;
    },
  },

  async mounted() {
    // Load parser asynchronously.
    const [
      espree,
      jsoncESLintParser,
      yamlESLintParser,
      tomlESLintParser,
      vueESLintParser,
    ] = await Promise.all([
      import("espree"),
      import("jsonc-eslint-parser"),
      import("yaml-eslint-parser"),
      import("toml-eslint-parser"),
      import("vue-eslint-parser"),
    ]);
    this.espree = espree;
    this.jsoncESLintParser = jsoncESLintParser;
    this.yamlESLintParser = yamlESLintParser;
    this.tomlESLintParser = tomlESLintParser;
    this.vueESLintParser = vueESLintParser;

    const monaco = await loadMonacoEditor();
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      validate: false,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      validate: false,
    });
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
    });

    const editorVue = this.$refs.editor.$refs.monacoEditorRef;
    for (const editor of [
      editorVue.getLeftEditor(),
      editorVue.getRightEditor(),
    ]) {
      editor?.onDidChangeModelDecorations(() =>
        this.onDidChangeModelDecorations(editor),
      );
    }
  },

  methods: {
    async onDidChangeModelDecorations(editor) {
      const monaco = await loadMonacoEditor();
      const model = editor.getModel();
      monaco.editor.setModelMarkers(model, "json", []);
    },
  },
};
</script>

<style scoped>
.eslint-code-block {
  width: 100%;
  margin: 1em 0;
}
</style>
