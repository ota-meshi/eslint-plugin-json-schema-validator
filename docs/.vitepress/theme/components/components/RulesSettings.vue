<template>
  <div class="rules-settings">
    <div class="tools">
      <label class="tool">
        <span class="tool-label">Filter:</span>
        <input
          v-model="filterValue"
          type="search"
          placeholder="Rule Filter"
          class="tool-form"
        />
      </label>
      <label class="tool">
        <input
          :checked="
            checkedBinds(categories, (category) =>
              category.rules.every((rule) => isErrorState(rule.ruleId)),
            ).checked
          "
          :indeterminate.prop="
            checkedBinds(categories, (category) =>
              category.rules.every((rule) => isErrorState(rule.ruleId)),
            ).indeterminate
          "
          type="checkbox"
          @input="onAllClick($event)"
        />
        <span class="tool-label">All Rules</span>
      </label>
    </div>
    <ul class="categories">
      <template v-for="category in categories">
        <li
          v-if="category.rules.length"
          :key="category.title"
          class="category"
          :class="category.classes"
        >
          <button
            class="category-button"
            :class="{
              'category-button--close': categoryState[category.title].close,
            }"
            @click="
              categoryState[category.title].close =
                !categoryState[category.title].close
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="10"
              viewBox="0 0 10 10"
              width="10"
            >
              <path d="M2.5 10l5-5-5-5v10z" fill="#ddd" />
            </svg>
          </button>
          <div class="category-title-wrapper">
            <label class="category-title">
              <input
                :checked="
                  checkedBinds(category.rules, (rule) =>
                    isErrorState(rule.ruleId),
                  ).checked
                "
                :indeterminate.prop="
                  checkedBinds(category.rules, (rule) =>
                    isErrorState(rule.ruleId),
                  ).indeterminate
                "
                type="checkbox"
                @input="onCategoryClick(category, $event)"
              />
              {{ category.title }}
            </label>
          </div>

          <ul v-show="!categoryState[category.title].close" class="rules">
            <li
              v-for="rule in category.rules"
              :key="rule.ruleId"
              class="rule"
              :class="rule.classes"
            >
              <label>
                <input
                  :checked="isErrorState(rule.ruleId)"
                  type="checkbox"
                  @input="onClick(rule.ruleId, $event)"
                />
                {{ rule.ruleId }}
              </label>
              <a :href="rule.url" target="_blank"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  x="0px"
                  y="0px"
                  viewBox="0 0 100 100"
                  width="15"
                  height="15"
                  class="icon outbound"
                >
                  <path
                    fill="currentColor"
                    d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                  />
                  <polygon
                    fill="currentColor"
                    points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                  /></svg
              ></a>
            </li>
          </ul>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
import { categories } from "../rules/index";

export default {
  name: "RulesSettings",
  props: {
    rules: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:rules"],
  data() {
    return {
      categoryState: Object.fromEntries(
        categories.map((c) => {
          return [
            c.title,
            {
              close: true,
            },
          ];
        }),
      ),
      filterValue: "",
    };
  },
  computed: {
    categories() {
      return categories.map((c) => {
        return {
          ...c,
          rules: this.filterRules(c.rules),
        };
      });
    },
  },
  methods: {
    filterRules(rules) {
      let filteredRules = rules;
      if (this.filterValue) {
        filteredRules = filteredRules.filter((r) =>
          r.ruleId.includes(this.filterValue),
        );
      }
      return filteredRules;
    },
    onCategoryClick(category, e) {
      const rules = Object.assign({}, this.rules);
      for (const rule of category.rules) {
        if (e.target.checked) {
          rules[rule.ruleId] = "error";
        } else {
          delete rules[rule.ruleId];
        }
      }
      this.$emit("update:rules", rules);
    },
    onAllClick(e) {
      const rules = Object.assign({}, this.rules);
      for (const category of this.categories) {
        for (const rule of category.rules) {
          if (e.target.checked) {
            rules[rule.ruleId] = "error";
          } else {
            delete rules[rule.ruleId];
          }
        }
      }
      this.$emit("update:rules", rules);
    },
    onClick(ruleId, e) {
      const rules = Object.assign({}, this.rules);
      if (e.target.checked) {
        rules[ruleId] = "error";
      } else {
        delete rules[ruleId];
      }
      this.$emit("update:rules", rules);
    },
    isErrorState(ruleId) {
      return this.rules[ruleId] === "error" || this.rules[ruleId] === 2;
    },
    checkedBinds(array, fn) {
      if (array.every(fn)) {
        return {
          checked: true,
          indeterminate: false,
        };
      }
      if (array.every((...args) => !fn(...args))) {
        return {
          checked: false,
          indeterminate: false,
        };
      }
      return {
        checked: false,
        indeterminate: true,
      };
    },
  },
};
</script>

<style scoped>
.tools {
  background-color: #222;
}

.tool {
  display: flex;
  padding: 4px;
}

.tools input {
  border: 1px solid #cfd4db;
  border-radius: 4px;
  background: canvas;
  color: canvastext;
  line-height: 1rem;
  padding-block: 1px;
  padding-inline: 2px;
}

.tool-label {
  flex-shrink: 0;
  padding: 0 4px;
}

.tool-form {
  width: 100%;
}

.tools-button {
  background-color: transparent;
  color: #ddd;
  border: none;
  appearance: none;
  cursor: pointer;
  padding: 0;
}

.tools-button--close {
  transform: rotate(90deg);
}

.categories {
  font-size: 14px;
  list-style-type: none;
}

.category {
  position: relative;
}

.category-button {
  position: absolute;
  left: -12px;
  top: 2px;
  background-color: transparent;
  color: #ddd;
  border: none;
  appearance: none;
  cursor: pointer;
  padding: 0;
}

.category-button--close {
  transform: rotate(90deg);
}

.category-title {
  font-size: 14px;
  font-weight: bold;
}

.eslint-plugin-json-schema-validator-category .category-title {
  color: #f8c555;
}

.eslint-core-category .category-title {
  color: #8080f2;
}

.rules {
  padding-left: 0;
}

.rule {
  font-size: 12px;
  line-height: 24px;
  vertical-align: top;
  list-style-type: none;
  display: flex;
}

.rule a {
  margin-left: auto;
}

a {
  text-decoration: none;
}

.eslint-core-rule a > svg {
  color: #8080f2;
}

.eslint-plugin-json-schema-validator-rule a > svg {
  color: #f8c555;
}
</style>
