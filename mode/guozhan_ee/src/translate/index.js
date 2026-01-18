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

	// 野心家带座次的 identity 翻译（前端统一显示为"野"）
	"0_ye": "野",
	"1_ye": "野",
	"2_ye": "野",
	"3_ye": "野",
	"4_ye": "野",
	"5_ye": "野",
	"6_ye": "野",
	"7_ye": "野",
	"8_ye": "野",
	"9_ye": "野",
	"10_ye": "野",
	"11_ye": "野",

	han: "汉",
	mahjong: "雀",
	jin: "晋",

	// 组合势力翻译（副将有第二势力时使用，带势力颜色）
	// groupnature: qun="qun", shu="soil", wei="water", wu="wood", ye="thunder"(野心家用紫色)
	qun_shu: '<span data-nature="qun">群</span><span data-nature="soil">蜀</span>',
	qun_wei: '<span data-nature="qun">群</span><span data-nature="water">魏</span>',
	qun_wu: '<span data-nature="qun">群</span><span data-nature="wood">吴</span>',
	shu_wei: '<span data-nature="soil">蜀</span><span data-nature="water">魏</span>',
	shu_wu: '<span data-nature="soil">蜀</span><span data-nature="wood">吴</span>',
	wei_wu: '<span data-nature="water">魏</span><span data-nature="wood">吴</span>',
	
	// 野心家与其他势力的组合翻译（野心家用 thunder 紫色）
	qun_ye: '<span data-nature="qun">群</span><span data-nature="thunder">野</span>',
	shu_ye: '<span data-nature="soil">蜀</span><span data-nature="thunder">野</span>',
	wei_ye: '<span data-nature="water">魏</span><span data-nature="thunder">野</span>',
	wu_ye: '<span data-nature="wood">吴</span><span data-nature="thunder">野</span>',
	han_ye: '<span data-nature="metal">汉</span><span data-nature="thunder">野</span>',
	ye_qun: '<span data-nature="thunder">野</span><span data-nature="qun">群</span>',
	ye_shu: '<span data-nature="thunder">野</span><span data-nature="soil">蜀</span>',
	ye_wei: '<span data-nature="thunder">野</span><span data-nature="water">魏</span>',
	ye_wu: '<span data-nature="thunder">野</span><span data-nature="wood">吴</span>',
	ye_han: '<span data-nature="thunder">野</span><span data-nature="metal">汉</span>',

	...rest,
	...card,
	...character,
	...skill,
};

export { default as dynamic } from "./dynamic.js";
