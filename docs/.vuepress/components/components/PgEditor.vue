<template>
    <eslint-plugin-editor
        ref="editor"
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
        :code="value"
        :rules="rules"
        fix
        dark
        @input="$emit('input', $event)"
        @change="$emit('change', $event)"
    />
</template>

<script>
import EslintPluginEditor from "./EslintPluginEditor.vue"

export default {
    name: "PgEditor",
    components: { EslintPluginEditor },
    props: {
        value: {
            type: String,
            default: "",
        },
        rules: {
            type: Object,
            default: () => ({}),
        },
        messages: {
            type: Array,
            default: () => [],
        },
        fileName: {
            type: String,
            default: undefined,
        },
    },
    computed: {
        language() {
            const fileName = `${this.fileName}`.toLowerCase()
            if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
                return "yaml"
            }
            if (fileName.endsWith(".toml")) {
                return "toml"
            }
            if (fileName.endsWith(".vue")) {
                return "html"
            }
            if (fileName.endsWith(".js")) {
                return "javascript"
            }
            return "json"
        },
    },
}
</script>
