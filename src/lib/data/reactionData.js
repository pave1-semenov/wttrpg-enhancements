const fields = foundry.data.fields;

export default class ReactionData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            description: new fields.StringField({ initial: '' }),
        };
    }
}