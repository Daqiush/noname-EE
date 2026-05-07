import { Character } from "../../../../noname/library/element/index.js";

export default {
	gz_pokemon_eve: new Character({
		sex: "male",
		group: "han",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["weishen", "pokemon_daifa", "pokemon_zhili", "pokemon_rixin", "pokemon_weiyang", "pokemon_tanwei", "pokemon_xingjian", "pokemon_xinya"],
		hasSkinInGuozhan: true,
	}),
	gz_pokemon_pikachu: new Character({
		sex: "male",
		group: "qun",
		hp: 3,
		maxHp: 3,
		hujia: 0,
		skills: ["pokemon_zhaofu",],
		hasSkinInGuozhan: true,
	}),
	gz_pokemon_wobbuffet: new Character({
		sex: "male",
		group: "wei",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["pokemon_fengjing", "pokemon_mihu"],
		hasSkinInGuozhan: true,
	}),
	gz_pokemon_groudon: new Character({
		sex: "male",
		group: "shu",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["pokemon_yajian", "pokemon_niaoxiang"],
		hasSkinInGuozhan: true,
	}),
	gz_pokemon_meowscarada: new Character({
		sex: "female",
		group: "wu",
		hp: 4,
		maxHp: 4,
		hujia: 0,
		skills: ["pokemon_wanhua"],
		hasSkinInGuozhan: true,
	}),
	gz_pokemon_squirtle: new Character({
		sex: "male",
		group: "wei",
		hp: 3,
		maxHp: 3,
		hujia: 0,
		skills: ["pokemon_shuijian"],
		hasSkinInGuozhan: true,
	}),
};

export const intro = {
	gz_pokemon_eve: "伊布的外表看起来基于狐狸，全身的毛大部分为褐色。颈部周围与尾巴蓬松的奶油色的毛是它的特征。伊布的腿短而细，各长有三趾和粉色的爪垫。伊布有褐色的眼睛、像兔子一样的长耳朵和小小的黑鼻子。",
	gz_pokemon_pikachu: "皮卡丘是一只电气鼠，全身的皮毛都是黄色的，背上有两条褐色的条纹，尾巴是像锯齿状的闪电，与身体相接的部分也有一片褐色的皮毛。它有小小的嘴巴，以及黑色的眼睛，脸颊上有着红色的电力袋，长长的耳朵尖端是黑色的。它的前爪短而粗，有五趾，后爪则只有三趾。越是能制造出强大电流的皮卡丘，脸颊上的囊就越柔软，同时也越有伸展性。由于它脸颊上的袋子中储存了电能，触摸了之后会觉得麻麻的。它跑动的时候是用四条腿着地快速地奔跑，但是更多时候它是站立着的并用两只后脚走路。",
	gz_pokemon_wobbuffet: "果然翁有蓝色的身体和一个黑色的尾巴，尾巴上有看起来像一双眼睛的东西。它的上唇是锯齿状的，眼睛看起来像是紧眯着。它有一双扁平的手和四只粗短的脚，头上有类似带子的东西。雌性果然翁的嘴巴上有着看起来像口红的红色纹路。",
	gz_pokemon_groudon: "固拉多是一只全身被红色、片状皮肤包裹着的宝可梦。其身体的暗面呈现灰色，大型的尖刺从头部、躯干和尾部伸出。固拉多的每只手都长有四个爪子，四个推土机般的齿在其尾部末端翘起，每只足长有三个爪子，足底有灰色标记。它皮肤的接缝内也长有蓝色的尖刺，在固拉多积蓄力量时能被看到。原始固拉多的皮肤接缝呈现出熔岩状的橙黄色。在它的手臂根部的圆形部分上有一个“Ω”的图标样式，这个图样也出现在朱红色宝珠上。",
	gz_pokemon_meowscarada: "魔幻假面喵浅绿色的毛发覆盖了它的大部分身体，腿部则是深绿色的，身后还有一条毛茸茸的短尾巴。它有一双粉色眼睛，脸上有着的面具状的深绿色长毛。它的每只手上都有三根手指、绿色的指甲和粉红色的肉垫。它的脖子上有一个花瓣形状的粉色领子和斗篷相连。披风外侧的毛发是黑色的，而内侧则是绿色。",
	gz_pokemon_squirtle: "杰尼龟有一双紫红色的大眼睛，四肢均为三趾，尾巴呈小型波浪状。杰尼龟的身体呈浅蓝色，被坚硬的龟壳包裹，龟壳背部为褐色，腹部为浅黄色，两者之间有着白色的波浪型边缘。",
};

export const sort = "guozhan_ee_pokemon";
