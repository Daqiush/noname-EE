import { getTypeOf } from "jszip/lib/deprecatedPublicUtils.js";
import { lib, game, ui, get as _get, ai, _status}  from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan } from "../../patch/player.js";
import skill from "../index.js";
import content from "../../patch/content.js";

/** @type {GetGuozhan}  */
const get = cast(_get);

/** @type {Record<string, Skill>} */
export default {
	/*----分界线----*/

	/**
	 * 明置技·马术：你到其他角色的距离-1。
	 * 暗置时效果依然对你自身生效；当你因此技能"消费"额外范围时，相应武将牌强制明置。
	 * 通过 mod.targetInRange 扩展范围，不使用 mod.globalFrom，
	 * 因此 player.inRange 返回自然距离，借刀杀人等效果不受影响。
	 */
	vibe_mashu: {
		showing: true,
		locked: true,
		mod: {
			targetInRange(card, player, target) {
				const skillName = "vibe_mashu";
				const mainSkills = lib.character[player.name1]?.[3] ?? [];
				const viceSkills = lib.character[player.name2]?.[3] ?? [];
				let hiddenCount = 0;
				if (mainSkills.includes(skillName) && player.isUnseen(0)) hiddenCount++;
				if (viceSkills.includes(skillName) && player.isUnseen(1)) hiddenCount++;
				if (hiddenCount === 0) return;
				const cardInfo = get.info(card);
				if (!cardInfo?.range) return;
				if (typeof cardInfo.range === "function") {
					if (player.inRange(target)) return;
					const attackRange = player.getAttackRange();
					if (attackRange < 1) return;
					if (get.distance(player, target, "attack") - hiddenCount <= attackRange) return true;
				} else if (cardInfo.range.global !== undefined) {
					const dist = get.distance(player, target);
					if (dist > cardInfo.range.global && dist - hiddenCount <= cardInfo.range.global) return true;
				} else if (cardInfo.range.attack !== undefined) {
					const attackRange = player.getAttackRange();
					if (attackRange < 1) return;
					const dist = get.distance(player, target);
					const threshold = attackRange + cardInfo.range.attack;
					if (dist >= threshold && dist - hiddenCount < threshold) return true;
				}
			},
		},
		trigger: { player: "useCardBegin" },
		forced: true,
		filter(event, player) {
			if (!event.targets?.length) return false;
			const skillName = "vibe_mashu";
			const mainSkills = lib.character[player.name1]?.[3] ?? [];
			const viceSkills = lib.character[player.name2]?.[3] ?? [];
			let hiddenCount = 0;
			if (mainSkills.includes(skillName) && player.isUnseen(0)) hiddenCount++;
			if (viceSkills.includes(skillName) && player.isUnseen(1)) hiddenCount++;
			if (hiddenCount === 0) return false;
			const cardInfo = get.info(event.card);
			if (!cardInfo?.range) return false;
			return event.targets.some(target => {
				if (typeof cardInfo.range === "function") {
					return !player.inRange(target);
				} else if (cardInfo.range.global !== undefined) {
					return get.distance(player, target) > cardInfo.range.global;
				} else if (cardInfo.range.attack !== undefined) {
					return get.distance(player, target) >= player.getAttackRange() + cardInfo.range.attack;
				}
				return false;
			});
		},
		async content(_event, trigger, player) {
			const skillName = "vibe_mashu";
			game.log(player, "即将触发明置技");
			const mainSkills = lib.character[player.name1]?.[3] ?? [];
			const viceSkills = lib.character[player.name2]?.[3] ?? [];
			const mainUnseen = mainSkills.includes(skillName) && player.isUnseen(0);
			const viceUnseen = viceSkills.includes(skillName) && player.isUnseen(1);
			const hiddenCount = (mainUnseen ? 1 : 0) + (viceUnseen ? 1 : 0);
			const cardInfo = get.info(trigger.card);
			let maxDeficit = 0;
			for (const target of trigger.targets) {
				let deficit = 0;
				if (typeof cardInfo.range === "function") {
					if (!player.inRange(target)) {
						deficit = get.distance(player, target, "attack") - player.getAttackRange();
					}
				} else if (cardInfo.range.global !== undefined) {
					deficit = Math.max(0, get.distance(player, target) - cardInfo.range.global);
				} else if (cardInfo.range.attack !== undefined) {
					const attackRange = player.getAttackRange();
					deficit = Math.max(0, get.distance(player, target) - (attackRange + cardInfo.range.attack - 1));
				}
				if (deficit > maxDeficit) maxDeficit = deficit;
			}
			let toReveal = Math.min(maxDeficit, hiddenCount);
			if (toReveal >= 1 && mainUnseen) {
				await player.showCharacter(0);
				toReveal--;
			}
			if (toReveal >= 1 && viceUnseen) {
				await player.showCharacter(2);
			}
		},
	},

	// 诸葛亮：对火攻结算，可选择修改规则
	bazhen_bagua_ee: {
		audio: "bazhen",
		audioname: ["re_sp_zhugeliang", "ol_sp_zhugeliang", "ol_pangtong"],
		equipSkill: true,
		inherit: "bagua_skill",
		sourceSkill: "vibe_zhugeliang_bazhen",
		filter(event, player) {
			if (!lib.skill.bagua_skill.filter(event, player)) {
				return false;
			}
			if (!player.hasEmptySlot(2)) {
				return false;
			}
			return true;
		},
		ai: {
			respondShan: true,
			freeShan: true,
			skillTagFilter(player, tag, arg) {
				if (tag !== "respondShan" && tag !== "freeShan") {
					return;
				}
				if (!player.hasEmptySlot(2) || player.hasSkillTag("unequip2")) {
					return false;
				}
				if (!arg || !arg.player) {
					return true;
				}
				if (
					arg.player.hasSkillTag("unequip", false, {
						target: player,
					})
				) {
					return false;
				}
				return true;
			},
			effect: {
				target(card, player, target) {
					if (player == target && get.subtype(card) == "equip2") {
						if (get.equipValue(card) <= 7.5) {
							return 0;
						}
					}
					if (!target.hasEmptySlot(2)) {
						return;
					}
					return lib.skill.bagua_skill.ai.effect.target.apply(this, arguments);
				},
			},
		},
	},
	
	vibe_zhugeliang_huoji: {
		audio: 2,
		onremove(player, skill) {
			if (player.storage?.vibe_zhugeliang_huoji_record) {
				console.log("[vibe_zhugeliang_huoji] clear record on remove", player.playerid, Object.keys(player.storage.vibe_zhugeliang_huoji_record));
				delete player.storage.vibe_zhugeliang_huoji_record;
			}
		},
		trigger: { player: "useCard" },
		direct: true,
		locked: false,
		popup: false,
		filter(event, player) {
			return event.card?.name == "huogong";
		},
		content() {
			"step 0";
			player
				.chooseControl("弃置->展示", "花色->颜色", "其->其与其同一队列的其他角色", "cancel2")
				.set("prompt", "火计：请选择本次修改项")
				.set("ai", () => "花色->颜色");
			"step 1";
			if (!result.control || result.control == "cancel2") {
				event.finish();
				return;
			}
			event.mode = result.control;
			var id = trigger.card.cardid;
			trigger.card.storage = trigger.card.storage || {};
			if (!id) {
				if (!trigger.card.storage.vibe_zhugeliang_huoji_record_id) {
					trigger.card.storage.vibe_zhugeliang_huoji_record_id = lib.status.videoId++;
				}
				id = trigger.card.storage.vibe_zhugeliang_huoji_record_id;
			} else {
				trigger.card.storage.vibe_zhugeliang_huoji_record_id = id;
			}
			if (!player.storage.vibe_zhugeliang_huoji_record) {
				player.storage.vibe_zhugeliang_huoji_record = {};
			}
			player.storage.vibe_zhugeliang_huoji_record[id] = event.mode;
			player.chat(result.control);
			console.log("[vibe_zhugeliang_huoji] record", player.playerid, id, event.mode);
		},
		huogongContentShow() {
			"step 0";
			if (target.countCards("h") == 0) {
				event.finish();
				return;
			}
			if (target.countCards("h") == 1) {
				event._result = { cards: target.getCards("h") };
			} else {
				target.chooseCard(true).ai = function (card) {
					if (_status.event.getRand() < 0.5) {
						return Math.random();
					}
					return get.value(card);
				};
			}
			"step 1";
			target.showCards(result.cards).setContent(function () {});
			event.dialog = ui.create.dialog(get.translation(target) + "展示的手牌", result.cards);
			event.videoId = lib.status.videoId++;
			game.broadcast("createDialog", event.videoId, get.translation(target) + "展示的手牌", result.cards);
			game.addVideo("cardDialog", null, [get.translation(target) + "展示的手牌", get.cardsInfo(result.cards), event.videoId]);
			event.card2 = result.cards[0];
			game.log(target, "展示了", event.card2);
			game.addCardKnower(result.cards, "everyone");

			event._result = {};
			player
				.chooseCard("h", "请展示一张与展示牌花色相同的手牌", function (card) {
					return get.suit(card) == get.suit(_status.event.getParent().card2);
				})
				.set("ai", function (card) {
					var evt = _status.event.getParent();
					if (get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0) {
						return 6.2 + Math.min(4, evt.player.hp) - get.value(card, evt.player);
					}
					return -1;
				});
			game.delay(2);
			"step 2";
			if (result.bool) {
				player.showCards(result.cards, "火计：展示代替弃置");
				target.damage("fire");
			} else {
				target.addTempSkill("huogong2");
			}
			event.dialog.close();
			game.addVideo("cardDialog", null, event.videoId);
			game.broadcast("closeDialog", event.videoId);
		},
		huogongContentQueueSplash() {
			"step 0";
			if (target.countCards("h") == 0) {
				event.finish();
				return;
			}
			if (target.countCards("h") == 1) {
				event._result = { cards: target.getCards("h") };
			} else {
				target.chooseCard(true).ai = function (card) {
					if (_status.event.getRand() < 0.5) {
						return Math.random();
					}
					return get.value(card);
				};
			}
			"step 1";
			target.showCards(result.cards).setContent(function () {});
			event.dialog = ui.create.dialog(get.translation(target) + "展示的手牌", result.cards);
			event.videoId = lib.status.videoId++;
			game.broadcast("createDialog", event.videoId, get.translation(target) + "展示的手牌", result.cards);
			game.addVideo("cardDialog", null, [get.translation(target) + "展示的手牌", get.cardsInfo(result.cards), event.videoId]);
			event.card2 = result.cards[0];
			game.log(target, "展示了", event.card2);
			game.addCardKnower(result.cards, "everyone");

			event._result = {};
			player
				.chooseToDiscard({ suit: get.suit(event.card2) }, function (card) {
					var evt = _status.event.getParent();
					if (get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0) {
						return 6.2 + Math.min(4, evt.player.hp) - get.value(card, evt.player);
					}
					return -1;
				})
				.set("prompt", false);
			game.delay(2);
			"step 2";
			if (result.bool) {
				target.damage("fire");
				var extraTargets = game.filterPlayer(current => {
					if (current == player || current == target) {
						return false;
					}
					return typeof target.inline == "function" ? target.inline(current) : false;
				});
				if (extraTargets.length) {
					player.line(extraTargets, "fire");
					for (var i = 0; i < extraTargets.length; i++) {
						extraTargets[i].damage("fire");
					}
				}
			} else {
				target.addTempSkill("huogong2");
			}
			event.dialog.close();
			game.addVideo("cardDialog", null, event.videoId);
			game.broadcast("closeDialog", event.videoId);
		},
		huogongContentColor() {
			"step 0";
			if (target.countCards("h") == 0) {
				event.finish();
				return;
			}
			if (target.countCards("h") == 1) {
				event._result = { cards: target.getCards("h") };
			} else {
				target.chooseCard(true).ai = function (card) {
					if (_status.event.getRand() < 0.5) {
						return Math.random();
					}
					return get.value(card);
				};
			}
			"step 1";
			target.showCards(result.cards).setContent(function () {});
			event.dialog = ui.create.dialog(get.translation(target) + "展示的手牌", result.cards);
			event.videoId = lib.status.videoId++;
			game.broadcast("createDialog", event.videoId, get.translation(target) + "展示的手牌", result.cards);
			game.addVideo("cardDialog", null, [get.translation(target) + "展示的手牌", get.cardsInfo(result.cards), event.videoId]);
			event.card2 = result.cards[0];
			game.log(target, "展示了", event.card2);
			game.addCardKnower(result.cards, "everyone");

			event._result = {};
			player
				.chooseToDiscard({ color: get.color(event.card2) }, function (card) {
					var evt = _status.event.getParent();
					if (get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0) {
						return 6.2 + Math.min(4, evt.player.hp) - get.value(card, evt.player);
					}
					return -1;
				})
				.set("prompt", false);
			game.delay(2);
			"step 2";
			if (result.bool) {
				target.damage("fire");
			} else {
				target.addTempSkill("huogong2");
			}
			event.dialog.close();
			game.addVideo("cardDialog", null, event.videoId);
			game.broadcast("closeDialog", event.videoId);
		},
		getHuojiContentByCard(card, player) {
			if (card?.name != "huogong") {
				return null;
			}
			var id = card.cardid || card.storage?.vibe_zhugeliang_huoji_record_id;
			var map = player.storage.vibe_zhugeliang_huoji_record || {};
			var mode = map[id];
			console.log("[vibe_zhugeliang_huoji] lookup", player.playerid, id, mode);
			var contentMap = {
				"弃置->展示": lib.skill.vibe_zhugeliang_huoji.huogongContentShow,
				"花色->颜色": lib.skill.vibe_zhugeliang_huoji.huogongContentColor,
				"其->其与其同一队列的其他角色": lib.skill.vibe_zhugeliang_huoji.huogongContentQueueSplash,
			};
			return contentMap[mode] || null;
		},
		group: ["vibe_zhugeliang_huoji_viewAs", "vibe_zhugeliang_huoji_effect", "vibe_zhugeliang_huoji_dieClear"],
		subSkill: {
			effect: {
				trigger: { global: "huogongBegin" },
				forced: true,
				locked: false,
				popup: false,
				filter(event, player) {
					return !!lib.skill.vibe_zhugeliang_huoji.getHuojiContentByCard(event.card, player);
				},
				content() {
					var content = lib.skill.vibe_zhugeliang_huoji.getHuojiContentByCard(trigger.card, player);
					if (content) {
						trigger.setContent(content);
					}
				},
			},
			dieClear: {
				trigger: { player: "dieBegin" },
				silent: true,
				content() {
					if (player.storage?.vibe_zhugeliang_huoji_record) {
						console.log("[vibe_zhugeliang_huoji] clear record on die", player.playerid, Object.keys(player.storage.vibe_zhugeliang_huoji_record));
						delete player.storage.vibe_zhugeliang_huoji_record;
					}
				},
			},
			viewAs: {
				audio: 2,
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					return player.countCards("h", card => get.color(card) == "red") > 0;
				},
				filterCard(card) {
					return get.color(card) == "red";
				},
				position: "h",
				viewAs: { name: "huogong", isCard: true },
				viewAsFilter(player) {
					return player.countCards("h", card => get.color(card) == "red") > 0;
				},
				check(card) {
					return 6 - get.value(card);
				},
				prompt: "将一张红色手牌当【火攻】使用",
				ai: {
					order: 7,
					result: {
						target: -1,
					},
				},
			},
		},
	},

	vibe_zhugeliang_kanpo: {
			audio: 2,
			enable: ["chooseToUse", "chooseToRespond"],
			filterCard(card) {
				return get.color(card) == "black";
			},
			position: "h",
			viewAs: { name: "wuxie" },
			viewAsFilter(player) {
				return player.countCards("h", card => get.color(card) == "black") > 0;
			},
			prompt: "将一张黑色手牌当【无懈可击】使用或打出",
			check(card) {
				return 8 - get.value(card);
			},
		},

	vibe_zhugeliang_bazhen: {
		inherit: "bazhen",
		group: ["bazhen_bagua_ee", "vibe_zhugeliang_bazhen_gain"],
	},

	vibe_zhugeliang_bazhen_gain: {
		trigger: { player: "showCharacterAfter" },
		direct: true,
		filter(event, player) {
			if (player.storage.vibe_zhugeliang_bazhen_shown_once) {
				return false;
			}
			if (!event.toShow || !event.toShow.length) {
				return false;
			}
			if (_status.currentPhase == player) {
				return false;
			}
			var names = event.toShow.map(name => {
				var skills = get.character(name, 3) || [];
				return skills.includes("vibe_zhugeliang_bazhen");
			});
			return names.includes(true) && _status.currentPhase && _status.currentPhase.isIn() && _status.currentPhase.countCards("he") > 0;
		},
		content() {
			"step 0";
			player.storage.vibe_zhugeliang_bazhen_shown_once = true;
			player.choosePlayerCard(_status.currentPhase, "he", true, "八阵：获得前回合角色的一张牌");
			"step 1";
			if (result.bool && result.cards && result.cards.length) {
				player.gain(result.cards, _status.currentPhase, "giveAuto", "bySelf");
			}
		},
	},

	vibe_zhaoyun_longdan: {
		inherit: "longdan",
	},
	vibe_zhaoyun_yajiao: {
		group: ["vibe_zhaoyun_yajiao_use", "vibe_zhaoyun_yajiao_respond"],
		subSkill: {
        use: {
			trigger: { player: "useCard" },
            direct: true,
            filter(event, player) {
				return ["sha", "shan"].includes(event.card?.name) && !player.hasSkill("vibe_zhaoyun_yajiao_used_mark");
            },
            content() {
				player.addTempSkill("vibe_zhaoyun_yajiao_used_mark", { global: "phaseAfter" });
                player.draw();
            },
        },
        respond: {
			trigger: { player: "respond" },
            filter(event, player) {
				return ["sha", "shan"].includes(event.card?.name) &&
					!player.hasSkill("vibe_zhaoyun_yajiao_respond_mark") &&
                    _status.currentPhase &&
                    _status.currentPhase != player &&
                    _status.currentPhase.isIn() &&
                    _status.currentPhase.countCards("h") > 0;
            },
            content() {
                "step 0";
				player.addTempSkill("vibe_zhaoyun_yajiao_respond_mark", { global: "phaseAfter" });
                player.choosePlayerCard(_status.currentPhase, "h", true, "涯角：获得当前回合角色一张手牌");
                "step 1";
                if (result.bool && result.cards && result.cards.length) {
                    player.gain(result.cards, _status.currentPhase, "giveAuto", "bySelf");
                }
            },
        },
			used_mark: {
				charlotte: true,
				sub: true,
			},
			respond_mark: {
				charlotte: true,
				sub: true,
			},
		},
	},

	vibe_jiangqin_shangyi: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return target != player;
		},
		content() {
			"step 0";
			target.viewHandcards(player);
			player.chooseControl("手牌干预", "暗将观察").set("prompt", "尚义：选择一项");
			"step 1";
			event.choice = result.control;
			if (event.choice == "手牌干预") {
				if (!target.countCards("h")) {
					event.finish();
					return;
				}
				player.chooseButton(1, [get.translation(target.name) + "的手牌", target.getCards("h")]).set("prompt", "尚义：选择其一张手牌（黑弃置/红重铸）");
			} else {
				var hidden = [];
				if (target.isUnseen(0)) {
					hidden.push(get.translation(target.name1));
				}
				if (target.isUnseen(1)) {
					hidden.push(get.translation(target.name2));
				}
				if (hidden.length) {
					game.log(player, "观看了", target, "暗置武将牌：", hidden.join("、"));
				}
				target.addTempSkill("vibe_jiangqin_shangyi_forbid_show", "phaseUseAfter");
				event.finish();
			}
			"step 2";
			if (result.buttons && result.buttons.length) {
				var card = result.buttons[0].link;
				if (get.color(card) == "black") {
					target.discard(card);
				} else {
					target.recast(card);
				}
			}
		},
		subSkill: {
			forbid_show: {
				charlotte: true,
				trigger: { player: "showCharacterBegin" },
				forced: true,
				content() {
					trigger.cancel();
				},
			},
		},
	},

	vibe_jiangqin_jianyi: {
		audio: 2,
		enable: "chooseToUse",
		position: "h",
		filter(event, player) {
			if (!player.countCards("h", card => get.type(card) == "equip" && player.hasUseTarget(card))) {
				return false;
			}
			for (var name of ["sha", "wuxie"]) {
				if (event.filterCard({ name: name, isCard: true }, player, event)) {
					return true;
				}
			}
			return false;
		},
		hiddenCard(player, name) {
			if (!["sha", "wuxie"].includes(name)) {
				return false;
			}
			return (
				player.countCards("h", card => {
					if (get.type(card) != "equip") {
						return false;
					}
					return player.hasUseTarget(card);
				}) > 0
			);
		},
		viewAsFilter(player) {
			return (
				player.countCards("h", card => {
					if (get.type(card) != "equip") {
						return false;
					}
					return player.hasUseTarget(card);
				}) > 0
			);
		},
		chooseButton: {
			dialog(event, player) {
				const list = [
					["", "", "sha"],
					["", "", "wuxie"],
				];
				return ui.create.dialog("俭衣", [list, "vcard"]);
			},
			filter(button, player) {
				const evt = _status.event.getParent();
				if (!evt || evt.name != "chooseToUse") {
					return false;
				}
				return evt.filterCard({ name: button.link[2], isCard: true }, player, evt);
			},
			check(button) {
				const choice = button.link[2];
				return choice == "sha" ? 1 : 0.5;
			},
			backup(links, player) {
				const choice = links[0][2];
				return {
					filterCard() {
						return false;
					},
					selectCard: -1,
					position: "h",
					viewAs: { name: choice },
					precontent() {
						"step 0";
						event.virtualCard = event.result.card;
						event.virtualCard.storage = event.virtualCard.storage || {};
						player
							.chooseCard("h", "俭衣：选择并使用一张装备手牌", card => {
								if (get.type(card) != "equip") {
									return false;
								}
								return player.hasUseTarget(card);
							})
							.set("ai", card => 8 - get.value(card));
						"step 1";
						if (!result.bool || !result.cards || !result.cards.length) {
							event.result = { bool: false };
							event.finish();
							return;
						}
						const equipCard = result.cards[0];
						const subtype = get.subtype(equipCard);
						event.replaced = !!(subtype && player.getEquip(subtype));
						event.equipCard = equipCard;
						player.chooseUseTarget(equipCard, true, "nopopup");
						"step 2";
						if (!result.bool) {
							event.result = { bool: false };
							event.finish();
							return;
						}
						if (!event.replaced) {
							event.finish();
							return;
						}
						player
							.chooseControl("不能被抵消", "不计入次数")
							.set("prompt", "俭衣：选择额外效果")
							.set("ai", () => "不能被抵消");
						"step 3";
						if (result.control == "不能被抵消") {
							event.virtualCard.storage.vibe_jianyi_nowuxie = true;
						} else if (result.control == "不计入次数") {
							event.virtualCard.storage.vibe_jianyi_nocount = true;
						}
					},
				};
			},
		},
		group: ["vibe_jiangqin_jianyi_effect"],
		subSkill: {
			effect: {
				trigger: { player: "useCard1" },
				forced: true,
				filter(event, player) {
					return event.card?.storage?.vibe_jianyi_nowuxie || event.card?.storage?.vibe_jianyi_nocount;
				},
				content() {
					if (trigger.card.storage.vibe_jianyi_nowuxie) {
						trigger.nowuxie = true;
						if (trigger.card.name == "sha") {
							trigger.customArgs = trigger.customArgs || {};
							trigger.customArgs.default = trigger.customArgs.default || {};
							trigger.customArgs.default.directHit2 = true;
						}
					}
					if (trigger.card.storage.vibe_jianyi_nocount) {
						if (trigger.addCount !== false) {
							trigger.addCount = false;
						}
						const evt = trigger.getParent();
						if (evt && evt.addCount !== false) {
							evt.addCount = false;
						}
					}
				},
			},
		},
	},

	vibe_bianfuren_yide: {
		trigger: { global: "damageBegin4" },
		direct: true,
		filter(event, player) {
			if (!event.player || !event.source || event.player == event.source) {
				return false;
			}
			if (!event.player.isFriendOf(player)) {
				return false;
			}
			if (!event.source.isFriendOf(player)) {
				return false;
			}
			return true;
		},
		content() {
			trigger.cancel();
		},
	},

	vibe_bianfuren_cijie: {
		trigger: { global: "useCard2" },
		direct: true,
		filter(event, player) {
			if (event.card?.name != "tao") {
				return false;
			}
			if (!event.player.isFriendOf(player)) {
				return false;
			}
			if (_status.currentPhase != event.player) {
				return false;
			}
			return game.hasPlayer(current => current.isDamaged() && !event.targets.includes(current));
		},
		content() {
			"step 0";
			trigger.player
				.chooseTarget([1, Infinity], "慈诫：为此【桃】额外指定任意名已受伤角色", function (card, player, target) {
					return target.isDamaged() && !trigger.targets.includes(target);
				})
				.set("ai", function (target) {
					return get.attitude(_status.event.player, target);
				});
			"step 1";
			if (result.bool && result.targets && result.targets.length) {
				trigger.targets.addArray(result.targets);
				if (typeof player.changeMain == "function") {
					player.changeMain(false);
				}
			}
		},
	},

	vibe_bianfuren_yuejian: {
		trigger: { global: "loseAfter" },
		filter(event, player) {
			if (player.hasSkill("vibe_bianfuren_yuejian_used")) {
				return false;
			}
			if (!event.player || !event.player.isFriendOf(player)) {
				return false;
			}
			if (event.type != "discard") {
				return false;
			}
			// 只在“其自己弃置自己的牌”时触发；被他人弃置不触发
			if ((event.discarder || event.getParent(2)?.player) != event.player) {
				return false;
			}
			var cards = (event.cards2 || []).filter(card => get.position(card, true) == "d");
			return cards.length > 0;
		},
		async cost(event, trigger, player) {
			event.cards = (trigger.cards2 || []).filter(card => get.position(card, true) == "d");
			const next = (await player.chooseBool(get.prompt("vibe_bianfuren_yuejian"), "是否发动【约俭】？").forResult())["bool"];
			if (next) {
				const result = await trigger.player.chooseButton(["约俭：选择一张弃置牌获得之", event.cards], true).forResult();
				event.result = {
					bool: true,
					cost_data: result,
				};
			console.log(result);
			}
			else {
				event.result = {
					bool: false,
				};
			}	
		},
		async content(event, trigger, player) {
			const result = event.cost_data;
			console.log(result);
			if (result.bool && result.links && result.links.length) {
				await trigger.player.gain(result.links, "gain2");
				player.addTempSkill("vibe_bianfuren_yuejian_used", { global: "phaseAfter" });
			}
		},
		subSkill: {
			used: {
				charlotte: true,
				sub: true,
			},
		},
	},

	vibe_zhuhuan_jutian: {
		trigger: { source: "damageEnd" },
		filter(event, player) {
			if (!event.player || event.player == player) {
				return false;
			}
			var canYazhi = !player.hasSkill("vibe_zhuhuan_jutian_yazhi") && game.hasPlayer(current => current.isFriendOf(event.player));
			var canFuzhu = !player.hasSkill("vibe_zhuhuan_jutian_fuzhu") && game.hasPlayer(current => current.isFriendOf(player));
			return canYazhi || canFuzhu;
		},
		async cost(event, trigger, player) {
			var canYazhi = !player.hasSkill("vibe_zhuhuan_jutian_yazhi") && game.hasPlayer(current => current.isFriendOf(trigger.player));
			var canFuzhu = !player.hasSkill("vibe_zhuhuan_jutian_fuzhu") && game.hasPlayer(current => current.isFriendOf(player));
			
			event.result = { bool: false };
			
			while (true) {
				var choices = [];
				if (canYazhi) choices.push("压制敌势力");
				if (canFuzhu) choices.push("辅助友势力");
				choices.push("cancel2");
				
				var controlResult = (await player.chooseControl(choices).set("prompt", get.prompt("vibe_zhuhuan_jutian")).set("ai", function(item) {
						if (item === "cancel2") return -1;
						return 1;
					})).result;
				if (!controlResult || !controlResult.control || controlResult.control === "cancel2") {
					return;
				}
				
				var choice = controlResult.control;
				var str = choice === "压制敌势力" ? "拒天：选择与其同势力的一名角色" : "拒天：选择与你同势力的一名角色";
				
				var targetResult = (await player.chooseTarget(1, str, function(card, player, target) {
					if (_status.event.choice === "压制敌势力") return target.isFriendOf(_status.event.sourcePlayer);
					return target.isFriendOf(player);
				}).set("choice", choice).set("sourcePlayer", trigger.player).set("ai", function(target) {
					var choice = _status.event.choice;
					var sourcePlayer = _status.event.sourcePlayer;
					if (choice === "压制敌势力") {
						var excess = target.countCards("h") - sourcePlayer.hp;
						return excess > 0 ? excess : 0.1;
					} else {
						var deficit = sourcePlayer.maxHp - target.countCards("h");
						return deficit > 0 ? deficit : 0.1;
					}
				})).result;
				
				if (targetResult && targetResult.bool && targetResult.targets && targetResult.targets.length) {
					event.result = {
						bool: true,
						cost_data: { choice: choice, target: targetResult.targets[0] }
					};
					return;
				}
			}
		},
		content() {
			var choice = event.cost_data.choice;
			var targetx = event.cost_data.target;
			player.logSkill("vibe_zhuhuan_jutian", targetx);
			if (choice === "压制敌势力") {
				player.addTempSkill("vibe_zhuhuan_jutian_yazhi", "roundStart");
				var needDiscard = Math.max(0, targetx.countCards("h") - trigger.player.hp);
				if (needDiscard > 0) {
					targetx.chooseToDiscard(needDiscard, true, "h");
				}
			} else {
				player.addTempSkill("vibe_zhuhuan_jutian_fuzhu", "roundStart");
				var needDraw = Math.max(0, trigger.player.maxHp - targetx.countCards("h"));
				if (needDraw > 0) {
					targetx.draw(needDraw);
				}
			}
		},
		check() {
			return 1;
		},
		subSkill: {
			yazhi: {
				charlotte: true,
				sub: true,
			},
			fuzhu: {
				charlotte: true,
				sub: true,
			},
		},
	},

	vibe_xurong_shajue: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			const used = player.getStorage("vibe_xurong_shajue_used") || [];
			return game.hasPlayer(current => current != player && current.countCards("h") == 1 && !used.includes(current.playerid));
		},
		filterTarget(card, player, target) {
			const used = player.getStorage("vibe_xurong_shajue_used") || [];
			return target != player && target.countCards("h") == 1 && !used.includes(target.playerid);
		},
		content() {
			"step 0";
			player.markAuto("vibe_xurong_shajue_used", [target.playerid]);
			player.discardPlayerCard(target, "h", true);
			"step 1";
			if (!game.hasPlayer(current => current != player && current != target)) {
				event.finish();
				return;
			}
			player.chooseTarget(true, "选择一名其他角色，视为对其使用【决斗】", function (card, player, target2) {
				return target2 != player && target2 != target;
			});
			"step 2";
			if (result.bool && result.targets && result.targets.length) {
				player.useCard({ name: "juedou" }, result.targets[0], false).set("skill", "vibe_xurong_shajue");
			}
		},
		ai: {
			order: 8,
			result: {
				target: -1,
			},
		},
		group: ["vibe_xurong_shajue_buff", "vibe_xurong_shajue_clear"],
		subSkill: {
			buff: {
				trigger: { global: "damageBegin1" },
				forced: true,
				filter(event, player) {
					if (!event.card || event.card.name != "juedou") {
						return false;
					}
					if (!event.getParent || event.getParent().skill != "vibe_xurong_shajue") {
						return false;
					}
					return event.player && event.player.countCards("h") == 0;
				},
				content() {
					trigger.num++;
				},
			},
			clear: {
				trigger: { player: "phaseUseAfter" },
				silent: true,
				content() {
					player.unmarkAuto("vibe_xurong_shajue_used", player.getStorage("vibe_xurong_shajue_used"));
				},
			},
		},
	},

	// 曹操：挥鞭
	vibe_caocao_huibian: {
		audio: 2,
		trigger: { player: "damageEnd" },
		getIndex(event, player) { return event.num; },
		filter(event, player) {
			var hasDamageCard = !!event.card && game.hasPlayer(current => current !== _status.currentPhase);
			var hasRecruitTarget = game.hasPlayer(current =>
				current !== player && current.identity && current.identity === player.identity
			);
			return hasDamageCard || hasRecruitTarget;
		},
		direct: true,
		content() {
			"step 0";
			var hasDamageCard = !!trigger.card && game.hasPlayer(current => current !== _status.currentPhase);
			var hasRecruitTarget = game.hasPlayer(current =>
				current !== player && current.identity && current.identity === player.identity
			);
			var choices = [];
			if (hasDamageCard) choices.push("获得伤害牌");
			if (hasRecruitTarget) choices.push("招募");
			choices.push("cancel2");
			player.chooseControl(choices)
				.set("prompt", get.prompt("vibe_caocao_huibian"))
				.set("ai", () => hasDamageCard ? "获得伤害牌" : "招募");
			"step 1";
			if (!result.control || result.control === "cancel2") { event.finish(); return; }
			event.choice = result.control;
			if (event.choice === "获得伤害牌") {
				player.chooseTarget(true, "挥鞭：选择一名非当前回合角色", function(card, player, target) {
					return target !== _status.currentPhase;
				}).set("ai", target => get.attitude(_status.event.player, target));
			} else {
				player.chooseTarget(true, "挥鞭：选择一名与你势力明确相同的角色", function(card, player, target) {
					return target !== player && target.identity && target.identity === player.identity;
				}).set("ai", target => get.attitude(_status.event.player, target));
			}
			"step 2";
			if (!result.bool || !result.targets || !result.targets.length) { event.finish(); return; }
			event.targetx = result.targets[0];
			player.logSkill("vibe_caocao_huibian", event.targetx);
			if (event.choice === "获得伤害牌") {
				event.targetx.gain([trigger.card]);
			} else {
				event.targetx.recruitCharacter();
				event.finish();
			}
			"step 3";
			if (!event.targetx.countCards("h")) { event.finish(); return; }
			event.targetx.chooseCard("h", true, "挥鞭：请将一张手牌交给" + get.translation(player))
				.set("ai", card => -get.value(card));
			"step 4";
			if (result.bool && result.cards && result.cards.length) {
				player.gain(result.cards, event.targetx, "giveAuto");
			}
		},
		ai: {
			order: 3,
			result: { player: 1 },
		},
	},

	// 司马懿：鬼才（每回合每种花色限一次）
	vibe_simayi_guicai: {
		audio: 2,
		trigger: { global: "judge" },
		filter(event, player) {
			var used = player.getStorage("vibe_simayi_guicai_suits") || [];
			return player.countCards("hes", card => !used.includes(get.suit(card))) > 0;
		},
		preHidden: true,
		popup: false,
		async cost(event, trigger, player) {
			var used = player.getStorage("vibe_simayi_guicai_suits") || [];
			event.result = await player
				.chooseCard(
					`${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`,
					"hes",
					card => {
						const p = get.player();
						const usedSuits = p.getStorage("vibe_simayi_guicai_suits") || [];
						if (usedSuits.includes(get.suit(card))) return false;
						const mod2 = game.checkMod(card, p, "unchanged", "cardEnabled2", p);
						if (mod2 !== "unchanged") return mod2;
						const mod = game.checkMod(card, p, "unchanged", "cardRespondable", p);
						if (mod !== "unchanged") return mod;
						return true;
					}
				)
				.set("ai", card => {
					const p = get.player();
					const usedSuits = p.getStorage("vibe_simayi_guicai_suits") || [];
					if (usedSuits.includes(get.suit(card))) return -999;
					const trig = get.event().getTrigger();
					const { player: evtPlayer, judging } = get.event();
					const delta = trig.judge(card) - trig.judge(judging);
					const attitude = get.attitude(evtPlayer, trig.player);
					let val = get.value(card);
					if (get.subtype(card) === "equip2") val /= 2;
					else val /= 4;
					if ((delta > 0 && attitude > 0) || (delta < 0 && attitude < 0)) return 11 - val;
					if ((delta > 0 && attitude < 0) || (delta < 0 && attitude > 0)) return -val;
					return 0;
				})
				.set("judging", trigger.player.judging[0])
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			const suit = get.suit(event.cards[0]);
			player.markAuto("vibe_simayi_guicai_suits", [suit]);
			player.addTempSkill("vibe_simayi_guicai_suits");
			const { cards } = await player.respond(event.cards, event.name, "highlight", "noOrdering");
			if (cards?.length) {
				if (trigger.player.judging[0].clone) {
					trigger.player.judging[0].clone.classList.remove("thrownhighlight");
					game.broadcast(card => {
						if (card.clone) card.clone.classList.remove("thrownhighlight");
					}, trigger.player.judging[0]);
					game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
				}
				await game.cardsDiscard(trigger.player.judging[0]);
				trigger.player.judging[0] = cards[0];
				trigger.orderingCards.addArray(cards);
				game.log(trigger.player, "的判定牌改为", cards);
				await game.delay(2);
			}
		},
		subSkill: {
			suits: {
				charlotte: true,
				onremove: true,
			},
		},
		ai: {
			rejudge: true,
			tag: { rejudge: 1 },
		},
	},

	// 司马懿：狼顾（继承refankui）
	vibe_simayi_langgu: {
		audio: "fankui",
		inherit: "refankui",
	},

	// 司马懿：连破（每轮限一次，每回合结束时，若本回合杀死过角色可获得额外回合）
	vibe_simayi_lianpo: {
		audio: "lianpo",
		trigger: { global: "phaseAfter" },
		frequent: true,
		filter(event, player) {
			if (player.hasSkill("vibe_simayi_lianpo_used")) return false;
			return player.getStat("kill") > 0;
		},
		async content(event, trigger, player) {
			player.addTempSkill("vibe_simayi_lianpo_used", "roundStart");
			player.insertPhase();
		},
		subSkill: {
			used: {
				charlotte: true,
				sub: true,
			},
		},
	},

	// 孟达：狐变
	vibe_mengda_hubian: {
		audio: 3,
		logAudio: index => (typeof index === "number" ? "vibe_mengda_hubian" + index + ".mp3" : false),
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return !(player.isUnseen(0) && player.hasSkillTag("nomingzhi", false, null, true));
		},
		content() {
			"step 0";
			player.showCharacter(0);
			"step 1";
			event.oldIdentity = player.identity;
			event.friendCount = game.filterPlayer(function(current) {
				return current.isFriendOf(player);
			}).length;
			player.changeMain(false);
			"step 2";
			if (player.identity !== event.oldIdentity) {
				if (player.identity == "wei") {
					player.logSkill("vibe_mengda_hubian", null, null, null, [1]);
				} else if (player.identity == "shu") {
					player.logSkill("vibe_mengda_hubian", null, null, null, [2]);
				} else if (player.identity.endsWith("ye")) {
					player.logSkill("vibe_mengda_hubian", null, null, null, [3]);
				}
			}
			"step 3";
			if (player.identity !== event.oldIdentity) {
				player.draw(event.friendCount);
			}
		},
		ai: {
			order: 3,
			result: { player: 0 },
		},
	},

	// 孟达：陈忠
	vibe_mengda_chenzhong: {
		audio: 2,
		groupSkill: "shu",
		locked: true,
		trigger: { player: "useCardBegin" },
		forced: true,
		filter(event, player) {
			return event.card && event.card.name === "sha" && game.hasPlayer(function(current) {
				return current !== player && current.isFriendOf(player);
			});
		},
		content() {
			"step 0";
			trigger.targets.length = 0;
			event.voters = game.filterPlayer(function(current) {
				return current !== player && current.isFriendOf(player);
			});
			event.votedTargets = [];
			event.voteMap = {};
			event.voteIdx = 0;
			"step 1";
			if (event.voteIdx >= event.voters.length) {
				event.goto(3);
				return;
			}
			var voter = event.voters[event.voteIdx];
			voter.chooseTarget(true, "陈忠：请选择【杀】的目标", function(card, v, target) {
				return trigger.player.canUse(trigger.card, target);
			}).set("ai", function(target) {
				return -get.attitude(_status.event.player, target);
			});
			"step 2";
			var czVoter = event.voters[event.voteIdx];
			if (result.bool && result.targets && result.targets.length) {
				var czVoted = result.targets[0];
				event.votedTargets.push(czVoted);
				event.voteMap[czVoter.playerid] = czVoted;
			} else {
				event.voteMap[czVoter.playerid] = null;
			}
			event.voteIdx++;
			event.goto(1);
			"step 3";
			for (var vi = 0; vi < event.voters.length; vi++) {
				var v = event.voters[vi];
				var czChoice = event.voteMap[v.playerid];
				if (czChoice) {
					var czLabel = !czChoice.isUnseen(0) ? get.translation(czChoice.name1) :
						(czChoice.name2 && !czChoice.isUnseen(1) ? get.translation(czChoice.name2) :
						czChoice.getSeatNum() + "号位");
					v.chat("投：" + czLabel);
				}
			}
			if (!event.votedTargets.length) {
				return;
			}
			var countMap = {};
			for (var i = 0; i < event.votedTargets.length; i++) {
				var t = event.votedTargets[i];
				countMap[t.playerid] = (countMap[t.playerid] || 0) + 1;
			}
			var maxCount = 0;
			for (var key in countMap) {
				if (countMap[key] > maxCount) maxCount = countMap[key];
			}
			var winners = [];
			for (var j = 0; j < event.votedTargets.length; j++) {
				var candidate = event.votedTargets[j];
				if (countMap[candidate.playerid] === maxCount && !winners.includes(candidate)) {
					winners.push(candidate);
				}
			}
			trigger.targets.addArray(winners);
		},
	},

	// 孟达：量反
	vibe_mengda_liangfan: {
		audio: 2,
		groupSkill: "wei",
		locked: true,
		trigger: { player: "phaseUseBegin" },
		forced: true,
		filter(event, player) {
			return game.hasPlayer(function(current) {
				return current !== player && current.isFriendOf(player);
			});
		},
		content() {
			"step 0";
			event.friends = game.filterPlayer(function(current) {
				return current !== player && current.isFriendOf(player);
			});
			event.votedTargets = [];
			event.voteMap = {};
			event.voteIdx = 0;
			"step 1";
			if (event.voteIdx >= event.friends.length) {
				event.goto(3);
				return;
			}
			var voter = event.friends[event.voteIdx];
			voter.chooseTarget(true, "量反：请选择一名友方角色", function(card, v, target) {
				return target.isFriendOf(_status.event.getParent().player);
			}).set("ai", function(target) {
				return -get.attitude(_status.event.player, target);
			});
			"step 2";
			var lfVoter = event.friends[event.voteIdx];
			if (result.bool && result.targets && result.targets.length) {
				var lfVoted = result.targets[0];
				event.votedTargets.push(lfVoted);
				event.voteMap[lfVoter.playerid] = lfVoted;
			} else {
				event.voteMap[lfVoter.playerid] = null;
			}
			event.voteIdx++;
			event.goto(1);
			"step 3";
			for (var lvi = 0; lvi < event.friends.length; lvi++) {
				var lv = event.friends[lvi];
				var lfChoice = event.voteMap[lv.playerid];
				if (lfChoice) {
					var lfLabel = !lfChoice.isUnseen(0) ? get.translation(lfChoice.name1) :
						(lfChoice.name2 && !lfChoice.isUnseen(1) ? get.translation(lfChoice.name2) :
						lfChoice.getSeatNum() + "号位");
					lv.chat("投：" + lfLabel);
				}
			}
			if (!event.votedTargets.length) {
				event.finish();
				return;
			}
			var countMap2 = {};
			for (var i2 = 0; i2 < event.votedTargets.length; i2++) {
				var t2 = event.votedTargets[i2];
				countMap2[t2.playerid] = (countMap2[t2.playerid] || 0) + 1;
			}
			var maxCount2 = 0;
			for (var key2 in countMap2) {
				if (countMap2[key2] > maxCount2) maxCount2 = countMap2[key2];
			}
			event.competitors = [];
			for (var j2 = 0; j2 < event.votedTargets.length; j2++) {
				var cand = event.votedTargets[j2];
				if (countMap2[cand.playerid] === maxCount2 && !event.competitors.includes(cand)) {
					event.competitors.push(cand);
				}
			}
			player.chooseTarget(true, "量反：请选择另一名角色进行拼点", function (card, player, target) {
				return !event.competitors.some(p => p === target) && target.countCards("h") > 0;
			}).set("ai", function(target) {
				return -get.attitude(_status.event.player, target);
			});
			"step 4";
			if (!result.bool || !result.targets || !result.targets.length) {
				event.finish();
				return;
			}
			event.enemy = result.targets[0];
			"step 5";
			event.enemy.chooseToCompare(event.competitors).callback = lib.skill.vibe_mengda_liangfan.callback;
		},
		callback(){
			if (event.winner === event.player) {
				event.player.useCard({ name: "sha", isCard: true }, event.target, false);
			} else if (event.winner === event.target) {
				event.target.useCard({ name: "sha", isCard: true }, event.player, false);
			}
		}
	},

	// 刘备：仁德（出牌阶段限一次，将手牌分配给多名角色）
	vibe_liubei_rende: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		content() {
			"step 0";
			player.chooseCard("h", [1, player.countCards("h")], "仁德：选择要分配的手牌")
				.set("ai", card => 1 - get.value(card) / 10);
			"step 1";
			if (!result.bool || !result.cards || !result.cards.length) {
				event.finish();
				return;
			}
			event.rendeCards = result.cards.slice();
			event.rendeCount = event.rendeCards.length;
			event.cardTargets = [];
			event.cardIdx = 0;
			"step 2";
			if (event.cardIdx >= event.rendeCards.length) {
				event.goto(5);
				return;
			}
			var curCard = event.rendeCards[event.cardIdx];
			player.chooseTarget(
				true,
				"仁德：将" + get.translation(curCard) + "交给谁？（第" + (event.cardIdx + 1) + "/" + event.rendeCards.length + "张）",
				function(card, player, target) { return target !== player; }
			).set("ai", function(target) {
				return get.attitude(_status.event.player, target);
			});
			"step 3";
			if (result.bool && result.targets && result.targets.length) {
				event.cardTargets.push({ card: event.rendeCards[event.cardIdx], target: result.targets[0] });
			}
			event.cardIdx++;
			event.goto(2);
			"step 5";
			if (!event.cardTargets.length) {
				event.finish();
				return;
			}
			player.logSkill("vibe_liubei_rende");
			event.giveIdx = 0;
			"step 6";
			if (event.giveIdx >= event.cardTargets.length) {
				event.goto(8);
				return;
			}
			event.cardTargets[event.giveIdx].target.gain([event.cardTargets[event.giveIdx].card], player, "giveAuto");
			"step 7";
			event.giveIdx++;
			event.goto(6);
			"step 8";
			if (event.rendeCount >= 2 && !player.hasSkill("vibe_liubei_renwang")) {
				player.addSkills("vibe_liubei_renwang");
			}
			var friendCount = game.filterPlayer(function(c) { return c.isFriendOf(player); }).length;
			if (event.rendeCount <= friendCount) {
				event.finish();
				return;
			}
			player.chooseTarget(
				"仁德：令一名与你势力明确相同的角色招募",
				function(card, player, target) {
					return target !== player && target.identity === player.identity;
				}
			).set("ai", function(target) {
				return get.attitude(_status.event.player, target);
			});
			"step 9";
			if (!result.bool || !result.targets || !result.targets.length) return;
			result.targets[0].recruitCharacter();
		},
		ai: {
			order: 9,
			result: { player: 0.5 },
		},
	},

	// 衍生技：仁望（回合内视为使用/打出一张基本牌，然后失去仁望）
	vibe_liubei_renwang: {
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			if (!["sha", "tao", "shan", "jiu"].includes(name)) return false;
			return _status.currentPhase === player;
		},
		viewAsFilter(player) {
			return _status.currentPhase === player;
		},
		chooseButton: {
			dialog(event, player) {
				const list = [
					["", "", "sha"],
					["", "", "tao"],
					["", "", "shan"],
					["", "", "jiu"],
				];
				return ui.create.dialog("仁望", [list, "vcard"]);
			},
			filter(button, player) {
				const evt = _status.event.getParent();
				if (!evt || !["chooseToUse", "chooseToRespond"].includes(evt.name)) return false;
				return evt.filterCard({ name: button.link[2], isCard: true }, player, evt);
			},
			check(button) {
				return button.link[2] === "sha" ? 1 : 0.5;
			},
			backup(links, player) {
				const choice = links[0][2];
				return {
					filterCard() { return false; },
					selectCard: -1,
					viewAs: { name: choice, isCard: true },
					precontent() {
						"step 0";
						player.removeSkill("vibe_liubei_renwang");
					},
				};
			},
		},
		ai: {
			order: 10,
			result: { player: 1 },
		},
	},

	// 关羽：武圣（将红色牌转化为杀）
	vibe_guanyu_wusheng: {
		audio: "wusheng",
		inherit: "new_rewusheng",
	},

	// 关羽：威临（主将技，含奥秘/战吼/明置/锁定四效果）
	vibe_guanyu_weilin: {
		audio: 2,
		mainSkill: true,
		init(player) {
			const playerRef = cast(player);
			if (playerRef.checkMainSkill("vibe_guanyu_weilin")) {
				playerRef.removeMaxHp();
			}
		},
		group: [
			"vibe_guanyu_weilin_zhanhao",
			"vibe_guanyu_weilin_diamond",
			"vibe_guanyu_weilin_heart",
		],
		subSkill: {
			// 战吼：当前结算结束后，视为使用水淹七军
			zhanhao: {
				trigger: { player: "showCharacterAfter" },
				frequent: true,
				filter(event, player) {
					if (!event.toShow || !event.toShow.length) return false;
					return event.toShow.some(function(name) {
						var skills = get.character(name, 3) || [];
						return skills.includes("vibe_guanyu_weilin");
					});
				},
				content() {
					"step 0";
					player.chooseBool("威临·战吼：是否视为使用一张【水淹七军】？");
					"step 1";
					if (!result.bool) return;
					player.chooseTarget(true, "战吼：选择【水淹七军】目标", function(card, player, target) {
						return target !== player && target.countCards("e") > 0;
					}).set("ai", function(target) {
						return -get.attitude(_status.event.player, target);
					});
					"step 2";
					if (!result.bool || !result.targets || !result.targets.length) return;
					player.logSkill("vibe_guanyu_weilin");
					player.useCard({ name: "shuiyanqijun_ee", isCard: true }, result.targets[0], false);
				},
			},
			// 明置技：♦杀无距离限制
			diamond: {
				charlotte: true,
				showing: true,
				locked: true,
				mod: {
					targetInRange(card, player, target) {
						if (card.name === "sha" && get.suit(card) === "diamond") return true;
					},
				},
			},
			// 锁定技：♥杀令目标防具无效
			heart: {
				charlotte: true,
				locked: true,
				trigger: { player: "useCardToPlayered" },
				forced: true,
				filter(event, player) {
					return event.card && event.card.name === "sha" && get.suit(event.card) === "heart";
				},
				logTarget: "target",
				content() {
					trigger.target.addTempSkill("qinggang2");
					if (!trigger.target.storage.qinggang2) trigger.target.storage.qinggang2 = [];
					trigger.target.storage.qinggang2.add(trigger.card);
					trigger.target.markSkill("qinggang2");
				},
			},
		},
	},

	// 孟达：求安（限定技，待实现 changeMainBefore 底层钩子后补全）
	vibe_mengda_qiuan: {
		audio: 3,
		logAudio: index => (typeof index === "number" ? "vibe_mengda_qiuan" + index + ".mp3" : 1),
		groupSkill: "ye",
		group: ["vibe_mengda_qiuan_invoke"],
		subSkill: {
			invoke: {
				limited: true,
				skillAnimation: true,
				animationColor: "thunder",
				filter: (event, player) => !player.hasSkill("vibe_mengda_qiuan_swap"),		
				trigger: { player: "changeBefore" },
				content() {
					"step 0";
					player.logSkill("vibe_mengda_qiuan", null, null, null, [1]);
					player.globalExposeYexin();
					player.addSkills(["vibe_mengda_qiuan_swap", "vibe_mengda_qiuan_swapback", "vibe_mengda_qiuan_anyGroup"]);
				},
			},
			swap: {
				trigger: { player: "changeMainAfter" },
				forced: true,
				limited: false,
				filter(event, player) {
					// 同一个 changeMainAfter 事件只允许触发一次
					if (player.storage._qiuan_swap_trigger === event) return false;
					return !player.hasMark("vibe_mengda_qiuan_swap") && !!player.name2;
				},
				content() {
				"step 0";
					player.storage._qiuan_swap_trigger = trigger;
					player.chooseBool("是否发动【求安】交换主副将？")
				"step 1";
					if (!result.bool) {
						event.finish();
						return;
					}
					player.addMark("vibe_mengda_qiuan_swap");
					player.logSkill("vibe_mengda_qiuan", null, null, null, [3]);
					event.newMain = player.name2;
					event.newVice = player.name1;
					player.replaceCharacter(1, "gz_shibing2mahjong", false);
				"step 2";
					player.replaceCharacter(0, event.newMain, false);
				"step 3";
					player.replaceCharacter(1, event.newVice, false);
				},
				ai: {
					result: { player: 1 },
				},
			},
			swapback: {
				trigger: { player: "changeBefore" },
				forced: true,
				limited: false,
				filter(event, player) {
					if (!player.hasMark("vibe_mengda_qiuan_swap")) {
						console.log("[vibe_mengda_qiuan] swapback filter: not activated");
					}
					return player.hasMark("vibe_mengda_qiuan_swap");
				},
				content() {
				"step 0";
					player.clearMark("vibe_mengda_qiuan_swap");
					event.newMain = player.name2;
					event.newVice = player.name1;
					player.replaceCharacter(1, "gz_shibing2mahjong", false);
				"step 1";
					player.replaceCharacter(0, event.newMain, false);
				"step 2";
					player.replaceCharacter(1, event.newVice, false);
				}	
			},
			anyGroup: {
				charlotte: true,
				forced: true,
				nopop: true,
				limited: false,
				trigger: { player: "changeMainBefore" },
				content() {
					player.logSkill("vibe_mengda_qiuan", null, null, null, [2]);
				}
			},
		},
		mark: true,
		marktext: "换",	
		intro: {
			name: "求安",
			content: "主副将暂时交换",
		},
		check(event, player) {
			return player.isYe();
		},
		ai: {
			result: { player: 1 },
		},
	},
};
