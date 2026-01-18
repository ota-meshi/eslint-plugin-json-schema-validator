import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";
import ESLintCodeBlock from "./components/eslint-code-block.vue";
import "./style.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
    ctx.app.use(TwoslashFloatingVue as never);
    ctx.app.component("eslint-code-block", ESLintCodeBlock);
  },
};
export default theme;
