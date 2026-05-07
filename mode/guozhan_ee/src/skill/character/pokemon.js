// @ts-nocheck
import { lib, game, ui, get as _get, ai, _status}  from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import content from "../../patch/content.js";

/** @type {import("../../patch/get.js").GetGuozhan} */
const get = cast(_get);

export default {

	weishen: {
		audio: 2,
		charlotte: true,
	},

	pokemon_daifa: {
		audio: 2,
		group: ["pokemon_daifa_show", "pokemon_daifa_prepare"],
		subSkill: {
			show: {
				trigger: { player: "afterShowCharacter" },
				forced: true,
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
					if (event.maxHand) {
						list.push("随机使用一张装备");
					}
					if (event.maxEquip) {
						list.push("本回合手牌上限+2");
					}
					if (!list.length) {
						event.finish();
						return;
					}
					player.chooseControl(list).set("prompt", "待发：请选择一项");
				"step 1";
					if (!result.control || result.control == "cancel2") {
						event.finish();
						return;
					}
					if (result.control == "摸1张牌") {
						player.draw();
					} else if (result.control == "随机使用一张装备") {
						const allEquips = [];
						for (const pile of ["cardPile", "discardPile"]) {
							for (const card of ui[pile].childNodes) {
								if (get.type(card) === "equip") {
									allEquips.push(card);
								}
							}
						}
						if (allEquips.length) {
							event.targetEquip = allEquips[Math.floor(Math.random() * allEquips.length)];
							player.gain([event.targetEquip], "gain2");
							player.chooseUseTarget(event.targetEquip, true, "nopopup")
						}
					} else if (result.control == "本回合手牌上限+2") {
						player.chat("待发：本回合手牌上限+2");
						player.addTempSkill("pokemon_daifa_handlimit", { global: "phaseAfter" });
					}
				"step 2";
					if (event.targetEquip && player.hasCard(event.targetEquip, "h")) {
						player.chooseUseTarget(event.targetEquip, true, "nopopup");
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
		intro: { content: "已记录牌名：$" },
		init(player) {
			player.storage.pokemon_zhili_records = ["guohe", "wuzhong", "wuxie"];
		},
		group: ["pokemon_zhili_record", "pokemon_zhili_draw"],
		subSkill: {
			record: {
				audio: "lingce2.mp3",
				trigger: { player: "phaseZhunbeiBegin" },
				locked: false,
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
						player.markAuto("pokemon_zhili", [name]);
						if (!player.storage.pokemon_zhili_records.includes(name)) {
							player.storage.pokemon_zhili_records.push(name);
						}
					}
				},
			},
			draw: {
				audio: "lingce2.mp3",
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
		audio: "dclianjie1.mp3",
		trigger: {
			player: "useCard",
		},
		groupSkill: "qun",
		filter(event, player) {
			if (
				player.hasSkill("pokemon_rixin_used") ||
				!player.hasHistory("lose", evt => {
					if ((evt.relatedEvent || evt.getParent()) != event) {
						return false;
					}
					return event.cards?.some(card => (evt.hs || []).includes(card));
				})
			) {
				return false;
			}
			const num = get.number(event.card, player);
			if (typeof num !== "number" || player.hasCard(card => get.number(card, player) < num, "h")) {
				return false;
			}
			return true;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.name.slice(0, -5)), (card, player, target) => {
					return target.countCards("h");
				})
				//.set("drawed", player.getStorage("pokemon_rixin_used").includes(get.number(trigger.card, player) || 0))
				.set("ai", target => {
					const player = get.player();
					const eff1 = get.effect(target, { name: "guohe_copy2" }, player, player);
					const eff2 = get.effect(target, { name: "draw" }, player, player);
					if (player == target) {
						return eff2 * (1 + player.maxHp - player.countCards("h"));
					} // && !get.event("drawed")
					return eff1;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const num = get.number(trigger.card, player) || 0;
			const target = event.targets[0];
			const cards = target.getCards("h"),
				minNumber = cards.map(card => get.number(card)).sort((a, b) => a - b)[0];
			player.addTempSkill("pokemon_rixin_used");
			const toLose = cards.filter(card => get.number(card) === minNumber);
			if (target != player || toLose.length <= 1) {
				await target.lose(toLose.randomGet(), ui.cardPile);
			} else {
				const result = await player
					.chooseCard("h", card => get.event("toLose")?.includes(card), true)
					.set("toLose", toLose)
					.set("ai", card => 10 - get.value(card))
					.forResult();
				if (result.bool) {
					await player.lose(result.cards[0], ui.cardPile);
				}
			}
			game.broadcastAll(function (player) {
				var cardx = ui.create.card();
				cardx.classList.add("infohidden");
				cardx.classList.add("infoflip");
				player.$throw(cardx, 1000, "nobroadcast");
			}, target);
			await game.delayx();
			if (player.countCards("h") >= player.maxHp) {
				return;
			}
			const result = await player.drawTo(player.maxHp).forResult();
			if (result) {
				player.addGaintag(result, "pokemon_rixin");
			}
		},
		mod: {
			aiOrder(player, card, num) {
				var number = get.number(card, player);
				if (player.countCards("h") < player.maxHp) {
					return num + number / 10;
				} /*else if (!player.getStorage("pokemon_rixin_used").includes(number)) {
					return num - 0.5;
				}*/
			},
		},
		subSkill: {
			used: {
				charlotte: true
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
		audio: ["olsbzhijue1.mp3", "olsbzhijue5.mp3"],
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

	pokemon_xinya: {
		groupSkill: "ye",
		audio: "jsrgweisi2.mp3",
		trigger: {
			player: "phaseJieshuBegin",
		},
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard("h", get.prompt2(event.skill))
				.set("ai", card => 7 - get.value(card))
				.forResult();
		},
		async content(event, trigger, player) {
			const cards = event.cards;
			if (cards?.length) {
				player.$throw(1, 1000);
				game.log(player, "将", "#y一张手牌", "置于了牌堆顶");
				await player.lose(cards, ui.cardPile, "insert");
				game.updateRoundNumber();
			}
			const card = { name: "binglinchengxiax", isCard: true, xinya: true };
			if (player.hasUseTarget(card)) {
				await player.chooseUseTarget(card, true);
			}
			if (
				!game.hasPlayer2(current => {
					return current.hasHistory("damage", evt => evt.getParent(card.name)?.card?.xinya);
				})
			) {
				await player.loseHp();
			}
		},
		ai: {
			order: 8,
			result: {
				player: 1,
			},
		},
	},
	
	//一名你攻击范围内的角色的判定阶段开始时，你可令其选择一项：<br>1.令你将一张牌当雷【杀】无距离限制地对其使用；<br>2.进行【闪电】的判定。<br>3.令你摸1张牌。",
	pokemon_zhaofu: {
		audio: 2,
		trigger: { global: "phaseJudgeBegin" },
		filter(event, player) {
			return player.inRange(event.player);
		},
		content(event, trigger, player) {
			"step 0";
			choices = [];
			if (player.canUse({ name: "sha", isCard: true }, trigger.player, false) && player.countCards("he") > 0) {
				choices.push("被其使用雷杀");
			}
			choices.push("进行闪电判定");
			choices.push("其摸1张牌");
			trigger.player
				.chooseControl(choices)
				.set("prompt", "兆伏：请选择一项")
				.set("ai", (event, player) => {
					return get.attitude(trigger.player, player) > 0 ? 2 : 0;
				})
				.forResult();
			"step 1";
			if (result.control == "被其使用雷杀") {
				player.chooseCard("he", true, get.prompt2("你须将一张牌当做雷【杀】对其使用（无距离限制）。")).set("ai", card => 7 - get.value(card)).forResult().then(result => {
					if (result.bool) {
						player.useCard({ name: "sha", nature: "thunder", isCard: true }, result.cards, trigger.player, false);
					}
				});
			} else if (result.control == "进行闪电判定") {
				trigger.player.executeDelayCardEffect("shandian");
			} else if (result.control == "其摸1张牌") {
				player.draw();
			}
		},
	},

	pokemon_fengjing: {
		audio: 2,
		trigger: { player: "phaseDiscardBegin" },
		marktext: "象",
		intro: { content: "expansion", markcount: "expansion" },
		filter(event, player) {
			return player.countCards("h") > 0 && !player.getExpansions("pokemon_fengjing").length;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard("h", false, get.prompt2(event.skill))
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
					player.showCards([huan], get.translation(player) + "展示了「象」");

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

	pokemon_mihu: {
		audio: 2,
		trigger: { global: "phaseJudgeBegin" },
		filter(event, player) {
			return player.getExpansions("pokemon_fengjing").length > 0 && event.player.countCards("j") > 0;
		},
		async content(event, trigger, player) {
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
				player(player, target) {
					//需要有奉镜牌，且玩家对目标友善
					if (!player.getExpansions("pokemon_fengjing").length) return 0;
					return get.attitude(player, target) > 0 ? 1 : 0;
				},
			},
		},
	},

	pokemon_yajian: {
		audio: 1,
		trigger: { player: "useCard" },
		usable: 2,
		filter(event, player) {
			return get.type(event.card) === "basic";
		},
		async content(event, trigger, player) {
			const judgeResult = await player.judge().forResult();
			const judgeCard = judgeResult.card;
			const usedCard = trigger.card;

			const sameColor = get.color(judgeCard, false) === get.color(usedCard, false);
			const sameSuit = get.suit(judgeCard, false) === get.suit(usedCard, false);
			const sameNumber = get.number(judgeCard, false) === get.number(usedCard, false);

			// 颜色相同，你可将判定牌置于牌堆顶
			if (sameColor) {
				const r = await player.chooseBool("崖剑：是否将判定牌置于牌堆顶").forResult();
				if (r.bool && !get.owner(judgeCard)) {
					judgeCard.fix();
					ui.cardPile.insertBefore(judgeCard, ui.cardPile.firstChild);
					game.log(player, "将判定牌置于了牌堆顶");
					game.updateRoundNumber();
				}
			}

			// 花色相同，你摸1张牌
			if (sameSuit) {
				player.draw();
			}

			// 点数相同，你可令当前回合角色失去或回复1点体力
			if (sameNumber) {
				const turnPlayer = _status.currentPhase;
				if (turnPlayer?.isIn()) {
					const r = await player
						.chooseControl(["令其失去1点体力", "令其回复1点体力", "cancel2"])
						.set("prompt", "崖剑：令" + get.translation(turnPlayer) + "失去或回复1点体力")
						.set("ai", () => {
							const player = get.player();
							const turnPlayer = _status.currentPhase;
							return get.attitude(player, turnPlayer) > 0 ? 1 : 0;
						})
						.forResult();
					if (r.control === "令其失去1点体力") {
						await turnPlayer.loseHp();
					} else if (r.control === "令其回复1点体力") {
						await turnPlayer.recover();
					}
				}
			}
		},
		ai: {
			order: 7,
			result: {
				player: 1,
			},
		},
	},

	pokemon_niaoxiang: {
		audio: 1,
		trigger: { global: "useCardToPlayered" },
		filter(event, player) {
			if (event.card.name !== "sha") return false;
			if (game.countPlayer() < 4) return false;
			return event.target === player && event.player.siege(player);
		},
		forced: true,
		locked: false,
		forceaudio: true,
		async content(event, trigger, player) {
			const id = trigger.target.playerid;
			const map = trigger.getParent().customArgs;
			if (!map[id]) map[id] = {};
			if (typeof map[id].shanRequired === "number") {
				map[id].shanRequired++;
			} else {
				map[id].shanRequired = 2;
			}
		},
	},

	pokemon_wanhua:{
		audio: 4,
		group: ["pokemon_wanhua_gainmark", "pokemon_wanhua_extinguish", "pokemon_wanhua_mark"],
		onremove(player) {
			player.removeMark("pokemon_wanhua_mark", 999);
		},
		subSkill:{
			gainmark:{
				audio: ["pokemon_wanhua1.mp3", "pokemon_wanhua2.mp3"],
				forced: true,
				trigger: { global: ["loseAfter", "loseAsyncAfter", "cardsDiscardAfter"] },
				filter(event, player) {
					return event.cards && event.cards.some(card => {
							return card.name == "sha" && card.nature && get.position(card, true) === "d"
						}
					)
				},
				content(event, trigger, player){
					"step 0"
					player.addMark("pokemon_wanhua_mark");
				},
			},
			extinguish:{
				audio: ["pokemon_wanhua3.mp3", "pokemon_wanhua4.mp3"],
				trigger: { player: ["useCard1"] },
				filter(event, player) {
					return event.card?.name === "sha" && game.hasNature(event.card);
				},
				content() {
					game.setNature(trigger.card, false);
					player.storage.pokemon_wanhua_card = trigger.card;
					player.chat("改为普【杀】")
				}
			},
			mark:{
				markText: "花",
				intro: {
					name: "花",
					content: "mark",
				},
				onremove: true,
				audio: ["pokemon_wanhua3.mp3", "pokemon_wanhua4.mp3"],
				trigger: { player: ["useCardToPlayer"] },
				filter(event, player) {
					console.log(event.card)
					console.log(player.storage.pokemon_wanhua_card)
					return event.card === player.storage.pokemon_wanhua_card && event.isFirstTarget && player.countMark("pokemon_wanhua_mark") >= 2;
				},
				content() {
					"step 0";
					event.videoId = lib.status.videoId++;
					if (player.isUnderControl()) {
						game.swapPlayerAuto(player);
					}
					var switchToAuto = function () {
						game.pause();
						game.countChoose();
						setTimeout(function () {
							_status.imchoosing = false;
							event._result = {
								bool: true,
								links: [],
								cost: 0
							};
							if (event.dialog) event.dialog.close();
							if (event.controls) {
								for (var i of event.controls) i.close();
							}
							if (event.control_confirm) event.control_confirm.close();
							game.resume();
						}, 5000);
					};
					var createDialog = function (player, id) {
						if (player == game.me) return;
						ui.create.dialog(get.translation(player) + "正在选择激活效果...", "forcebutton").videoId = id;
					};
					var chooseButton = function (player) {
						var event = _status.event;
						player = player || event.player;
						event.status = { btn1: false, btn2: false, btn3: false, btn4: false };
						event.costs = { btn1: 2, btn2: 2, btn3: 3, btn4: 3 };
						event.totalMark = player.countMark("pokemon_wanhua_mark");
						
						event.dialog = ui.create.dialog("选择要激活的效果（当前花标记：" + event.totalMark + "）", "hidden");
						event.dialog.addText("<li>点击按钮激活对应效果，再次点击取消。所需标记：2、2、3、3。");
						event.dialog.open();
						
						event.controls = [];
						event.control_confirm = ui.create.control("确认", function() {
							var links = [];
							var cost = 0;
							for (var i in event.status) {
								if (event.status[i]) {
									links.push(i);
									cost += event.costs[i];
								}
							}
							event._result = { bool: true, links: links, cost: cost };
							event.dialog.close();
							for (var i of event.controls) i.close();
							event.control_confirm.close();
							game.resume();
							_status.imchoosing = false;
						});
						
						var updateConfirm = function() {
							var cost = 0;
							for (var i in event.status) {
								if (event.status[i]) cost += event.costs[i];
							}
							if (cost <= event.totalMark) {
								event.control_confirm.style.display = "";
							} else {
								event.control_confirm.style.display = "none";
							}
						};
						
						var btnNames = ["摸牌", "多指", "加伤", "强中"];
						for (var i = 1; i <= 4; i++) {
							let btnId = "btn" + i;
							let cost = event.costs[btnId];
							let name = btnNames[i - 1] + " (耗" + cost + ")";
							let ctr = ui.create.control(name, function (link) {
								var event = _status.event;
								var currentBtnId = link === "摸牌 (耗2)" ? "btn1" : link === "多指 (耗2)" ? "btn2" : link === "加伤 (耗3)" ? "btn3" : "btn4";
								event.status[currentBtnId] = !event.status[currentBtnId];
								if (event.status[currentBtnId]) {
									this.classList.add("glow");
								} else {
									this.classList.remove("glow");
								}
								updateConfirm();
							});
							event.controls.push(ctr);
						}
						
						updateConfirm();
						game.pause();
						game.countChoose();
					};
					
					game.broadcastAll(createDialog, player, event.videoId);
					if (event.isMine()) {
						chooseButton();
					} else if (event.isOnline()) {
						event.player.send(chooseButton, event.player);
						event.player.wait();
						game.pause();
					} else {
						switchToAuto();
					}
					
					"step 1";
					game.broadcastAll("closeDialog", event.videoId);
					if (result && result.bool) {
						var links = result.links;
						var cost = result.cost;
						if (cost > 0) {
							player.removeMark("pokemon_wanhua_mark", cost);
						}
						var effects = [];
						event.links = links;
						if (links.includes("btn1")) effects.push("摸牌");
						if (links.includes("btn2")) effects.push("多指");
						if (links.includes("btn3")) effects.push("加伤");
						if (links.includes("btn4")) effects.push("强中");
						
						if (effects.length) game.log(player, "消耗了" + cost + "个花标记，生效了：", effects.join("、"));
						
						if (links.includes("btn1")) {
							if (!player.storage.pokemon_wanhua_draw) player.storage.pokemon_wanhua_draw = [];
							player.storage.pokemon_wanhua_draw.push(trigger.card);
							player.addTempSkill("pokemon_wanhua_draw", "useCardAfter");
						}
						if (links.includes("btn3")) {
							if (!trigger.getParent().baseDamage) trigger.getParent().baseDamage = 1;
							trigger.getParent().baseDamage++;
						}
						if (links.includes("btn4")) {
							if (!trigger.getParent().directHit) trigger.getParent().directHit = [];
							trigger.getParent().directHit.addArray(trigger.getParent().targets);
						}
						if (links.includes("btn2")) {
							event.needBtn2 = true;
						}
					} else {
						event.finish();
					}
					
					"step 2";
					if (event.needBtn2) {
						player.chooseTarget("为【杀】选择一个额外目标", function(card, player, target) {
							var triggerParent = _status.event.triggerEvent.getParent();
							if (triggerParent.targets.includes(target)) return false;
							return player.canUse(triggerParent.card, target);
						}).set("triggerEvent", trigger);
					} else {
						event.finish();
					}
					
					"step 3";
					if (result.bool && result.targets && result.targets.length) {
						var parentEvent = trigger.getParent();
						player.line(result.targets, "green");
						parentEvent.targets.addArray(result.targets);
						if (event.links.includes("btn4")) {
							if (!parentEvent.directHit) parentEvent.directHit = [];
							parentEvent.directHit.addArray(result.targets);
						}
					}
				},
			},
			pokemon_wanhua_draw: {
				trigger: { player: "useCardAfter" },
				forced: true,
				popup: false,
				filter(event, player) {
					return player.storage.pokemon_wanhua_draw && player.storage.pokemon_wanhua_draw.includes(event.card);
				},
				content() {
					player.storage.pokemon_wanhua_draw.remove(trigger.card);
					player.draw();
				}
			},
		}
	},

	//水箭龟：水箭
	pokemon_shuijian: {
		audio: 1,
		preHidden: true,
		trigger: { player: "phaseDrawBegin" },
		filter(event, player) {
			return player.hasUseTarget({ name: "sha", isCard: true });
		},
		filterTarget(card, player, target) {
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
			const card = { name: "sha", isCard: true, shuijian: true };
			const next = player.useCard(card, target, false);
			await next;
			const damaged = game.hasPlayer2(current => {
				return current.hasHistory("damage", evt => evt.getParent("sha")?.card?.shuijian);
			});
			if (!damaged) {
				trigger.num += Math.ceil(player.countCards("e") / 2);
			}
		},
		ai: {
			order: 9,
			result: { target: -1 },
		},
	},
};

