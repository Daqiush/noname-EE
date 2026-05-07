import sort from "./sort.js";
import vibe from "./vibe.js";
import pokemon from "./pokemon.js";

import test from "./test.js"; //保持test在最后

export default {
	...sort,
	...vibe,
	...pokemon,

	...test, //保持test在最后
};
