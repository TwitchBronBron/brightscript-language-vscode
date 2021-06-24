const fetch = require('node-fetch');
var fsExtra = require('fs-extra');
(async () => {
    const json = await (await fetch('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/xml/syntaxes/xml.tmLanguage.json')).json()
    json.scopeName = 'scenegraph.xml';
    json.name = 'scenegraph';
    json.fileTypes = ['xml'];
    delete json.information_for_contributors;
    delete json.version;
    //find the CDATA pattern
    var pattern = json.patterns.find(x => x.name === 'string.unquoted.cdata.xml');
    pattern.name = 'source.brighterscript.embedded.scenegraph';
    pattern.patterns = [{
        include: "source.brs"
    }];
    fsExtra.outputFileSync(`${__dirname}/../syntaxes/scenegraph.tmLanguage.json`, JSON.stringify(json, null, 4));
})().catch(e => console.error(e));
