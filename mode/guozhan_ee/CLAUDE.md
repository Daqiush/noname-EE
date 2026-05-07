# guozhan_ee 模式开发指南

## 目录结构

```
mode/guozhan_ee/
├── index.js                    # 模式入口，聚合所有子模块导出
├── src/
│   ├── main.js                 # 模式初始化、playerHasGroup 第一份实现
│   ├── character/
│   │   ├── index.js            # 汇总所有武将包
│   │   └── vibe.js             # vibe 武将包（当前主开发目标）
│   ├── skill/character/
│   │   └── vibe.js             # vibe 武将技能实现
│   ├── translate/
│   │   ├── index.js            # 汇总翻译
│   │   ├── character/vibe.js   # 武将名翻译
│   │   └── skill/character/vibe.js  # 技能名 + 描述翻译
│   ├── voices/character/
│   │   └── vibe.js             # 台词字幕
│   └── patch/
│       ├── content.js          # 技能内容补丁（含 showing 属性处理）
│       ├── game.js             # 游戏逻辑补丁、playerHasGroup 第二份实现
│       └── player.js           # 玩家逻辑补丁
```

---

## 添加新武将：五文件工作流

新增一个 vibe 武将需同时修改以下五个文件：

| 文件 | 内容 |
|------|------|
| `src/character/vibe.js` | 武将基本信息 |
| `src/translate/character/vibe.js` | 武将名称翻译 |
| `src/translate/skill/character/vibe.js` | 技能名 + 描述翻译 |
| `src/skill/character/vibe.js` | 技能实现代码 |
| `src/voices/character/vibe.js` | 台词字幕 |

---

## 武将基本信息格式

```javascript
// src/character/vibe.js
import { Character } from "../../../../noname/library/element/index.js";

export default {
    gz_vibe_mengda: new Character({
        sex: "male",            // "male" | "female"
        group: "qun",           // 主势力
        hp: 4,
        maxHp: 4,
        hujia: 0,
        skills: ["vibe_mengda_hubian", "vibe_mengda_qiuan"],
        hasSkinInGuozhan: true,
        // majorSecondGroup: "wei"  // 可选，副势力
    }),
};
```

**势力代码**：`shu`（蜀）、`wei`（魏）、`wu`（吴）、`qun`（群）、`ye`（野心家）、`han`（汉）、`jin`（晋）

---

## 翻译格式

```javascript
// src/translate/character/vibe.js
export default {
    gz_vibe_mengda: "孟达",
    gz_vibe_mengda_prefix: "背汉",  // 可选称号
};

// src/translate/skill/character/vibe.js
export default {
    vibe_mengda_hubian: "互变",
    vibe_mengda_hubian_info: "出牌阶段限一次，你可以……",  // 必须100%复制原文，禁止改写
};
```

---

## 技能实现格式

```javascript
// src/skill/character/vibe.js
export default {
    vibe_mengda_hubian: {
        // --- 音频声明 ---
        audio: 3,  // N 条台词，对应 N 个音频文件和 N 条 voices 条目

        // --- 触发类技能必填 ---
        trigger: { player: "phaseUseBegin" },  // 触发时机
        filter(event, player) {
            return player.countCards("h") > 0;
        },
        async content(event, trigger, player) {
            player.logSkill("vibe_mengda_hubian", null, null, null, [2]);  // 指定播放第2条台词
            // 技能逻辑…
        },

        // --- 主动技必填 ---
        // enable: "phaseUse",
        // filterCard(card, player) { … },
        // filterTarget(card, player, target) { … },

        // --- 可选 ---
        locked: true,       // 锁定技
        forced: true,       // 强制触发（无"你可以"）
        // groupSkill: "shu",  // 势力技（见下方约束）
        ai: {
            order: 9,
            result: { target: 1 },
        },
    },
};
```

### `async cost` + `async content` 写法

`cost` 中存入 `event.result`，`content` 中必须读 `event.cards`（引擎自动提升），**禁止**在 `content` 中读 `event.result.cards`（该字段在 content 阶段已被清空）。

### 触发类技能必须加 `preHidden: true`

每个有 `trigger` 的技能，首层必须加：

```javascript
preHidden: true,
```

### `forced` 与 `locked` 的区别

| 属性 | 含义 |
|------|------|
| `forced: true` | 触发时不弹"是否发动"提示，强制执行（但技能名前**不显示锁定图标**） |
| `locked: true` | 技能名前显示锁定技图标（通常与 `forced: true` 同用） |

**两者组合**：
- `forced: true` + `locked: true` → 锁定技：强制触发 + 显示锁定图标
- `forced: true` + `locked: false`（或省略 locked）→ 强制触发但**不显示锁定图标**（适合阵法技、子技能等不应被标注为锁定技的强制效果）

---

## 音频 / 台词规则

### `audio` 与 `logAudio` 的选择

**情况①：普通台词**（技能发动时随机播放，无分阶段标注）→ **只写 `audio: N`，不写 `logAudio`**

```javascript
vibe_mengda_liangfan: {
    audio: 2,
    // 不写 logAudio，引擎自动随机播放
}
```

**情况②：分阶段台词**（部分台词在特定时机播放）→ **写 `logAudio`**

```javascript
vibe_mengda_qiuan: {
    audio: 3,
    logAudio: index => (typeof index === "number"
        ? "vibe_mengda_qiuan" + index + ".mp3"
        : "vibe_mengda_qiuan" + 1 + ".mp3"),
    // index 为数字：播放指定编号；非数字（默认发动）：播放第1条
    // 若发动时无语音：非数字时返回 false
}
// 在 content 中指定播放：
player.logSkill("vibe_mengda_qiuan", null, null, null, [3]);
```

### 音频文件路径

| 类型 | 路径 |
|------|------|
| die 台词 | `audio/die/gz_<characterId>.mp3` |
| 技能台词 | `audio/skill/<skillKey><index>.mp3` |

文件名必须与 `logAudio` 返回值完全一致，index 从 1 起。

### 台词字幕格式（`voices/character/vibe.js`）

```javascript
export default {
    "#gz_vibe_mengda:die":    "东风谬掌花权柄，却忌孤高不主张。",
    "#vibe_mengda_hubian1":   "臣心不自安，乃君之过也。",
    "#vibe_mengda_hubian2":   "丞相吊民伐罪，吾自当举城来降。",
    "#vibe_mengda_hubian3":   "立锥无地，望桑梓以何为？",
};
// 键以 "#" 开头，值为字幕文字（不是文件名）
```

---

## 明置技（`showing: true`）

guozhan_ee 独有机制：技能在武将**暗置**时对持有者自身生效，第一次"消费"超额收益时强制明置。

```javascript
skill_id: {
    showing: true,
    locked: true,
    // …
}
```

实现前必须确认 `patch/content.js` 或 `patch/player.js` 中已有 `showing` 属性处理逻辑；若底层缺失，必须先告知用户并征得同意再扩展。

**子技能明置技约束**：`patch/content.js` 的 `showing` 检查只遍历角色直属技能列表（`lib.character[name][3]`）。若明置技是某父技能的 **group 子技能**（如 `vibe_guanyu_weilin_diamond`），父技能不在直属列表里被检查到，子技能的 `showing: true` 对初始化循环完全不可见，暗置时技能不会生效。底层已在初始化和重置两处循环中补充了对 group 子技能的 `showing` 检查，新增此类子技能无需额外处理。

---

## 阵法技（`zhenfa`）

描述中含"阵法技"时，技能定义首层加 `zhenfa: "siege"`（围攻阵法）或 `zhenfa: "inline"`（队列阵法）。此属性的作用是：**授予技能持有者发起阵法召唤的资格**，允许满足条件的未确定势力角色依次明置武将牌。

**约束**：`zhenfa` 只应加在能**主动发起**围攻/队列的角色身上。若技能描述为"若你是围攻目标……"（被动防御效果），技能持有者本身不参与发起阵法，**禁止添加 `zhenfa` 属性**。

---

## 势力技（`groupSkill`）

描述中含"X势力技"时，技能定义首层加：

```javascript
groupSkill: "shu",  // 对应势力代码
```

**双文件约束**：`playerHasGroup` 在 `src/main.js` 和 `src/patch/game.js` 中各有一份独立实现。若需修改 `groupSkill` 判定逻辑，必须**同步修改这两个文件**。

---

## 选择目标：禁止无依据排除自己

`chooseTarget` 的 filter 中，**禁止无根据地加 `target !== player`**。仅当描述明确写"其他角色"/"除你外"时才排除自己。

典型错误（来自 `vibe_liubei_rende` 招募步骤）：
```javascript
// 错误：描述为"一名与你势力明确相同的角色"，未排除自己
(card, player, target) => target !== player && target.identity === player.identity
```

```javascript
// 正确：移除 target !== player，改用 hasCommonIdentity 防止"未知"势力误匹配
(card, player, target) => !player.isUndetermined() && !target.isUndetermined() && player.hasCommonIdentity(target)
```

此外，`target.identity === player.identity` 会让两名势力未确定的角色（identity 均为 "unknown"）互相匹配，造成技能错误触发，**必须用 `hasCommonIdentity` + `isUndetermined` 替代**。

---

## 视为使用有目标锦囊

禁止直接 `player.useCard({ name: "xxx", isCard: true })` 用于带 `filterTarget` 的锦囊。正确做法：

```javascript
"step 0";
player.chooseTarget(true, "选择目标", (card, player, target) => target !== player);
"step 1";
if (!result.bool || !result.targets.length) return;
player.useCard({ name: "xxx", isCard: true }, result.targets[0], false);
```

---

## 联机序列化约束

技能函数会被 `toString()` 后广播，eval 上下文只有 `lib`、`game`、`ui`、`get`、`ai`、`_status`、`gnc`。

- **模块局部函数不可在可序列化函数中直接引用**。需共享的工具函数挂到 `game` 对象上：
  ```javascript
  game.myHelper = function(...) { ... };  // 在模块初始化阶段挂载
  ```

- **`backup` 闭包变量不可在 `content` 中直接引用**。运行时决策值应作为普通属性写入 backup 返回对象，`content` 中从 `lib.skill[event.name].属性名` 读取（用 `event.name` 不是 `event.skill`）：
  ```javascript
  backup(result, player) {
      return {
          color: result.control === "红色" ? "red" : "black",  // ✅
          async content(event, trigger, player) {
              const color = lib.skill[event.name].color;  // ✅
          },
      };
  },
  ```

---

## 关键引擎 API

### 势力相关

```javascript
lib.group                       // 本局所有势力数组，不含野心家
player.getIdentities()          // 玩家势力集合；暗置时 []，纯野心家为 ["ye"] 或 ["N_ye"]（N为座次）
player.isYe()                   // 是否为野心家
player.isUndetermined()         // 势力是否未确定
player.hasCommonIdentity(target) // 两玩家势力是否有交集
isYeIdentity(id)               // 判断 identity 是否为野心家（从 player.js 导入）
```

**`isUndetermined()` 对野心家的判断规则**：
- 纯野心家（`identity === "ye"` 或座次格式 `"N_ye"`）→ 返回 `false`（已确定为野心家）
- 复合野心家（`"shu_ye"` 等）→ 返回 `true`（势力未确定）

**`isRealFriendOf(target)` — "与你势力明确相同"的标准实现**：
- `this === target`（自身）→ 始终返回 `true`（玩家永远是自己的有效招募目标，即使势力未确定）
- 其他情况：要求双方 identity 均已确定、势力集合各恰好一个，且相等
- "与你势力明确相同的角色"筛选器直接用 `player.isRealFriendOf(target)`，无需手写 `isUndetermined` + `hasCommonIdentity` 组合

### `enable` 的选择

| 描述文案 | `enable` 值 |
|----------|-------------|
| "当你需要使用X时" | `"chooseToUse"` |
| "当你需要打出X时" | `"chooseToRespond"` |
| 两者都有 | `["chooseToUse", "chooseToRespond"]` |

转化/虚拟使用类技能（`chooseToUse`），若可转化牌名不在手牌中可见，必须补 `hiddenCard(player, name)` 并显式校验资源条件。

### `chooseToUse` / `chooseToRespond` 技能按钮的显示控制

技能按钮是否出现由 `lib.filter.filterEnable(event, player, skill)` 决定，它依次检查：

1. `info.enable` 与当前事件名匹配
2. **`info.filter(event, player)`** ← 这是唯一能限制"何时/何种上下文出现"的入口
3. 若有 `info.viewAs`（非函数），才检查 `info.viewAsFilter`

**`viewAsFilter` 对 `chooseButton` 技能无效**：`chooseButton` 技能没有 `viewAs`，`filterEnable` 永远不会走到 `viewAsFilter` 的检查分支。错误地写 `viewAsFilter` 不会报错，但也不会生效。

**正确做法：用 `filter` 限制上下文**

```javascript
// 限制"仅在自己回合内，且当前事件允许基本牌"才显示按钮
filter(event, player) {
    if ((/** @type {any} */(_status)).currentPhase !== player) return false;
    const basicCards = ["sha", "tao", "shan", "jiu"];
    return basicCards.some(name => event.filterCard?.({ name, isCard: true }, player, event));
},
```

- 限制回合内：`_status.currentPhase !== player` → false
- 防止在"只允许锦囊"等上下文出现：`event.filterCard` 拒绝基本牌 → false

### `canMoveCard` 参数

- `player.canMoveCard()` — 规则判断（filter / check 中用这个）
- `player.canMoveCard(true)` — AI 判断是否应该发动（不代表规则上可以）

### 弃置触发器的"自己弃置"判定

`trigger: { global: "loseAfter" }` 且语义为"角色弃置自己的牌"时，必须同时校验：

```javascript
event.type === "discard" &&
(event.discarder || event.getParent(2)?.player) === event.player
```

禁止只用 `event.player == event.getParent()?.player`。

### `chooseToCompare` 多目标拼点

多名角色同时与同一敌方拼点：

```javascript
enemy.chooseToCompare(competitorsArray).callback = lib.skill.skillId.callback;
```

禁止用 `compareIdx` 循环逐一拼点。callback 中：`event.player` 为调用方（敌人），`event.target` 为竞选者，`event.winner` 为赢者。

### `get.name` 的 `mod.cardname` 作用范围

`get.name(card, player)` 仅在 player 为 Player 对象，或未传 player 且 `get.position(card) === "h"` 时调用 `mod.cardname`。position `"s"`（如木牛流马存储的牌）在未显式传 player 时，`mod.cardname` 不会生效。

### `enable: "phaseUse"` 的选牌 cost

`cost` 仅适用于触发技（有 `trigger`）。`enable: "phaseUse"` 的等价物是 `filterCard` + `selectCard`：玩家点技能后选牌，取消则技能不发动；确认后 `event.cards` 即为所选牌，在 `content` 中读取。

```javascript
filterCard(card, player) { return get.position(card) === "h"; },
selectCard: [1, Infinity],  // 1 张到无限张；-1 不表示"无限"，必须用 Infinity
```

`async content` 仅适用于触发技；`enable` 技的 `content` 必须用 step-based 写法，否则内部的 `chooseCard`/`chooseTarget` 子事件不会正常阻塞，技能会立即结束。

### `chooseCard` 第二参数

- `true` — 强制选择（描述中无"可以"的强制效果）
- 描述字符串 — 可选（描述中有"你可以"）

### "不能被抵消"vs"不能被响应"

- "不能被抵消"→ 优先用 `nowuxie` 与 `directHit2`
- "不能被响应"→ 用 `directHit`

### 两段式使用 vs 转化使用

- "使用A，然后视为使用B"→ 两段式：先使用实体A，再视为使用虚拟B
- "将A当B使用/打出"→ `viewAs + filterCard(A)` 单段转化

### 触发技"视为使用一张[X]"的标准三段式写法

**禁止**在 `content` 里调用 `chooseUseTarget`。正确做法是 `filterTarget` + `async cost`（含 `chooseTarget`）+ `async content`（含 `useCard` + 自定义标记 + 伤害追踪）：

```javascript
filter(event, player) {
    return player.hasUseTarget({ name: "sha", isCard: true });
},
filterTarget(card, player, target) {
    // 必须显式加 inRange：对虚拟牌 canUse 不自动校验攻击范围
    return player.inRange(target) && player.canUse({ name: "sha", isCard: true }, target, false);
},
async cost(event, trigger, player) {
    event.result = await player
        .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
            return player.inRange(target) && player.canUse({ name: "sha", isCard: true }, target, false);
        })
        .set("ai", target => get.effect(target, { name: "sha" }, player, player))
        .forResult();
},
async content(event, trigger, player) {
    const target = event.targets[0];
    const card = { name: "sha", isCard: true, mySkill: true };  // 自定义标记用于追踪
    const next = player.useCard(card, target, false);
    await next;
    // 检查是否造成伤害：通过自定义标记追踪
    const damaged = game.hasPlayer2(current => {
        return current.hasHistory("damage", evt => evt.getParent("sha")?.card?.mySkill);
    });
},
```

- `filterTarget` 供 AI 参考，`cost` 内的 filter 与之保持一致（inline 复制，避免序列化引用问题）
- 自定义标记属性（如 `shuijian: true`）挂在虚拟卡对象上，`getParent("sha")?.card` 取到使用事件的 card 即可读取
- `ai.result` 改为 `{ target: -1 }`（对敌）或 `{ target: 1 }`（对友）

### 势力词"同势力/相同势力角色"

默认包含自己。仅当描述明确写"其他角色/除你外"时才排除自己，禁止无依据添加 `event.player == player` 过滤。

---

## 判定后多条件效果：顺序执行 vs n选1

技能描述若列出若干条件（如"若结果与此牌：颜色相同……花色相同……点数相同……"），判断方式取决于原文措辞：

- **顺序执行（全部独立检查）**：原文只列出条件及对应效果，没有"选择一项"字样。若多个条件同时满足，则从前到后依次执行每项效果（各项"你可"效果分别由玩家选择是否触发）。实现方式：若干独立 `if` 语句，不使用 `if-else`。
- **n选1（只执行一项）**：原文明确写"你可以选择一项："，后接编号列表。只能执行其中一项。实现方式：`chooseControl` 或 `chooseButton` 弹出单选框。

**典型错误**：看到多个条件就用 `chooseControl` 做 n选1，但原文并无"选择一项"字样。此时应用独立 `if` 顺序执行。

---

## 战吼时机选择

| 战吼类型 | 触发时机 | 说明 |
|----------|----------|------|
| 普通战吼（`战吼：`） | `showCharacterAfter` | 明置时立即触发，在 `showCharacter` 事件内同步触发 |
| 延时战吼（`战吼（延时）：`） | `afterShowCharacter` | 等当前结算链（最近的 `useCard`/`respond`）结束后触发 |

---

## 技能的卡牌选择类消耗：不进弃牌堆须写 `lose: false`

技能中选择卡牌时，若描述为"置于……"、"转移到……"等**不进弃牌堆**的操作，必须显式写：

```javascript
lose: false,
```

例如仁德类技能将手牌给出、将牌置于角色区域等，均属此类。不写 `lose: false` 时引擎默认牌进弃牌堆。

---

## 武将代码生成工作流

使用 `/character-code-generator` 技能生成武将代码时，额外遵守：

1. 生成前读取 `.claude/skills/character-code-generator/keyword-library.json` 检索已有模式
2. 生成后将新模式写回该文件（不允许仅在会话中临时记忆）
3. `*_info` 技能描述必须 100% 复制原文，禁止改写、润色、简化
4. 若现有模式无法适配，必须先向用户说明原因并征得同意，才允许改写底层代码
5. 实现前若不确定某 API 是否存在，必须先在代码库中检索确认，禁止臆造引擎函数/字段
