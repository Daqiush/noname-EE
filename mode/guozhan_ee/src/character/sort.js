import vibe, { sort as vibeSort } from "./vibe.js";
import pokemon, { sort as pokemonSort } from "./pokemon.js";

import test, { sort as testSort } from "./test.js"; //保持test在最后

export default {
	[vibeSort]: Object.keys(vibe),
	[pokemonSort]: Object.keys(pokemon),

	[testSort]: Object.keys(test), //保持test在最后
	// 谷爱凌
	// 野心家
	// 汉势力
	// 晋势力
};
