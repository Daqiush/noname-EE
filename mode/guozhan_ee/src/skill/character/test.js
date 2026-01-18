import { lib, game, ui, get as _get, ai, _status } from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan } from "../../patch/player.js";

/** @type {GetGuozhan}  */
const get = cast(_get);

/** @type {Record<string, Skill>} */
export default {
	// 从魏大秋蜀二的测试技能：造成100点伤害
	gz_daqiush_kill: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			target.damage(100);
		},
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},
	// 从魏大秋蜀二的测试技能：选择隐藏主将或副将
	gz_daqiush_hide: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			"step 0";
			var choiceList = ["暗置主将", "暗置副将"];
			player.chooseControl(lib.card.chiling.chooseai).set("prompt", "暗将").set("choiceList", choiceList);
			"step 1";
			var index = result.index;
			if (index === 0)
				target.hideCharacter(0);
			else
				target.hideCharacter(1);
		},
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 从魏大秋蜀二的测试技能：选择隐藏主将或副将
	gz_daqiush_show: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			"step 0";
			var choiceList = ["明置主将", "明置副将"];
			player.chooseControl(lib.card.chiling.chooseai).set("prompt", "明将").set("choiceList", choiceList);
			"step 1";
			var index = result.index;
			if (index === 0)
				target.showCharacter(0);
			else
				target.showCharacter(1);
		},
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 从魏大秋蜀二的测试技能：传播副将
	gz_daqiush_infect: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			"step 0";
			var secondCharacter = player.name2;
			if (secondCharacter) {
				target.replaceCharacter(1, secondCharacter, false);
				if (target.isUnseen(1))
					target.showCharacter(1);
			}
		},
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 从魏大秋蜀二的测试技能：变更主将
	gz_daqiush_changemain: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			"step 0";
			target.changeMain(false);
		},
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 从魏大秋蜀二的测试技能：选择移除主将或副将
	gz_daqiush_remove: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			"step 0";
			var choiceList = ["移除主将", "移除副将"];
			player.chooseControl(lib.card.chiling.chooseai).set("prompt", "移除将").set("choiceList", choiceList);
			"step 1";
			var index = result.index;
			if (index === 0)
				target.removeCharacter(0);
			else
				target.removeCharacter(1);
		},
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 技能A：主动技能，初始禁用，需要被其他技能激活
	gz_daqiush_controlled_active: {
	    enabledByDefault: false,  // 初始状态为禁用
	    enable: "phaseUse",
		usable: 10000,
	    content: function () {
	        player.draw(2);
	    },
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},
	
	// 技能B：可以使能技能A的使能位
	gz_daqiush_enable_active: {
	    enable: "phaseUse",
	    usable: 10000,
	    content: function () {
	        // 使能技能A
	        player.enableSkillBit("gz_daqiush_controlled_active");
	    },
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},
	
	
	// 技能C：可以失能技能A的使能位
	gz_daqiush_disable_active: {
	    enable: "phaseUse",
		usable: 10000,
	    content: function () {
	        // 失能技能A
	        player.disableSkillBit("gz_daqiush_controlled_active");
	    },
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 技能D：被动技能，初始禁用，需要被其他技能激活
	gz_daqiush_controlled_passive: {
	    enabledByDefault: false,  // 初始状态为禁用
	    trigger: {player: "damageEnd"},
	    // 保证AI不会使用此技能
		check() {
			return false;
		},
		async content(event, trigger, player) {
	        "step 0";
			var damageAmount = trigger.num;
			player.recover(damageAmount);
	    }
	},
	
	// 技能E：可以使能技能D的使能位
	gz_daqiush_enable_passive: {
	    enable: "phaseUse",
	    usable: 10000,
	    content: function () {
	        // 使能技能D
	        player.enableSkillBit("gz_daqiush_controlled_passive");
	    },
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},
	
	
	// 技能F：可以失能技能D的使能位
	gz_daqiush_disable_passive: {
	    enable: "phaseUse",
		usable: 10000,
	    content: function () {
	        // 失能技能D
	        player.disableSkillBit("gz_daqiush_controlled_passive");
	    },
		ai: {
			// 确保AI不会使用此技能
			order: 0,
			result: {
				target: 0,
			},
		},
	},

	// 玉魔：
	miyanaga_teru_yumo: {
	    enabledByDefault: true,  // 初始状态为启用
		audio: 3,
		group: ["miyanaga_teru_yumo_battlecry", "miyanaga_teru_yumo_assertion"],
		subSkill:{
			battlecry:{
				trigger: {player: "showCharacterEnd"},
				forced: true,
				filter(event, player) {
					return event.toShow.some(name => {
						return get.character(name, 3).includes("miyanaga_teru_yumo");
					});
				},
				async content(event, trigger, player) {
					player.replaceCharacter(1, "gz_amae_koromo", false);
					if (player.isUnseen(1))
						player.showCharacter(1);
					return;
				}
			},
			assertion:{
				trigger: {global: "phaseBegin", player: "showCharacterEnd"},
				audio: ["miyanaga_teru_assert1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					if (trigger.name == "phase") {
						// 回合开始时失能此技能，获取技能名方法为event.name，但截掉最后一个子技能名（一个下划线）部分
						const parentName = event.name.slice(0, event.name.lastIndexOf("_"));
						player.disableSkillBit(parentName);
						player.addTempSkill("miyanaga_teru_yumo_assertion_succeeded", "phaseBefore");
						player.addTempSkill("miyanaga_teru_yumo_assertion_failed", "phaseBefore");
					}
				},
			},
			assertion_succeeded:{
				trigger: {global: "phaseEnd"},
				audio: ["miyanaga_teru_yumo_assertion_succeeded1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 成功：使能【月冷】。从弃牌堆中获得此牌。
				}
			},
			assertion_failed:{
				trigger: {global: "phaseEnd"},
				audio: ["miyanaga_teru_yumo_assertion_failed1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 失败：使能【玉魔】。
					player.enableSkillBit("miyanaga_teru_yumo");  
				}
			}
		}
	},


	// 月冷：
	gz_miyanaga_teru_yueleng: {
	    enabledByDefault: true,  // 初始状态为启用
		audio: 3,
		group: ["gz_miyanaga_teru_yueleng_assertion"],
		subSkill:{
			assertion:{
				trigger: {global: "phaseBegin", player: "showCharacterEnd"},
				audio: ["gz_miyanaga_teru_assert1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					if (trigger.name == "phase") {
						// 回合开始时失能此技能
						const parentName = event.name.slice(0, event.name.lastIndexOf("_"));
						player.disableSkillBit(parentName);
						player.addTempSkill("gz_miyanaga_teru_yueleng_assertion_succeeded", "phaseBefore");
						player.addTempSkill("gz_miyanaga_teru_yueleng_assertion_failed", "phaseBefore");
					}
				},
			},
			assertion_succeeded:{
				trigger: {global: "phaseEnd"},
				audio: ["gz_miyanaga_teru_yueleng_assertion_succeeded1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 成功：使能【月清】。从弃牌堆中获得此牌。
				}
			},
			assertion_failed:{
				trigger: {global: "phaseEnd"},
				audio: ["gz_miyanaga_teru_yueleng_assertion_failed1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 失败：使能【玉魔】。
					player.enableSkillBit("miyanaga_teru_yumo");  
				}
			}
		}
	},
};
