const fields = foundry.data.fields;

export default class SituationalBonusData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            description: new fields.HTMLField({ initial: '' }),
            formula: new fields.StringField({ initial: '1' }),
            imageLayout: new fields.StringField({ initial: 'left' }),
            scope: new fields.StringField({ initial: 'skill' }),
            applicableSkills: new fields.ArrayField(new fields.StringField({ initial: '' }), { initial: [] }),
            parentItemUuid: new fields.StringField({ initial: '' }),
            condition: new fields.StringField({ initial: '' })
        };
    }
}
