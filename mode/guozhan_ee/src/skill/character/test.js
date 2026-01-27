import { lib, game, ui, get as _get, ai, _status } from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan } from "../../patch/player.js";
import skill from "../index.js";

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
			player.chooseControl().set("prompt", "暗将").set("choiceList", choiceList);
			"step 1";
			console.log(result);
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

	// 从魏大秋蜀二的测试技能：选择展示主将或副将
	gz_daqiush_show: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return true;
		},
		content: function () {
			"step 0";
			var choiceList = ["明置主将", "明置副将"];
			player.chooseControl().set("prompt", "明将").set("choiceList", choiceList);
			"step 1";
			console.log(result);
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
			player.chooseControl().set("prompt", "移除将").set("choiceList", choiceList);
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

	// 从魏大秋蜀二的测试技能：游戏开始时，从牌堆中获得传国玉玺，并装备
	gz_daqiush_chengdi: {
		trigger: { 	
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		content() {
			"step 0";
			player.getNext().replaceCharacter(1, "gz_daqiush1", false);
			if (player.getNext().isUnseen(1))
				player.getNext().showCharacter(1);
			player.getNext().getNext().replaceCharacter(1, "gz_daqiush11", false);
			if (player.getNext().getNext().isUnseen(1))
				player.getNext().getNext().showCharacter(1);
			"step 1";
			var cards = [];
			var card = get.cardPile2(function (card) {
				return card.name == "chuanguoyuxi_ee";
			});
			if (card) {
				cards.push(card);
			}
			card = get.cardPile2(function (card) {
				return card.name == "huoshaolianying_ee";
			});
			if (card) {
				cards.push(card);
			}
			if (cards.length) {
				player.getPrevious().gain(cards, "gain2");
				for (var card of cards) {
					player.getPrevious().chooseUseTarget(card, true, "nopopup");
				}
			}
		}
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

	// 技能D：被动技能，初始启用，可以被其他技能禁用
	gz_daqiush_controlled_passive: {
	    enabledByDefault: true,  // 初始状态为启用
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

	// 月涌：
	miyanaga_teru_yueyong: {
	    enabledByDefault: true,  // 初始状态为启用
		audio: ["miyanaga_teru_assert1.mp3", "miyanaga_teru_yueyong_assertion_succeeded1.mp3", "miyanaga_teru_yueyong_assertion_failed1.mp3"],
		group: ["miyanaga_teru_yueyong_battlecry", "miyanaga_teru_yueyong_assertion"],
		subSkill:{
			battlecry:{
				skillAnimation: true,
				animationColor: "thunder",
				trigger: {player: "showCharacterEnd"},
				forced: true,
				filter(event, player) {
					return event.toShow.some(name => {
						return get.character(name, 3).includes("miyanaga_teru_yueyong");
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
				trigger: {global: "phaseBegin"},
				audio: ["miyanaga_teru_assert1.mp3"],
				forced: true,
				content: async function(event, trigger, player) {
					if (trigger.name == "phase") {
						"step 0";
						// 回合开始时失能此技能，获取技能名方法为event.name，但截掉最后一个子技能名（一个下划线）部分
						const parentName = event.name.slice(0, event.name.lastIndexOf("_"));
						player.disableSkillBit(parentName);
						player.addTempSkills(["miyanaga_teru_yueyong_assertion_succeeded", "miyanaga_teru_yueyong_assertion_failed"], "phaseBefore");
						"step 1";
						// 秘密指定一个花色X
					 	const result = await player
							.chooseControl(lib.suit)
							.set("prompt", "请选择一个花色：")
							.set("prompt2", "猜测本回合下一张被其他角色使用的有花色的牌的花色。")
							.forResult();
						console.log(result);
						"step 2";
						// 记录所选花色
						var suit = result.control;
						player.storage.yueyong_assertion_mark ??= [];
						player.storage.yueyong_assertion_mark.add(suit);
						player.markSkill("yueyong_assertion_mark", null, null, false);
					}
				},
			},
			assertion_succeeded:{
				trigger: {global: ["useCard", "phaseEnd"]},
				filter: function(event, player) {
					if (event.name === "useCard") {
						if (player.hasMark("yueyong_assertion_succeeded_mark")) {
							return false;
						}
						var suit = get.suit(event.card)
						console.log("实际花色为："+suit+"，断言花色为："+player.storage.yueyong_assertion_mark[0]);
						return lib.suit.includes(suit) && suit === player.storage.yueyong_assertion_mark[0] && event.player != player;
					}
					// 回合结束成功结算
					else if (event.name === "phase"){
						return player.hasMark("yueyong_assertion_succeeded_mark");
					}
				},
				audio: ["miyanaga_teru_yueyong_assertion_succeeded1.mp3"],
				forced: true,
				content: async function(event, trigger, player) {
					// 成功：使能【月冷】。本回合结束时，从弃牌堆中获得此牌。
					if (trigger.name === "useCard") {
						player.addMark("yueyong_assertion_succeeded_mark");
						player.storage.yueyong_assertion_mark.remove(player.storage.yueyong_assertion_mark[0]);
						player.unmarkSkill("yueyong_assertion_mark");
						player.removeSkill(["miyanaga_teru_yueyong_assertion_failed"]);
						player.enableSkillBit("miyanaga_teru_yueleng");
						// 记录这张被使用的牌
						player.storage.miyanaga_teru_yueyong_usedcard = trigger.cards;
						console.log("断言成功，记录被使用的牌：", trigger.cards);
					}
					else if (trigger.name === "phase") {
						player.removeMark("yueyong_assertion_succeeded_mark");

						// 从弃牌堆中获得此牌
						var usedCards = player.storage.miyanaga_teru_yueyong_usedcard;
						if (usedCards && usedCards.length) {
							var cardsToGain = [];
							for (var card of usedCards) {
								if (ui.discardPile.contains(card)) {
									cardsToGain.push(card);
								}
							}
							if (cardsToGain.length) {
								player.gain(cardsToGain, "gain2");
							}
						}
					}
				}
			},
			assertion_failed:{
				trigger: {global: ["useCard", "phaseEnd"]},
				filter: function(event, player) {
					if (event.name === "useCard") {
						var suit = get.suit(event.card)
						console.log("实际花色为："+suit+"，断言花色为："+player.storage.yueyong_assertion_mark[0]);
						return lib.suit.includes(suit) && suit !== player.storage.yueyong_assertion_mark[0] && event.player != player;
					}
					// 回合结束且没有其他角色使用有花色的牌，也会导致失败
					else if (event.name === "phase"){
						console.log("本回合没有其他角色使用有花色的牌。");
						return true;
					}
				},
				audio: ["miyanaga_teru_yueyong_assertion_failed1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 失败：使能【月涌】。
					console.log("断言失败，重新使能月涌。");
					player.storage.yueyong_assertion_mark.remove(player.storage.yueyong_assertion_mark[0]);
					player.unmarkSkill("yueyong_assertion_mark");
					player.removeSkills(["miyanaga_teru_yueyong_assertion_succeeded", "miyanaga_teru_yueyong_assertion_failed"]);
					player.enableSkillBit("miyanaga_teru_yueyong");  
				}
			}
		}
	},

	yueyong_assertion_mark: {
		marktext: "涌",
		intro: {
			name: "月涌",
			content: "你已秘密指定一个花色：“$”，并断言本回合第一张由其他角色使用且有花色的牌的花色为此花色。",
		},
	},

	// 月冷：
	miyanaga_teru_yueleng: {
	    enabledByDefault: false,  // 初始状态为禁用
		audio: ["miyanaga_teru_assert1.mp3", "miyanaga_teru_yueleng_assertion_succeeded1.mp3", "miyanaga_teru_yueleng_assertion_failed1.mp3"],
		group: ["miyanaga_teru_yueleng_assertion"],
		subSkill:{
			assertion:{
				trigger: {global: "phaseBegin"},
				audio: ["gz_miyanaga_teru_assert1.mp3"],
				forced: true,
				async content(event, trigger, player, result) {
					if (trigger.name == "phase") {
						"step 0";
						// 回合开始时失能此技能
						const parentName = event.name.slice(0, event.name.lastIndexOf("_"));
						player.disableSkillBit(parentName);
						player.addTempSkills(["miyanaga_teru_yueleng_assertion_succeeded", "miyanaga_teru_yueleng_assertion_failed"], "phaseBefore");
					}
				},
			},
			assertion_succeeded:{
				trigger: {global: "phaseEnd"},
				audio: ["miyanaga_teru_yueleng_assertion_succeeded1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 成功：使能【月清】。摸1张牌。
				}
			},
			assertion_failed:{
				trigger: {global: "phaseEnd"},
				audio: ["miyanaga_teru_yueleng_assertion_failed1.mp3"],
				forced: true,
				async content(event, trigger, player) {
					// 失败：使能【月涌】。
					player.enableSkillBit("miyanaga_teru_yueyong");  
				}
			}
		}
	},
};
