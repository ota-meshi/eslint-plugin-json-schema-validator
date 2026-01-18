import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
  },
};
export default theme;
