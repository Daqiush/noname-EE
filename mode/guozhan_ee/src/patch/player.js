import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import { GameEvent, Dialog, Player } from "../../../../noname/library/element/index.js";

/**
 * 判断 identity 是否为野心家
 * @param {string} identity 
 * @returns {boolean}
 */
export function isYeIdentity(identity) {
	return identity === "ye" || (typeof identity === "string" && identity.endsWith("_ye"));
}

export class PlayerGuozhan extends Player {
	/**
	 * @type {string}
	 */
	trueIdentity;

	/**
	 * 获取此玩家的野心家 identity（带座次）
	 * @returns {string} 格式为 "座次_ye"，如 "1_ye"
	 */
	getYeIdentity() {
		return `${this.getSeatNum()}_ye`;
	}

	/**
	 * 判断此玩家是否为野心家
	 * @returns {boolean}
	 */
	isYe() {
		return isYeIdentity(this.identity);
	}

	/**
	 * 获取玩家的势力
	 *
	 * @param { number } [num = 0] - 根据哪张武将牌返回势力，`0`为主将，`1`为副将（默认为0）
	 * @returns { string }
	 */
	getGuozhanGroup(num = 0) {
		if (this.trueIdentity) {
			const group = lib.character[this[num == 1 ? "name2" : "name1"]][1];
			if (num != 2 && lib.selectGroup.includes(group)) {
				return group;
			}
			if (lib.character[this.name1][1] != "ye" || num == 1) {
				return this.trueIdentity;
			}
			return "ye";
		}
		if (get.is.double(this.name2)) {
			return lib.character[this.name1].group;
		}
		if (num == 1) {
			return lib.character[this.name2].group;
		}
		if (num == 2 && lib.selectGroup.includes(lib.character[this.name1][1])) {
			return lib.character[this.name2].group;
		}
		return lib.character[this.name1].group;
	}

	/**
	 * 获取玩家当前所属的势力集合
	 * 
	 * 势力集合机制：
	 * - 每个角色所属的势力是一个集合，可以包含多个元素
	 * - 单独明置双势力副将时，暂时同时属于两个势力（集合有两个元素）
	 * - 单独明置汉朝副将时，暂时只属于汉势力（集合只有一个元素）
	 * - 身份为 "unknown" 时返回空数组
	 * - 身份为 "ye" 时返回"x号野心家"，其中若非建国则"x号"为座次，若为建国加入者则为建国者座次
	 * - 双势力中部分为野心家时（如"野&魏"），只返回非野心家的势力部分
	 * 
	 * @returns { string[] } 势力集合
	 */
	getIdentities() {
		// 未确定势力
		if (this.identity === "unknown") {
			return [];
		}

		// 完全野心家（identity 为 "x_ye" 格式或 "ye"）
		if (this.isYe()) {
			if (!this.getStorage("yexinjia_friend").length) {
				// 单独野心家，返回带座次的野心家标识
				return [this.identity];
			} else {
				// 有建国者的野心家
				return this.getStorage("yexinjia_friend").map(friend => friend.identity);
			}
		}
		
		// 如果是临时使用副将势力的情况（_viceGroupTemp 为 true）
		if (this._viceGroupTemp) {
			// 直接从 lib.character 获取，确保获取到 Character 实例的属性
			const viceInfo = lib.character[this.name2];
			const viceGroup = viceInfo?.group;
			
			if (viceGroup === "han") {
				// 汉朝副将只属于汉势力
				return ["han"];
			} else if (this._viceSecondGroup === "ye") {
				// 有部分势力变成野心家
				if (this._validGroup) {
					// 第一势力超标，返回有效的第二势力
					return [this._validGroup];
				} else {
					// 第二势力超标，返回有效的第一势力
					return [viceGroup];
				}
			} else if (this._viceSecondGroup) {
				// 正常双势力
				return [viceGroup, this._viceSecondGroup];
			} else {
				// 普通单势力副将
				return [viceGroup];
			}
		}
		
		// 正常情况，势力集合只包含一个 identity
		return [this.identity];
	}

	/**
	 * 判断两个角色的势力集合是否有交集
	 * 
	 * @param { Player } target 判断对象
	 * @returns { boolean } 势力集合是否有交集
	 */
	hasCommonIdentity(target) {
		const myIdentities = this.getIdentities();
		const targetIdentities = target.getIdentities();
		
		// 任一方为空集合，则无交集
		if (myIdentities.length === 0 || targetIdentities.length === 0) {
			return false;
		}
		
		// 检查是否有交集
		return myIdentities.some(id => targetIdentities.includes(id));
	}

	/**
	 * 判断此角色是否属于指定势力
	 * 
	 * @param { string } group 势力名称
	 * @returns { boolean } 是否属于该势力
	 */
	hasIdentity(group) {
		return this.getIdentities().includes(group);
	}

	/**
	 * 重新计算角色的势力
	 * 
	 * 根据当前武将的明置状态重新计算势力：
	 * - 两将均暗置：identity 为 "unknown"
	 * - 仅主将明置：以主将势力为准
	 * - 仅副将明置：以副将势力为准（双势力副将同时属于两个势力，汉朝副将只属于汉）
	 * - 两将均明置：以主将势力为准
	 * 
	 * 野心家逻辑（双势力支持）：
	 * - 双势力副将单亮时，每个势力分别判断是否超过阈值
	 * - 如果某势力超标，该势力变成野心家，另一个势力可能仍然有效
	 * - 例如：魏&蜀副将单亮，如果蜀超标但魏不超标，则为"野&魏"
	 * - 主将明置后，以主将势力为准（如果之前已成为野心家，则保持野心家身份）
	 * 
	 * 野心家身份清除逻辑：
	 * - 当暗置主将后仅副将明置时，如果副将势力不包含之前导致成为野心家的势力，则清除野心家标记
	 * - 例如：主将蜀副将汉，因蜀满员成为野心家后，暗置主将变成汉朝，此时野心家标记被清除
	 * - 再次明置主将时，重新判断蜀国是否满员
	 */
	recalculateIdentity() {
		const mainUnseen = this.isUnseen(0);
		const viceUnseen = this.isUnseen(1);
		
		// 两将均暗置
		if (mainUnseen && viceUnseen) {
			// 清除临时势力标记和野心家标记
			delete this._viceGroupTemp;
			delete this._viceSecondGroup;
			delete this._confirmedYe; // 已确认的野心家身份
			delete this._confirmedYeGroup; // 导致成为野心家的势力
			delete this._exposedYeGroups; // 清除所有暴露野心的记录
			delete this._validGroup; // 有效势力标记
			// 设为未确定
			this.identity = "unknown";
			this.group = "unknown";
			this.ai.shown = 0;
			this.setIdentity("unknown");
			this.node.identity.classList.add("guessing");
			return;
		}
		
		// 仅副将明置
		if (mainUnseen && !viceUnseen) {
			// 直接从 lib.character 获取，确保获取到 Character 实例的属性
			const viceInfo = lib.character[this.name2];
			const viceGroup = viceInfo?.group;
			// majorSecondGroup：副将的第二势力，禁止此武将作为主将使用
			// minorSecondGroup：副将的第二势力，不禁止作为主将使用（作为主将时忽略此标签）
			const viceSecondGroup = viceInfo?.majorSecondGroup || viceInfo?.minorSecondGroup;
			
			// DEBUG: 输出双势力信息
			console.log(`[recalculateIdentity] name2=${this.name2}, viceGroup=${viceGroup}, majorSecondGroup=${viceInfo?.majorSecondGroup}, minorSecondGroup=${viceInfo?.minorSecondGroup}, viceSecondGroup=${viceSecondGroup}`);
			
			// 副将势力集合
			const viceGroups = [viceGroup];
			if (viceSecondGroup) {
				viceGroups.push(viceSecondGroup);
			}
			
			// 清除不在副将势力中的暴露野心记录
			// 只有副将势力不包含某个暴露势力时，才能清除该势力的暴露记录
			if (this._exposedYeGroups && this._exposedYeGroups.length > 0) {
				this._exposedYeGroups = this._exposedYeGroups.filter(g => viceGroups.includes(g));
				if (this._exposedYeGroups.length === 0) {
					delete this._exposedYeGroups;
				}
				console.log(`[recalculateIdentity] 更新后的暴露野心记录: [${this._exposedYeGroups?.join(", ") || "无"}]`);
			}
			
			// 检查是否需要清除当前野心家标记
			// 如果之前因某势力成为野心家，但副将势力不包含该势力，则清除野心家标记
			if (this._confirmedYe && this._confirmedYeGroup) {
				// 如果副将势力不包含导致成为野心家的势力，清除野心家标记
				if (!viceGroups.includes(this._confirmedYeGroup)) {
					console.log(`[recalculateIdentity] 副将势力 [${viceGroups.join(", ")}] 不包含野心家势力 ${this._confirmedYeGroup}，清除野心家标记`);
					delete this._confirmedYe;
					delete this._confirmedYeGroup;
				}
			}
			
			this._viceGroupTemp = true;
			
			if (viceGroup === "han") {
				// 汉朝副将只属于汉势力
				this.group = "han";
				delete this._viceSecondGroup;
				// 汉势力只计入汉，判断是否野心家
				if (this.wontYe("han")) {
					this.identity = "han";
				} else {
					this.identity = this.getYeIdentity();
					this._confirmedYe = true;
					this._confirmedYeGroup = "han";
					this.exposeYeToGroup("han");
				}
			} else if (viceSecondGroup) {
				// 双势力副将，分别判断每个势力
				const group1 = viceGroup;
				const group2 = viceSecondGroup;
				const group1WontYe = this.wontYe(group1);
				const group2WontYe = this.wontYe(group2);
				
				if (group1WontYe && group2WontYe) {
					// 两个势力都不超标，正常双势力
					const groups = [group1, group2].sort();
					this.group = groups.join("_");
					this._viceSecondGroup = group2;
					this.identity = group1; // 主势力作为 identity
					console.log(`[recalculateIdentity] 双势力设置: group=${this.group}, identity=${this.identity}, _viceSecondGroup=${this._viceSecondGroup}`);
				} else if (group1WontYe && !group2WontYe) {
					// 第二势力超标变野心家，第一势力有效
					const groups = [group1, "ye"].sort();
					this.group = groups.join("_");
					this._viceSecondGroup = "ye"; // 第二势力变成野心家
					this.identity = group1;
					this._confirmedYe = true;
					this._confirmedYeGroup = group2; // 记录是哪个势力导致成为野心家
					this.exposeYeToGroup(group2);
				} else if (!group1WontYe && group2WontYe) {
					// 第一势力超标变野心家，第二势力有效
					const groups = [group2, "ye"].sort();
					this.group = groups.join("_");
					this._viceSecondGroup = "ye"; // 第一势力变成野心家，用ye标记
					this._validGroup = group2; // 保存有效的势力
					this.identity = group2;
					this._confirmedYe = true;
					this._confirmedYeGroup = group1; // 记录是哪个势力导致成为野心家
					this.exposeYeToGroup(group1);
				} else {
					// 两个势力都超标，完全成为野心家
					this.group = "ye";
					delete this._viceSecondGroup;
					this.identity = this.getYeIdentity();
					this._confirmedYe = true;
					// 两个势力都导致野心家，记录主势力
					this._confirmedYeGroup = group1;
					this.exposeYeToGroup(group1);
					this.exposeYeToGroup(group2);
				}
						} else {
				// 普通单势力副将
				if (this.wontYe(viceGroup)) {
					this.group = viceGroup;
					this.identity = viceGroup;
					console.log(`[recalculateIdentity] 单势力非野心家: viceGroup=${viceGroup}, group=${this.group}, identity=${this.identity}`);
				} else {
					this.group = "ye";  // 成为野心家，group 也变成 ye
					this.identity = this.getYeIdentity();
					this._confirmedYe = true;
					this._confirmedYeGroup = viceGroup; // 记录是哪个势力导致成为野心家
					this.exposeYeToGroup(viceGroup);
					console.log(`[recalculateIdentity] 单势力野心家: viceGroup=${viceGroup}, group=${this.group}, identity=${this.identity}`);
				}
				delete this._viceSecondGroup;
			}
			
			console.log(`[recalculateIdentity] 设置 setIdentity 之前: group=${this.group}, identity=${this.identity}`);
			this.setIdentity(this.identity);
			this.ai.shown = 1;
			return;
		}
		
		// 主将明置（无论副将是否明置，都以主将势力为准）
		if (!mainUnseen) {
			// 清除临时势力标记
			delete this._viceGroupTemp;
			delete this._viceSecondGroup;
			delete this._validGroup;
			
			const mainGroup = this.getGuozhanGroup(0);
			
			// 保存之前的野心家信息，用于判断是否保持野心家身份
			const wasConfirmedYe = this._confirmedYe;
			const wasConfirmedYeGroup = this._confirmedYeGroup;
			
			// 清除野心家标记，准备重新判断主将势力
			// （如果主将势力也超标，会重新设置；如果不超标，则不再是野心家）
			delete this._confirmedYe;
			delete this._confirmedYeGroup;
			
			// 清除与主将势力不同的暴露野心记录
			// 例如：AB双势力副将对A暴露野心后，明置B势力主将，则清除对A的暴露记录
			if (this._exposedYeGroups && this._exposedYeGroups.length > 0) {
				this._exposedYeGroups = this._exposedYeGroups.filter(g => g === mainGroup);
				if (this._exposedYeGroups.length === 0) {
					delete this._exposedYeGroups;
				}
				console.log(`[recalculateIdentity] 主将明置后更新暴露野心记录: [${this._exposedYeGroups?.join(", ") || "无"}]`);
			}
			
			// 设置 identity 和 group
			if (lib.character[this.name1][1] === "ye") {
				// 主将本身就是野心家势力
				this.group = "ye";
				this.identity = this.getYeIdentity();
			} else if (wasConfirmedYe && wasConfirmedYeGroup === mainGroup) {
				// 之前已经确认为野心家，且是因为同一势力，保持野心家身份
				this.group = "ye";
				this.identity = this.getYeIdentity();
				this._confirmedYe = true;
				this._confirmedYeGroup = mainGroup;
			} else if (get.is.jun(this.name1) && this.isAlive()) {
				// 君主
				this.group = mainGroup;
				this.identity = this.group;
			} else if (this.wontYe(mainGroup)) {
				// 正常势力
				this.group = mainGroup;
				this.identity = this.group;
			} else {
				// 主将势力超标，成为野心家
				this.group = "ye";
				this.identity = this.getYeIdentity();
				this._confirmedYe = true;
				this._confirmedYeGroup = mainGroup; // 记录是哪个势力导致成为野心家
				this.exposeYeToGroup(mainGroup);
			}
			
			console.log(`[recalculateIdentity] 主将明置: mainGroup=${mainGroup}, group=${this.group}, identity=${this.identity}, _confirmedYe=${this._confirmedYe}, _confirmedYeGroup=${this._confirmedYeGroup}`);
			this.setIdentity(this.identity);
			this.ai.shown = 1;
			return;
		}
	}

	/**
	 * 判断是否为友方（基于势力集合交集）
	 * 
	 * @param { Player } target 判断对象
	 * @returns { boolean }
	 */
	isFriendOf(target) {
		// 自己是自己的友方
		if (this === target) {
			return true;
		}
		
		// 野心家建国情况
		if (this.getStorage("yexinjia_friend").includes(target) || target.getStorage("yexinjia_friend").includes(this)) {
			return true;
		}
		
		// 任一方身份未确定
		if (this.identity === "unknown" || target.identity === "unknown") {
			return false;
		}
		
		// 野心家判断：每个野心家是独立的势力
		if (this.isYe() || target.isYe()) {
			// 使用势力集合交集判断（野心家的 identity 互相不同）
			return this.hasCommonIdentity(target);
		}
		
		// 使用势力集合交集判断
		return this.hasCommonIdentity(target);
	}

	/**
	 * 判断是否为敌方
	 * 
	 * @param { Player } target 判断对象
	 * @returns { boolean }
	 */
	isEnemyOf(target) {
		return !this.isFriendOf(target);
	}

	/**
	 * 设置身份显示（覆盖基类方法以支持野心家座次格式和双势力显示）
	 * 
	 * @param {string} [identity] 身份标识
	 * @param {string} [nature] 颜色标识
	 * @returns {this}
	 */
	setIdentity(identity, nature) {
		if (!identity) {
			identity = this.identity;
		}
		console.log(`[setIdentity] 入参 identity=${identity}, nature=${nature}, this.group=${this.group}`);
		if (get.is.jun(this)) {
			this.node.identity.firstChild.innerHTML = "君";
		} else {
			// 野心家显示"野"
			if (isYeIdentity(identity)) {
				this.node.identity.firstChild.innerHTML = "野";
			} else {
				// 优先显示 group（支持双势力如 "shu_wei"），其次显示 identity
				const displayGroup = this.group && this.group !== "unknown" ? this.group : identity;
				console.log(`[setIdentity] displayGroup=${displayGroup}, translation=${get.translation(displayGroup)}`);
				this.node.identity.firstChild.innerHTML = get.translation(displayGroup);
			}
		}
		// 对于 "x_ye" 格式的野心家身份，颜色使用 "ye"
		let color = nature || identity;
		if (isYeIdentity(identity)) {
			color = nature || "ye";
		}
		this.node.identity.dataset.color = color;
		return this;
	}

	/**
	 * 选择军令
	 *
	 * @param { Player } target 执行军令的对象
	 * @returns
	 */
	chooseJunlingFor(target) {
		const next = game.createEvent("chooseJunlingFor");

		// @ts-expect-error 类型就是这么写的
		next.player = this;
		next.target = target;
		next.num = 2;

		// @ts-expect-error 类型就是这么写的
		next.setContent("chooseJunlingFor");

		return next;
	}

	/**
	 * 选择是否执行军令
	 *
	 * @param { Player } source 军令发起者
	 * @param { string } junling 军令内容
	 * @param { Player[] } targets 军令效果的对象
	 * @returns
	 */
	chooseJunlingControl(source, junling, targets) {
		const next = game.createEvent("chooseJunlingControl");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		next.source = source;
		// @ts-expect-error 类型就是这么写的
		next.junling = junling;
		if (targets.length) {
			next.targets = targets;
		}
		// @ts-expect-error 类型就是这么写的
		next.setContent("chooseJunlingControl");
		return next;
	}

	/**
	 * 执行军令
	 *
	 * @param { Player } source 军令发起者
	 * @param { string } junling 军令内容
	 * @param { Player[] } targets 军令效果的对象
	 * @returns
	 */
	carryOutJunling(source, junling, targets) {
		const next = game.createEvent("carryOutJunling");
		next.source = source;
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		if (targets.length) {
			next.targets = targets;
		}
		// @ts-expect-error 类型就是这么写的
		next.junling = junling;
		// @ts-expect-error 类型就是这么写的
		next.setContent("carryOutJunling");
		return next;
	}

	/**
	 * 选择变更副将
	 *
	 * @param { boolean } [repeat] 是否强制变更，且当前变更副将技能不计入变更记录
	 * @param { "hidden" } [hidden] 是否暗置变更后的副将，若为`"hidden"`则暗置
	 * @returns
	 */
	mayChangeVice(repeat, hidden) {
		if (!this.playerid) {
			return;
		}
		const changedSkills = Reflect.get(_status, "changedSkills") ?? {};
		Reflect.set(_status, "changedSkills", changedSkills);
		const skill = _status.event?.name;
		if (repeat || !changedSkills[this.playerid] || !changedSkills[this.playerid].includes(skill)) {
			var next = game.createEvent("mayChangeVice");
			// @ts-expect-error 类型就是这么写的
			next.setContent("mayChangeVice");
			// @ts-expect-error 类型就是这么写的
			next.player = this;
			next.skill = skill;
			if (repeat || (!_status.connectMode && get.config("changeViceType") == "online")) {
				// @ts-expect-error 类型就是这么写的
				next.repeat = true;
			}
			if (hidden == "hidden") {
				// @ts-expect-error 类型就是这么写的
				next.hidden = true;
			}
			return next;
		}
	}

	// 后面摆了，相信后人的智慧

	/**
	 * 判断是否“不是”队友
	 *
	 * @param { Player } target 判断对象
	 * @param { boolean } [shown] 考虑自身身份已明确的情况
	 * @returns { boolean }
	 */
	differentIdentityFrom(target, shown) {
		// @ts-expect-error 类型就是这么写的
		if (this == target) {
			return false;
		}
		//野心家建国情况
		if (this.getStorage("yexinjia_friend").includes(target)) {
			return false;
		}
		if (target.getStorage("yexinjia_friend").includes(this)) {
			return false;
		}
		if (shown) {
			if (target.identity == "unknown") {
				return false;
			}
			if (isYeIdentity(target.identity) || this.isYe()) {
				return true;
			}
			if (this.identity == "unknown") {
				var identity = lib.character[this.name1][1];
				if (this.wontYe()) {
					// 使用势力集合判断
					const targetIdentities = target.getIdentities();
					return !targetIdentities.includes(identity);
				}
				return true;
			}
		} else {
			if (this.identity == "unknown" || target.identity == "unknown") {
				return false;
			}
			if (this.isYe() || isYeIdentity(target.identity)) {
				return true;
			}
		}
		// 使用势力集合无交集判断
		return !this.hasCommonIdentity(target);
	}

	/**
	 * 判断是否“是”队友
	 *
	 * @param { Player } target 判断对象
	 * @param { boolean } [shown] 考虑自身身份已明确的情况
	 * @returns { boolean }
	 */
	sameIdentityAs(target, shown) {
		if (this.getStorage("yexinjia_friend").includes(target)) {
			return true;
		}
		if (target.getStorage("yexinjia_friend").includes(this)) {
			return true;
		}
		if (shown) {
			if (this.isYe() || this.identity == "unknown") {
				return false;
			}
		} else {
			// @ts-expect-error 类型就是这么写的
			if (this == target) {
				return true;
			}
			if (target.identity == "unknown" || isYeIdentity(target.identity) || this.isYe()) {
				return false;
			}
			if (this.identity == "unknown") {
				var identity = lib.character[this.name1][1];
				if (this.wontYe()) {
					// 使用势力集合判断
					const targetIdentities = target.getIdentities();
					return targetIdentities.includes(identity);
				}
				return false;
			}
		}
		// 使用势力集合有交集判断
		return this.hasCommonIdentity(target);
	}

	/**
	 * 判断玩家亮将情况
	 *
	 * @returns { object }
	 */
	getModeState() {
		return {
			unseen: this.isUnseen(0),
			unseen2: this.isUnseen(1),
		};
	}

	/**
	 * 设置玩家信息（主副将名称、身份）
	 *
	 * @param { object } info
	 */
	setModeState(info) {
		if (info.mode.unseen) {
			this.classList.add("unseen");
		}
		if (info.mode.unseen2) {
			this.classList.add("unseen2");
		}
		if (!info.name) {
			return;
		}
		// if(info.name.indexOf('unknown')==0){
		// 	if(this==game.me){
		// 		lib.translate[info.name]+='（你）';
		// 	}
		// }
		this.init(info.name1, info.name2, false);
		this.name1 = info.name1;
		this.name = info.name;
		this.node.name_seat = ui.create.div(".name.name_seat", get.verticalStr(lib.translate[this.name].slice(0, 3)), this);
		if (info.identityShown) {
			this.setIdentity(info.identity);
			this.node.identity.classList.remove("guessing");
			// @ts-expect-error 类型就是这么写的
		} else if (this != game.me) {
			// @ts-expect-error 类型就是这么写的
			this.node.identity.firstChild.innerHTML = "猜";
			this.node.identity.dataset.color = "unknown";
			this.node.identity.classList.add("guessing");
		}
	}
	dieAfter2(source) {
		var that = this;
		if (that.hasSkillTag("noDieAfter", null, source)) {
			return;
		}
		if (source && source.hasSkillTag("noDieAfter2", null, that)) {
			return;
		}
		if (source && source.shijun) {
			source.discard(source.getCards("he"));
			delete source.shijun;
		} else if (source && source.identity != "unknown") {
			if (isYeIdentity(source.identity) && !source.getStorage("yexinjia_friend").length) {
				source.draw(3);
			} else if (source.shijun2) {
				delete source.shijun2;
				source.draw(
					1 +
						game.countPlayer(function (current) {
							return current.group == that.group;
						})
				);
			} else if (isYeIdentity(that.identity)) {
				if (that.getStorage("yexinjia_friend").includes(source) || source.getStorage("yexinjia_friend").includes(that)) {
					source.discard(source.getCards("he"));
				} else {
					source.draw(
						1 +
							game.countPlayer(function (current) {
								// @ts-expect-error 类型就是这么写的
								if (current == that) {
									return false;
								}
								if (current.getStorage("yexinjia_friend").includes(that)) {
									return true;
								}
								if (that.getStorage("yexinjia_friend").includes(current)) {
									return true;
								}
								return false;
							})
					);
				}
			} else if (!source.hasCommonIdentity(that)) {
				// 不同势力（使用势力集合判断，支持双势力副将）
				source.draw(get.population(that.identity) + 1);
			} else {
				// 同势力
				source.discard(source.getCards("he"));
			}
		}
	}
	dieAfter(source) {
		this.showCharacter(2);
		if (get.is.jun(this.name1)) {
			if (source && source.identity == this.identity) {
				source.shijun = true;
			} else if (source && !isYeIdentity(source.identity)) {
				source.shijun2 = true;
			}
			var yelist = [];
			/** @type {string[]} */
			var yeIdentities = [];
			for (var i = 0; i < game.players.length; i++) {
				if (game.players[i].identity == this.identity) {
					yelist.push(game.players[i]);
					// 每个玩家获取自己的野心家身份（带座次）
					yeIdentities.push(game.players[i].getYeIdentity ? game.players[i].getYeIdentity() : `${game.players[i].getSeatNum()}_ye`);
				}
			}
			// @ts-expect-error 类型就是这么写的
			game.broadcastAll(function (list, identities) {
				for (var i = 0; i < list.length; i++) {
					list[i].identity = identities[i];
					list[i].setIdentity();
				}
			}, yelist, yeIdentities);
			// @ts-expect-error 类型就是这么写的
			_status.yeidentity.add(this.identity);
		}
		// @ts-expect-error 类型就是这么写的
		game.tryResult();
	}

	/**
	 * 查看一名角色的主副将
	 *
	 * @param { Player } target 查看对象
	 * @param { number } [num] - 查看哪张武将牌，`0`为主将，`1`为副将，`2`为全部（默认为2）
	 */
	viewCharacter(target, num) {
		if (num != 0 && num != 1) {
			num = 2;
		}
		if (!target.isUnseen(num)) {
			return;
		}
		var next = game.createEvent("viewCharacter");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		next.target = target;
		next.num = num;
		next.setContent(function () {
			// @ts-expect-error 类型就是这么写的
			if (!player.storage.zhibi) {
				// @ts-expect-error 类型就是这么写的
				player.storage.zhibi = [];
			}
			// @ts-expect-error 类型就是这么写的
			player.storage.zhibi.add(target);
			var content,
				str = get.translation(target) + "的";
			// @ts-expect-error 类型就是这么写的
			if (event.num == 0 || !target.isUnseen(1)) {
				content = [str + "主将", [[target.name1], "character"]];
				// @ts-expect-error 类型就是这么写的
				game.log(player, "观看了", target, "的主将");
				// @ts-expect-error 类型就是这么写的
			} else if (event.num == 1 || !target.isUnseen(0)) {
				content = [str + "副将", [[target.name2], "character"]];
				// @ts-expect-error 类型就是这么写的
				game.log(player, "观看了", target, "的副将");
			} else {
				content = [str + "主将和副将", [[target.name1, target.name2], "character"]];
				// @ts-expect-error 类型就是这么写的
				game.log(player, "观看了", target, "的主将和副将");
			}
			// @ts-expect-error 类型就是这么写的
			player.chooseControl("ok").set("dialog", content);
		});
	}

	/**
	 * 判断副将技是否生效
	 *
	 * @param { string } skill 要判断的技能
	 * @param { false } [disable] 是否失效该技能，若为`false`则失效
	 */
	checkViceSkill(skill, disable) {
		if (game.expandSkills(lib.character[this.name2][3].slice(0)).includes(skill) || this.hasSkillTag("alwaysViceSkill")) {
			return true;
		} else {
			if (disable !== false) {
				this.awakenSkill(skill);
			}
			return false;
		}
	}
	/**
	 * 判断主将技是否生效
	 *
	 * @param { string } skill 要判断的技能
	 * @param { false } [disable] 是否失效该技能，若为`false`则失效
	 */
	checkMainSkill(skill, disable) {
		if (game.expandSkills(lib.character[this.name1][3].slice(0)).includes(skill) || this.hasSkillTag("alwaysMainSkill")) {
			return true;
		} else {
			if (disable !== false) {
				this.awakenSkill(skill);
			}
			return false;
		}
	}

	/**
	 * 减少玩家体力上限，不触发相关时机
	 *
	 * @param { number } [num] 减少的数值，默认为1
	 */
	removeMaxHp(num) {
		if (game.online) {
			return;
		}
		if (!num) {
			num = 1;
		}
		while (num > 0) {
			num--;
			if (typeof this.singleHp == "boolean") {
				if (this.singleHp) {
					this.singleHp = false;
				} else {
					this.singleHp = true;
					this.maxHp--;
				}
			} else {
				this.maxHp--;
			}
		}
		this.update();
	}

	/**
	 * 暗置武将
	 *
	 * @param { number } num - 暗置哪张武将牌，`0`为主将，`1`为副将
	 * @param { boolean } [log] 是否log信息
	 * @returns
	 */
	hideCharacter(num, log) {
		if (this.isUnseen(2)) {
			return;
		}
		var name = this["name" + (num + 1)];
		var next = game.createEvent("hideCharacter");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		// @ts-expect-error 类型就是这么写的
		next.toHide = name;
		next.num = num;
		// @ts-expect-error 类型就是这么写的
		next.log = log;
		// @ts-expect-error 类型就是这么写的
		next.setContent("hideCharacter");
		return next;
	}

	/**
	 * 移去武将牌（变成士兵）
	 *
	 * @param { number } num - 移去哪张武将牌，`0`为主将，`1`为副将
	 * @returns
	 */
	removeCharacter(num) {
		var name = this["name" + (num + 1)];
		var next = game.createEvent("removeCharacter");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		// @ts-expect-error 类型就是这么写的
		next.toRemove = name;
		next.num = num;
		next.setContent("removeCharacter");
		return next;
	}
	$removeCharacter(num) {
		var name = this["name" + (num + 1)];
		var info = lib.character[name];
		if (!info) {
			return;
		}
		var to = "gz_shibing" + (info[0] == "male" ? 1 : 2) + info[1];
		game.log(this, "移除了" + (num ? "副将" : "主将"), "#b" + name);
		if (!lib.character[to]) {
			// @ts-expect-error 类型就是这么写的
			lib.character[to] = [info[0], info[1], 0, [], [`character:${to.slice(3, 11)}`, "unseen"]];
			lib.translate[to] = `${get.translation(info[1])}兵`;
		}
		this.reinit(name, to, false);
		this.showCharacter(num, false);
		// @ts-expect-error 类型就是这么写的
		_status.characterlist.add(name);
	}

	/**
	 * 替换武将牌
	 * 
	 * @param { number } num - 替换哪张武将牌，`0`为主将，`1`为副将
	 * @param { string } characterName - 替换成的武将名称
	 * @param { boolean } [hidden] - 是否暗置替换后的武将
	 * @returns { GameEvent | undefined }
	 */
	replaceCharacter(num, characterName, hidden) {
		if (!lib.character[characterName]) {
			console.warn(`replaceCharacter: 武将 "${characterName}" 不存在`);
			return;
		}
		var next = game.createEvent("replaceCharacter");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		next.num = num;
		// @ts-expect-error 类型就是这么写的
		next.characterName = characterName;
		if (hidden) {
			// @ts-expect-error 类型就是这么写的
			next.hidden = true;
		}
		// @ts-expect-error 类型就是这么写的
		next.setContent("replaceCharacter");
		return next;
	}

	/**
	 * 变更副将
	 *
	 * @param { boolean } [hidden] 是否暗置变更后的副将
	 * @returns
	 */
	changeVice(hidden) {
		var next = game.createEvent("changeVice");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		// @ts-expect-error 类型就是这么写的
		next.setContent("changeVice");
		next.num = !_status.connectMode && get.config("changeViceType") == "online" ? 1 : 3;
		if (hidden) {
			// @ts-expect-error 类型就是这么写的
			next.hidden = true;
		}
		return next;
	}

	/**
	 * 与一名角色的主副将进行易位
	 *
	 * @param { Player } target 要交换武将的对象
	 * @param { number } [num1=2]  - 自己要易位的武将牌，`1`为主将，`2`为副将（默认为2）
	 * @param { number } [num2=num1] - 交换对象要易位的武将牌，`1`为主将，`2`为副将（默认与前一个参数相同）
	 * @returns
	 */
	transCharacter(target, num1 = 2, num2 = num1) {
		var next = game.createEvent("transCharacter");
		// @ts-expect-error 类型就是这么写的
		next.player = this;
		next.target = target;
		// @ts-expect-error 类型就是这么写的
		next.num1 = num1;
		// @ts-expect-error 类型就是这么写的
		next.num2 = num2;
		// @ts-expect-error 类型就是这么写的
		next.setContent("transCharacter");
		return next;
	}
	/**
	 * 玩家是否有主将（不为士兵）
	 *
	 * @returns { boolean }
	 */
	hasMainCharacter() {
		return this.name1.indexOf("gz_shibing") != 0;
	}
	/**
	 * 玩家是否有副将（不为士兵）
	 *
	 * @returns { boolean }
	 */
	hasViceCharacter() {
		return this.name2.indexOf("gz_shibing") != 0;
	}
	$showCharacter(num, log) {
		var showYe = false;
		if (num == 0 && !this.isUnseen(0)) {
			return;
		}
		if (num == 1 && !this.isUnseen(1)) {
			return;
		}
		if (!this.isUnseen(2)) {
			return;
		}
		// @ts-expect-error 类型就是这么写的
		game.addVideo("showCharacter", this, num);
		
		// 先更新武将明置状态
		var skills;
		switch (num) {
			case 0:
				if (log !== false) {
					game.log(this, "展示了主将", "#b" + this.name1);
				}
				this.name = this.name1;
				skills = lib.character[this.name][3];
				this.sex = lib.character[this.name][0];
				this.classList.remove("unseen");
				break;
			case 1:
				if (log !== false) {
					game.log(this, "展示了副将", "#b" + this.name2);
				}
				skills = lib.character[this.name2][3];
				if (this.sex == "unknown") {
					this.sex = lib.character[this.name2][0];
				}
				if (this.name.indexOf("unknown") == 0) {
					this.name = this.name2;
				}
				this.classList.remove("unseen2");
				break;
			case 2:
				if (log !== false) {
					game.log(this, "展示了主将", "#b" + this.name1, "、副将", "#b" + this.name2);
				}
				this.name = this.name1;
				skills = lib.character[this.name][3].concat(lib.character[this.name2][3]);
				this.sex = lib.character[this.name][0];
				this.classList.remove("unseen");
				this.classList.remove("unseen2");
				break;
		}
		
		// 武将明置状态更新后，再计算势力
		if (this.identity == "unknown" || (num == 0 || num == 2) && lib.character[this.name1][1] == "ye" || this._viceGroupTemp) {
			// 使用 recalculateIdentity 统一处理势力计算（包括双势力野心家判断）
			// numOfReadyToShow = 0：因为上面已经更新了明置状态（classList.remove），
			// 所以当前明置的武将已经被 population 统计进去了，不需要再 +1
			this.recalculateIdentity();
			
			// 检查是否需要显示野心家动画
			if ((num == 0 || num == 2) && lib.character[this.name1][1] == "ye") {
				if (!this._ye) {
					this._ye = true;
					showYe = true;
				}
			}
			
			this.node.identity.classList.remove("guessing");

			// @ts-expect-error 类型就是这么写的
			if (_status.clickingidentity && _status.clickingidentity[0] == this) {
				// @ts-expect-error 类型就是这么写的
				for (var i = 0; i < _status.clickingidentity[1].length; i++) {
					// @ts-expect-error 类型就是这么写的
					_status.clickingidentity[1][i].delete();
					// @ts-expect-error 类型就是这么写的
					_status.clickingidentity[1][i].style.transform = "";
				}
				// @ts-expect-error 类型就是这么写的
				delete _status.clickingidentity;
			}
			// @ts-expect-error 类型就是这么写的
			game.addVideo("setIdentity", this, this.identity);
		}
		
		game.broadcast(
			// @ts-expect-error 类型就是这么写的
			function (player, name, sex, num, identity, group) {
				player.identityShown = true;
				player.group = group;
				player.name = name;
				player.sex = sex;
				player.node.identity.classList.remove("guessing");
				switch (num) {
					case 0:
						player.classList.remove("unseen");
						break;
					case 1:
						player.classList.remove("unseen2");
						break;
					case 2:
						player.classList.remove("unseen");
						player.classList.remove("unseen2");
						break;
				}
				player.ai.shown = 1;
				player.identity = identity;
				player.setIdentity(identity);
				// @ts-expect-error 类型就是这么写的
				if (_status.clickingidentity && _status.clickingidentity[0] == player) {
					// @ts-expect-error 类型就是这么写的
					for (var i = 0; i < _status.clickingidentity[1].length; i++) {
						// @ts-expect-error 类型就是这么写的
						_status.clickingidentity[1][i].delete();
						// @ts-expect-error 类型就是这么写的
						_status.clickingidentity[1][i].style.transform = "";
					}
					// @ts-expect-error 类型就是这么写的
					delete _status.clickingidentity;
				}
			},
			this,
			this.name,
			this.sex,
			num,
			this.identity,
			this.group
		);
		this.identityShown = true;
		// @ts-expect-error 类型就是这么写的
		for (var i = 0; i < skills.length; i++) {
			// @ts-expect-error 类型就是这么写的
			if (!this.hiddenSkills.includes(skills[i])) {
				continue;
			}
			// @ts-expect-error 类型就是这么写的
			this.hiddenSkills.remove(skills[i]);
			// @ts-expect-error 类型就是这么写的
			this.addSkill(skills[i]);
		}
		this.checkConflict();
		// @ts-expect-error 类型就是这么写的
		if (!this.viceChanged) {
			var initdraw = get.config("initshow_draw");
			if (_status.connectMode) {
				initdraw = lib.configOL.initshow_draw;
			}
			// @ts-expect-error 类型就是这么写的
			if (!_status.initshown && !_status.overing && initdraw != "off" && this.isAlive() && _status.mode != "mingjiang") {
				this.popup("首亮");
				if (initdraw == "draw") {
					game.log(this, "首先明置武将，得到奖励");
					game.log(this, "摸了两张牌");
					// @ts-expect-error 类型就是这么写的
					this.draw(2).log = false;
				} else {
					this.addMark("xianqu_mark", 1);
				}
				// @ts-expect-error 类型就是这么写的
				_status.initshown = true;
			}
			if (!this.isUnseen(2) && !this._mingzhied) {
				this._mingzhied = true;
				if (this.singleHp) {
					this.doubleDraw();
				}
				if (this.perfectPair()) {
					var next = game.createEvent("guozhanDraw");
					// @ts-expect-error 类型就是这么写的
					next.player = this;
					// @ts-expect-error 类型就是这么写的
					next.setContent("zhulian");
				}
			}
			if (showYe) {
				this.addMark("yexinjia_mark", 1);
			}
		}
		// @ts-expect-error 类型就是这么写的
		game.tryResult();
	}

	/**
         * 记录对某势力暴露野心
         * 一旦记录，除非完全暗置或暗置主将后副将不包含此势力，否则无法回归该势力
         * 
         * @param { string } group 暴露野心的势力
         */
        exposeYeToGroup(group) {
                if (!this._exposedYeGroups) {
                        this._exposedYeGroups = [];
                }
                if (!this._exposedYeGroups.includes(group)) {
                        this._exposedYeGroups.push(group);
                        console.log(`[exposeYeToGroup] 记录对 ${group} 势力暴露野心，当前记录: [${this._exposedYeGroups.join(", ")}]`);
                }
        }

        /**
	 * 玩家是否“不会”变成野心家
	 *
	 * @param { string } [group] 判断所处的势力
	 * @returns { boolean }
	 */
	wontYe(group) {
		if (!group) {
			if (this.trueIdentity) {
				group = this.trueIdentity;
			} else {
				group = lib.character[this.name1][1];
			}
		}
		// @ts-expect-error 类型就是这么写的
		if (_status.yeidentity && _status.yeidentity.includes(group)) {
			return false;
		}
		if (get.zhu(this, null, group)) {
			return true;
		}
		
		// 检查是否曾经对此势力暴露过野心
                // 一旦对某势力暴露野心，除非完全暗置或暗置主将后副将不包含此势力，否则无法回归
                if (this._exposedYeGroups && this._exposedYeGroups.includes(group)) {
                        console.log(`[wontYe] 玩家曾对 ${group} 势力暴露野心，无法回归`);
                        return false;
                }

                // 计算阈值：游戏人数除以2，向下取整
		const threshold = Math.floor(get.population() / 2);
		
		// 使用支持双势力的人口计算函数
		// populationOf 基于明置状态计算，无需手动加减
		const currentPopulation = typeof get.populationOf === "function" 
			? get.populationOf(group, true)  // includeDead = true
			: get.totalPopulation(group);    // 降级处理
		
		return currentPopulation <= threshold;
	}

	/**
	 * 判断主副将是否“珠联璧合”
	 *
	 * @param { object } [choosing] 传入已选主副将（目前无实际用处）
	 * @returns { boolean }
	 */
	perfectPair(choosing) {
		if (_status.connectMode) {
			if (!lib.configOL.zhulian) {
				return false;
			}
		} else {
			if (!get.config("zhulian")) {
				return false;
			}
		}
		var name1 = this.name1;
		var name2 = this.name2;
		const junFilter = (name1, name2, reverse) => {
			if (reverse !== true && junFilter(name2, name1, true)) {
				return true;
			}
			if (!get.is.jun(name1)) {
				return false;
			}
			const group = get.character(name1).group,
				info = get.character(name2);
			// 检查主势力或第二势力是否匹配
			return info.group == group || info.majorSecondGroup == group || info.minorSecondGroup == group;
		};
		if (junFilter(name1, name2)) {
			return true;
		}
		if (name1.indexOf("gz_shibing") == 0) {
			return false;
		}
		if (name2.indexOf("gz_shibing") == 0) {
			return false;
		}
		if (choosing && lib.character[name1][1] != "ye" && lib.character[name2][1] != "ye" && lib.character[name1][1] != lib.character[name2][1]) {
			return false;
		}
		if (name1.indexOf("gz_") == 0) {
			name1 = name1.slice(name1.indexOf("_") + 1);
		} else {
			while (name1.indexOf("_") != -1 && !lib.perfectPair[name1]) {
				name1 = name1.slice(name1.indexOf("_") + 1);
			}
		}
		if (name2.indexOf("gz_") == 0) {
			name2 = name2.slice(name2.indexOf("_") + 1);
		} else {
			while (name2.indexOf("_") != -1 && !lib.perfectPair[name2]) {
				name2 = name2.slice(name2.indexOf("_") + 1);
			}
		}
		var list = Object.keys(lib.perfectPair).concat(Object.values(lib.perfectPair)).flat();
		if (!list.includes(name1) || !list.includes(name2)) {
			return false;
		}
		return (lib.perfectPair[name1] && lib.perfectPair[name1].flat(Infinity).includes(name2)) || (lib.perfectPair[name2] && lib.perfectPair[name2].flat(Infinity).includes(name1));
	}

	/**
	 * 判断玩家是否处于“围攻”状态
	 *
	 * @param { Player } [player] 参照对象，是否“围攻”该角色，不填则判断自身上下家
	 * @returns { boolean }
	 */
	siege(player) {
		if (this.identity == "unknown" || this.hasSkill("undist")) {
			return false;
		}
		if (!player) {
			var next = this.getNext();
			if (next && next.sieged()) {
				return true;
			}
			var previous = this.getPrevious();
			if (previous && previous.sieged()) {
				return true;
			}
			return false;
		} else {
			// @ts-expect-error 类型就是这么写的
			return player.sieged() && (player.getNext() == this || player.getPrevious() == this);
		}
	}

	/**
	 * 判断玩家是否处于“被围攻”状态
	 *
	 * @param { Player } [player] 参照对象，是否被该角色“围攻”，不填则判断自身上下家
	 * @returns { boolean }
	 */
	sieged(player) {
		if (this.identity == "unknown") {
			return false;
		}
		if (player) {
			return player.siege(this);
		} else {
			var next = this.getNext();
			var previous = this.getPrevious();
			if (next && previous && next != previous) {
				if (next.identity == "unknown" || next.isFriendOf(this)) {
					return false;
				}
				return next.isFriendOf(previous);
			}
			return false;
		}
	}

	/**
	 * 判断玩家是否处于“队列”
	 *
	 * @returns { boolean }
	 */
	inline() {
		if (this.identity == "unknown" || this.isYe() || this.hasSkill("undist")) {
			return false;
		}
		var next = this,
			previous = this;
		var list = [];
		for (var i = 0; next || previous; i++) {
			if (next) {
				// @ts-expect-error 类型就是这么写的
				next = next.getNext();
				if (!next.isFriendOf(this) || next == this) {
					// @ts-expect-error 类型就是这么写的
					next = null;
				} else {
					list.add(next);
				}
			}
			if (previous) {
				// @ts-expect-error 类型就是这么写的
				previous = previous.getPrevious();
				if (!previous.isFriendOf(this) || previous == this) {
					// @ts-expect-error 类型就是这么写的
					previous = null;
				} else {
					list.add(previous);
				}
			}
		}
		if (!list.length) {
			return false;
		}
		for (var i = 0; i < arguments.length; i++) {
			if (!list.includes(arguments[i]) && arguments[i] != this) {
				return false;
			}
		}
		return true;
	}
	logAi(targets, card) {
		if (this.ai.shown == 1 || this.isMad()) {
			return;
		}
		if (typeof targets == "number") {
			// @ts-expect-error 类型就是这么写的
			this.ai.shown += targets;
		} else {
			var effect = 0,
				c,
				shown;
			var info = get.info(card);
			if (info.ai && info.ai.expose) {
				if (_status.event.name == "_wuxie") {
					if (_status.event.source && _status.event.source.ai.shown) {
						// @ts-expect-error 类型就是这么写的
						this.ai.shown += 0.2;
					}
				} else {
					// @ts-expect-error 类型就是这么写的
					this.ai.shown += info.ai.expose;
				}
			}
			if (targets.length > 0) {
				for (var i = 0; i < targets.length; i++) {
					shown = Math.abs(targets[i].ai.shown);
					if (shown < 0.2 || targets[i].identity == "nei") {
						c = 0;
					} else if (shown < 0.4) {
						c = 0.5;
					} else if (shown < 0.6) {
						c = 0.8;
					} else {
						c = 1;
					}
					effect += get.effect(targets[i], card, this) * c;
				}
			}
			if (effect > 0) {
				if (effect < 1) {
					c = 0.5;
				} else {
					c = 1;
				}
				if (targets.length != 1 || targets[0] != this) {
					if (targets.length == 1) {
						// @ts-expect-error 类型就是这么写的
						this.ai.shown += 0.2 * c;
					} else {
						// @ts-expect-error 类型就是这么写的
						this.ai.shown += 0.1 * c;
					}
				}
			}
		}
		// @ts-expect-error 类型就是这么写的
		if (this.ai.shown > 0.95) {
			this.ai.shown = 0.95;
		}
		// @ts-expect-error 类型就是这么写的
		if (this.ai.shown < -0.5) {
			this.ai.shown = -0.5;
		}
	}
}
