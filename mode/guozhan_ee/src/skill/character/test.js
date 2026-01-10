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
};
