import "virtual:uno.css";
import { createApp } from "vue";

import HrCalculator from "../widgets/HrCalculator/index.vue";
import type { Source } from "../widgets/HrCalculator/utils";
import { Char } from "../widgets/HrCalculator/utils";

const ele = document.getElementById("root");

function init(): Source[] {
  return (
    Array.from(
      document.getElementById("filter-data")?.children || [],
    ) as HTMLElement[]
  )
    .filter((v) => {
      return v.dataset.obtain_method?.split(", ").includes("公开招募");
    })
    .map((v) => {
      const temp: Source = {
        profession: v.dataset.profession!,
        position: v.dataset.position!,
        rarity: Number.parseInt(v.dataset.rarity!),
        tag: v.dataset.tag?.split(" ") || [],
        zh: v.dataset.zh!,
        subset: [],
        obtainMethod: v.dataset.obtain_method?.split(", ") || [],
      };
      const char = Char.fromSource(temp);
      temp.subset = char.bitmap.getSubSet();
      return Object.freeze(temp);
    });
}

const source = init();
console.log(source);
if (ele) createApp(HrCalculator, { source }).mount(ele);
else console.error("data-item or ele not found", ele);
