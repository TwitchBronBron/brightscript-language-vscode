import { expect } from 'chai';
import { commandsView } from './CommandsView';

describe('CommandsView', () => {
    const requestArgsSchema = {
        "definitions": {
            "MatchObject": {
                "properties": {
                    "base": {
                        "$ref": "#/definitions/ODC.BaseTypes"
                    },
                    "key": {
                        "type": "string"
                    },
                },
                "propertyOrder": [
                    "base",
                    "key"
                ],
            },
            "ODC.BaseTypes": {
                "enum": [
                    "global",
                    "nodeRef",
                    "scene"
                ],
                "type": "string"
            },
        }
    }

    describe('convertArgs', () => {
        it('should return as an array with the correct count', () => {
            const result = commandsView.convertArgs(requestArgsSchema.definitions.MatchObject, requestArgsSchema)
            expect(result.length).to.equal(2);
        });

        it('should work correctly with direct entries', () => {
            const result = commandsView.convertArgs(requestArgsSchema.definitions.MatchObject, requestArgsSchema)
            const refResult = result[1];
            expect(refResult.id).to.equal('key');
            expect(refResult.type).to.equal('string');
        });

        it('should work correctly ref entries', () => {
            const result = commandsView.convertArgs(requestArgsSchema.definitions.MatchObject, requestArgsSchema)
            const refResult = result[0];
            expect(refResult.id).to.equal('base');
            expect(refResult.type).to.equal('string');
        });
    });

    describe('processArgToSendToExtension', () => {
        it('should handle boolean values correctly', () => {
            expect(commandsView.processArgToSendToExtension('boolean', 'true')).to.equal(true);
            expect(commandsView.processArgToSendToExtension('boolean', 'false')).to.equal(false);
        });

        it('should handle object values correctly', () => {
            const result = commandsView.processArgToSendToExtension('object', '{"a": 1}');
            expect(result.a).to.equal(1);
        });

        it('should handle array values correctly', () => {
            const result = commandsView.processArgToSendToExtension('array', '["a", "b"]')
            expect(result[0]).to.equal('a');
            expect(result[1]).to.equal('b');
        });

        it('should handle number values correctly', () => {
            expect(commandsView.processArgToSendToExtension('number', '1')).to.equal(1);
            expect(commandsView.processArgToSendToExtension('number', '1.5')).to.equal(1.5);
        });

        it('string values should be passed through directly', () => {
            const value = 'foo';
            expect(commandsView.processArgToSendToExtension('string', value)).to.equal(value);
        });
    });

});
