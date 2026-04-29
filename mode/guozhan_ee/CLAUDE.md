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

---

## 势力技（`groupSkill`）

描述中含"X势力技"时，技能定义首层加：

```javascript
groupSkill: "shu",  // 对应势力代码
```

**双文件约束**：`playerHasGroup` 在 `src/main.js` 和 `src/patch/game.js` 中各有一份独立实现。若需修改 `groupSkill` 判定逻辑，必须**同步修改这两个文件**。

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
player.getIdentities()          // 玩家势力集合；暗置时 []
player.isYe()                   // 是否为野心家
player.isUndetermined()         // 势力是否未确定
player.hasCommonIdentity(target) // 两玩家势力是否有交集
isYeIdentity(id)               // 判断 identity 是否为野心家（从 player.js 导入）
```

### `enable` 的选择

| 描述文案 | `enable` 值 |
|----------|-------------|
| "当你需要使用X时" | `"chooseToUse"` |
| "当你需要打出X时" | `"chooseToRespond"` |
| 两者都有 | `["chooseToUse", "chooseToRespond"]` |

转化/虚拟使用类技能（`chooseToUse`），若可转化牌名不在手牌中可见，必须补 `hiddenCard(player, name)` 并显式校验资源条件。

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

### `chooseCard` 第二参数

- `true` — 强制选择（描述中无"可以"的强制效果）
- 描述字符串 — 可选（描述中有"你可以"）

### "不能被抵消"vs"不能被响应"

- "不能被抵消"→ 优先用 `nowuxie` 与 `directHit2`
- "不能被响应"→ 用 `directHit`

### 两段式使用 vs 转化使用

- "使用A，然后视为使用B"→ 两段式：先使用实体A，再视为使用虚拟B
- "将A当B使用/打出"→ `viewAs + filterCard(A)` 单段转化

### 势力词"同势力/相同势力角色"

默认包含自己。仅当描述明确写"其他角色/除你外"时才排除自己，禁止无依据添加 `event.player == player` 过滤。

---

## 武将代码生成工作流

使用 `/character-code-generator` 技能生成武将代码时，额外遵守：

1. 生成前读取 `.claude/skills/character-code-generator/keyword-library.json` 检索已有模式
2. 生成后将新模式写回该文件（不允许仅在会话中临时记忆）
3. `*_info` 技能描述必须 100% 复制原文，禁止改写、润色、简化
4. 若现有模式无法适配，必须先向用户说明原因并征得同意，才允许改写底层代码
5. 实现前若不确定某 API 是否存在，必须先在代码库中检索确认，禁止臆造引擎函数/字段
