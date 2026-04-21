import { lib, game, ui, get, ai, _status } from "../../noname.js";
import { pack, intro, sort } from "../../mode/guozhan_ee/src/character/index.js";

game.import("character", function () {
	return {
		name: "mode_guozhan_ee",
		connect: true,
		character: { ...pack },
		characterIntro: { ...intro },
		characterSort: {
			mode_guozhan_ee: sort,
		},
		translate: {
			mode_guozhan_ee_character_config: "黄金战将",
		},
	};
});
