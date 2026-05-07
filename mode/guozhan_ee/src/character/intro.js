import { intro as vibeIntro } from "./vibe.js";
import { intro as pokemonIntro } from "./pokemon.js";

import { intro as testIntro } from "./test.js"; //保持test在最后

export default {
	...vibeIntro,
	...pokemonIntro,
	...testIntro,
};
