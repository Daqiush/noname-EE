import test, { sort as testSort } from "./test.js";
import vibe, { sort as vibeSort } from "./vibe.js";
import pokemon, { sort as pokemonSort } from "./pokemon.js";

export default {
	[testSort]: Object.keys(test),
	[vibeSort]: Object.keys(vibe),
	[pokemonSort]: Object.keys(pokemon),
	// 谷爱凌
	// 野心家
	// 汉势力
	// 晋势力
};
