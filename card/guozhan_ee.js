import { lib, game, ui, get, ai, _status } from "../noname.js";
game.import("card", function () {
	return {
		name: "guozhan_ee",
		connect: true,
		card: {
			minguangkai_ee: {
				audio: true,
				mode: ["guozhan_ee"],
				fullskin: true,
				type: "equip",
				subtype: "equip2",
				skills: ["minguangkai_ee_cancel", "minguangkai_ee_link"],
				ai: {
					basic: {
						equipValue: 6,
					},
				},
			},
			chuanguoyuxi_ee: {
				audio: true,
				mode: ["guozhan_ee"],
				bingzhu: ["刘宏", "袁术", "司马炎"],
				fullskin: true,
				type: "equip",
				subtype: "equip5",
				skills: ["chuanguoyuxi_ee_skill"],
				ai: {
					equipValue: 9,
				},
			},
			xietianzi_ee: {
				audio: true,
				fullskin: true,
				type: "trick",
				enable(card, player, event) {
					if (get.mode() == "guozhan_ee" && !player.isMajor()) {
						return false;
					}
					if (player.hasSkill("xietianzi_ee")) {
						return false;
					}
					if (_status.currentPhase != player) {
						return false;
					}
					var evt = event || _status.event;
					if (evt.name != "chooseToUse") {
						evt = evt.getParent("chooseToUse");
					}
					return evt.type == "phase";
				},
				toself: true,
				filterTarget(card, player, target) {
					return player == target;
				},
				selectTarget: -1,
				content() {
					var evt = _status.event.getParent("phaseUse");
					if (evt && evt.name == "phaseUse") {
						evt.skipped = true;
					}
					target.addTempSkill("xietianzi_ee");
				},
				ai: {
					order: 0.5,
					value: 4,
					useful: 2,
					result: {
						target(player, target) {
							if (target.countCards("h") >= 2) {
								return 1;
							}
							return 0;
						},
					},
				},
			},
			shuiyanqijun_ee: {
				audio: true,
				fullskin: true,
				type: "trick",
				cardnature: "thunder",
				filterTarget(card, player, target) {
					return target != player && (get.mode() != "guozhan_ee" || _status.mode == "yingbian" || _status.mode == "free" || target.countCards("e") > 0);
				},
				enable: true,
				defaultYingbianEffect: "add",
				content() {
					"step 0";
					if (event.card.yingbian_all) {
						target.discard(
							target.getCards("e", function (card) {
								return lib.filter.cardDiscardable(card, target, "shuiyanqijun_ee");
							})
						);
						target.damage("thunder");
						event.finish();
					} else if (
						!target.countCards("e", function (card) {
							return lib.filter.cardDiscardable(card, target, "shuiyanqijun_ee");
						})
					) {
						var next = target.damage();
						if (!get.is.single()) {
							game.setNature(next, "thunder", true);
						}
						event.finish();
						return;
					} else {
						target
							.chooseControl("discard_card", "take_damage", function (event, player) {
								let eff = get.damageEffect(player, event.player, player, "thunder");
								if (eff > 0) {
									return "take_damage";
								}
								if (player.hasSkillTag("noe")) {
									return "discard_card";
								}
								if (!eff) {
									return "take_damage";
								}
								if (player.isDamaged() && player.hasCard(card => get.name(card) == "baiyin" && get.recoverEffect(player, player, _status.event.player) > 0, "e")) {
									return "discard_card";
								}
								if (player.hasCard(card => get.value(card, player) <= 0, "e") && !player.hasCard(card => get.value(card, player) > Math.max(7, 12 - player.hp), "e")) {
									return "discard_card";
								}
								if (
									lib.skill.huxinjing_ee.filter(
										{
											player: player,
											card: event.card,
											source: event.player,
											num: 1,
										},
										player
									)
								) {
									return "take_damage";
								}
								if ((player.hp > 2 && player.countCards("e") > 2) || (player.hp > 1 && player.countCards("e") > 3)) {
									return "take_damage";
								}
								return "discard_card";
							})
							.set("prompt", "水淹七军")
							.set("prompt2", "请选择一项：⒈弃置装备区里的所有牌；⒉受到" + get.translation(player) + "造成的1点雷电伤害。");
					}
					"step 1";
					if (result.control == "discard_card") {
						target.discard(
							target.getCards("e", function (card) {
								return lib.filter.cardDiscardable(card, target, "shuiyanqijun_ee");
							})
						);
					} else {
						var next = target.damage();
						if (!get.is.single()) {
							game.setNature(next, "thunder", true);
						}
					}
					event.finish();
				},
				ai: {
					canLink(player, target, card) {
						if (!target.isLinked() || player.hasSkill("jueqing") || target.hasSkill("gangzhi") || player.hasSkill("gangzhi")) {
							return false;
						}
						let es = target.getCards("e"),
							val = 0;
						if (!es.length) {
							return true;
						}
						for (let i of es) {
							if (i.name == "baiyin" && target.isDamaged() && get.recoverEffect(target)) {
								val += get.value({ name: "tao" }, target);
							} else {
								val -= get.value(i, target);
							}
						}
						if (0.15 * val > 2 * get.sgn(get.damageEffect(target, player, target, "thunder"))) {
							return false;
						}
						return true;
					},
					order: 6,
					value: 4,
					useful: 2,
					tag: {
						damage: 1,
						thunderDamage: 1,
						natureDamage: 1,
						loseCard: 1,
					},
					yingbian(card, player, targets, viewer) {
						if (get.attitude(viewer, player) <= 0) {
							return 0;
						}
						var base = 0;
						if (get.cardtag(card, "yingbian_all")) {
							if (
								targets.filter(function (current) {
									return (
										get.damageEffect(current, player, player, "thunder") > 0 &&
										current.countCards("e", function (card) {
											return get.value(card, current) <= 0;
										}) < 2 &&
										current.countCards("e", function (card) {
											return get.value(card, current) > 0;
										}) > 0
									);
								}).length
							) {
								base += 6;
							}
						}
						if (get.cardtag(card, "yingbian_add")) {
							if (
								game.hasPlayer(function (current) {
									return !targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
								})
							) {
								base += 6;
							}
						}
						return 0;
					},
					result: {
						target(player, target, card, isLink) {
							let es = target.getCards("e"),
								eff = 2 * get.sgn(get.damageEffect(target, player, target, "thunder"));
							if (isLink || !es.length) {
								return eff;
							}
							let val = 0;
							for (let i of es) {
								if (i.name == "baiyin" && target.isDamaged() && get.recoverEffect(target)) {
									val += 6;
								} else {
									val -= get.value(i, target);
								}
							}
							return Math.max(eff, 0.15 * val);
						},
					},
				},
			},
			lulitongxin_ee: {
				fullskin: true,
				audio: true,
				type: "trick",
				enable(card, player) {
					if (get.mode() == "versus") {
						return true;
					}
					return game.hasPlayer(function (current) {
						return current.isMajor();
					});
				},
				mode: ["guozhan_ee", "versus"],
				filterTarget: true,
				recastable: true,
				changeTarget(player, targets) {
					var target = targets[0];
					game.filterPlayer(function (current) {
						if (get.mode() == "versus") {
							return current.isFriendOf(target);
						}
						return current.isMajor() == target.isMajor() && current != target && !current.hasSkill("diaohulishan_ee");
					}, targets);
				},
				content() {
					if (get.mode() == "versus") {
						if (target.isEnemyOf(player)) {
							target.link(true);
						} else if (target.isLinked()) {
							target.draw();
						}
					} else if (target.isLinked()) {
						target.draw();
					} else {
						target.link();
					}
				},
				ai: {
					order: 7.5,
					value: 4,
					useful: 2,
					wuxie: (target, card, player, viewer, status) => {
						if (target.hasSkillTag("noLink") || target.hasSkillTag("nodamage") || target.hasSkillTag("nofire") || target.hasSkillTag("nothunder")) {
							return 0;
						}
						if (get.damageEffect(target, player, viewer, "thunder") >= 0 || get.damageEffect(target, player, viewer, "fire") >= 0) {
							return 0;
						}
						if (target.hp + target.hujia > 2 && target.mayHaveShan(viewer, "use")) {
							return 0;
						}
					},
					result: {
						target(player, target) {
							if (target.hasSkillTag("noLink") || target.hasSkillTag("nodamage")) {
								return 0;
							}
							if (get.mode() == "versus") {
								if (target.isFriendOf(player)) {
									return target.isLinked() ? 1 : 0;
								}
								return target.isLinked() ? 0 : -1;
							}
							return target.isLinked() ? 1 : -1;
						},
					},
				},
			},
			lianjunshengyan_ee: {
				fullskin: true,
				audio: true,
				type: "trick",
				enable(card, player) {
					if (get.mode() == "guozhan_ee") {
						return !player.isUnseen();
					}
					return true;
				},
				mode: ["guozhan_ee", "boss"],
				filterTarget(card, player, target) {
					if (get.mode() == "guozhan_ee") {
						return target != player && target.identity != "unknown" && !target.isFriendOf(player);
					}
					return true;
				},
				selectTarget() {
					return get.mode() == "guozhan_ee" ? 1 : -1;
				},
				changeTarget(player, targets) {
					if (get.mode() == "guozhan_ee") {
						var target = targets[0];
						targets.push(player);
						if (target.identity != "ye") {
							game.filterPlayer(function (current) {
								return target != current && target.isFriendOf(current) && !current.hasSkill("diaohulishan_ee");
							}, targets);
						}
					}
				} /*
				contentBefore:function(){
					if(get.mode()=='guozhan_ee'){
						var evt=event.getParent();
						if(evt&&evt.targets&&evt.targets.includes(player)){
							evt.fixedSeat=true;
							evt.targets.sortBySeat();
							evt.targets.remove(player);
							evt.targets.push(player);
						}
					}
				},*/,
				content() {
					"step 0";
					if (get.mode() != "guozhan_ee") {
						if (player == target) {
							target.draw(game.filterPlayer().length);
						} else {
							target.chooseDrawRecover(true);
						}
						event.finish();
					} else {
						if (target == player) {
							var num = targets.length - 1;
							event.num = num;
							var damaged = target.maxHp - target.hp;
							if (damaged == 0) {
								target.draw(num);
								event.finish();
							} else {
								var list = [];
								for (var i = Math.min(num, damaged); i >= 0; i--) {
									list.push("摸" + (num - i) + "回" + i);
								}
								target.chooseControl(list).set("prompt", "请分配自己的摸牌数和回复量").ai = function () {
									return 0;
								};
							}
						} else {
							target.draw();
						}
					}
					"step 1";
					if (target != player) {
						target.link(false);
					} else if (typeof result.control == "string") {
						var index = result.control.indexOf("回");
						var draw = parseInt(result.control.slice(1, index));
						var recover = parseInt(result.control.slice(index + 1));
						if (draw) {
							target.draw(draw);
						}
						if (recover) {
							target.recover(recover);
						}
					}
				},
				ai: {
					wuxie(target, card, player, viewer) {
						if (get.mode() == "guozhan_ee") {
							if (!_status._aozhan) {
								if (!player.isMajor()) {
									if (!viewer.isMajor()) {
										return 0;
									}
								}
							}
						}
					},
					order: 6,
					value: 4,
					useful: 2,
					result: {
						target(player, target) {
							if (player == target) {
								return 2;
							}
							return 1;
						},
					},
				},
			},
			chiling_ee: {
				fullskin: true,
				audio: true,
				type: "trick",
				enable() {
					return game.hasPlayer(function (current) {
						return current.isUnseen();
					});
				},
				mode: ["guozhan_ee"],
				//global:['g_chiling_ee1','g_chiling_ee2','g_chiling_ee3'],
				filterTarget(card, player, target) {
					return target.isUnseen();
				},
				selectTarget: -1,
				chooseai(event, player) {
					if (player.hasSkillTag("mingzhi_yes")) {
						return "选项一";
					}
					if (_status.event.controls.includes("选项三")) {
						if (player.hasSkillTag("mingzhi_no")) {
							return "选项三";
						}
						return Math.random() < 0.5 ? "选项一" : "选项三";
					} else {
						if (_status.event.getParent().nomingzhi) {
							if (_status.event.controls.includes("选项二")) {
								return "选项二";
							}
							return "选项一";
						}
						if (player.hasSkillTag("maixie_hp") || player.hp <= 2) {
							return "选项一";
						}
						return Math.random() < 0.5 ? "选项一" : "选项二";
					}
				},
				content() {
					"step 0";
					var choiceList = ["明置一张武将牌，然后摸一张牌", "失去1点体力"];
					event.nomingzhi = target.hasSkillTag("nomingzhi", false, null, true);
					if (event.nomingzhi) {
						choiceList.shift();
					}
					if (target.countCards("he", { type: "equip" })) {
						choiceList.push("弃置一张装备牌");
					}
					target.chooseControl(lib.card.chiling_ee.chooseai).set("prompt", "敕令").set("choiceList", choiceList);
					"step 1";
					var index = result.index;
					if (event.nomingzhi) {
						index++;
					}
					if (index == 0) {
						target
							.chooseControl("主将", "副将", function () {
								return Math.floor(Math.random() * 2);
							})
							.set("prompt", "选择要明置的武将牌");
					} else if (index == 1) {
						target.loseHp();
						event.finish();
					} else {
						target.chooseToDiscard("he", { type: "equip" }, true);
						event.finish();
					}
					"step 2";
					if (result.index == 0) {
						target.showCharacter(0);
					} else {
						target.showCharacter(1);
					}
					target.draw();
				},
				destroy(card, targetPosition, player, event) {
					if ((event.name != "lose" && event.name != "cardsDiscard") || targetPosition != "discardPile") {
						return false;
					}
					var evt = event.getParent().relatedEvent;
					if (evt && evt.name == "useCard") {
						return false;
					}
					return true;
				},
				onDestroy() {
					var currentPhase = _status.currentPhase;
					if (currentPhase) {
						_status.chiling_ee = true;
						currentPhase.addTempSkill("g_chiling_ee3");
					}
					if (!lib.inpile.includes("zhaoshu")) {
						lib.inpile.push("zhaoshu");
						var card = game.createCard2("zhaoshu", "club", 3);
						game.log(card, "被置于了牌堆底");
						ui.cardPile.appendChild(card);
						game.updateRoundNumber();
					}
				},
				ai: {
					order: 6,
					result: {
						target: -1,
					},
					tag: {
						multitarget: 1,
						multineg: 1,
					},
				},
			},
			diaohulishan_ee: {
				fullskin: true,
				audio: true,
				type: "trick",
				enable: true,
				global: "g_diaohulishan_ee",
				filterTarget(card, player, target) {
					return target != player;
				},
				selectTarget: [1, 2],
				content() {
					target.addTempSkill("diaohulishan_ee");
				},
				ai: {
					order(item, player) {
						if (!player) {
							player = get.player();
						}
						if (
							player.hasCard(function (card) {
								return ["gz_haolingtianxia", "gz_guguoanbang", "gz_kefuzhongyuan", "wuzhong", "yuanjiao_ee", "lianjunshengyan_ee", "lulitongxin_ee", "yiyi_ee"].includes(get.name(card));
							}, "hs")
						) {
							return 3.5;
						}
						if (
							player.hasCard(function (card) {
								return get.name(card) == "taoyuan";
							}, "hs")
						) {
							return get.order({ name: "taoyuan" }, player) - 1;
						}
						return 9.5;
					},
					value: 4,
					useful: [2, 1],
					wuxie() {
						return 0;
					},
					result: {
						player(player, target) {
							var att = get.attitude(player, target);
							if (target.hp == 1 && att < 0) {
								return 0;
							}
							if (
								game.hasPlayer(function (current) {
									return get.attitude(player, current) < att;
								})
							) {
								var num = 1;
								if (target == player.next || target == player.previous) {
									num += 0.5;
								}
								return num;
							}
							return 0;
						},
					},
				},
			},
			huxinjing_ee: {
				fullskin: true,
				type: "equip",
				subtype: "equip2",
				cardcolor: "club",
				skills: ["huxinjing_ee"],
				filterTarget(card, player, target) {
					if (get.mode() == "guozhan_ee" && player != target) {
						return false;
					}
					return target.canEquip(card, true);
				},
				selectTarget() {
					return get.mode() == "guozhan_ee" ? -1 : 1;
				},
				toself: false,
				ai: {
					basic: {
						equipValue: 6,
					},
				},
			},
			huoshaolianying_ee: {
				fullskin: true,
				audio: true,
				type: "trick",
				cardnature: "fire",
				filterTarget(card, player, target) {
					if (get.mode() == "guozhan_ee") {
						var next = player.getNext();
						if (!next) {
							return false;
						}
						return target == next || target.inline(next);
					}
					if (player == target) {
						return false;
					}
					if (
						game.hasPlayer(function (current) {
							return current.isLinked() && current != player;
						})
					) {
						if (!target.isLinked()) {
							return false;
						}
						var distance = get.distance(player, target, "absolute");
						return !game.hasPlayer(function (current) {
							if (target != current && current != player && current.isLinked()) {
								var dist = get.distance(player, current, "absolute");
								if (dist < distance) {
									return true;
								}
								if (dist == distance && parseInt(current.dataset.position) < parseInt(target.dataset.position)) {
									return true;
								}
							}
						});
					} else {
						var dist = get.distance(player, target);
						return !game.hasPlayer(function (current) {
							return current != player && get.distance(player, current) < dist;
						});
					}
				},
				enable: true,
				selectTarget: -1,
				modTarget: true,
				content() {
					target.damage("fire");
				},
				ai: {
					order: 5,
					value: 6,
					tag: {
						damage: 1,
						natureDamage: 1,
						fireDamage: 1,
					},
					result: {
						target(player, target, card) {
							if (
								target.hasSkillTag("nofire") ||
								target.hasSkillTag("nodamage", null, {
									source: player,
									card: card,
									natures: ["fire"],
								})
							) {
								return 0;
							}
							if (target.hasSkill("xuying") && target.countCards("h") == 0) {
								return 0;
							}
							if (!target.isLinked()) {
								return get.damageEffect(target, player, target, "fire");
							}
							return game.countPlayer(function (current) {
								if (current.isLinked()) {
									return get.sgn(get.damageEffect(current, player, target, "fire"));
								}
							});
						},
					},
				},
			},
			yuanjiao_ee: {
				audio: true,
				fullskin: true,
				type: "trick",
				enable(card, player) {
					if (get.mode() == "guozhan_ee" && player.isUnseen()) {
						return false;
					}
					return true;
				},
				filterTarget(card, player, target) {
					if (get.mode() != "guozhan_ee") {
						return target.group != player.group;
					}
					if (target.identity == "unknown" || player.identity == "unknown") {
						return false;
					}
					return player.isEnemyOf(target);
				},
				content() {
					target.draw(1, "nodelay");
					player.draw(3);
				},
				ai: {
					wuxie(target, card, player, viewer) {
						if (get.mode() == "guozhan_ee") {
							if (!_status._aozhan) {
								if (!player.isMajor()) {
									if (!viewer.isMajor()) {
										return 0;
									}
								}
							}
						}
					},
					basic: {
						useful: 4,
						value: 8,
						order: 9,
					},
					result: {
						target: 1,
						player: 3,
					},
				},
			},
			zhibi_ee: {
				audio: true,
				fullskin: true,
				type: "trick",
				enable: true,
				recastable: true,
				filterTarget(card, player, target) {
					if (player == target) {
						return false;
					}
					return target.countCards("h") || target.isUnseen(2);
				},
				content() {
					"step 0";
					if (!player.storage.zhibi_ee) {
						player.storage.zhibi_ee = [];
					}
					player.storage.zhibi_ee.add(target);
					var controls = [];
					if (target.countCards("h")) {
						controls.push("手牌");
					}
					if (target.isUnseen(0)) {
						controls.push("主将");
					}
					if (target.isUnseen(1)) {
						controls.push("副将");
					}
					if (controls.length > 1) {
						player.chooseControl(controls).set("ai", function () {
							return 1;
						});
					}
					if (controls.length == 0) {
						event.finish();
					}
					"step 1";
					var content;
					var str = get.translation(target) + "的";
					if (result.control) {
						if (result.control == "手牌") {
							content = [str + "手牌", target.getCards("h")];
							game.log(player, "观看了", target, "的手牌");
						} else if (result.control == "主将") {
							content = [str + "主将", [[target.name1], "character"]];
							game.log(player, "观看了", target, "的主将");
						} else {
							content = [str + "副将", [[target.name2], "character"]];
							game.log(player, "观看了", target, "的副将");
						}
					} else if (target.countCards("h")) {
						content = [str + "手牌", target.getCards("h")];
						game.log(player, "观看了", target, "的手牌");
					} else if (target.isUnseen(0)) {
						content = [str + "主将", [[target.name1], "character"]];
						game.log(player, "观看了", target, "的主将");
					} else {
						content = [str + "副将", [[target.name2], "character"]];
						game.log(player, "观看了", target, "的副将");
					}
					player.chooseControl("ok").set("dialog", content);
				},
				mode: ["guozhan_ee"],
				ai: {
					order: 9.5,
					wuxie() {
						return 0;
					},
					result: {
						player(player, target) {
							if (player.countCards("h") <= player.hp) {
								return 0;
							}
							if (player.storage.zhibi_ee && player.storage.zhibi_ee.includes(target)) {
								return 0;
							}
							return target.isUnseen() ? 1 : 0;
						},
					},
				},
			},
			yiyi_ee: {
				audio: true,
				fullskin: true,
				type: "trick",
				enable: true,
				filterTarget(card, player, target) {
					if (get.mode() == "guozhan_ee") {
						return target.isFriendOf(player);
					} else if (get.is.versus()) {
						return player.side == target.side;
					} else {
						return true;
					}
				},
				selectTarget() {
					if (get.mode() == "guozhan_ee") {
						return -1;
					}
					return [1, 3];
				},
				content() {
					target.draw(2);
					target.chooseToDiscard(2, "he", true).ai = get.disvalue;
				},
				ai: {
					wuxie() {
						return 0;
					},
					basic: {
						order: 9,
						useful: 1.5,
						value: 3,
					},
					result: {
						target(player, target) {
							let i,
								add = 0,
								y = 1,
								tars = 0;
							if (!ui.selected.cards) {
								y = 0;
							}
							if (ui.selected.targets) {
								tars = 0.01 * ui.selected.targets.length;
							} else {
								tars = 0;
							}
							if (target == player) {
								i = player.countCards("h", function (card) {
									if (y > 0 && ui.selected.cards.includes(card)) {
										return false;
									}
									if (!y && get.name(card) === "yiyi_ee") {
										y = -1;
										return false;
									}
									return true;
								});
							} else {
								i = target.countCards("he");
							}
							if (target.hasSkillTag("noh")) {
								add++;
							}
							return add + Math.sqrt(i / 3.6 + tars) / 2;
						},
					},
					tag: {
						draw: 2,
						loseCard: 2,
						discard: 2,
						multitarget: true,
						norepeat: 1,
					},
				},
			},
			wuliu_ee: {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				global: "g_wuliu_ee_skill",
				distance: { attackFrom: -1 },
				ai: {
					equipValue(card, player) {
						if (player.identity == "unknown" || player.identity == "ye") {
							return 2;
						}
						return (
							2 +
							game.countPlayer(function (current) {
								return current.isFriendOf(player);
							}) /
								2
						);
					},
					basic: {
						equipValue: 3,
					},
				},
				skills: ["wuliu_ee_skill"],
				mode: ["guozhan_ee"],
				bingzhu: ["孙权"],
			},
			sanjian_ee: {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				bingzhu: ["纪灵"],
				distance: { attackFrom: -2 },
				ai: {
					basic: {
						equipValue: 4,
					},
				},
				skills: ["sanjian_ee_skill"],
			},
			jingfanma_ee: {
				fullskin: true,
				type: "equip",
				subtype: "equip4",
				distance: { globalFrom: -1 },
			},
		},
		skill: {
			minguangkai_ee_cancel: {
				equipSkill: true,
				trigger: { target: "useCardToTarget" },
				forced: true,
				check(event, player) {
					return get.effect(event.target, event.card, event.player, player) < 0;
				},
				filter(event, player) {
					if (["huoshaolianying_ee", "huogong"].includes(event.card.name)) {
						return true;
					}
					if (event.card.name == "sha") {
						return game.hasNature(event.card, "fire");
					}
					return false;
				},
				content() {
					trigger.getParent().targets.remove(player);
				},
				ai: {
					effect: {
						target(card, player, target, current) {
							if (["huoshaolianying_ee", "huogong"].includes(card.name) || (card.name == "sha" && game.hasNature(card, "fire"))) {
								return "zeroplayertarget";
							}
						},
					},
				},
			},
			minguangkai_ee_link: {
				equipSkill: true,
				trigger: { player: "linkBefore" },
				forced: true,
				filter(event, player) {
					return player.isNotMajor() && !player.isLinked();
				},
				content() {
					trigger.cancel();
				},
				ai: {
					noLink: true,
				},
			},
			chuanguoyuxi_ee_skill: {
				equipSkill: true,
				trigger: { player: "phaseDrawBegin2" },
				forced: true,
				filter(event, player) {
					return !player.isUnseen() && !event.numFixed;
				},
				content() {
					trigger.num++;
				},
				ai: {
					threaten: 1.3,
					forceMajor: true,
				},
				group: "chuanguoyuxi_ee_skill2",
			},
			chuanguoyuxi_ee_skill2: {
				equipSkill: true,
				trigger: { player: "phaseUseBegin" },
				forced: true,
				filter(event, player) {
					if (player.isUnseen()) {
						return false;
					}
					return game.hasPlayer(function (current) {
						return player.canUse("zhibi_ee", current);
					});
				},
				content() {
					player.chooseUseTarget("玉玺：选择知己知彼的目标", { name: "zhibi_ee" });
				},
			},
			xietianzi_ee: {
				forced: true,
				popup: false,
				nopop: true,
				filter(event, player) {
					return player.countCards("h") > 0;
				},
				trigger: {
					player: "phaseDiscardAfter",
				},
				content() {
					"step 0";
					player.removeSkill("xietianzi_ee");
					player.chooseToDiscard("h", "是否弃置一张手牌并获得一个额外回合？").set("ai", function (card) {
						return 10 - get.value(card);
					});
					"step 1";
					if (result.bool) {
						player.insertPhase();
					}
				},
			},
			g_chiling_ee3: {
				mode: ["guozhan_ee"],
				trigger: { player: "phaseEnd" },
				forced: true,
				popup: false,
				filter() {
					return _status.chiling_ee == true;
				},
				content() {
					"step 0";
					_status.chiling_ee = false;
					var targets = game.filterPlayer(function (target) {
						return target.isUnseen();
					});
					targets.sort(lib.sort.seat);
					event.targets = targets;
					"step 1";
					if (event.targets.length) {
						var target = event.targets.shift();
						event.current = target;
						var choiceList = ["明置一张武将牌，然后摸一张牌", "失去1点体力"];
						if (target.countCards("he", { type: "equip" })) {
							choiceList.push("弃置一张装备牌");
						}
						target.chooseControl(lib.card.chiling_ee.chooseai).set("prompt", "敕令").set("choiceList", choiceList);
					} else {
						event.finish();
					}
					"step 2";
					var target = event.current;
					if (result.control == "选项一") {
						target
							.chooseControl("主将", "副将", function () {
								return Math.floor(Math.random() * 2);
							})
							.set("prompt", "选择要明置的武将牌");
					} else if (result.control == "选项二") {
						target.loseHp();
						event.goto(1);
					} else {
						target.chooseToDiscard("he", { type: "equip" }, true);
						event.goto(1);
					}
					"step 3";
					var target = event.current;
					if (result.index == 0) {
						target.showCharacter(0);
					} else {
						target.showCharacter(1);
					}
					target.draw();
					event.goto(1);
				},
			},
			g_diaohulishan_ee: {},
			diaohulishan_ee: {
				charlotte: true,
				group: "undist",
				init(player) {
					if (player.isIn()) {
						game.broadcastAll(function (player) {
							player.classList.add("out");
						}, player);
						game.log(player, "移出了游戏");
					}
				},
				onremove(player) {
					if (player.isOut()) {
						game.broadcastAll(function (player) {
							player.classList.remove("out");
						}, player);
						game.log(player, "移回了游戏");
					}
				},
			},
			huxinjing_ee: {
				equipSkill: true,
				trigger: { player: "damageBegin4" },
				// forced:true,
				filter(event, player) {
					if (event.num < player.hp && (get.mode() == "guozhan_ee" || event.num <= 1)) {
						return false;
					}
					let cards = player.getEquips("huxinjing_ee");
					if (!cards.length) {
						return false;
					}
					if (player.hasSkillTag("unequip2")) {
						return false;
					}
					if (
						event.source &&
						event.source.hasSkillTag("unequip", false, {
							name: event.card ? event.card.name : null,
							target: player,
							card: event.card,
						})
					) {
						return false;
					}
					return true;
				},
				content() {
					trigger.cancel();
					var e2 = player.getEquips("huxinjing_ee");
					if (e2.length) {
						player.discard(e2);
					}
					player.removeSkill("huxinjing_ee");
				},
			},
			wuliu_ee_skill: {
				equipSkill: true,
			},
			g_wuliu_ee_skill: {
				equipSkill: true,
				mod: {
					attackRange(player, distance) {
						return (
							distance +
							game.countPlayer(function (current) {
								if (current == player || !current.isFriendOf(player)) {
									return false;
								}
								if (current.hasSkill("wuliu_ee_skill")) {
									return true;
								}
							})
						);
					},
				},
			},
			sanjian_ee_skill: {
				equipSkill: true,
				audio: true,
				trigger: { source: "damageSource" },
				direct: true,
				filter(event, player) {
					if (event.player.isDead()) {
						return false;
					}
					if (player.countCards("h") == 0) {
						return false;
					}
					if (!event.card) {
						return false;
					}
					if (event.card.name != "sha") {
						return false;
					}
					if (!event.notLink()) {
						return false;
					}
					return game.hasPlayer(function (current) {
						return current != event.player && get.distance(event.player, current) <= 1;
					});
				},
				content() {
					"step 0";
					var damaged = trigger.player;
					player
						.chooseCardTarget({
							filterCard: lib.filter.cardDiscardable,
							filterTarget(card, player, target) {
								var damaged = _status.event.damaged;
								return get.distance(damaged, target) <= 1 && target != damaged;
							},
							ai1(card) {
								return 9 - get.value(card);
							},
							ai2(target) {
								var player = _status.event.player;
								return get.damageEffect(target, player, player);
							},
							prompt: get.prompt("sanjian_ee"),
						})
						.set("damaged", damaged);
					"step 1";
					if (result.bool) {
						player.logSkill("sanjian_ee_skill", result.targets);
						player.discard(result.cards);
						result.targets[0].damage();
					}
				},
			},
		},
		translate: {
			minguangkai_ee: "明光铠",
			minguangkai_ee_cancel: "明光铠",
			minguangkai_ee_link: "明光铠",
			minguangkai_ee_info: "锁定技。①当你成为【火烧连营】、【火攻】或火【杀】的目标时，取消之。②当你即将横置前，若你是小势力角色，取消之。",
			chuanguoyuxi_ee_skill: "玉玺",
			chuanguoyuxi_ee_skill2: "玉玺",
			chuanguoyuxi_ee: "传国玉玺",
			chuanguoyuxi_ee_info: "锁定技。若你已确定势力，则：①你的势力视为唯一的大势力。②摸牌阶段开始时，你令额定摸牌数+1。③出牌阶段开始时，你视为使用【知己知彼】。",
			xietianzi_ee: "挟令",
			xietianzi_ee_info: "1",
			xietianzi_ee_info_guozhan_ee: "出牌阶段，对身为大势力角色的自己使用。若目前为你的出牌阶段，你结束出牌阶段，且本回合的弃牌阶段结束时，你可以弃置一张手牌，获得一个额外的回合。",
			shuiyanqijun_ee: "水淹七军",
			shuiyanqijun_ee_info: "1",
			shuiyanqijun_ee_info_guozhan_ee: "出牌阶段，对一名装备区里有牌的其他角色使用。目标角色选择一项：⒈弃置装备区里的所有牌。⒉受到你造成的1点雷电伤害。",
			lulitongxin_ee: "勠力同心",
			lulitongxin_ee_info: "出牌阶段，对所有大势力角色或所有小势力角色使用。若目标角色：未横置，则其横置；已横置，则其摸一张牌。",
			lulitongxin_ee_info_versus: "1",
			lianjunshengyan_ee: "联军盛宴",
			lianjunshengyan_ee_info: "出牌阶段，对你和你选择的除你的势力外的一个势力的所有角色使用。若目标角色：为你，你选择摸Y张牌并回复X-Y点体力（X为该势力的角色数，Y∈[0,X]）；不为你，其摸一张牌，然后重置。",
			lianjunshengyan_ee_info_boss: "1",
			chiling_ee: "敕令",
			chiling_ee_info: "①出牌阶段，对所有未确定势力的角色使用。目标角色选择一项：1、明置一张武将牌，然后摸一张牌；2、弃置一张装备牌；3、失去1点体力。②当【敕令】因判定或弃置而置入弃牌堆时，系统将之移出游戏并将【诏书】置于牌堆底，然后系统于当前回合结束后视为对所有没有势力的角色使用【敕令】。",
			diaohulishan_ee: "调虎离山",
			diaohulishan_ee_info: "出牌阶段，对至多两名其他角色使用。目标角色于此回合：不能使用牌、不是牌的合法目标、体力值不会变化、不计入距离或座次的结算。",
			huoshaolianying_ee: "火烧连营",
			huoshaolianying_ee_bg: "烧",
			huoshaolianying_ee_info_guozhan_ee: "出牌阶段，若你的下家不在/在队列中，对其/其所在所有队列中的所有角色使用。你对目标角色造成1点火属性伤害。",
			huoshaolianying_ee_info: "1",
			yuanjiao_ee: "远交近攻",
			yuanjiao_ee_info: "1",
			yuanjiao_ee_info_guozhan_ee: "出牌阶段，对一名与你势力不同且已确定势力的其他角色使用。其摸一张牌，然后你摸三张牌。",
			yuanjiao_ee_bg: "交",
			zhibi_ee: "知己知彼",
			zhibi_ee_info: "出牌阶段，对一名有手牌或有暗置武将牌的其他角色使用。你选择一项：⒈观看其手牌。⒉观看其的一张暗置武将牌。",
			yiyi_ee: "以逸待劳",
			yiyi_ee_info_guozhan_ee: "出牌阶段，对所有己方角色使用。目标角色摸两张牌，然后弃置两张牌。",
			yiyi_ee_info_combat: "1",
			yiyi_ee_info: "1",
			yiyi_ee_bg: "逸",
			wuliu_ee: "吴六剑",
			wuliu_ee_info: "锁定技。与你势力相同的所有其他角色的攻击范围+1。",
			wuliu_ee_skill: "吴六剑",
			sanjian_ee: "三尖两刃刀",
			sanjian_ee_info: "当你因执行【杀】而对A造成伤害后，你可以弃置一张牌并选择一名其他角色B（A至B的距离需为1）。你对B造成1点伤害。",
			sanjian_ee_skill: "三尖两刃刀",
			jingfanma_ee_bg: "-马",
			jingfanma_ee: "惊帆",
			jingfanma_ee_info: "锁定技，你计算与其他角色的距离-1。",
			huxinjing_ee_bg: "镜",
			huxinjing_ee: "护心镜",
			huxinjing_ee_info: "1",
			huxinjing_ee_info_guozhan_ee: "当你受到伤害时，若伤害值大于等于你的体力值，则你可以将所有【护心镜】置入弃牌堆，然后防止此伤害。",
		},
		list: [
			["heart", 9, "yuanjiao_ee"],
			["club", 3, "zhibi_ee"],
			["club", 4, "zhibi_ee"],
			["diamond", 4, "yiyi_ee"],
			["heart", 11, "yiyi_ee"],
			["diamond", 6, "wuliu_ee"],
			["diamond", 12, "sanjian_ee"],
			["heart", 3, "jingfanma_ee"],
			["spade", 4, "shunshou"],
			["spade", 12, "guohe"],
			["spade", 11, "wuxie"],
			["spade", 3, "huoshaolianying_ee", "fire"],
			["club", 11, "huoshaolianying_ee", "fire"],
			["heart", 12, "huoshaolianying_ee", "fire"],
			["club", 2, "huxinjing_ee"],
			["heart", 2, "diaohulishan_ee"],
			["diamond", 10, "diaohulishan_ee"],
			["heart", 1, "lianjunshengyan_ee"],
			["club", 3, "chiling_ee"],
			["spade", 12, "lulitongxin_ee"],
			["club", 10, "lulitongxin_ee"],
			["club", 12, "shuiyanqijun_ee"],
			["heart", 13, "shuiyanqijun_ee"],
			["spade", 1, "xietianzi_ee"],
			["diamond", 1, "xietianzi_ee"],
			["diamond", 4, "xietianzi_ee"],
			["club", 1, "chuanguoyuxi_ee"],
		],
	};
});
