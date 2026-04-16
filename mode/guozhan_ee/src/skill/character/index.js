import test from "./test.js";
import vibe from "./vibe.js";
import pokemon from "./pokemon.js";

import rest from "./rest.js";

export default {
	// 导入明置武将相关技能
	...test,
	...vibe,
	...pokemon,

	...rest,
};
