import card from "./card/index.js";
import character from "./character/index.js";
import skill from "./skill/index.js";
import rest from "./rest.js";

export default {
	yexinjia_mark: "野心家",

	bumingzhi: "不明置",
	mingzhizhujiang: "明置主将",
	mingzhifujiang: "明置副将",
	tongshimingzhi: "同时明置",
	mode_guozhan_ee_character_config: "黄金战将",
	_zhenfazhaohuan: "阵法召唤",
	_zhenfazhaohuan_info: "由拥有阵法技的角色发起，满足此阵法技条件的未确定势力角色均可按逆时针顺序依次明置其一张武将牌(响应阵法召唤)，以发挥阵法技的效果。",

	// 组合势力翻译（副将有第二势力时使用，带势力颜色）
	// groupnature: qun="qun", shu="soil", wei="water", wu="wood"
	qun_shu: '<span data-nature="qun">群</span><span data-nature="soil">蜀</span>',
	qun_wei: '<span data-nature="qun">群</span><span data-nature="water">魏</span>',
	qun_wu: '<span data-nature="qun">群</span><span data-nature="wood">吴</span>',
	shu_wei: '<span data-nature="soil">蜀</span><span data-nature="water">魏</span>',
	shu_wu: '<span data-nature="soil">蜀</span><span data-nature="wood">吴</span>',
	wei_wu: '<span data-nature="water">魏</span><span data-nature="wood">吴</span>',

	...rest,
	...card,
	...character,
	...skill,
};

export { default as dynamic } from "./dynamic.js";
