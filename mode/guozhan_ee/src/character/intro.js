import { intro as testIntro } from "./test.js";
import { intro as vibeIntro } from "./vibe.js";
import { intro as pokemonIntro } from "./pokemon.js";

export default {
	...testIntro,
	...vibeIntro,
	...pokemonIntro,
};
