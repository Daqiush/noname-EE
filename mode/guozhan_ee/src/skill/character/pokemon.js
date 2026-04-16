// @ts-nocheck
import { lib, game, ui, get as _get, ai, _status}  from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import content from "../../patch/content.js";

/** @type {import("../../patch/get.js").GetGuozhan} */
const get = cast(_get);

export default {
	pokemon_weishen: {
		audio: 2,
		charlotte: true,
	},

	pokemon_daifa: {
		audio: 2,
		group: ["pokemon_daifa_show", "pokemon_daifa_prepare"],
		subSkill: {
			show: {
				trigger: { player: "showCharacterAfter" },
				direct: true,
				filter(event, player) {
					if (!event.toShow || !event.toShow.length) {
						return false;
					}
					return event.toShow.some(name => get.character(name, 3).includes("pokemon_daifa"));
				},
				content() {
					if (typeof player.changeMain == "function") {
						player.changeMain(false);
					}
				},
			},
			prepare: {
				trigger: { player: "phaseZhunbeiBegin" },
				force: true,
				filter(event, player) {
					const players = game.filterPlayer(current => current.isIn());
					if (!players.length) {
						return false;
					}
					const maxHp = Math.max.apply(
						null,
						players.map(current => current.hp)
					);
					const maxHand = Math.max.apply(
						null,
						players.map(current => current.countCards("h"))
					);
					const maxEquip = Math.max.apply(
						null,
						players.map(current => current.countCards("e"))
					);
					return player.hp >= maxHp || player.countCards("h") >= maxHand || player.countCards("e") >= maxEquip;
				},
				content() {
				"step 0";
					const players = game.filterPlayer(current => current.isIn());
					const maxHp = Math.max.apply(
						null,
						players.map(current => current.hp)
					);
					const maxHand = Math.max.apply(
						null,
						players.map(current => current.countCards("h"))
					);
					const maxEquip = Math.max.apply(
						null,
						players.map(current => current.countCards("e"))
					);
					event.maxHp = player.hp >= maxHp;
					event.maxHand = player.countCards("h") >= maxHand;
					event.maxEquip = player.countCards("e") >= maxEquip;
					const list = [];
					if (event.maxHp) {
						list.push("摸1张牌");
					}
					if (event.maxHand && player.canMoveCard(true)) {
						list.push("移动场上一张牌");
					}
					if (event.maxEquip) {
						list.push("本回合手牌上限+2");
					}
					if (event.maxHp && event.maxHand && event.maxEquip && typeof player.changeMain == "function") {
						list.push("变更主将");
					}
					if (!list.length) {
						event.finish();
						return;
					}
					player.chooseControl(list).set("prompt", "待发：请选择一项");
				"step 1";
					console.log(result);
					console.log("选择了", result.control);
					if (!result.control || result.control == "cancel2") {
						event.finish();
						return;
					}
					if (result.control == "摸1张牌") {
						player.draw();
					} else if (result.control == "移动场上一张牌") {
						player.moveCard(game.filterPlayer(true));
					} else if (result.control == "本回合手牌上限+2") {
						player.addTempSkill("pokemon_daifa_handlimit", { global: "phaseAfter" });
					} else if (result.control == "变更主将") {
						player.changeMain(false);
					}
				},
			},
			handlimit: {
				charlotte: true,
				sub: true,
				mod: {
					maxHandcard(player, num) {
						return num + 2;
					},
				},
			},
		},
	},

	pokemon_zhili: {
		audio: "lingce2.mp3",
		locked: true,
		groupSkill: "han",
		init(player) {
			player.storage.pokemon_zhili_records = ["guohe", "wuzhong", "wuxie"];
		},
		group: ["pokemon_zhili_record", "pokemon_zhili_draw"],
		subSkill: {
			record: {
				trigger: { player: "phaseZhunbeiBegin" },
				direct: true,
				filter(event, player) {
					const records = player.storage.pokemon_zhili_records || [];
					return lib.inpile.some(name => get.type({ name: name }) == "trick" && !records.includes(name));
				},
				content() {
					"step 0";
					const records = player.storage.pokemon_zhili_records || [];
					const list = lib.inpile.filter(name => get.type({ name: name }) == "trick" && !records.includes(name));
					if (!list.length) {
						event.finish();
						return;
					}
					player
						.chooseButton(["致理：记录一张未被记录的锦囊牌", [list, "vcard"]])
						.set("ai", button => get.value({ name: button.link[2] }));
					"step 1";
					if (result.bool && result.links && result.links.length) {
						const name = result.links[0][2];
						player.storage.pokemon_zhili_records = player.storage.pokemon_zhili_records || ["guohe", "wuzhong", "wuxie"];
						if (!player.storage.pokemon_zhili_records.includes(name)) {
							player.storage.pokemon_zhili_records.push(name);
						}
					}
				},
			},
			draw: {
				trigger: { global: "useCard" },
				forced: true,
				filter(event, player) {
					if (get.type(event.card) != "trick") {
						return false;
					}
					const records = player.storage.pokemon_zhili_records || ["guohe", "wuzhong", "wuxie"];
					return records.includes(event.card.name);
				},
				content() {
					player.draw();
				},
			},
		},
	},

	pokemon_rixin: {
		audio: "xinfu_tushe1.mp3",
		trigger: { player: "useCard2" },
		direct: true,
		groupSkill: "qun",
		filter(event, player) {
			if (!event.card || get.type(event.card) == "equip") {
				return false;
			}
			if (!event.targets || !event.targets.length) {
				return false;
			}
			if (player.countCards("h", card => get.type(card) == "basic") > 0) {
				return false;
			}
			const used = player.getStorage("pokemon_rixin_used") || [];
			return !used.includes(event.card.name);
		},
		content() {
			player.addTempSkill("pokemon_rixin_used", { global: "phaseAfter" });
			player.markAuto("pokemon_rixin_used", [trigger.card.name]);
			player.draw(trigger.targets.length);
		},
		subSkill: {
			used: {
				charlotte: true,
				sub: true,
				onremove: true,
			},
		},
	},

	pokemon_weiyang: {
		audio: "pottuntian2.mp3",
		enable: "phaseUse",
		usable: 1,
		groupSkill: "wei",
		content() {
			"step 0";
			const used = player.storage.pokemon_weiyang_count || 0;
			event.maxNum = used + 1;
			player
				.chooseTarget([1, event.maxNum], "未央：选择至多" + get.cnNumber(event.maxNum) + "名角色，各随机获得一张红桃牌")
				.set("ai", target => get.attitude(player, target));
			"step 1";
			if (!result.bool || !result.targets || !result.targets.length) {
				event.finish();
				return;
			}
			event.targets = result.targets;
			player.storage.pokemon_weiyang_count = (player.storage.pokemon_weiyang_count || 0) + 1;
			"step 2";
			if (!event.targets.length) {
				event.finish();
				return;
			}
			const current = event.targets.shift();
			const card = get.cardPile2(cardx => get.suit(cardx, false) == "heart", null, "random");
			if (card) {
				current.gain(card, "gain2");
			}
			event.redo();
		},
		ai: {
			order: 6,
			result: {
				player: 1,
			},
		},
	},

	pokemon_tanwei: {
		audio: "olsbzhijue",
		groupSkill: "shu",
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage) {
				if (storage) {
					return "阴：每回合限一次，你可以将一种颜色的所有手牌置入弃牌堆，然后摸1张牌。";
				}
				return "阳：你可以将牌堆顶的一张牌当火攻使用。";
			},
		},
		filter(event, player) {
			if (player.storage.pokemon_tanwei) {
				const used = player.getStorage("pokemon_tanwei_yin_used") || [];
				const hasRed = player.countCards("h", card => get.color(card) == "red") > 0 && !used.includes("red");
				const hasBlack = player.countCards("h", card => get.color(card) == "black") > 0 && !used.includes("black");
				return hasRed || hasBlack;
			}
			return game.hasPlayer(target => player.canUse({ name: "huogong", isCard: true }, target, false));
		},
        group: ["pokemon_tanwei_yang", "pokemon_tanwei_yin"],
        subSkill: {
            yang: {
		        enable: "phaseUse",
                filter(event, player) {
                    if (!player.storage.pokemon_tanwei) {
			            return game.hasPlayer(target => player.canUse({ name: "huogong", isCard: true }, target, false));
			        }
                    else return false;
                },
                chooseTarget: 1,
				logAudio() {
					return "olsbzhijue1.mp3"
				},
                filterTarget(card, player, target) {
                    return player.canUse({ name: "huogong", isCard: true }, target, false);
                },
                content() {
                    event.topCard = get.cards(1)[0];
                    if (targets && targets.length) {
                        player.showCards([event.topCard], "探微：展示牌堆顶牌");
                        player.useCard({ name: "huogong", isCard: true }, [event.topCard], targets[0], false);
                    }
			        player.changeZhuanhuanji("pokemon_tanwei");
                },
            },
			yin: {
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (player.storage.pokemon_tanwei) {
						const hasRed = player.countCards("h", card => get.color(card) == "red") > 0;
						const hasBlack = player.countCards("h", card => get.color(card) == "black") > 0;
						return hasRed || hasBlack;
					}
					return false;
				},
				audio: "olsbzhijue5.mp3",
				chooseButton: {
					dialog(event, player) {
						return ui.create.dialog("探微（阴）：选择一种颜色");
					},
					chooseControl(event, player) {
						const controls = [];
						if (player.countCards("h", card => get.color(card) == "red") > 0) {
							controls.push("红色");
						}
						if (player.countCards("h", card => get.color(card) == "black") > 0) {
							controls.push("黑色");
						}
						controls.push("cancel2");
						return controls;
					},
					check(control) {
						return 1;
					},
					backup(result, player) {
						const color = result.control === "红色" ? "red" : "black";
						return {
							log: false,
							color: color,
							async content(event, trigger, player) {
								player.logSkill("pokemon_tanwei_yin");
								const color = lib.skill[event.name].color;
								const cards = player.getCards("h", card => get.color(card) == color);
								if (cards.length) {
									await player.loseToDiscardpile(cards);
									player.draw(1);
								}
								player.changeZhuanhuanji("pokemon_tanwei");
							},
						};
					},
				},
			}
        },
	},

	pokemon_xingjian: {
		audio: "dcxiongmu2.mp3",
		trigger: { global: "roundStart" },
		prompt2(event, player) {
			return (player.countCards("h") < player.maxHp ? "将手牌摸至" + get.cnNumber(player.maxHp) + "张，然后" : "") + "将任意张牌随机置入牌堆并从牌堆或弃牌堆中获得等量点数为8的牌。";
		},
		groupSkill: "wu",
		async content(event, trigger, player) {
			await player.drawTo(player.maxHp);
			var cards = player.getCards("he");
			if (!cards.length) {
				return;
			}
			var result;
			let selectedCards = null;
			let selectedCount = 0;
			if (cards.length == 1) {
				result = { bool: true, cards: cards };
			} else {
				result = await player
					.chooseCard("行健：将任意张牌置入牌堆的随机位置", "he", [1, Infinity], true, "allowChooseAll")
					.set("ai", card => {
						return 6 - get.value(card);
					})
					.forResult();
			}
			if (result.bool) {
				selectedCards = result.cards;
				selectedCount = selectedCards.length;
				game.log(player, `将${get.cnNumber(selectedCount)}张牌置入了牌堆`);
				var next = player.loseToDiscardpile(selectedCards, ui.cardPile, "blank").set("log", false);
				next.insert_index = function () {
					return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
				};
				await next;
			} else {
				return;
			}
			var list = [],
				shown = [];
			var piles = ["cardPile", "discardPile"];
			for (var pile of piles) {
				for (var i = 0; i < ui[pile].childNodes.length; i++) {
					var card = ui[pile].childNodes[i];
					var number = get.number(card, false);
					if (!list.includes(card) && number == 8) {
						list.push(card);
						if (pile == "discardPile") {
							shown.push(card);
						}
						if (list.length >= selectedCount) {
							break;
						}
					}
				}
				if (list.length >= selectedCount) {
					break;
				}
			}
			if (list.length) {
				var next = player.gain(list);
				next.shown_cards = shown;
				next.set("animate", function (event) {
					var player = event.player,
						cards = event.cards,
						shown = event.shown_cards;
					if (shown.length < cards.length) {
						var num = cards.length - shown.length;
						player.$draw(num);
						game.log(player, "从牌堆获得了", get.cnNumber(num), "张点数为8的牌");
					}
					if (shown.length > 0) {
						player.$gain2(shown, false);
						game.log(player, "从弃牌堆获得了", shown);
					}
					return 500;
				});
				next.gaintag.add("pokemon_xingjian_tag");
				await next;
				player.addTempSkill("pokemon_xingjian_tag", "roundStart");
			}
		},
		subSkill: {
			tag: {
				charlotte: true,
				onremove(player) {
					player.removeGaintag("pokemon_xingjian_tag");
				},
				mod: {
					ignoredHandcard(card, player) {
						if (card.hasGaintag("pokemon_xingjian_tag")) {
							return true;
						}
					},
					cardDiscardable(card, player, name) {
						if (name == "phaseDiscard" && card.hasGaintag("pokemon_xingjian_tag")) {
							return false;
						}
					},
				},
			},
		},
	},

	pokemon_fengjing: {
		audio: 2,
		trigger: { player: "phaseDiscardBegin" },
		marktext: "还",
		intro: { content: "expansion", markcount: "expansion" },
		filter(event, player) {
			return player.countCards("h") > 0 && !player.getExpansions("pokemon_fengjing").length;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard("h", true, get.prompt2(event.skill))
				.set("ai", card => 1 - get.value(card) / 10)
				.forResult();
		},
		async content(event, trigger, player) {
			await player.addToExpansion(event.cards, player, "give2").set("gaintag", ["pokemon_fengjing"]);
			player.addSkill("pokemon_fengjing_yin");
			player.addSkill("pokemon_fengjing_hui");
		},
		onremove(player) {
			const cards = player.getExpansions("pokemon_fengjing");
			if (cards.length) player.loseToDiscardpile(cards);
			player.removeSkill("pokemon_fengjing_yin");
			player.removeSkill("pokemon_fengjing_hui");
		},
		subSkill: {
			yin: {
				charlotte: true,
				trigger: { player: "damageEnd" },
				forced: true,
				popup: false,
				filter(event, player) {
					return !!event.card && player.getExpansions("pokemon_fengjing").length > 0;
				},
				async content(event, trigger, player) {
					const huan = player.getExpansions("pokemon_fengjing")[0];
					player.showCards([huan], get.translation(player) + "展示了「还」");

					const sameType = get.type(huan) === get.type(trigger.card);

					if (sameType) {
						await player.loseToDiscardpile([huan]);
						player.removeSkill("pokemon_fengjing_yin");
						player.removeSkill("pokemon_fengjing_hui");

						const source = trigger.source;
						if (!source?.isIn()) return;

						const damageCard = trigger.card;
						const isVirtual = !!damageCard.isCard || !!damageCard.viewAs;
						const effectiveName = damageCard.viewAs || damageCard.name;

						let next;
						if (isVirtual) {
							const vcard = { name: effectiveName, isCard: true };
							if (!player.canUse(vcard, source, false)) return;
							next = player.useCard(vcard, source, false);
						} else {
							const realCard = player.getCards("h", c => get.name(c) === effectiveName && player.canUse(c, source, false))[0];
							if (!realCard) return;
							const vcard = get.autoViewAs({ name: effectiveName }, [realCard]);
							next = player.useCard(vcard, [realCard], source, false);
						}
						await next;
						if (player.hasHistory("sourceDamage", evt => evt.getParent(2) == next)) {
							await player.draw();
						}
					} else {
						await player.gain([huan], player, "give2");
						player.removeSkill("pokemon_fengjing_yin");
						player.removeSkill("pokemon_fengjing_hui");
					}
				},
			},
			hui: {
				charlotte: true,
				trigger: { player: "phaseBegin" },
				forced: true,
				popup: false,
				filter(event, player) {
					return player.getExpansions("pokemon_fengjing").length > 0;
				},
				async content(event, trigger, player) {
					const huan = player.getExpansions("pokemon_fengjing");
					await player.gain(huan, player, "give2");
					player.removeSkill("pokemon_fengjing_yin");
					player.removeSkill("pokemon_fengjing_hui");
				},
			},
		},
	},

	pokemon_mihu{
		audio: 2,
		trigger: { global: "phaseJudgeBegin" },
		direct: true,
		filter(event, player) {
			return player.getExpansions("pokemon_fengjing").length > 0 && event.player.countCards("j") > 0;
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseBool(get.prompt("pokemon_mihu trigger.player), "将「还」置入弃牌堆，然后将其判定区内一张牌置入弃牌堆")
				.set("ai", () => {
					const target = get.event("_qst");
					return get.attitude(get.player(), target) < 0 ? 3 : -2;
				})
				.set("_qst", trigger.player)
				.forResult();

			if (!result.bool) return;

			player.logSkill("pokemon_mihu trigger.player);

			const huan = player.getExpansions("pokemon_fengjing")[0];
			await player.loseToDiscardpile([huan]);
			player.removeSkill("pokemon_fengjing_yin");

			const jCards = trigger.player.getCards("j");
			if (!jCards.length) return;

			let toDiscard;
			if (jCards.length === 1) {
				toDiscard = jCards;
			} else {
				const jResult = await player
					.choosePlayerCard(trigger.player, "j", true, "秘护：选择置入弃牌堆的判定牌")
					.set("ai", button => {
						const name = button.link.viewAs || button.link.name;
						return ["lebu", "bingliang", "shandian"].includes(name) ? 10 : -get.value(button.link);
					})
					.forResult();
				if (!jResult.bool) return;
				toDiscard = jResult.cards;
			}

			await trigger.player.loseToDiscardpile(toDiscard);
		},
		ai: {
			order: 6,
			result: {
				player(player) {
					return player.getExpansions("pokemon_fengjing").length ? 1 : 0;
				},
			},
		},
	},
};

