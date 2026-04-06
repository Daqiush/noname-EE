import { lib, game, ui, get as _get, ai, _status } from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan } from "../../patch/player.js";
import skill from "../index.js";

/** @type {GetGuozhan}  */
const get = cast(_get);

/** @type {Record<string, Skill>} */
export default {
	// 诸葛亮：类火攻结算，可选择修改规则
	vibe_zgl_huoji: {
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
        group: ["vibe_zgl_huoji_effect"],
		subSkill: {
			effect: {
				trigger: { player: "useCardBefore" },
				charlotte: true,
				direct: true,
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
					if (result.control && result.control != "cancel2") {
						if (!trigger.card.storage) {
							trigger.card.storage = {};
						}
						trigger.card.storage.vibe_zgl_huoji_mode = result.control;
						if (result.control == "其->其与其同一队列的其他角色" && trigger.targets && trigger.targets.length) {
							const firstTarget = trigger.targets[0];
							const extraTargets = game.filterPlayer(current => {
								if (current == player || current == firstTarget) {
									return false;
								}
								return typeof firstTarget.inline == "function" ? firstTarget.inline(current) : false;
							});
							trigger.targets.addArray(extraTargets);
						}
					}
				},
			},
		},
		ai: {
			order: 7,
			result: {
				target: -1,
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
		group: ["bazhen", "vibe_zgl_bazhen_gain"],
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
            trigger: { player: "useCardAfter" },
            direct: true,
            filter(event, player) {
                return ["sha", "shan"].includes(event.card?.name) && !player.hasSkill("vibe_zhaoyun_yajiao_used_mark");
            },
            content() {
                player.addTempSkill("vibe_zhaoyun_yajiao_used_mark", "roundStart");
                player.draw();
            },
        },
        respond: {
            trigger: { player: "respondAfter" },
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
                player.addTempSkill("vibe_zhaoyun_yajiao_respond_mark", "roundStart");
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
			target.showHandcards();
			player.chooseControl("手牌干预", "暗将观察").set("prompt", "尚义：选择一项");
			"step 1";
			event.choice = result.control;
			if (event.choice == "手牌干预") {
				if (!target.countCards("h")) {
					event.finish();
					return;
				}
				player.choosePlayerCard(target, "h", true, "尚义：选择其一张手牌（黑弃置/红重铸）");
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
			if (result.bool && result.cards && result.cards.length) {
				var card = result.cards[0];
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
		enable: ["chooseToUse", "chooseToRespond"],
		chooseButton: {
			dialog() {
				return ui.create.dialog("俭衣：请选择转化牌", [["sha", "wuxie"], "vcard"]);
			},
			filter(button, player) {
				var evt = _status.event.getParent();
				if (button.link[2] == "sha") {
					return evt.filterCard({ name: "sha" }, player, evt);
				}
				return evt.filterCard({ name: "wuxie" }, player, evt);
			},
			check(button) {
				if (button.link[2] == "wuxie") {
					return 10;
				}
				return 7;
			},
			backup(links, player) {
				return {
					filterCard(card) {
						return get.type(card) == "equip";
					},
					position: "h",
					viewAs: { name: links[0][2] },
					precontent() {
						"step 0";
						if (event.result.card && event.result.card.name == "sha") {
							player.chooseControl("不计入次数", "不可被抵消", "cancel2").set("prompt", "俭衣：为此【杀】选择增益");
						} else {
							event.finish();
						}
						"step 1";
						if (result.control == "不计入次数") {
							event.getParent().addCount = false;
						} else if (result.control == "不可被抵消") {
							event.result.card.storage.vibe_jianyi_direct = true;
						}
					},
				};
			},
			prompt(links, player) {
				return "将一张装备手牌当" + get.translation(links[0][2]) + "使用或打出";
			},
		},
		group: ["vibe_jiangqin_jianyi_direct_hit"],
		subSkill: {
			direct_hit: {
				trigger: { player: "useCardToPlayered" },
				forced: true,
				filter(event, player) {
					return event.card?.storage?.vibe_jianyi_direct;
				},
				content() {
					trigger.directHit.add(trigger.target);
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
			if (!event.source.isFriendOf(event.player)) {
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
			if (event.player == player || !event.player.isFriendOf(player)) {
				return false;
			}
			if (_status.currentPhase != event.player) {
				return false;
			}
			return game.hasPlayer(current => current.isDamaged() && !event.targets.includes(current));
		},
		content() {
			"step 0";
			player
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
		direct: true,
		filter(event, player) {
			if (player.hasSkill("vibe_bianfuren_yuejian_used")) {
				return false;
			}
			if (!event.player || !event.player.isFriendOf(player)) {
				return false;
			}
			if (event.player != event.getParent()?.player) {
				return false;
			}
			var cards = (event.cards2 || []).filter(card => get.position(card, true) == "d");
			return cards.length > 0;
		},
		content() {
			"step 0";
			player.addTempSkill("vibe_bianfuren_yuejian_used", "roundStart");
			event.cards = (trigger.cards2 || []).filter(card => get.position(card, true) == "d");
			trigger.player.chooseButton(["约俭：选择一张弃置牌获得之", event.cards], true);
			"step 1";
			if (result.bool && result.links && result.links.length) {
				trigger.player.gain(result.links, "gain2");
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
		direct: true,
		filter(event, player) {
			return event.player && event.player != player && !player.hasSkill("vibe_zhuhuan_jutian_used");
		},
		content() {
			"step 0";
			player.addTempSkill("vibe_zhuhuan_jutian_used", "roundStart");
			player.chooseControl("压制同势力", "补牌同势力").set("prompt", "拒天：请选择效果");
			"step 1";
			event.choice = result.control;
			if (event.choice == "压制同势力") {
				player.chooseTarget("选择与受伤角色同势力的一名角色", function (card, player, target) {
					return target.isFriendOf(trigger.player);
				});
			} else {
				player.chooseTarget("选择与你同势力的一名角色", function (card, player, target) {
					return target.isFriendOf(player);
				});
			}
			"step 2";
			if (!result.bool || !result.targets || !result.targets.length) {
				event.finish();
				return;
			}
			event.targetx = result.targets[0];
			if (event.choice == "压制同势力") {
				var needDiscard = Math.max(0, event.targetx.countCards("h") - event.targetx.hp);
				if (needDiscard > 0) {
					event.targetx.chooseToDiscard(needDiscard, true, "h");
				}
			} else {
				var needDraw = Math.max(0, event.targetx.maxHp - event.targetx.countCards("h"));
				if (needDraw > 0) {
					event.targetx.draw(needDraw);
				}
			}
		},
		subSkill: {
			used: {
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
			player.chooseTarget("选择一名其他角色，视为对其使用【决斗】", function (card, player, target2) {
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
};
