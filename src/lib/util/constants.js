export const MODULE = {
    ID: 'wttrpg-enhancements',
    FLAGS_KEY: 'wttrpg-enhancements'
}

export const SYSTEM = {
    ID: 'TheWitcherTRPG'
}

export const ENHANCEMENT_KEYS = {
    DOT: 'dot',
    HOT: 'hot',
    LIFESTEAL: 'lifesteal',
    AMP: 'amp',
    WEAPON_SKILL: 'weaponSkill'
}

export const FLAG_KEYS = ENHANCEMENT_KEYS

export const FORM_PREFIXES = {
    ...ENHANCEMENT_KEYS,
    DAMAGE_PROPERTIES: 'damageProperties'
}

export const FLAG_PATHS = {
    DOT: `flags.${MODULE.FLAGS_KEY}.${ENHANCEMENT_KEYS.DOT}`,
    DOT_ENABLED: `flags.${MODULE.FLAGS_KEY}.${ENHANCEMENT_KEYS.DOT}.enabled`,
    HOT: `flags.${MODULE.FLAGS_KEY}.${ENHANCEMENT_KEYS.HOT}`,
    HOT_ENABLED: `flags.${MODULE.FLAGS_KEY}.${ENHANCEMENT_KEYS.HOT}.enabled`,
    LIFESTEAL: `flags.${MODULE.FLAGS_KEY}.${ENHANCEMENT_KEYS.LIFESTEAL}`,
    AMP: `flags.${MODULE.FLAGS_KEY}.${ENHANCEMENT_KEYS.AMP}`
}

export const CHAT_FLAGS = {
    DAMAGE: 'damage'
}

export const TEMPLATE_PATHS = {
    NAVIGATION: 'templates/generic/tab-navigation.hbs',
    SHEET_AMPLIFIER: `modules/${MODULE.ID}/templates/sheet/amplifier.hbs`,
    SHEET_LIFESTEAL: `modules/${MODULE.ID}/templates/sheet/lifesteal.hbs`,
    SHEET_DOT: `modules/${MODULE.ID}/templates/sheet/dot.hbs`,
    SHEET_HOT: `modules/${MODULE.ID}/templates/sheet/hot.hbs`,
    SHEET_DAMAGE_PROPERTIES: `modules/${MODULE.ID}/templates/sheet/damageProperties.hbs`,
    SHEET_WEAPON_SKILL: `modules/${MODULE.ID}/templates/sheet/weaponSkill.hbs`,
    SHEET_WEAPON_SKILL_MANAGER: `modules/${MODULE.ID}/templates/sheet/weaponSkillManager.hbs`,
    DIALOG_WEAPON_SKILL_ATTACH_MODE: `modules/${MODULE.ID}/templates/dialog/weaponSkillAttachMode.hbs`,
    DIALOG_WEAPON_SKILL_ATTACK_CHOICE: `modules/${MODULE.ID}/templates/dialog/weaponSkillAttackChoice.hbs`,
    DIALOG_WEAPON_SKILL_INFO: `modules/${MODULE.ID}/templates/dialog/weaponSkillInfo.hbs`,
    WEAPON_SKILL_MANAGER_HEADER: `modules/${MODULE.ID}/templates/dialog/weaponSkillManagerHeader.hbs`,
    WEAPON_SKILL_MANAGER_SKILLS: `modules/${MODULE.ID}/templates/dialog/weaponSkillManagerSkills.hbs`,
    WEAPON_SKILL_MANAGER_FOOTER: `modules/${MODULE.ID}/templates/dialog/weaponSkillManagerFooter.hbs`,
    DIALOG_APPLY_DAMAGE: `modules/${MODULE.ID}/templates/dialog/applyDamage.hbs`,
    CHAT_DOT_DAMAGE: `modules/${MODULE.ID}/templates/chat/dotDmg.hbs`,
    CHAT_HOT_HEAL: `modules/${MODULE.ID}/templates/chat/hotHeal.hbs`,
    CHAT_APPLY_LIFESTEAL: `modules/${MODULE.ID}/templates/chat/applyLifesteal.hbs`,
    ROLL_ENHANCEMENT: `modules/${MODULE.ID}/templates/roll/enhancementRoll.hbs`,
    TOOLTIP_ENHANCEMENT: `modules/${MODULE.ID}/templates/roll/enhancementTooltip.hbs`
}

export const ATTRIBUTES = {
    HP: 'hp',
    STA: 'sta',
    SHIELD: 'shield'
}
