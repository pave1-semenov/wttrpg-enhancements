const fields = foundry.data.fields;

export default class DefenseProperties extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            parrying: new fields.BooleanField({ initial: false, label: 'WITCHER.Item.DefenseProperties.parrying' }),
            defendsAgainst: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                initial: [],
                label: 'WITCHER.Item.DefenseProperties.defendsAgainst.label'
            }),
            modifier: new fields.NumberField({ initial: 0, label: 'WITCHER.Item.DefenseProperties.modifier' })
        };
    }

    isApplicableDefense(attack) {
        return (this.defendsAgainst ?? []).includes(attack);
    }

    createDefenseOption() {
        return {
            modifier: this.modifier,
            skills: [],
            itemTypes: []
        };
    }
}
