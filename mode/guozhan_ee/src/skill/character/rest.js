import { lib, game, ui, get as _get, ai, _status } from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan, isYeIdentity } from "../../patch/player.js";

/** @type {GetGuozhan}  */
const get = cast(_get);

/** @type {Record<string, Skill>} */
export default {
	
	/*----分界线----*/
	_viewnext: {
		trigger: {
			global: "gameDrawBefore",
		},
		silent: true,
		popup: false,
		forced: true,
		filter() {
			if (_status.connectMode && !lib.configOL.viewnext) {
				return false;
			} else if (!_status.connectMode && !get.config("viewnext")) {
				return false;
			}
			return game.players.length > 1;
		},
		content() {
			var target = player.getNext();
			player.viewCharacter(target, 1);
		},
	},
	_aozhan_judge: {
		trigger: {
			player: "phaseBefore",
		},
		forced: true,
		priority: 22,
		filter(event, player) {
			if (get.mode() != "guozhan") {
				return false;
			}
			if (_status.connectMode && !lib.configOL.aozhan) {
				return false;
			} else if (!_status.connectMode && !get.config("aozhan")) {
				return false;
			}
			if (_status._aozhan) {
				return false;
			}
			if (game.players.length > 4) {
				return false;
			}
			if (game.players.length > 3 && game.players.length + game.dead.length <= 7) {
				return false;
			}
			for (var i = 0; i < game.players.length; i++) {
				for (var j = i + 1; j < game.players.length; j++) {
					if (game.players[i].isFriendOf(game.players[j])) {
						return false;
					}
				}
			}
			return true;
		},
		content() {
			var color = get.groupnature(player.group, "raw");
			if (player.isUnseen()) {
				color = "fire";
			}
			player.$fullscreenpop("鏖战模式", color);
			game.broadcastAll(function () {
				_status._aozhan = true;
				ui.aozhan = ui.create.div(".touchinfo.left", ui.window);
				ui.aozhan.innerHTML = "鏖战模式";
				if (ui.time3) {
					ui.time3.style.display = "none";
				}
				ui.aozhanInfo = ui.create.system("鏖战模式", null, true);
				lib.setPopped(
					ui.aozhanInfo,
					function () {
						var uiintro = ui.create.dialog("hidden");
						uiintro.add("鏖战模式");
						var list = ["当游戏中仅剩四名或更少角色时（七人以下游戏时改为三名或更少），若此时全场没有超过一名势力相同的角色，则从一个新的回合开始，游戏进入鏖战模式直至游戏结束。", "在鏖战模式下，任何角色均不是非转化的【桃】的合法目标。【桃】可以被当做【杀】或【闪】使用或打出。", "进入鏖战模式后，即使之后有两名或者更多势力相同的角色出现，仍然不会取消鏖战模式。"];
						var intro = '<ul style="text-align:left;margin-top:0;width:450px">';
						for (var i = 0; i < list.length; i++) {
							intro += "<li>" + list[i];
						}
						intro += "</ul>";
						uiintro.add('<div class="text center">' + intro + "</div>");
						var ul = uiintro.querySelector("ul");
						if (ul) {
							ul.style.width = "180px";
						}
						uiintro.add(ui.create.div(".placeholder"));
						return uiintro;
					},
					250
				);
				game.playBackgroundMusic();
				lib.init.sheet(`
					.card[data-card-name = "tao"]>.image {
						background-image: url(${lib.assetURL}image/card/gz_aozhantao.png) !important;
					}
				`);
			});
			game.addGlobalSkill("aozhan");
		},
	},
	_guozhan_marks: {
		ruleSkill: true,
		enable: "phaseUse",
		filter(event, player) {
			return ["yexinjia", "xianqu", "yinyang", "zhulianbihe"].some(mark => player.hasMark(`${mark}_mark`));
		},
		chooseButton: {
			dialog(event, player) {
				return ui.create.dialog("###国战标记###弃置一枚对应的标记，发动其对应的效果");
			},
			chooseControl(event, player) {
				const list = [],
					bool = player.hasMark("yexinjia_mark");
				if (bool || player.hasMark("xianqu_mark")) {
					list.push("先驱");
				}
				if (bool || player.hasMark("zhulianbihe_mark")) {
					list.push("珠联(摸牌)");
					if (event.filterCard({ name: "tao", isCard: true }, player, event)) {
						list.push("珠联(桃)");
					}
				}
				if (bool || player.hasMark("yinyang_mark")) {
					list.push("阴阳鱼");
				}
				list.push("cancel2");
				return list;
			},
			check() {
				const player = get.player(),
					bool = player.hasMark("yexinjia_mark"),
					evt = get.event().getParent();
				if ((bool || player.hasMark("xianqu_mark")) && 4 - player.countCards("h") > 1) {
					return "先驱";
				}
				if (bool || player.hasMark("zhulianbihe_mark")) {
					if (evt.filterCard({ name: "tao", isCard: true }, player, evt) && get.effect_use(player, { name: "tao" }, player) > 0) {
						return "珠联(桃)";
					}
					if (
						player.getHandcardLimit() - player.countCards("h") > 1 &&
						!game.hasPlayer(function (current) {
							return current != player && current.isFriendOf(player) && current.hp + current.countCards("h", "shan") <= 2;
						})
					) {
						return "珠联(摸牌)";
					}
				}
				if (player.hasMark("yinyang_mark") && player.getHandcardLimit() - player.countCards("h") > 0) {
					return "阴阳鱼";
				}
				return "cancel2";
			},
			backup(result, player) {
				switch (result.control) {
					case "珠联(桃)":
						return get.copy(lib.skill._zhulianbihe_mark_tao);
					case "珠联(摸牌)":
						return {
							async content(event, trigger, player) {
								await player.draw(2);
								player.removeMark(player.hasMark("zhulianbihe_mark") ? "zhulianbihe_mark" : "yexinjia_mark", 1);
							},
						};
					case "阴阳鱼":
						return {
							async content(event, trigger, player) {
								await player.draw();
								player.removeMark(player.hasMark("yinyang_mark") ? "yinyang_mark" : "yexinjia_mark", 1);
							},
						};
					case "先驱":
						return { content: lib.skill.xianqu_mark.content };
				}
			},
		},
		ai: {
			order: 1,
			result: { player: 1 },
		},
	},
	xianqu_mark: {
		intro: { content: "◇出牌阶段，你可以弃置此标记，然后将手牌摸至四张并观看一名其他角色的一张武将牌。" },
		async content(event, trigger, player) {
			player.removeMark(player.hasMark("xianqu_mark") ? "xianqu_mark" : "yexinjia_mark", 1);
			await player.drawTo(4);
			if (
				game.hasPlayer(current => {
					return current != player && current.isUnseen(2);
				})
			) {
				let result = await player
					.chooseTarget("是否观看一名其他角色的一张暗置武将牌？", (card, player, target) => {
						return target != player && target.isUnseen(2);
					})
					.set("ai", target => {
						const player = get.player();
						if (target.isUnseen()) {
							const next = player.getNext();
							if (target != next) {
								return 10;
							}
							return 9;
						}
						return -get.attitude(player, target);
					})
					.forResult();
				if (result?.bool && result?.targets?.length) {
					const [target] = result.targets;
					const controls = [];
					if (target.isUnseen(0)) {
						controls.push("主将");
					}
					if (target.isUnseen(1)) {
						controls.push("副将");
					}
					if (!controls.length) {
						return;
					}
					player.line(target, "green");
					result = controls.length == 1 ? { control: controls[0] } : await player.chooseControl(controls).forResult();
					if (!result?.control) {
						return;
					}
					await player.viewCharacter(target, result.control == "主将" ? 0 : 1);
				} else {
					player.removeSkill("xianqu_mark");
				}
			}
		},
	},
	zhulianbihe_mark: {
		intro: { content: "◇出牌阶段，你可以弃置此标记，然后摸两张牌。<br>◇你可以将此标记当做【桃】使用。" },
	},
	yinyang_mark: {
		intro: { content: "◇出牌阶段，你可以弃置此标记，然后摸一张牌。<br>◇弃牌阶段，你可以弃置此标记，然后本回合手牌上限+2。" },
	},
	_zhulianbihe_mark_tao: {
		ruleSkill: true,
		enable: "chooseToUse",
		viewAsFilter(player) {
			return ["yexinjia_mark", "zhulianbihe_mark"].some(mark => player.hasMark(mark));
		},
		viewAs: {
			name: "tao",
			isCard: true,
		},
		filterCard: () => false,
		selectCard: -1,
		async precontent(event, trigger, player) {
			player.removeMark(player.hasMark("zhulianbihe_mark") ? "zhulianbihe_mark" : "yexinjia_mark", 1);
		},
	},
	_yinyang_mark_add: {
		ruleSkill: true,
		trigger: { player: "phaseDiscardBegin" },
		filter(event, player) {
			return ["yexinjia_mark", "yinyang_mark"].some(mark => player.hasMark(mark)) && player.needsToDiscard();
		},
		prompt(event, player) {
			return `是否弃置一枚【${player.hasMark("yinyang_mark") ? "阴阳鱼" : "野心家"}】标记，使本回合的手牌上限+2？`;
		},
		async content(event, trigger, player) {
			player.addTempSkill("yinyang_add", "phaseAfter");
			player.removeMark(player.hasMark("yinyang_mark") ? "yinyang_mark" : "yexinjia_mark", 1);
		},
	},
	yinyang_add: {
		charlotte: true,
		mod: {
			maxHandcard(player, num) {
				return num + 2;
			},
		},
	},
	yexinjia_mark: {
		intro: {
			content: "◇你可以弃置此标记，并发动【先驱】标记或【珠联璧合】标记或【阴阳鱼】标记的效果。",
		},
	},
	yexinjia_friend: {
		marktext: "盟",
		intro: {
			name: "结盟",
			content: "已经与$结成联盟",
		},
	},
	/*----分界线----*/
	_mingzhi1: {
		trigger: { player: "phaseBeginStart" },
		//priority:19,
		ruleSkill: true,
		forced: true,
		popup: false,
		filter(event, player) {
			return player.isUnseen(2) && !player.hasSkillTag("nomingzhi", false, null, true);
		},
		async content(event, trigger, player) {
			const junzhu = _status.connectMode ? lib.configOL.junzhu : get.config("junzhu");
			if (player.phaseNumber == 1 && player.isUnseen(0) && junzhu) {
				let name = player.name1;
				if (name.indexOf("gz_") == 0 && (lib.junList.includes(name.slice(3)) || get.character(name)?.junName)) {
					const junzhu_name = get.character(name).junName ?? `gz_jun_${name.slice(3)}`,
						group = lib.character[junzhu_name][1];
					const notChange = game.hasPlayer(current => get.is.jun(current) && current.hasIdentity(group));
					const result = notChange
						? {
								bool: false,
						  }
						: await player
								.chooseBool("是否将主武将牌替换为“" + get.translation(junzhu_name) + "”？")
								.set("createDialog", [`是否替换主武将牌为君主武将“${get.translation(junzhu_name)}”`, [[junzhu_name], "character"]])
								.forResult();
					if (result.bool) {
						const maxHp = player.maxHp;
						player.reinit(name, junzhu_name, 4);
						const map = {
							gz_jun_liubei: "shouyue",
							gz_jun_zhangjiao: "hongfa",
							gz_jun_sunquan: "jiahe",
							gz_jun_caocao: "jianan",
							gz_jun_jin_simayi: "smyyingshi",
						};
						game.trySkillAudio(map[junzhu_name], player);

						await player.showCharacter(0);
						const yelist = game.filterPlayer(function (current) {
							if (current == player) {
								return current.identity != group;
							}
							if (!isYeIdentity(current.identity)) {
								return false;
							}
							return current.group == group;
						});
						if (yelist.length > 0) {
							const next = game.createEvent("changeGroupInGuozhan", false);
							next.player = player;
							next.targets = yelist;
							next.fromGroups = yelist.map(current => current.identity);
							next.toGroup = group;
							next.setContent("emptyEvent");
							player.line(yelist, "green");
							if (yelist.includes(player)) {
								game.log(player, "变回了", `<span data-nature=${get.groupnature(group, "raw")}m>${get.translation(group + 2)}</span>身份`);
							}
							game.log(yelist.filter(current => current != player), "失去了野心家身份");
							game.broadcastAll(
								function (list, group) {
									for (let i = 0; i < list.length; i++) {
										list[i].identity = group;
										list[i].group = group;
										list[i].setIdentity();
									}
								},
								yelist,
								group
							);
							await next;
						}
						game.tryResult();
						if (player.maxHp > maxHp) {
							await player.recover(player.maxHp - maxHp);
						}
					}
				}
			}
			let choice = 1;
			for (let i = 0; i < player.hiddenSkills.length; i++) {
				if (lib.skill[player.hiddenSkills[i]].ai) {
					let mingzhi = lib.skill[player.hiddenSkills[i]].ai.mingzhi;
					if (mingzhi == false) {
						choice = 0;
						break;
					}
					if (typeof mingzhi == "function" && mingzhi(trigger, player) == false) {
						choice = 0;
						break;
					}
				}
			}
			let control;
			if (player.isUnseen()) {
				let group = lib.character[player.name1][1];
				const result = await player
					.chooseControl("bumingzhi", "明置" + get.translation(player.name1), "明置" + get.translation(player.name2), "tongshimingzhi", true)
					.set("ai", (event, player) => {
						if (player.hasSkillTag("mingzhi_yes")) {
							return get.rand(1, 2);
						}
						if (player.hasSkillTag("mingzhi_no")) {
							return 0;
						}
						// 测试：前缀为 gz_daqiush 的武将AI积极明置
						if (player.name1 && player.name1.startsWith("gz_daqiush")) {
							return 3; // 同时明置
						}
						if (player.name2 && player.name2.startsWith("gz_daqiush")) {
							return 3; // 同时明置
						}
						var popu = get.population(lib.character[player.name1][1]);
						if (popu >= 2 || (popu == 1 && game.players.length <= 4)) {
							return Math.random() < 0.5 ? 3 : Math.random() < 0.5 ? 2 : 1;
						}
						if (choice == 0) {
							return 0;
						}
						if (get.population(group) > 0 && player.wontYe()) {
							return Math.random() < 0.2 ? (Math.random() < 0.5 ? 3 : Math.random() < 0.5 ? 2 : 1) : 0;
						}
						var nming = 0;
						for (var i = 0; i < game.players.length; i++) {
							if (game.players[i] != player && game.players[i].identity != "unknown") {
								nming++;
							}
						}
						if (nming == game.players.length - 1) {
							return Math.random() < 0.5 ? (Math.random() < 0.5 ? 3 : Math.random() < 0.5 ? 2 : 1) : 0;
						}
						return Math.random() < (0.1 * nming) / game.players.length ? (Math.random() < 0.5 ? 3 : Math.random() < 0.5 ? 2 : 1) : 0;
					})
					.forResult();
				control = result.control;
			} else {
				if (Math.random() < 0.5) {
					choice = 0;
				}
				if (player.isUnseen(0)) {
					// 测试：前缀为 gz_daqiush 的武将AI积极明置
					if (player.name1 && player.name1.startsWith("gz_daqiush")) {
						choice = 1;
					}
					const result = await player
						.chooseControl("bumingzhi", "明置" + get.translation(player.name1), true)
						.set("choice", choice)
						.forResult();
					control = result.control;
				} else if (player.isUnseen(1)) {
					// 测试：前缀为 gz_daqiush 的武将AI积极明置
					if (player.name2 && player.name2.startsWith("gz_daqiush")) {
						choice = 1;
					}
					const result = await player
						.chooseControl("bumingzhi", "明置" + get.translation(player.name2), true)
						.set("choice", choice)
						.forResult();
					control = result.control;
				} else {
					return;
				}
			}
			switch (control) {
				case "明置" + get.translation(player.name1):
					await player.showCharacter(0);
					break;
				case "明置" + get.translation(player.name2):
					await player.showCharacter(1);
					break;
				case "tongshimingzhi":
					await player.showCharacter(2);
					break;
			}
		},
	},
	_mingzhi2: {
		trigger: { player: "triggerHidden" },
		forced: true,
		forceDie: true,
		popup: false,
		priority: 10,
		async content(event, trigger, player) {
			const { skill } = trigger;
			if (get.info(skill).silent) {
				event.finish();
			} else {
				event.skillHidden = true;
				const bool1 = game.expandSkills(lib.character[player.name1][3]).includes(skill);
				const bool2 = game.expandSkills(lib.character[player.name2][3]).includes(skill);
				const info = get.info(skill);
				const isLockedCost = get.is.locked(skill, player) && typeof info?.cost == "function";
				const choice = (() => {
					const yes = !info?.check || info?.check?.(trigger._trigger, player, trigger.triggername, trigger.indexedData);
					if (!yes) {
						return false;
					}
					if (player.hasSkillTag("mingzhi_no")) {
						return false;
					}
					if (player.hasSkillTag("mingzhi_yes")) {
						return true;
					}
					// 测试：前缀为 gz_daqiush 的武将AI积极明置
					if (player.name1 && player.name1.startsWith("gz_daqiush")) {
						return true;
					}
					if (player.name2 && player.name2.startsWith("gz_daqiush")) {
						return true;
					}
					if (player.identity != "unknown") {
						return true;
					}
					if (Math.random() < 0.5) {
						return true;
					}
					if (info?.ai?.mingzhi === true) {
						return true;
					}
					if (info?.ai?.maixie) {
						return true;
					}
					const group = lib.character[player.name1][1];
					const popu = get.population(lib.character[player.name1][1]);
					if (popu >= 2 || (popu == 1 && game.players.length <= 4)) {
						return true;
					}
					if (get.population(group) > 0 && player.wontYe()) {
						return Math.random() < 0.2 ? true : false;
					}
					let nming = 0;
					for (let i = 0; i < game.players.length; i++) {
						if (game.players[i] != player && game.players[i].identity != "unknown") {
							nming++;
						}
					}
					if (nming == game.players.length - 1) {
						return Math.random() < 0.5 ? true : false;
					}
					return Math.random() < (0.1 * nming) / game.players.length ? true : false;
				})();
				if (bool1 && bool2) {
					event.name1 = player.name1;
					event.name2 = player.name2;
					const { result } = await player
						.chooseButton([`明置：请选择你要明置以发动【${get.translation(skill)}】的角色`, [[event.name1, event.name2], "character"]])
						.set("ai", button => {
							const { player, choice } = get.event();
							if (!choice) {
								return 0;
							}
							return 1;
						})
						.set("choice", choice);
					if (result?.links?.length) {
						const index = event.name1 == result.links[0] ? 0 : 1;
						await player.showCharacter(index);
						if (!isLockedCost) {
							trigger.revealed = true;
						}
					} else {
						trigger.untrigger();
						trigger.cancelled = true;
					}
				} else {
					event.name1 = bool1 ? player.name1 : player.name2;
					const { result } = await player.chooseBool(`是否明置${get.translation(event.name1)}以发动【${get.translation(skill)}】？`).set("choice", choice);
					if (result?.bool) {
						const index = bool1 ? 0 : 1;
						await player.showCharacter(index);
						if (!isLockedCost) {
							trigger.revealed = true;
						}
					} else {
						trigger.untrigger();
						trigger.cancelled = true;
					}
				}
			}
		},
	},
	_mingzhiSelectGroup: {
		trigger: { player: "showCharacterBegin" },
		forced: true,
		forceDie: true,
		popup: false,
		priority: 11,
		async content(event, trigger, player) {
			const checkChange = name => lib.selectGroup.includes(lib.character[name][1]);
			if (trigger.toShow?.every(name => !checkChange(name))) {
				return;
			}
			if (!lib.selectGroup.includes(player.identity) && !get.nameList(player).every(name => checkChange(name))) {
				return;
			}
			const groups = ["wei", "shu", "wu", "qun", "jin"];
			if (_status.bannedGroup) {
				groups.remove(_status.bannedGroup?.slice(6));
			}
			const willBeYe = groups.filter(group => {
				if (_status.yeidentity && _status.yeidentity.includes(group)) {
					return true;
				}
				if (get.zhu(player, null, group)) {
					return false;
				}
				const num = player.hasIdentity(group) ? 0 : 1;
				// @ts-expect-error 类型就是这么写的
				return get.totalPopulation(group) + num > Math.floor(get.population() / 2);
			});
			if (willBeYe?.length) {
				groups.removeArray(willBeYe);
				groups.add("ye");
			}
			if (!groups?.length) {
				return;
			}
			const newGroup = await player
				.chooseControl(groups)
				.set("prompt", "请选择一个新的势力")
				.set("ai", (event, player) => {
					const { groups } = get.event();
					const getn = group => {
						const targets = game.filterPlayer(current => current.hasIdentity(group));
						if (!targets.length || group == "ye") {
							return 1 + Math.random();
						}
						return targets.reduce((sum, current) => sum + current.hp, 0) / targets.length + Math.random();
					};
					return groups.maxBy(getn);
				})
				.set("groups", groups)
				.forResult("control");
			if (newGroup != player.identity) {
				const next = game.createEvent("changeGroupInGuozhan", false);
				next.player = player;
				next.targets = [player];
				next.fromGroups = [player.identity];
				next.toGroup = newGroup;
				next.setContent("emptyEvent");
				game.log(player, "变更了势力为", `<span data-nature=${get.groupnature(newGroup, "raw")}m>${get.translation(newGroup)}</span>`);
				game.broadcastAll(
					function (player, group) {
						player.identity = group;
						player.group = group;
						player.setIdentity();
					},
					player,
					newGroup
				);
				await next;
				game.tryResult();
			}
		},
	},
	_zhenfazhaohuan: {
		enable: "phaseUse",
		usable: 1,
		getConfig(player, target) {
			if (target == player || !target.isUnseen()) {
				return false;
			}
			var config = {};
			var skills = player.getSkills();
			for (var i = 0; i < skills.length; i++) {
				var info = get.info(skills[i]).zhenfa;
				if (info) {
					config[info] = true;
				}
			}
			if (config.inline) {
				var next = target.getNext();
				var previous = target.getPrevious();
				if (next == player || previous == player || (next && next.inline(player)) || (previous && previous.inline(player))) {
					return true;
				}
			}
			if (config.siege) {
				if (target == player.getNext().getNext() || target == player.getPrevious().getPrevious()) {
					return true;
				}
			}
			return false;
		},
		filter(event, player) {
			if (isYeIdentity(player.identity) || player.identity == "unknown" || !player.wontYe(player.identity)) {
				return false;
			}
			if (player.hasSkill("undist")) {
				return false;
			}
			if (
				game.countPlayer(function (current) {
					return !current.hasSkill("undist");
				}) < 4
			) {
				return false;
			}
			return game.hasPlayer(function (current) {
				return lib.skill._zhenfazhaohuan.getConfig(player, current);
			});
		},
		content() {
			"step 0";
			event.list = game
				.filterPlayer(function (current) {
					return current.isUnseen();
				})
				.sortBySeat();
			"step 1";
			var target = event.list.shift();
			event.target = target;
			if (target.wontYe(player.identity) && lib.skill._zhenfazhaohuan.getConfig(player, target)) {
				player.line(target, "green");
				var list = [];
				if (target.getGuozhanGroup(0) == player.identity) {
					list.push("明置" + get.translation(target.name1));
				}
				if (target.getGuozhanGroup(1) == player.identity) {
					list.push("明置" + get.translation(target.name2));
				}
				if (list.length > 0) {
					target
						.chooseControl(list, "cancel2")
						.set("prompt", "是否响应" + get.translation(player) + "发起的阵法召唤？")
						.set("ai", function () {
							return Math.random() < 0.5 ? 0 : 1;
						});
				} else {
					event.goto(3);
				}
			} else {
				event.goto(3);
			}
			"step 2";
			if (result.control != "cancel2") {
				if (result.control == "明置" + get.translation(target.name1)) {
					target.showCharacter(0);
				} else {
					target.showCharacter(1);
				}
			}
			"step 3";
			if (event.list.length) {
				event.goto(1);
			}
			"step 4";
			game.delay();
		},
		ai: {
			order: 5,
			result: {
				player: 1,
			},
		},
	},
	_hezong: {
		mode: ["guozhan_ee"],
		enable: "phaseUse",
		usable: 1,
		prompt: "将至多三张可合纵的牌交给一名与你势力不同的角色，或未确定势力的角色，若你交给与你势力不同的角色，则你摸等量的牌",
		filter(event, player) {
			return player.hasCard(function (card) {
				return card.hasTag("hezong") || card.hasGaintag("_hezong");
			}, "h");
		},
		filterCard(card) {
			if (get.itemtype(card) != "card") {
				return false;
			}
			return card.hasTag("hezong") || card.hasGaintag("_hezong");
		},
		filterTarget(card, player, target) {
			if (target == player) {
				return false;
			}
			if (player.isUnseen()) {
				return target.isUnseen();
			}
			return !target.isFriendOf(player);
		},
		check(card) {
			if (card.name == "tao") {
				return 0;
			}
			return 7 - get.value(card);
		},
		selectCard: [1, 3],
		discard: false,
		lose: false,
		delay: false,
		content() {
			"step 0";
			player.give(cards, target);
			"step 1";
			if (!target.isUnseen()) {
				player.draw(cards.length);
			}
		},
		ai: {
			basic: {
				order: 8,
			},
			result: {
				player(player, target) {
					var huoshao = false;
					for (var i = 0; i < ui.selected.cards.length; i++) {
						if (ui.selected.cards[i].name == "huoshaolianying") {
							huoshao = true;
							break;
						}
					}
					if (huoshao && player.inline(target.getNext())) {
						return -3;
					}
					if (target.isUnseen()) {
						return 0;
					}
					if (player.isMajor()) {
						return 0;
					}
					if (!player.isMajor() && huoshao && player.getNext().isMajor()) {
						return -2;
					}
					if (!player.isMajor() && huoshao && player.getNext().isMajor() && player.getNext().getNext().isMajor()) {
						return -3;
					}
					if (!player.isMajor() && huoshao && !target.isMajor() && target.getNext().isMajor() && target.getNext().getNext().isMajor()) {
						return 3;
					}
					if (!player.isMajor() && huoshao && !target.isMajor() && target.getNext().isMajor()) {
						return 1.5;
					}
					return 1;
				},
				target(player, target) {
					if (target.isUnseen()) {
						return 0;
					}
					return 1;
				},
			},
		},
	}
}