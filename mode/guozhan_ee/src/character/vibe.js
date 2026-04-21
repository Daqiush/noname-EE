import { Character } from "../../../../noname/library/element/index.js";

export default {
	gz_vibe_zhugeliang: new Character({
		sex: "male",
		group: "shu",
		hp: 3,
		maxHp: 3,
		hujia: 0,
		skills: ["vibe_zgl_huoji", "vibe_zgl_kanpo", "vibe_zgl_bazhen"],
		hasSkinInGuozhan: true,
	}),
	gz_vibe_zhaoyun: new Character({
		sex: "male",
		group: "shu",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["vibe_zhaoyun_longdan", "vibe_zhaoyun_yajiao"],
		hasSkinInGuozhan: true,
	}),
	gz_vibe_jiangqin: new Character({
		sex: "male",
		group: "wu",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["vibe_jiangqin_shangyi", "vibe_jiangqin_jianyi"],
		hasSkinInGuozhan: true,
	}),
	gz_vibe_bianfuren: new Character({
		sex: "female",
		group: "wei",
		hp: 3,
		maxHp: 3,
		hujia: 0,
		skills: ["vibe_bianfuren_yide", "vibe_bianfuren_cijie", "vibe_bianfuren_yuejian"],
		hasSkinInGuozhan: true,
	}),
	gz_vibe_zhuhuan: new Character({
		sex: "male",
		group: "wu",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["vibe_zhuhuan_jutian"],
		hasSkinInGuozhan: true,
	}),
	gz_vibe_xurong: new Character({
		sex: "male",
		group: "qun",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["vibe_xurong_shajue"],
		hasSkinInGuozhan: true,
	}),
	gz_vibe_mengda: new Character({
		sex: "male",
		group: "shu",
		majorSecondGroup: "wei",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["vibe_mengda_hubian", "vibe_mengda_chenzhong", "vibe_mengda_liangfan", "vibe_mengda_qiuan"],
		hasSkinInGuozhan: true,
	}),
};

export const intro = {
	gz_vibe_zhugeliang: "以转化与阵法见长的蜀势力智将，能够灵活改写火攻结算并通过明置技获取节奏优势。",
	gz_vibe_zhaoyun: "攻守一体的蜀将，凭借龙胆实现杀闪互转，并以涯角在回合内外获取补牌与干扰能力。",
	gz_vibe_jiangqin: "以情报与牌序操控为核心的吴将，通过尚义窥牌制衡，并可将装备手牌应急转化为关键牌。",
	gz_vibe_bianfuren: "强调同势力联动与保护的魏将，能够阻断友军误伤并在治疗链路中提供额外收益。",
	gz_vibe_zhuhuan: "擅长伤害后再分配牌差的吴将，可在同势力间实施压制或补牌，强化团队节奏。",
	gz_vibe_xurong: "以定点破手与决斗压制为核心的群将，对无手牌目标具有更高的斩杀威胁。",
	gz_vibe_mengda: "身处蜀魏之间的机变之将，受伤后可随时变更主将借势获牌，蜀势力下以众将投票决定杀的目标，魏势力下令友方投票择敌后拼点奇袭，野心家势力下可暴露野心搭配任意主将并灵活换位。",
};

export const sort = "guozhan_ee_vibe";
