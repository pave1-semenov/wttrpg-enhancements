import { LifeStealMixin } from '../mixin/lifestealMixin.js';
import { WeaponSkillManagerMixin } from '../mixin/weaponSkillManagerMixin.js';
import { FORM_PREFIXES, ENHANCEMENT_KEYS, TEMPLATE_PATHS } from '../util/constants.js';
import DefauldDocumentSheet from './defaultSheet.js';

export default class ItemEnhancementSheet extends WeaponSkillManagerMixin(LifeStealMixin(DefauldDocumentSheet)) {
    static DEFAULT_OPTIONS = {
        position: {
            width: 760,
            height: 760
        },
        window: {
            icon: 'fas fa-circle-up',
            resizable: true
        },
        form: {
            handler: ItemEnhancementSheet.saveData,
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            createSkill: ItemEnhancementSheet.onCreateSkill,
            openSkill: ItemEnhancementSheet.onOpenSkill,
            removeSkill: ItemEnhancementSheet.onRemoveSkill
        }
    };

    static PARTS = {
        tabs: {
            template: TEMPLATE_PATHS.NAVIGATION
        },
        [ENHANCEMENT_KEYS.LIFESTEAL]: {
            template: TEMPLATE_PATHS.SHEET_LIFESTEAL,
            scrollable: ['']
        },
        [ENHANCEMENT_KEYS.WEAPON_SKILL]: {
            template: TEMPLATE_PATHS.SHEET_WEAPON_SKILL_MANAGER,
            scrollable: ['']
        }
    };

    static TABS = {
        primary: {
            tabs: [
                { id: ENHANCEMENT_KEYS.LIFESTEAL, icon: 'fas fa-people-robbery' },
                { id: ENHANCEMENT_KEYS.WEAPON_SKILL, icon: 'fas fa-sword' }
            ],
            initial: ENHANCEMENT_KEYS.LIFESTEAL,
            labelPrefix: 'WTTRPGEnhancements.Enhancements'
        }
    };

    static async saveData(event, form, formData) {
        const update = await this._prepareUpdateData(formData);
        await this.document.update(update);
    }

    async _prepareUpdateData(formData) {
        const updateData = {
            [ENHANCEMENT_KEYS.LIFESTEAL]: {}
        };

        const prefixesConfig = [{ prefix: FORM_PREFIXES.LIFESTEAL, target: updateData[ENHANCEMENT_KEYS.LIFESTEAL] }];

        return this._fillUpdateData(formData, updateData, prefixesConfig);
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.document = this.document;
        this._prepareLifestealtContext(context);

        if (this.isWeaponDocument()) {
            const attachedSkills = await this.getAttachedSkills();
            context.attachedSkills = attachedSkills.map(skill => ({
                id: skill.id,
                name: skill.name,
                img: skill.img,
                uuid: skill.uuid
            }));
            context.attachedSkillCount = attachedSkills.length;
        } else {
            context.attachedSkills = [];
            context.attachedSkillCount = 0;
        }

        const tabs = this._prepareTabs('primary');
        if (!this.isWeaponDocument()) {
            if (tabs.primary?.tabs) {
                tabs.primary.tabs = tabs.primary.tabs.filter(tab => tab.id !== ENHANCEMENT_KEYS.WEAPON_SKILL);
            }
            delete tabs[ENHANCEMENT_KEYS.WEAPON_SKILL];
        }

        context.tabs = tabs;
        return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isWeaponDocument()) return;

        const dropZone = this.element?.querySelector('[data-drop-zone]');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', event => {
            event.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', async event => {
            event.preventDefault();
            dropZone.classList.remove('dragover');
            await this.onDropSkill(event);
        });
    }

    isWeaponDocument() {
        return this.document?.type === 'weapon';
    }
}
