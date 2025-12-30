import { sort as testSort } from "./test.js";

const sortList = [testSort];
const sortMap = sortList.reduce((result, [id, translate]) => {
	result[id] = translate;
	return result;
}, {});

export default sortMap;
