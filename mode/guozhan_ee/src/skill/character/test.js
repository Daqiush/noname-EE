import { lib, game, ui, get as _get, ai, _status } from "../../../../../noname.js";
import { cast } from "../../../../../noname/util/index.js";
import { GetGuozhan } from "../../patch/get.js";
import { PlayerGuozhan } from "../../patch/player.js";

/** @type {GetGuozhan}  */
const get = cast(_get);

/** @type {Record<string, Skill>} */
export default {
	// 从魏大秋蜀二的测试技能：造成10点伤害
	gz_daqiush2_kill: {
		enable: "phaseUse",
		usable: 10000,
		filterTarget: function (card, player, target) {
			return target !== player;
		},
		content: function () {
			target.damage(10);
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
