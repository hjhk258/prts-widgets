<script lang="ts">
import type { PropType } from "vue";
import { computed, defineComponent, nextTick, reactive, ref, watch } from "vue";

import { useBreakpoints } from "@vueuse/core";

import Avatar from "@/components/Avatar.vue";
import Checkbox from "@/components/Checkbox.vue";
import FilterRow from "@/components/FilterRow.vue";

import type { Source } from "./utils";
import {
  Char,
  all,
  can5,
  number2names,
  position,
  positionIndex,
  profession,
  professionIndex,
  rarity,
  rarityIndex,
  tag,
  tagIndex,
} from "./utils";
export default defineComponent({
  components: { Checkbox, FilterRow, Avatar },
  props: {
    source: { type: Array as PropType<Source[]>, default: () => [] },
  },
  setup(props) {
    const breakpoints = useBreakpoints({ xs: 640 });
    const xs = breakpoints.smallerOrEqual("xs");
    const value = reactive(new Char(0));
    const selected = computed(() => {
      return all.map((v, i) => {
        return value.bitmap.get(i) !== 0;
      });
    });
    function onTagClick(i: number) {
      if (value.bitmap.get(i) === 0) value.bitmap.set(i);
      else value.bitmap.clear(i);
    }

    const isClassEmpty = computed(() => {
      return value.isProfessionEmpty();
    });
    const isPositionEmpty = computed(() => {
      return value.isPositionEmpty();
    });
    const isRarityEmpty = computed(() => {
      return value.isRarityEmpty();
    });
    const isTagEmpty = computed(() => {
      return value.isTagEmpty();
    });
    function calc() {
      const result: Record<number | string, { charIndict: Set<number> }> = {};
      const subset = value.bitmap.getSubSet();
      props.source.forEach((c, charIndex) => {
        c.subset.forEach((set) => {
          subset.forEach((group) => {
            // 干员的子集中的一个元素 是这个选中的子集中的一个元素 的子集
            if ((group & set) !== group) return;

            // 6星要有对应的稀有度tag才能出
            if (c.rarity === 5 && !can5(group)) return;

            if (!result[group]) {
              result[group] = {
                charIndict: new Set(),
              };
            }
            result[group].charIndict.add(charIndex);
          });
        });
      });
      const list: Array<{ tags: number; charIndict: number[]; score: number }> =
        [];
      Object.keys(result).forEach((k) => {
        const key = parseInt(k);
        const charIndict = Array.from(result[key].charIndict).sort((a, b) => {
          return props.source[b].rarity - props.source[a].rarity;
        });
        list.push({
          tags: key,
          charIndict,
          score:
            charIndict.reduce((acc, cur) => {
              let s = props.source[cur].rarity + 1;
              if (s === 1) s = 3.5;

              return acc + s;
            }, 0) / charIndict.length,
        });
      });
      list.sort((a, b) => {
        const rarity = b.score - a.score;
        if (rarity !== 0) return rarity;
        return a.charIndict.length - b.charIndict.length;
      });
      return list;
    }
    const result = ref<
      Array<{
        tags: number;
        charIndict: number[];
        score: number;
      }>
    >([]);
    watch(value, () => {
      nextTick(() => {
        result.value = calc();
      });
    });
    // 寻访出不了的都算只能公招出
    function isOnly(s: Source) {
      return !s.obtainMethod.some((v) => v.includes("寻访"));
    }
    return {
      value,
      profession,
      position,
      rarity,
      tag,
      professionIndex,
      positionIndex,
      rarityIndex,
      tagIndex,
      selected,
      onTagClick,
      isClassEmpty,
      isPositionEmpty,
      isRarityEmpty,
      isTagEmpty,
      result,
      number2names,
      isOnly,
      xs,
    };
  },
});
</script>

<template>
  <div>
    <FilterRow
      title="资历"
      :some-selected="!isRarityEmpty"
      @all="() => value.selectAllRarity()"
      @clear="() => value.unselectAllRarity()"
    >
      <Checkbox
        v-for="(c, i) in rarity"
        :key="c"
        class="m-1"
        :model-value="selected[rarityIndex - i]"
        @click="onTagClick(rarityIndex - i)"
      >
        {{ c }}
      </Checkbox>
    </FilterRow>
    <FilterRow
      title="职业"
      :some-selected="!isClassEmpty"
      @all="() => value.selectAllProfession()"
      @clear="() => value.unselectAllProfession()"
    >
      <Checkbox
        v-for="(c, i) in profession"
        :key="c"
        :model-value="selected[professionIndex - i]"
        class="m-1"
        @click="onTagClick(professionIndex - i)"
      >
        {{ c }}
      </Checkbox>
    </FilterRow>
    <FilterRow
      title="位置"
      :some-selected="!isPositionEmpty"
      @all="() => value.selectAllPosition()"
      @clear="() => value.unselectAllPosition()"
    >
      <Checkbox
        v-for="(c, i) in position"
        :key="c"
        class="m-1"
        :model-value="selected[positionIndex - i]"
        @click="onTagClick(positionIndex - i)"
      >
        {{ c }}
      </Checkbox>
    </FilterRow>

    <FilterRow
      title="词缀"
      :some-selected="!isTagEmpty"
      @all="() => value.selectAllTag()"
      @clear="() => value.unselectAllTag()"
    >
      <Checkbox
        v-for="(c, i) in tag"
        :key="c"
        class="m-1"
        :model-value="selected[tagIndex - i]"
        checkable
        @click="onTagClick(tagIndex - i)"
      >
        {{ c }}
      </Checkbox>
    </FilterRow>
  </div>
  <div v-if="xs" class="w-full mt-2">
    <div
      v-for="data in result"
      :key="data.tags"
      class="bg-[#f8f9fa] mb-1 shadow shadow-gray-400"
    >
      <div class="flex items-center flex-wrap justify-start">
        <div v-for="name in number2names(data.tags)" :key="name" class="tag">
          {{ name }}
        </div>
      </div>
      <div class="flex flex-wrap">
        <div
          v-for="charIndex in data.charIndict"
          :key="charIndex"
          class="p-2 m-2 <sm:p-1 <sm:m-1 rounded relative"
          :class="`r-${source[charIndex].rarity}`"
        >
          <span
            v-if="isOnly(source[charIndex])"
            class="absolute top-0 right-0 bg-[#3fbd43] text-white leading-none p-1 rounded z-1 font-bold"
            >限</span
          >
          <Avatar
            :size="xs ? 'xs' : 'sm'"
            :profession="source[charIndex].profession"
            :rarity="source[charIndex].rarity"
            :name="source[charIndex].zh"
          />
        </div>
      </div>
    </div>
  </div>
  <table v-else class="bg-[#f8f9fa] w-full mt-2">
    <colgroup>
      <col class="tag-row" />
      <col />
    </colgroup>
    <thead class="bg-[#eaebee]">
      <tr>
        <th>Tags</th>
        <th>可能出现</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="data in result" :key="data.tags" class="row">
        <td>
          <div class="flex justify-center items-center flex-wrap">
            <div
              v-for="name in number2names(data.tags)"
              :key="name"
              class="tag"
            >
              {{ name }}
            </div>
          </div>
        </td>
        <td class="flex flex-wrap flex-1">
          <div
            v-for="charIndex in data.charIndict"
            :key="charIndex"
            class="p-2 m-2 <sm:p-1 <sm:m-1 rounded relative"
            :class="`r-${source[charIndex].rarity}`"
          >
            <span
              v-if="isOnly(source[charIndex])"
              class="absolute top-0 right-0 bg-[#3fbd43] text-white leading-none p-1 rounded z-1 font-bold"
              >限</span
            >
            <Avatar
              :size="xs ? 'xs' : 'sm'"
              :profession="source[charIndex].profession"
              :rarity="source[charIndex].rarity"
              :name="source[charIndex].zh"
            />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.tag {
  background-color: #313131;
  color: #ffffff;
  height: 28px;
  min-width: 40px;
  padding: 0 8px;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  box-shadow: 0 3px 5px grey;
  letter-spacing: 0.08em;
  text-indent: 0.08em;
  margin: 4px 4px;
}

.row {
  margin-top: 6px;
  box-shadow:
    0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
}

.tag-row {
  width: 110px;
}

@media screen and (min-width: 700px) {
  .tag-row {
    width: 300px;
  }
}

.r-5 {
  background: #ff7f27;
}

.r-4 {
  background: #ffc90e;
}

.r-3 {
  background: #d8b3d8;
}

.r-2 {
  background: #09b3f7;
}

.r-1 {
  background: #d3db2e;
}
.r-0 {
  background: gray;
}
</style>
