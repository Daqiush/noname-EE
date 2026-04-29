---
name: character-code-generator
description: "将武将描述转换为代码化的技能实现。当用户说'把位于xxx路径的武将代码化'时，必须先阅读目标 txt 文件头部的规则/要求，并严格按该要求写代码；然后读取 skills/character-code-generator/keyword-library.json 检索已缓存的技能关键词与代码写法，再在项目代码库中补充搜索，最终将武将各部分代码分别添加到 mode\\guozhan_ee\\src\\character\\vibe.js、mode\\guozhan_ee\\src\\translate\\character\\vibe.js、mode\\guozhan_ee\\src\\translate\\skill\\character\\vibe.js、mode\\guozhan_ee\\src\\skill\\character\\vibe.js、mode\\guozhan_ee\\src\\voices\\character\\vibe.js。"
compatibility:
    required_tools: ["read", "write", "grep", "glob", "bash"]
---

# 武将代码生成器技能

## 功能概述

该技能能够将武将的自然语言描述转换为标准化的代码实现，通过分析现有技能库，找到相似技能的代码模式，并生成符合项目规范的武将代码。

## 工作流程

### 1. 接收指令和读取文件

- 监听"把位于xxx路径的武将代码化"指令
- 自动读取指定路径下的TXT文件
- 解析TXT文件中的武将结构信息

### 2. 建立关键字库

- 先读取 `skills/character-code-generator/keyword-library.json`
- 将技能描述拆成关键词，与库中条目进行匹配
- 已查询过的关键词、参考技能键、实现提示必须持久化写回该文件

## 关键字库文件

- 固定路径：`skills/character-code-generator/keyword-library.json`
- 新增条目模板：`skills/character-code-generator/entry-template.json`
- 备注关键词词汇表：`skills/character-code-generator/keyword-glossary.json`
- 作用：保存“自然语言描述关键词 -> 参考技能键/参考文件/实现提示”的持久化映射
- 使用顺序：先查库，再补搜索，最后回写库
- 最低要求：
    - 不能只在会话上下文里临时记忆，必须落盘
    - 新增条目时需要写入 `patternId`、`keywords`、`referenceSkills`、`implementationHints`
    - 若新技能仅是现有模式的变体，应给既有条目补充关键词，而不是重复新建同义条目

## 备注关键词学习规则

- 输入武将描述文本中若包含“备注/注释/说明”等段落，且解释了专有关键词含义，必须提取并学习
- 提取结果需写入 `skills/character-code-generator/keyword-glossary.json`，不能只保存在当前会话
- 若某关键词仅在第一次出现时有备注解释，后续再次出现该关键词时：
    - 必须自动先查 `keyword-glossary.json`
    - 按已学习解释参与技能匹配和代码生成
    - 不要求用户重复提供备注
- 若新备注与旧解释冲突：
    - 优先采用用户最新说明
    - 在词条的 `history` 中保留旧解释摘要，避免语义丢失
- 若关键词解释影响到底层机制选择（例如触发阶段、状态语义、结算优先级），应在生成前向用户复述理解并确认

## 技能描述原文复制规则

- 目标文件中的技能描述（`*_info`）必须 **100% 复制** 输入文档中的 `description` 原文。
- 严禁擅自改写、润色、简化、扩写、同义替换。
- 必须保留原文中的：
    - 标点符号
    - 全角/半角符号
    - HTML 标记（如 `<b>...</b>`）
    - 换行（技能描述中用 `<br>` 而非 `\n` 表示换行）
    - 序号与分隔符（如 `1.`、`2.`、`；`、`->`）
- 若原文存在歧义或疑似笔误，不得自行修正；应先询问用户是否按原文保留。
- “100%复制”仅约束 `*_info` 描述文本，不限制技能实现代码写法。

## 新增条目模板

- 新增条目时，先复制 `skills/character-code-generator/entry-template.json` 的结构
- 每个新条目至少填写以下字段：
    - `patternId`
    - `intent`
    - `keywords`
    - `descriptionPatterns`
    - `referenceSkills`
    - `implementationHints`
- 填写要求：
    - `patternId` 使用稳定的英文 snake_case，描述模式而不是某个具体武将
    - `keywords` 只保留可复用的关键词，不写一次性的角色名、包名或临时注释
    - `descriptionPatterns` 优先保留完整中文技能描述，而不是零散碎片
    - `referenceSkills` 至少包含一个真实存在的参考技能，且路径必须是仓库相对路径
    - `implementationHints` 只记录能指导后续生成的结构信息，不记录空泛结论

## 去重规则

- 新增条目前，必须先按以下维度在 `keyword-library.json` 中检查是否已有近似模式：
    - `intent` 是否只是同一模式的同义改写
    - `keywords` 是否与已有条目高度重合
    - `descriptionPatterns` 是否只是已有描述的轻微措辞变化
    - `referenceSkills.skillId` 是否与已有条目完全相同
- 命中已有模式时，按以下方式处理：
    - 同一技能模式仅增加了几个近义关键词：补充到已有条目的 `keywords`
    - 同一技能模式只是多了一种常见描述：补充到已有条目的 `descriptionPatterns`
    - 同一技能模式新增了更好的参考实现：补充到已有条目的 `referenceSkills`
    - 同一技能模式只是多了一条实现经验：补充到已有条目的 `implementationHints`
- 只有在以下情况才允许新建条目：
    - 核心触发时机不同
    - 核心资源成本不同
    - 目标选择规则不同且会显著改变代码骨架
    - 结算流程不同，不能通过补充 hints 解决
- 明确禁止：
    - 因为角色名称不同而新建重复条目
    - 因为“你可以摸一张牌”与“可摸1张牌”这种文案差异而新建重复条目
    - 同时存在两个只差 `patternId` 名称、但 `referenceSkills` 与实现提示实质相同的条目

### 3. 搜索相似技能

- 在项目代码库中搜索技能的自然语言描述关键词
- 定位到相似的技能描述
- 通过字典键找到对应的实现代码

### 4. 代码实现生成

- 模仿找到的代码段结构和实现方式
- 根据武将的具体需求修改代码细节
- 确保代码符合项目规范

### 5. 代码整合

将生成的代码分别添加到对应文件：

- **character/vibe.js**: 武将基本信息定义
- **translate/character/vibe.js**: 武将名称翻译
- **translate/skill/character/vibe.js**: 技能描述翻译
- **skill/character/vibe.js**: 技能实现代码
- **voices/character/vibe.js**: 技能台词

### 6. 不可适配时的底层扩展

- 若检索现有仓库后，确认现有武将技能代码模式无法适配目标技能，先暂停直接实现
- 先向用户说明：
    - 为什么现有模式无法覆盖（触发机制、状态管理、事件流或结算链路差异）
    - 计划改动的底层位置与影响范围
    - 是否需要新增底层函数/公共工具函数
- 只有在获得用户明确同意后，才允许改写更底层代码并创建新函数
- 新增底层函数后，应补充注释说明用途，并在关键词库中记录该模式对底层能力的依赖

## 文件结构说明

### 武将基本信息格式

```javascript
character_id: new Character({
    sex: "male|female",
    group: "group_name",
    hp: number,
    maxHp: number,
    hujia: number,
    skills: ["skill1", "skill2", ...],
    hasSkinInGuozhan: boolean,
}),
```

### 技能翻译格式

```javascript
// 名称翻译
skill_id: "技能名称",

// 描述翻译
skill_id_info: "技能描述文本",
```

### 技能实现格式

```javascript
skill_id: {
    audio: 3,  // 该技能共 N 条台词
    logAudio: index => (typeof index === "number" ? "skill_id" + index + ".mp3" : false),
    // 返回 false 时默认不播放；在 content 中主动调用 logSkill 并传入编号才播放
    trigger: { player: "event" },
    filter(event, player) {
        // 过滤条件
    },
    async content(event, trigger, player) {
        // 播放第 N 条台词：
        player.logSkill("skill_id", null, null, null, [N]);
    },
},
```

**`audio` / `logAudio` 说明**：
- `audio: N` 声明台词总数，对应 N 个音频文件和 N 条 voices 字幕条目
- index 从 1 开始

**是否需要 `logAudio` 取决于台词文本的标注方式**：

① **普通台词**（无括号标注，技能发动时随机播放）→ **不写 `logAudio`**：
```
台词：1.若大军遂进，足下失据而还，窃相为危之。2.陛下大军金鼓以震……
```

② **有分阶段标注的台词**（部分台词在特定时机触发）→ **写 `logAudio`**：
```
台词：1.（发动）既生七尺之躯……2.（发动后，变更主将前）广纳百川……3.（交换主副将）锥处囊中……
```
此时写法为：
```javascript
logAudio: index => (typeof index === "number" ? "skill_id" + index + ".mp3" : "skill_id" + 1 + ".mp3"),
```
- `index` 为数字时：播放对应编号台词（由 `logSkill(..., [N])` 触发）
- `index` 非数字时（技能默认发动）：播放第 1 条（若有多条"发动"台词则在调用处随机抽取编号再传入）
- 若完全没有发动时语音，非数字时返回 `false` 而非 `"skill_id1.mp3"`

### 技能台词格式（voices/character/vibe.js）

键名以 `#` 开头，值为字幕文字（非文件名）：

```javascript
// die 台词：键格式 "#gz_<characterId>:die"
"#gz_vibe_mengda:die":   "东风谬掌花权柄,却忌孤高不主张。",

// 技能台词：键格式 "#<skillKey><index>"，index 从 1 起
"#vibe_mengda_hubian1":  "臣心不自安，乃君之过也。",
"#vibe_mengda_hubian2":  "丞相吊民伐罪，吾自当举城来降。",
"#vibe_mengda_hubian3":  "立锥无地，望桑梓以何为？",
```

### 音频文件路径规则

| 类型 | 路径 |
|---|---|
| die | `audio/die/gz_<characterId>.mp3` |
| 技能台词 | `audio/skill/<skillKey><index>.mp3` |

音频文件名必须与 `logAudio` 返回值完全一致。

## 操作步骤

### 步骤1: 读取输入文件

- 读取指定路径的TXT文件
- 解析武将的基本信息、技能列表等
- 建立武将结构化数据
- 解析“备注/注释/说明”中的专有关键词解释，并更新 `keyword-glossary.json`

### 步骤2: 搜索和匹配

- 先在 `keyword-glossary.json` 中解析专有关键词语义
- 先在 `keyword-library.json` 中查找可复用模式
- 若库中命中，则优先使用条目中的 `referenceSkills` 与 `implementationHints`
- 若库中未命中，再在 `character/**/translate.js`、`mode/**/translate/**/*.js` 中搜索相似描述
- 通过相同字典键定位到对应 `skill.js` 实现
- 将本次新增关键词、参考技能键和写法摘要写回 `keyword-library.json`

### 步骤3: 生成代码

- 根据找到的技能模板生成对应代码
- 修改适配武将的具体需求
- 确保代码格式正确

### 步骤4: 输出文件

- 检查目标文件是否存在，不存在则创建
- 将生成的代码整合到对应文件中
- 维持代码格式的一致性

## 注意事项

1. **关键字库管理**: 已查询的关键字会被缓存，避免重复搜索
2. **代码格式**: 生成的代码必须符合现有代码风格
3. **技能依赖**: 确保技能间的依赖关系正确
4. **翻译一致性**: 保持翻译文本的一致性
5. **性能优化**: 通过关键字缓存减少token消耗
6. **描述保真**: `*_info` 必须与输入文档 `description` 原文逐字一致

## 错误处理

- 输入文件格式错误时给出明确提示
- 搜索不到相似技能时使用默认模板
- 目标文件写入失败时提供备用方案
- 关键字库不存在时，应先创建 `skills/character-code-generator/keyword-library.json` 再继续执行
- 关键词备注词汇表不存在时，应先创建 `skills/character-code-generator/keyword-glossary.json` 再继续执行
- 若判定为“现有技能模式不可适配”，必须先征求用户意见，不得在未经确认的情况下直接改底层代码

## 执行约束

- 每次处理技能描述前，必须先读取 `keyword-library.json`
- 每次处理技能描述前，必须先读取 `keyword-glossary.json`
- 每次完成新模式搜索后，必须更新 `keyword-library.json`
- 每次识别到新备注关键词后，必须更新 `keyword-glossary.json`
- 不允许仅在文档中声称“有关键字库”而没有对应硬盘文件
- 新增条目时，必须对照 `entry-template.json` 填写，并执行一次去重检查
- 若需要改写底层代码或新增底层函数，必须先获得用户明确同意
- 写入 `*_info` 前，必须逐条对照输入文档执行一次“原文一致性检查”
- 对 `trigger: { global: "loseAfter" }` 且语义为“角色弃置自己的牌”类技能，必须同时校验：
    - `event.type === "discard"`
    - `(event.discarder || event.getParent(2)?.player) === event.player`
- 明确禁止仅使用 `event.player == event.getParent()?.player` 判定“自己弃置”，该写法会在部分链路误判为可触发
- 当技能描述中包含”x势力技”时（如”蜀势力技”、”群雄势力技”），必须在技能实现代码的首层添加 `groupSkill: “x”` 属性（其中x为对应势力代码，如 `shu`、`qun` 等）。
- **`groupSkill` 判定逻辑双文件约束**：`playerHasGroup` 函数在 `mode/guozhan_ee/src/main.js`（管 `lib.filter.filterTrigger`）和 `mode/guozhan_ee/src/patch/game.js`（管 `game.filterSkills`）中各有一份独立实现。若需修改 `groupSkill` 的判定行为（如新增势力别名、支持复合身份），必须同步修改这两个文件，否则修改只对其中一条路径生效。
- 当描述仅为“当你需要使用X时”，必须使用 `enable: "chooseToUse"`（或等价实现），禁止混入 `chooseToRespond`。
- 当描述仅为“当你需要打出X时”，必须使用 `enable: "chooseToRespond"`（或等价实现），禁止混入 `chooseToUse`。
- 当描述明确同时包含“需要使用/打出”两类时机时，才允许使用 `enable: ["chooseToUse", "chooseToRespond"]`。
- 对“需要使用牌”的转化/虚拟使用类技能（尤其 `enable: "chooseToUse"`），若可转化牌名不是玩家当前手牌中可见原名，必须补 `hiddenCard(player, name)`，确保系统在无原名手牌时仍开放转化/虚拟使用入口。
- `hiddenCard(player, name)` 必须显式校验可转化牌名集合（如 `sha`/`wuxie`）与资源条件（如存在可转化装备手牌），禁止只写宽泛返回。
- “不能被抵消”与“不能被响应”必须区分：前者优先使用 `nowuxie` 与 `directHit2` 语义；`directHit` 仅用于“不能被响应”。
- 若文案是“你可以使用一张A，然后视为使用B”（含“先使用…再视为使用…”），实现语义必须是两段式：先使用A的实体牌，再额外视为使用B的虚拟牌；严禁误写成“将A当B使用”。
- 仅当文案是“将A当B使用/打出”时，才使用 `viewAs + filterCard(A)` 的单段转化模式。
- 对上述两段式语义，生成代码前必须在仓库中检索同类实现再落地（优先检索关键词：`然后视为使用`、`chooseUseTarget`、`useCard`），不得凭空套用“当作使用”模板。
- 语义词”同势力/相同势力角色”默认包含自己；仅当描述明确写”其他角色/除你外”时才排除自己，禁止无依据添加 `event.player == player` 过滤
- 严禁臆造”引擎内置函数/字段”；实现前必须先检索并确认 API 在代码库中存在，优先复用现有引擎接口。
- **`canMoveCard` 参数语义**：`player.canMoveCard()` 无参数时用于规则判断（是否允许发动）；`player.canMoveCard(true)` 的 `true` 参数仅供 AI 判断是否应该发动，不代表规则上可以发动。在技能 `filter` / `check` / 规则判断中只能用无参版本，禁止传 `true`。
- **`chooseToCompare` 多目标拼点**：当多名角色需要"同时"与同一敌方角色拼点时，正确写法是 `enemy.chooseToCompare(competitorsArray).callback = lib.skill.skillId.callback`，由引擎原生处理多目标拼点，**禁止**用 `compareIdx` 逐一循环 `competitor.chooseToCompare(enemy)`。callback 定义在技能对象顶层，其上下文中 `event.player` 为调用方（敌人），`event.target` 为一名竞选者，`event.winner` 为赢的一方。
- **引擎 API 新知识落盘规则**：在实现或调试过程中，若发现引擎 API 的参数语义、适用范围或潜在误用（如参数含义与直觉不符、两个相近函数的区别），应自行判断是否属于未来生成代码时容易踩坑的知识；若是，则主动将该规则添加到本文件的”执行约束”节，无需等用户提示。
- **`get.name` 的 `mod.cardname` 作用范围**：引擎 `get.name(card, player)` 只在以下两种情况下调用 `mod.cardname`：① `player` 为 Player 对象时；② 未传 `player` 且 `get.position(card) === “h”` 时。**position “s”（即 `glows` 牌，含木牛流马存储的牌）在未显式传入 player 时，mod.cardname 不会生效**。若需要让 mod.cardname 作用于 position “s” 的牌（如鏖战模式桃→杀/闪），必须在调用 `get.name` 时传入 owner，或 monkey-patch `get.name` 额外处理 “s” 位置。
- **`chooseCard` 强制参数禁止乱写**：`player.chooseCard` 的第二个参数若为 `true` 表示强制选择（玩家必须选），若为描述字符串则表示可选。技能描述中”你可以...”对应可选（传描述字符串），描述中无”可以”的强制效果才传 `true`。不确定时照抄同类技能模板，禁止猜测。
- **`async cost` + `async content` 的结果读取**：`cost` 中通过 `event.result = await player.chooseCard(...).forResult()` 存储结果后，`content` 中必须用 `event.cards`（引擎在 cost 结束后自动将 `event.result.cards` 提升到 `event.cards`），严禁在 `content` 中写 `event.result.cards`（该字段在 content 阶段已被清空）。不确定写法时，必须先在仓库中检索同类 `async cost` + `async content` 模板再落地。

## 明置技机制（guozhan_ee 独有）

### 概念定义

- **明置技**是 guozhan_ee 独有的一种特殊锁定技，用 `showing: true` 标记。
- 它表示：该技能是一种**状态类被动效果**，即使武将处于**暗置**状态，其效果在规则层面依然**对持有者自身生效**；但当持有者真正"消费"该效果（即第一次令效果产生超额收益）时，引擎会**强制明置**对应武将牌。
- 典型示例：`showing: true`，你计算到其他角色的距离时 -1。
  - 武将暗置且攻击距离为 2 时：
    - 其他角色视你的可指定距离仍为 2（不受此技影响）。
    - 你自己可以指定距离 3 以内的角色为【杀】的目标（攻击距离 2，距离 -1 后覆盖距离 3）。
    - 【顺手牵羊】的基础距离限制为 1（不受攻击范围影响，只受距离计算影响）；有此技能时，你可以指定距离 2 以内的角色为【顺手牵羊】目标（距离 -1 后等效距离 1）。
    - 当你**第一次**指定本来超额的目标（如距离 3 的角色为【杀】目标、距离 2 的角色为【顺手牵羊】目标）时，持有此技能的武将**立即强制明置**。

### 双武将明置规则

当主副将均暗置、均未被禁止明置、且均持有明置技时：

| 所需超额距离 | 明置数量 | 玩家操作 |
|---|---|---|
| 需 1 个武将效果即可覆盖 | 强制明置 1 个 | 玩家自选明置主将或副将 |
| 需 2 个武将效果才能覆盖 | 强制明置 2 个 | 玩家自选先明置哪个、再明置哪个 |

### 实现约束

- `showing: true` 是 **guozhan_ee 新增的底层机制属性**，在标准引擎中不存在。
- 实现含 `showing: true` 的技能前，**必须先确认底层已支持该属性**（检索 `patch/content.js` 或 `patch/player.js` 中是否有 `showing` 的处理逻辑）。
- 若底层尚未实现，**必须先向用户说明底层缺失并征得同意**，再按"不可适配时的底层扩展"流程新增支持，禁止直接生成上层技能代码。
- 明置技在技能定义中应同时写：
  ```javascript
  skill_id: {
      showing: true,
      locked: true,
      // ...其余属性
  }
  ```
- 明置技的效果对**持有者自身**始终生效（含暗置时）；强制明置仅在首次"消费"超额效果时触发。
- 若技能效果不依赖攻击距离/指定目标（如纯状态加成），则明置触发时机另行根据描述确定。

## 常用引擎 API 备忘

### 势力相关

- `lib.group` — 本局游戏所有势力的数组（如 `["wei","shu","wu","qun",...]`），**不含野心家身份**；需要枚举全部势力时用此变量，禁止用 `lib.selectGroup`（含义不同）。
- `isYeIdentity(id)` — 判断某 identity 是否为野心家身份（`"ye"` 或 `"x_ye"` 格式）；从 `player.js` 导入。
- `player.getIdentities()` — 返回玩家当前势力集合数组；暗置时为 `[]`，纯野心家为 `["x_ye"]`，双势力为两元素数组。
- `player.isYe()` — 是否为野心家（`getIdentities()` 含野心家身份）。
- `player.isUndetermined()` — 势力是否未确定：`identity === "unknown"`、势力集合长度 ≠ 1、或复合野心家身份（如 `"shu_ye"`）均返回 `true`。
- `player.hasCommonIdentity(target)` — 两玩家势力集合是否有交集。

## 联机模式序列化约束

联机模式下，技能函数会被 `Function.prototype.toString()` 序列化后广播给其他客户端，并通过 `security.js` 的 `_exec` / `_eval` 在受限上下文中重新执行。该上下文仅有 `lib`、`game`、`ui`、`get`、`ai`、`_status`、`gnc` 七个顶级变量，**模块作用域的局部函数和闭包变量均不可用**。

### 规则1：模块局部函数不得在可序列化函数中直接引用

- `content.js`、`game.js` 等模块文件中以 `function foo()` 或 `const foo = ...` 形式定义的函数，在联机 eval 上下文中不存在。
- 若某函数（如 `filterButton`、`chooseCharacterCheck`、`check`）会被 `next.set(...)` 注册到事件上并在联机时广播执行，其函数体内不得直接调用任何模块局部函数。
- **正确做法**：将需要共享的工具函数挂载到 `game` 对象上（`game.myHelper = function(...) {...}`），在序列化函数中改写为 `game.myHelper(...)`。挂载代码应放在模块初始化阶段（import 之后、class 定义之前）。
- **示例**（`game.js`）：
  ```javascript
  // 挂载到 game，使 eval 上下文可访问
  game.isValidCharacterPair = function (name1, name2) {
      if (_status.separatism) return true;
      return isValidCharacterCombination(name1, name2);
  };
  // 之后 filterButton / chooseCharacterCheck 中改用 game.isValidCharacterPair(...)
  ```

### 规则2：`chooseButton.backup` 的闭包变量不得在 `content` 中直接引用

- `backup(result, player)` 返回的对象会被存入 `lib.skill[skillName + “_backup”]`，并通过 `event._sendskill` 序列化广播。
- `content` 函数被 stringify 后重新 eval，**所有从 `backup` 闭包捕获的局部变量（如 `color`、`target`、`num`）均会丢失**，导致联机端执行时变量为 `undefined`，技能只有台词没有实际效果。
- **正确做法**：将运行时决策值作为**普通属性**写入 backup 返回对象（原始值可序列化），`content` 中改从 `lib.skill[event.name].属性名` 读取（注意：backup content 的 event 由 `game.createEvent(skillName)` 创建，只有 `event.name` 而无 `event.skill`）。
- **示例**（`pokemon_tanwei` 阴技能）：
  ```javascript
  backup(result, player) {
      const color = result.control === “红色” ? “red” : “black”;
      return {
          log: false,
          color: color,           // ✅ 普通属性，序列化后保留
          async content(event, trigger, player) {
              const color = lib.skill[event.name].color;  // ✅ 运行时从 lib.skill 读取（用 event.name，不是 event.skill）
              const cards = player.getCards(“h”, card => get.color(card) == color);
              // ...
          },
      };
  },
  ```
- **禁止**：
  ```javascript
  backup(result, player) {
      const color = result.control === “红色” ? “red” : “black”;
      return {
          async content(event, trigger, player) {
              // ❌ color 是闭包变量，联机序列化后丢失
              const cards = player.getCards(“h”, card => get.color(card) == color);
          },
      };
  },
  ```
- 该规则适用于所有通过 `backup` 传递运行时状态到 `content` 的场景，包括但不限于：选择的颜色、数量、目标名、牌名等。

## 视为使用有目标的锦囊牌

- **禁止**直接 `player.useCard({ name: "xxx", isCard: true })` 来"视为使用"一张带 `filterTarget` 的锦囊牌（如水淹七军、决斗等）。没有提供目标时，卡牌的 content 中的 `target` 为 undefined，效果无法触发。
- **正确做法**：先用 `player.chooseTarget()` 让玩家选择合法目标（filter 逻辑与该卡牌的 `filterTarget` 保持一致），再调用：
  ```javascript
  player.useCard({ name: "xxx", isCard: true }, result.targets[0], false);
  ```
  第三参数 `false` 抑制 AI 确认弹窗，使牌直接对指定目标生效。
- 仅对**无目标/自动全体目标**的锦囊（如桃园结义、万箭齐发等）可省略目标参数。
- 在 step-based content 中，chooseTarget 和 useCard 必须分两步写，示例：
  ```javascript
  "step N";
  player.chooseTarget(true, "选择目标", function(card, player, target) {
      return target !== player && target.countCards("e") > 0;
  });
  "step N+1";
  if (!result.bool || !result.targets.length) return;
  player.useCard({ name: "shuiyanqijun_ee", isCard: true }, result.targets[0], false);
  ```

## 示例

输入文件内容：

```
武将名称: 宫永照
性别: 女
势力: 麻将
体力: 4
技能: 月咏, 月冷, 月清, 月明, 月会, 月情歌, 月怜, 月落, 月魂
```

输出文件将包含对应的JavaScript代码，分别整合到各个目标文件中。
