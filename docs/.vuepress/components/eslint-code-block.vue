<template>
  <eslint-plugin-editor
    ref="editor"
    v-model="code"
    :style="{ height }"
    :rules="rules"
    dark
    :fix="fix"
    :file-name="fileName"
    :language="language"
    :parser="
      language === 'yaml'
        ? 'yaml-eslint-parser'
        : language === 'toml'
          ? 'toml-eslint-parser'
          : language === 'html'
            ? 'vue-eslint-parser'
            : language === 'json'
              ? 'jsonc-eslint-parser'
              : 'espree'
    "
  />
</template>

<script>
import EslintPluginEditor from "./components/EslintPluginEditor.vue";

export default {
  name: "ESLintCodeBlock",
  components: { EslintPluginEditor },
  props: {
    fix: {
      type: Boolean,
    },
    rules: {
      type: Object,
      default() {
        return {};
      },
    },
    fileName: {
      type: String,
      default: undefined,
    },
  },
  data() {
    return {
      code: "",
      height: "",
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
      return "json";
    },
  },
  mounted() {
    this.code = `${this.computeCodeFromSlot(this.$slots.default).trim()}\n`;
    const lines = this.code.split("\n").length;
    this.height = `${Math.max(120, 20 * (1 + lines))}px`;
  },

  methods: {
    /**
     * @param {VNode[]} nodes
     * @returns {string}
     */
    computeCodeFromSlot(nodes) {
      if (!Array.isArray(nodes)) {
        return "";
      }
      return nodes
        .map((node) => node.text || this.computeCodeFromSlot(node.children))
        .join("");
    },
  },
};
</script>
