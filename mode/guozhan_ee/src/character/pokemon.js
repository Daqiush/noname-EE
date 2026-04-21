import { Character } from "../../../../noname/library/element/index.js";

export default {
	gz_pokemon_yibu: new Character({
		sex: "male",
		group: "han",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["pokemon_weishen", "pokemon_daifa", "pokemon_zhili", "pokemon_rixin", "pokemon_weiyang", "pokemon_tanwei", "pokemon_xingjian", "pokemon_xinya"],
		hasSkinInGuozhan: true,
	}),
	gz_pokemon_guoranweng: new Character({
		sex: "male",
		group: "wei",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["pokemon_fengjing", "pokemon_mihu"],
		hasSkinInGuozhan: true,
	}),
};

export const intro = {
	gz_pokemon_yibu: "可随主将势力切换战斗风格的多面手，围绕主将变更、锦囊记录与牌序运营持续滚起资源优势。",
	gz_pokemon_guoranweng: '善用「还」牌预判来袭，以牌型博弈化被动为主动，并可于他人判定前精准介入。',
};

export const sort = "guozhan_ee_pokemon";
