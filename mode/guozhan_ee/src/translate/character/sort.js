import { sort as testSort } from "./test.js";
import { sort as vibeSort } from "./vibe.js";
import { sort as pokemonSort } from "./pokemon.js";

const sortList = [testSort, vibeSort, pokemonSort];
const sortMap = sortList.reduce((result, [id, translate]) => {
	result[id] = translate;
	return result;
}, {});

export default sortMap;
