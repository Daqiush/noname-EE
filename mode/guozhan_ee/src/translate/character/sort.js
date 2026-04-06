import { sort as testSort } from "./test.js";
import { sort as vibeSort } from "./vibe.js";

const sortList = [testSort, vibeSort];
const sortMap = sortList.reduce((result, [id, translate]) => {
	result[id] = translate;
	return result;
}, {});

export default sortMap;
