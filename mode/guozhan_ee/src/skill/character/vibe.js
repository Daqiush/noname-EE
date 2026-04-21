import { getTypeOf } from "jszip/lib/deprecatedPublicUtils.js";
import { lib, game, ui, get as _get, ai, _status}  from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan } from "../../patch/player.js";
import skill from "../index.js";

/** @type {GetGuozhan}  */
const get = cast(_get);

/** @type {Record<string, Skill>} */
export default {
	// 诸葛亮：对火攻结算，可选择修改规则
	vibe_zgl_huoji: {
		audio: 2,
		onremove(player, skill) {
			if (player.storage?.vibe_zgl_huoji_record) {
				console.log("[vibe_zgl_huoji] clear record on remove", player.playerid, Object.keys(player.storage.vibe_zgl_huoji_record));
				delete player.storage.vibe_zgl_huoji_record;
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
				if (!trigger.card.storage.vibe_zgl_huoji_record_id) {
					trigger.card.storage.vibe_zgl_huoji_record_id = lib.status.videoId++;
				}
				id = trigger.card.storage.vibe_zgl_huoji_record_id;
			} else {
				trigger.card.storage.vibe_zgl_huoji_record_id = id;
			}
			if (!player.storage.vibe_zgl_huoji_record) {
				player.storage.vibe_zgl_huoji_record = {};
			}
			player.storage.vibe_zgl_huoji_record[id] = event.mode;
			player.chat(result.control);
			console.log("[vibe_zgl_huoji] record", player.playerid, id, event.mode);
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
			var id = card.cardid || card.storage?.vibe_zgl_huoji_record_id;
			var map = player.storage.vibe_zgl_huoji_record || {};
			var mode = map[id];
			console.log("[vibe_zgl_huoji] lookup", player.playerid, id, mode);
			var contentMap = {
				"弃置->展示": lib.skill.vibe_zgl_huoji.huogongContentShow,
				"花色->颜色": lib.skill.vibe_zgl_huoji.huogongContentColor,
				"其->其与其同一队列的其他角色": lib.skill.vibe_zgl_huoji.huogongContentQueueSplash,
			};
			return contentMap[mode] || null;
		},
		group: ["vibe_zgl_huoji_viewAs", "vibe_zgl_huoji_effect", "vibe_zgl_huoji_dieClear"],
		subSkill: {
			effect: {
				trigger: { global: "huogongBegin" },
				forced: true,
				locked: false,
				popup: false,
				filter(event, player) {
					return !!lib.skill.vibe_zgl_huoji.getHuojiContentByCard(event.card, player);
				},
				content() {
					var content = lib.skill.vibe_zgl_huoji.getHuojiContentByCard(trigger.card, player);
					if (content) {
						trigger.setContent(content);
					}
				},
			},
			dieClear: {
				trigger: { player: "dieBegin" },
				silent: true,
				content() {
					if (player.storage?.vibe_zgl_huoji_record) {
						console.log("[vibe_zgl_huoji] clear record on die", player.playerid, Object.keys(player.storage.vibe_zgl_huoji_record));
						delete player.storage.vibe_zgl_huoji_record;
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

	vibe_zgl_kanpo: {
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

	vibe_zgl_bazhen: {
		inherit: "bazhen",
		group: ["bazhen_bagua", "vibe_zgl_bazhen_gain", "vibe_zgl_bazhen_hidden_bagua", "vibe_zgl_bazhen_forced_bagua"],
		subSkill: {
			hidden_bagua: {
				priority: 10,
				trigger: { player: ["chooseToRespondBegin", "chooseToUseBegin"] },
				direct: true,
				popup: false,
				filter(event, player) {
					// 必须满足八卦阵的基础触发条件（需要闪、未响应、防具未失效等）
					if (!lib.skill.bagua_skill.filter(event, player)) {
						return false;
					}
					// 需要“无防具且防具栏可用”
					if (!player.hasEmptySlot(2)) {
						return false;
					}
					// 仅在该技能武将牌仍暗置时可发动
					const effectiveMainHidden = player.isUnseen(0) && get.character(player.name1, 3).includes("vibe_zgl_bazhen");
					const effectiveViceHidden = player.name2 && player.isUnseen(1) && get.character(player.name2, 3).includes("vibe_zgl_bazhen");
					return effectiveMainHidden || effectiveViceHidden;
				},
				content() {
					// 注意：暗将技能触发时，是否明置由引擎的“明置武将以发动技能”流程处理。
					// 到这里时若能进入 content，说明已完成明置确认，不应再二次找暗将位或手动 showCharacter。
					player.addTempSkill("vibe_zgl_bazhen_force_mark", {
						player: ["chooseToRespondAfter", "chooseToUseAfter"],
					});
				},
			},
			forced_bagua: {
				trigger: { player: ["chooseToRespondBegin", "chooseToUseBegin"] },
				forced: true,
				popup: false,
				filter(event, player) {
					if (!lib.skill.bagua_skill.filter(event, player)) {
						console.log("[vibe_zgl_bazhen] bagua filter not passed", player.playerid);
						return false;
					}
					if (!player.hasSkill("vibe_zgl_bazhen_force_mark")) {
						console.log("[vibe_zgl_bazhen] no force mark", player.playerid);
						return false;
					}
					if (!player.hasEmptySlot(2)) {
						console.log("[vibe_zgl_bazhen] no empty slot", player.playerid);
						return false;
					}
					return true;
				},
				content() {
					console.log("[vibe_zgl_bazhen] force bagua trigger", player.playerid);
					"step 0";
					// 标记为已执行八卦，阻止本次后续的 bazhen_bagua 再弹可选发动
					trigger.bagua_skill = true;
					player.judge("bagua", function (card) {
						return get.color(card) === "red" ? 1.5 : -0.5;
					}).judge2 = function (result) {
						return result.bool;
					};
					"step 1";
					if (result.judge > 0) {
						trigger.untrigger();
						trigger.set("responded", true);
						trigger.result = { bool: true, card: { name: "shan", isCard: true } };
					}
					player.removeSkill("vibe_zgl_bazhen_force_mark");
				},
			},
			force_mark: {
				charlotte: true,
				sub: true,
			},
		},
	},
	vibe_zgl_bazhen_gain: {
		trigger: { player: "showCharacterEnd" },
		direct: true,
		filter(event, player) {
			if (player.storage.vibe_zgl_bazhen_shown_once) {
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
				return skills.includes("vibe_zgl_bazhen");
			});
			return names.includes(true) && _status.currentPhase && _status.currentPhase.isIn() && _status.currentPhase.countCards("he") > 0;
		},
		content() {
			"step 0";
			player.storage.vibe_zgl_bazhen_shown_once = true;
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
				
				var controlResult = (await player.chooseControl(choices).set("prompt", get.prompt("vibe_zhuhuan_jutian"))).result;
				if (!controlResult || !controlResult.control || controlResult.control === "cancel2") {
					return;
				}
				
				var choice = controlResult.control;
				var str = choice === "压制敌势力" ? "拒天：选择与其同势力的一名角色" : "拒天：选择与你同势力的一名角色";
				
				var targetResult = (await player.chooseTarget(1, str, function(card, player, target) {
					if (_status.event.choice === "压制敌势力") return target.isFriendOf(_status.event.sourcePlayer);
					return target.isFriendOf(player);
				}).set("choice", choice).set("sourcePlayer", trigger.player)).result;
				
				if (targetResult && targetResult.bool && targetResult.targets && targetResult.targets.length) {
					event.result = {
						bool: true,
						cost_data: { choice: choice, target: targetResult.targets[0] }
					};
					return;
				}
			}
		},
		ai() {
			return 0;
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

	// 孟达：狐变
	vibe_mengda_hubian: {
		audio: 3,
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return true;
		},
		content() {
			"step 0";
			event.oldIdentity = player.identity;
			event.friendCount = game.filterPlayer(function(current) {
				return current.isFriendOf(player);
			}).length;
			player.changeMain(false);
			"step 1";
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
				event.player.useCard({ name: "sha", isCard: true }, event.target, false).set("skill", "vibe_mengda_liangfan");
			} else if (event.winner === event.target) {
				event.target.useCard({ name: "sha", isCard: true }, event.player, false).set("skill", "vibe_mengda_liangfan");
			}
		}
	},

	// 孟达：求安（限定技，待实现 changeMainBefore 底层钩子后补全）
	vibe_mengda_qiuan: {
		audio: 3,
		groupSkill: "ye",
		limited: true,
		trigger: { player: "changeBefore" },
		filter(event, player) {
			return !player.getStorage("qiuan_activated").length;
		},
		init(player, skill) {
			player.storage.qiuan_activated = [];
			player.storage.qiuan_anyFaction = [];
			if (player.hasSkill("vibe_mengda_qiuan")) {
				player.storage.qiuan_activated.push(true);
				player.storage.qiuan_anyFaction.push(true);
			}
		},
		content() {
			"step 0";
			"step 1";
			player.storage.qiuan_activated.push(true);
			player.storage.qiuan_anyFaction.push(true);
			for (var group of lib.group) {
				if (group !== "ye" && typeof player.exposeYeToGroup === "function") {
					player.exposeYeToGroup(group);
				}
			}
			player.addSkills(["vibe_mengda_qiuan_swap", "vibe_mengda_qiuan_swapback"]);
		},
		subSkill: {
			swap: {
				trigger: { player: "changeMainAfter" },
				forced: false,
				popup: false,
				filter(event, player) {
					return !player.hasMark("vibe_mengda_qiuan_swap") && !!player.name2;
				},
				content() {
				"step 0";
					player.addMark("vibe_mengda_qiuan_swap");
					event.newMain = player.name2;
					event.newVice = player.name1;
					player.replaceCharacter(1, "gz_shibing2mahjong", false);
				"step 1";
					player.replaceCharacter(0, event.newMain, false);
				"step 2";
					player.replaceCharacter(1, event.newVice, false);
				},
				ai: {
					result: { player: 1 },
				},
			},
			swapback: {
				trigger: { player: "changeBefore" },
				forced: true,
				popup: false,
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
			}
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
