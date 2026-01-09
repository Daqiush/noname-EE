// @ts-nocheck

import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import { GameEvent, Dialog, Player } from "../../../../noname/library/element/index.js";
import { Get } from "../../../../noname/get/index.js";
import { showYexingsContent, chooseCharacterContent, chooseCharacterOLContent } from "./content.js";
import { isYeIdentity } from "./player.js";

export class GetGuozhan extends Get {
	/**
	 * > ?.?
	 *
	 * @param {*} source
	 * @param {*} junling
	 * @param {*} performer
	 * @param {*} targets
	 * @param {*} viewer
	 * @returns
	 */
	junlingEffect(source, junling, performer, targets, viewer) {
		var att1 = get.attitude(viewer, source),
			att2 = get.attitude(viewer, performer);
		var eff1 = 0,
			eff2 = 0;
		switch (junling) {
			case "junling1":
				if (
					!targets.length &&
					game.countPlayer(function (current) {
						return get.damageEffect(viewer, current, viewer) > 0;
					})
				) {
					eff1 = 2;
				} else {
					if (get.damageEffect(targets[0], performer, source) >= 0) {
						eff1 = 2;
					} else {
						eff1 = -2;
					}
					if (get.damageEffect(targets[0], source, performer) >= 0) {
						eff2 = 2;
					} else {
						eff2 = -2;
					}
				}
				break;
			case "junling2":
				if (performer.countCards("he")) {
					eff1 = 1;
					eff2 = 0;
				} else {
					eff1 = 2;
					eff2 = -1;
				}
				break;
			case "junling3":
				if (performer.hp == 1 && !performer.hasSkillTag("save", true)) {
					eff2 = -5;
				} else {
					if (performer == viewer) {
						if (performer.hasSkillTag("maihp", true)) {
							eff2 = 3;
						} else {
							eff2 = -2;
						}
					} else {
						if (performer.hasSkillTag("maihp", false)) {
							eff2 = 3;
						} else {
							eff2 = -2;
						}
					}
				}
				break;
			case "junling4":
				eff1 = 0;
				eff2 = -2;
				break;
			case "junling5":
				var td = performer.isTurnedOver();
				if (td) {
					if (performer == viewer) {
						// @ts-expect-error 祖宗之法就是这么写的
						if (_status.currentPhase == performer && performer.hasSkill("jushou")) {
							eff2 = -3;
						} else {
							eff2 = 3;
						}
					} else {
						eff2 = 3;
					}
				} else {
					if (performer == viewer) {
						if (performer.hasSkillTag("noturn", true)) {
							eff2 = 0;
						} else {
							eff2 = -3;
						}
					} else {
						if (performer.hasSkillTag("noturn", false)) {
							eff2 = 0;
						} else {
							eff2 = -3;
						}
					}
				}
				break;
			case "junling6":
				if (performer.countCards("h") > 1) {
					eff2 += 1 - performer.countCards("h");
				}
				if (performer.countCards("e") > 1) {
					eff2 += 1 - performer.countCards("e");
				}
				break;
		}
		return Math.sign(att1) * eff1 + Math.sign(att2) * eff2;
	}

	/**
	 * > ??.?
	 *
	 * @param {string} name1
	 * @param {string} name2
	 * @returns {boolean}
	 */
	guozhanReverse(name1, name2) {
		if (get.is.double(name2)) {
			return false;
		}
		if (["gz_xunyou", "gz_lvfan", "gz_liubei"].includes(name2)) {
			return true;
		}
		if (name1 == "gz_re_xushu") {
			return true;
		}
		if (name2 == "gz_dengai") {
			return lib.character[name1][2] % 2 == 1;
		}
		if (["gz_sunce", "gz_jiangwei"].includes(name1)) {
			return name2 == "gz_zhoutai" || lib.character[name2][2] % 2 == 1;
		}
		return false;
	}

	/**
	 * 获取武将的等级
	 *
	 * @param {string} name
	 * @param {Player} player
	 * @returns
	 */
	guozhanRank(name, player) {
		if (name.indexOf("gz_shibing") == 0) {
			return -1;
		}
		if (name.indexOf("gz_jun_") == 0) {
			return 7;
		}
		if (player) {
			var skills = lib.character[name][3].slice(0);
			for (var i = 0; i < skills.length; i++) {
				if (lib.skill[skills[i]].limited && player.awakenedSkills.includes(skills[i])) {
					return skills.length - 1;
				}
			}
		}
		if (_status._aozhan) {
			for (var i in lib.aozhanRank) {
				if (lib.aozhanRank[i].includes(name)) {
					return parseInt(i);
				}
			}
		}
		for (var i in lib.guozhanRank) {
			if (lib.guozhanRank[i].includes(name)) {
				return parseInt(i);
			}
		}
		return 0;
	}

	/**
	 * 获取属于某势力的人口数（支持双势力）
	 * 
	 * 计算规则：
	 * - 使用 hasIdentity(group) 判断角色是否属于该势力
	 * - 双势力武将同时计入两个势力的人口
	 * - 已确定为野心家的角色不计入任何势力人口
	 * 
	 * @param {string} group 势力名称
	 * @param {boolean} [includeDead=false] 是否包含死亡角色
	 * @returns {number} 人口数
	 */
	populationOf(group, includeDead = false) {
		if (!group) {
			return includeDead ? game.players.length + game.dead.length : game.players.length;
		}
		
		const players = includeDead ? game.players.concat(game.dead) : game.players;
		return players.filter(current => {
			// 未确定势力不计入
			if (current.identity === "unknown") {
				return false;
			}
			// 野心家不计入正常势力人口
			if (isYeIdentity(current.identity)) {
				return false;
			}
			// 使用 hasIdentity 判断是否属于该势力（支持双势力）
			if (typeof current.hasIdentity === "function") {
				return current.hasIdentity(group);
			}
			// 降级处理：使用 identity 直接比较
			return current.identity === group;
		}).length;
	}

	/**
	 * 检查某角色加入某势力后是否会成为野心家
	 * 
	 * @param {string} group 势力名称
	 * @param {number} [numOfReadyToShow=1] 即将加入的人数
	 * @returns {boolean} 是否会成为野心家
	 */
	wouldBeYexinjia(group, numOfReadyToShow = 1) {
		// 已被禁用的势力
		if (_status.yeidentity && _status.yeidentity.includes(group)) {
			return true;
		}
		
		// 有君主的势力不会产生野心家
		if (game.hasPlayer(current => get.is.jun(current) && current.hasIdentity && current.hasIdentity(group))) {
			return false;
		}
		
		// 计算阈值：游戏人数除以2，向下取整
		const threshold = Math.floor(get.population() / 2);
		
		// 当前人口 + 即将加入的人数 > 阈值 则成为野心家
		return get.populationOf(group) + numOfReadyToShow > threshold;
	}

	/**
	 * > ?.??
	 *
	 * @param {Player} from
	 * @param {Player} to
	 * @param {number} difficulty
	 * @param {string} toidentity
	 * @returns
	 */
	realAttitude(from, to, difficulty, toidentity) {
		var getIdentity = function (player) {
			if (player.isUnseen()) {
				if (!player.wontYe()) {
					return "ye";
				}
				return player.getGuozhanGroup(0);
			}
			return player.identity;
		};
		
		// 检查势力是否匹配（支持势力集合）
		var hasMatchingIdentity = function (player, targetIdentity) {
			if (isYeIdentity(targetIdentity) || targetIdentity === "unknown") {
				return false;
			}
			// 如果目标是组合势力，拆分检查
			if (targetIdentity && targetIdentity.includes("_") && !targetIdentity.endsWith("_ye")) {
				const parts = targetIdentity.split("_");
				return player.getIdentities().some(id => parts.includes(id));
			}
			return player.hasIdentity ? player.hasIdentity(targetIdentity) : player.identity === targetIdentity;
		};
		
		var fid = getIdentity(from);
		// 使用势力集合判断
		if (hasMatchingIdentity(from, toidentity) && !isYeIdentity(toidentity)) {
			return 4 + difficulty;
		}
		if (from.identity == "unknown" && hasMatchingIdentity(from, toidentity)) {
			if (from.wontYe()) {
				return 4 + difficulty;
			}
		}
		var groups = [];
		var map = {},
			sides = [],
			pmap = _status.connectMode ? lib.playerOL : game.playerMap,
			player;
		for (var i of game.players) {
			if (i.identity == "unknown") {
				continue;
			}
			var added = false;
			for (var j of sides) {
				if (i.isFriendOf(pmap[j])) {
					added = true;
					map[j].push(i);
					if (i == this) {
						player = j;
					}
					break;
				}
			}
			if (!added) {
				map[i.playerid] = [i];
				sides.push(i.playerid);
				if (i == this) {
					player = i.playerid;
				}
			}
		}
		for (var i in map) {
			var num = map[i].length;
			groups.push(num);
		}
		var max = Math.max.apply(this, groups);
		if (max <= 1) {
			return -3;
		}
		var from_p;
		if (from.identity == "unknown" && from.wontYe()) {
			from_p = get.population(fid);
		} else {
			from_p = game.countPlayer(function (current) {
				return current.isFriendOf(from);
			}, true);
		}
		var to_p = game.countPlayer(function (current) {
			return current.isFriendOf(to);
		}, true);
		if (isYeIdentity(to.identity)) {
			to_p += 1.5;
		}

		if (to_p >= max) {
			return -5;
		}
		if (from_p >= max) {
			return -2 - to_p;
		}
		if (max >= game.players.length / 2) {
			if (to_p <= from_p) {
				return 0.5;
			}
			return 0;
		}
		if (to_p < max - 1) {
			return 0;
		}
		return -0.5;
	}

	/**
	 * > ??.??
	 *
	 * @param {Player} from
	 * @param {Player} to
	 * @returns
	 */
	rawAttitude(from, to) {
		var getIdentity = function (player) {
			if (player.isUnseen()) {
				if (!player.wontYe()) {
					return "ye";
				}
				return player.getGuozhanGroup(0);
			}
			return player.identity;
		};
		
		// 检查势力是否匹配（支持势力集合）
		var hasMatchingIdentity = function (player, targetIdentity) {
			if (isYeIdentity(targetIdentity) || targetIdentity === "unknown") {
				return false;
			}
			// 如果目标是组合势力，拆分检查
			if (targetIdentity && targetIdentity.includes("_") && !targetIdentity.endsWith("_ye")) {
				const parts = targetIdentity.split("_");
				return player.getIdentities().some(id => parts.includes(id));
			}
			return player.hasIdentity ? player.hasIdentity(targetIdentity) : player.identity === targetIdentity;
		};
		
		var fid = getIdentity(from),
			tid = getIdentity(to);
		if (to.identity == "unknown" && game.players.length == 2) {
			return -5;
		}
		if (_status.currentPhase == from && from.ai.tempIgnore && from.ai.tempIgnore.includes(to) && to.identity == "unknown" && (!from.storage.zhibi || !from.storage.zhibi.includes(to))) {
			return 0;
		}
		var difficulty = 0;
		if (to == game.me) {
			difficulty = (2 - get.difficulty()) * 1.5;
		}
		if (from == to) {
			return 5 + difficulty;
		}
		if (from.isFriendOf(to)) {
			return 5 + difficulty;
		}
		// 使用势力集合判断
		if (from.identity == "unknown" && hasMatchingIdentity(from, to.identity)) {
			if (from.wontYe()) {
				return 4 + difficulty;
			}
		}
		var att = get.realAttitude(from, to, difficulty, tid);
		if (from.storage.zhibi && from.storage.zhibi.includes(to)) {
			return att;
		}
		if (to.ai.shown >= 0.5) {
			return att * to.ai.shown;
		}

		var nshown = 0;
		for (var i = 0; i < game.players.length; i++) {
			if (game.players[i] != from && game.players[i].identity == "unknown") {
				nshown++;
			}
		}
		if (to.ai.shown == 0) {
			if (nshown >= game.players.length / 2 && att >= 0) {
				return 0;
			}
			return Math.min(0, Math.random() - 0.5) + difficulty;
		}
		if (to.ai.shown >= 0.2) {
			if (att > 2) {
				return Math.max(0, Math.random() - 0.5) + difficulty;
			}
			if (att >= 0) {
				return 0;
			}
			return Math.min(0, Math.random() - 0.7) + difficulty;
		}
		if (att > 2) {
			return Math.max(0, Math.random() - 0.7) + difficulty;
		}
		if (att >= 0) {
			return Math.min(0, Math.random() - 0.3) + difficulty;
		}
		return Math.min(0, Math.random() - 0.5) + difficulty;
	}
}
