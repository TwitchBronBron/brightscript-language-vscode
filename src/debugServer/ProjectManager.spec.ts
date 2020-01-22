//tslint:disable:no-unused-expression
import { Project, ComponentLibraryProject, ProjectManager } from './ProjectManager';
import { fileUtils } from './FileUtils';
import { expect } from 'chai';
import { standardizePath as s } from './FileUtils';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import * as sinonActual from 'sinon';
let sinon = sinonActual.createSandbox();
let n = fileUtils.standardizePath.bind(fileUtils);

let cwd = fileUtils.standardizePath(process.cwd());
let rootDir = s`${cwd}/rootDir`;
let outDir = s`${cwd}/outDir`;
let stagingFolderPath = s`${outDir}/stagingDir`;
let compLibOutDir = s`${outDir}/component-libraries`;
let compLibStagingFolderPath = s`${rootDir}/component-libraries/CompLibA`;

beforeEach(() => {
    sinon.restore();
});

describe('ProjectManager', () => {
    var manager: ProjectManager;
    beforeEach(() => {
        manager = new ProjectManager();
        manager.mainProject = <any>{
            stagingFolderPath: stagingFolderPath
        };
        manager.componentLibraryProjects.push(<any>{
            stagingFolderPath: compLibStagingFolderPath,
            libraryIndex: 1,
            outDir: compLibOutDir
        });
    });

    describe('getLineNumberOffsetByBreakpoints', () => {
        it('accounts for the entry breakpoint', () => {
            sinon.stub(manager.breakpointManager, 'getBreakpointsForFile').returns(<any>[{
                line: 3,
                column: 0,
                isEntryBreakpoint: true
            }, {
                line: 3,
                column: 0,
                isEntryBreakpoint: false
            }]);
            //no offset because line is before any breakpoints
            expect(manager.getLineNumberOffsetByBreakpoints('does not matter', 1)).to.equal(1);
            //after the breakpoints, should be offset by -1
            expect(manager.getLineNumberOffsetByBreakpoints('does not matter', 4)).to.equal(3);
        });
    });

    describe('getStagingFileInfo', () => {
        it('finds standard files in main project', async () => {
            expect(
                (await manager.getStagingFileInfo('pkg:/source/main.brs')).absolutePath
            ).to.equal(
                s`${stagingFolderPath}/source/main.brs`
            );
        });

        it(`searches for partial files in main project when '...' is encountered`, async () => {
            let stub = sinon.stub(fileUtils, 'findPartialFileInDirectory').callsFake(function(partialFilePath, directoryPath) {
                expect(partialFilePath).to.equal('...ource/main.brs');
                expect(directoryPath).to.equal(manager.mainProject.stagingFolderPath);
                return Promise.resolve(`source/main.brs`);
            });
            expect(
                (await manager.getStagingFileInfo('...ource/main.brs')).absolutePath
            ).to.equal(
                s`${stagingFolderPath}/source/main.brs`
            );
            expect(stub.called).to.be.true;
        });

        it(`detects full paths to component library filenames`, async () => {
            expect(
                (await manager.getStagingFileInfo('pkg:/source/main__lib1.brs')).absolutePath
            ).to.equal(
                s`${compLibStagingFolderPath}/source/main__lib1.brs`
            );
        });

        it(`detects partial paths to component library filenames`, async () => {
            let stub = sinon.stub(fileUtils, 'findPartialFileInDirectory').callsFake(function(partialFilePath, directoryPath) {
                expect(partialFilePath).to.equal('...ource/main__lib1.brs');
                expect(directoryPath).to.equal(manager.componentLibraryProjects[0].stagingFolderPath);
                return Promise.resolve(`source/main__lib1.brs`);
            });
            let info = await manager.getStagingFileInfo('...ource/main__lib1.brs');
            expect(info).to.deep.include({
                relativePath: s`source/main__lib1.brs`,
                absolutePath: s`${compLibStagingFolderPath}/source/main__lib1.brs`
            });
            expect(info.project).to.include({
                outDir: compLibOutDir
            });

            expect(stub.called).to.be.true;
        });
    });

    describe('getSourceLocation', () => {
        it('handles truncated paths', async () => {
            //mock fsExtra so we don't have to create actual files
            sinon.stub(fsExtra, 'pathExists').callsFake(async (filePath: string) => {
                if (fileUtils.pathEndsWith(filePath, '.map')) {
                    return false;
                } else {
                    return true;
                }
            });
            sinon.stub(fileUtils, 'getAllRelativePaths').returns(Promise.resolve([
                'source/file1.brs',
                'source/file2.brs'
            ]));
            manager.mainProject.rootDir = rootDir;
            manager.mainProject.stagingFolderPath = stagingFolderPath;
            manager.mainProject.fileMappings = [{
                src: s`${rootDir}/source/file1.brs`,
                dest: s`${stagingFolderPath}/source/file1.brs`
            }, {
                src: s`${rootDir}/source/file2.brs`,
                dest: s`${stagingFolderPath}/source/file2.brs`
            }];

            let sourceLocation = await manager.getSourceLocation('...rce/file1.brs', 1);
            expect(sourceLocation).to.exist;
            expect(n(sourceLocation.filePath)).to.equal(s`${rootDir}/source/file1.brs`);

            sourceLocation = await manager.getSourceLocation('...rce/file2.brs', 1);
            expect(n(sourceLocation.filePath)).to.equal(s`${rootDir}/source/file2.brs`);
        });

        it('handles pkg paths', async () => {
            //mock fsExtra so we don't have to create actual files
            sinon.stub(fsExtra, 'pathExists').callsFake(async (filePath: string) => {
                if (fileUtils.pathEndsWith(filePath, '.map')) {
                    return false;
                } else {
                    return true;
                }
            });
            manager.mainProject.rootDir = rootDir;
            manager.mainProject.stagingFolderPath = stagingFolderPath;
            manager.mainProject.fileMappings = [{
                src: s`${rootDir}/source/file1.brs`,
                dest: s`${stagingFolderPath}/source/file1.brs`
            }, {
                src: s`${rootDir}/source/file2.brs`,
                dest: s`${stagingFolderPath}/source/file2.brs`
            }];

            let sourceLocation = await manager.getSourceLocation('pkg:source/file1.brs', 1);
            expect(n(sourceLocation.filePath)).to.equal(n(`${rootDir}/source/file1.brs`));

            sourceLocation = await manager.getSourceLocation('pkg:source/file2.brs', 1);
            expect(n(sourceLocation.filePath)).to.equal(n(`${rootDir}/source/file2.brs`));
        });

    });
});

describe('Project', () => {
    var project: Project;
    beforeEach(() => {
        project = new Project({
            rootDir: cwd,
            outDir: s`${cwd}/out`,
            files: ['a'],
            bsConst: { b: true },
            injectRaleTrackerTask: true,
            sourceDirs: [s`${cwd}/source1`],
            stagingFolderPath: s`${cwd}/staging`,
            trackerTaskFileLocation: 'z'

        });
    });
    it('copies the necessary properties onto the instance', () => {
        expect(project.rootDir).to.equal(cwd);
        expect(project.files).to.eql(['a']);
        expect(project.bsConst).to.eql({ b: true });
        expect(project.injectRaleTrackerTask).to.equal(true);
        expect(project.outDir).to.eql(s`${cwd}/out`);
        expect(project.sourceDirs).to.eql([s`${cwd}/source1`]);
        expect(project.stagingFolderPath).to.eql(s`${cwd}/staging`);
        expect(project.trackerTaskFileLocation).to.eql('z');
    });

    describe('updateManifestBsConsts', () => {
        let constsLine: string;
        let startingFileContents: string;
        let bsConsts: { [key: string]: boolean };

        beforeEach(() => {
            constsLine = 'bs_const=const=false;const2=true;const3=false';
            startingFileContents = `title=ComponentLibraryTestChannel
                subtitle=Test Channel for Scene Graph Component Library
                mm_icon_focus_hd=pkg:/images/MainMenu_Icon_Center_HD.png
                mm_icon_side_hd=pkg:/images/MainMenu_Icon_Side_HD.png
                mm_icon_focus_sd=pkg:/images/MainMenu_Icon_Center_SD43.png
                mm_icon_side_sd=pkg:/images/MainMenu_Icon_Side_SD43.png
                splash_screen_fd=pkg:/images/splash_fhd.jpg
                splash_screen_hd=pkg:/images/splash_hd.jpg
                splash_screen_sd=pkg:/images/splash_sd.jpg
                major_version=1
                minor_version=1
                build_version=00001
                ${constsLine}
            `.replace(/    /g, '');

            bsConsts = {};
        });

        it('should update one bs_const in the bs_const line', () => {
            let fileContents: string;
            bsConsts.const = true;
            fileContents = project.updateManifestBsConsts(bsConsts, startingFileContents);
            expect(fileContents).to.equal(
                startingFileContents.replace(constsLine, 'bs_const=const=true;const2=true;const3=false')
            );

            delete bsConsts.const;
            bsConsts.const2 = false;
            fileContents = project.updateManifestBsConsts(bsConsts, startingFileContents);
            expect(fileContents).to.equal(
                startingFileContents.replace(constsLine, 'bs_const=const=false;const2=false;const3=false')
            );

            delete bsConsts.const2;
            bsConsts.const3 = true;
            fileContents = project.updateManifestBsConsts(bsConsts, startingFileContents);
            expect(fileContents).to.equal(
                startingFileContents.replace(constsLine, 'bs_const=const=false;const2=true;const3=true')
            );
        });

        it('should update all bs_consts in the bs_const line', () => {
            bsConsts.const = true;
            bsConsts.const2 = false;
            bsConsts.const3 = true;
            let fileContents = project.updateManifestBsConsts(bsConsts, startingFileContents);
            expect(fileContents).to.equal(
                startingFileContents.replace(constsLine, 'bs_const=const=true;const2=false;const3=true')
            );
        });
        it('should throw error when there is no bs_const line', async () => {
            expect(() => {
                project.updateManifestBsConsts(bsConsts, startingFileContents.replace(constsLine, ''));
            }).to.throw;
        });

        it('should throw error if there is consts in the bsConsts that are not in the manifest', async () => {
            bsConsts.const4 = true;
            expect(() => {
                project.updateManifestBsConsts(bsConsts, startingFileContents);
            }).to.throw;
        });
    });

    describe('transformRaleTrackerTask', () => {
        let key = 'vscode_rale_tracker_entry';
        let trackerTaskCode = `if true = CreateObject("roAppInfo").IsDev() then m.vscode_rale_tracker_task = createObject("roSGNode", "TrackerTask") ' Roku Advanced Layout Editor Support`;
        let tempPath = s`${cwd}/tmp`;
        let trackerTaskFileLocation = s`${cwd}/TrackerTask.xml`;
        before(() => {
            fsExtra.writeFileSync(trackerTaskFileLocation, '');
        });
        after(() => {
            fsExtra.removeSync(tempPath);
            fsExtra.removeSync(trackerTaskFileLocation);
        });
        afterEach(() => {
            fsExtra.emptyDirSync('./.tmp');
            fsExtra.rmdirSync('./.tmp');
        });

        async function doTest(fileContents: string, expectedContents: string, fileExt: string = 'brs') {
            fsExtra.emptyDirSync(tempPath);
            let folder = s`${tempPath}/findMainFunctionTests/`;
            fsExtra.mkdirSync(folder);

            let filePath = s`${folder}/main.${fileExt}`;

            fsExtra.writeFileSync(filePath, fileContents);
            project.stagingFolderPath = folder;
            project.injectRaleTrackerTask = true;
            //these file contents don't actually matter
            project.trackerTaskFileLocation = trackerTaskFileLocation;
            await project.transformRaleTrackerTask();
            let newFileContents = (await fsExtra.readFile(filePath)).toString();
            expect(newFileContents).to.equal(expectedContents);
        }

        it('works for in line comments brs files', async () => {
            let brsSample = `\nsub main()\n  screen.show  <ENTRY>\nend sub`;
            let expectedBrs = brsSample.replace('<ENTRY>', `: ${trackerTaskCode}`);

            await doTest(brsSample.replace('<ENTRY>', `\' ${key}`), expectedBrs);
            await doTest(brsSample.replace('<ENTRY>', `\'${key}`), expectedBrs);
            //works with extra spacing
            await doTest(brsSample.replace('<ENTRY>', `\'         ${key}                 `), expectedBrs);
        });

        it('works for in line comments in xml files', async () => {
            let xmlSample = `<?rokuml version="1.0" encoding="utf-8" ?>
            <!--********** Copyright COMPANY All Rights Reserved. **********-->

            <component name="TrackerTask" extends="Task">
              <interface>
                  <field id="sample" type="string"/>
                  <function name="sampleFunction"/>
              </interface>
                <script type = "text/brightscript" >
                <![CDATA[
                    <ENTRY>
                ]]>
                </script>
            </component>`;
            let expectedXml = xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true : ${trackerTaskCode}\n        end sub`);

            await doTest(xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true ' ${key}\n        end sub`), expectedXml, 'xml');
            await doTest(xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true '${key}\n        end sub`), expectedXml, 'xml');
            //works with extra spacing
            await doTest(xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true '        ${key}      \n        end sub`), expectedXml, 'xml');
        });

        it('works for stand alone comments in brs files', async () => {
            let brsSample = `\nsub main()\n  screen.show\n  <ENTRY>\nend sub`;
            let expectedBrs = brsSample.replace('<ENTRY>', trackerTaskCode);

            await doTest(brsSample.replace('<ENTRY>', `\' ${key}`), expectedBrs);
            await doTest(brsSample.replace('<ENTRY>', `\'${key}`), expectedBrs);
            //works with extra spacing
            await doTest(brsSample.replace('<ENTRY>', `\'         ${key}                 `), expectedBrs);
        });

        it('works for stand alone comments in xml files', async () => {
            let xmlSample = `<?rokuml version="1.0" encoding="utf-8" ?>
            <!--********** Copyright COMPANY All Rights Reserved. **********-->

            <component name="TrackerTask" extends="Task">
              <interface>
                  <field id="sample" type="string"/>
                  <function name="sampleFunction"/>
              </interface>
                <script type = "text/brightscript" >
                <![CDATA[
                    <ENTRY>
                ]]>
                </script>
            </component>`;

            let expectedXml = xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true\n             ${trackerTaskCode}\n        end sub`);

            await doTest(xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true\n             ' ${key}\n        end sub`), expectedXml, 'xml');
            await doTest(xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true\n             '${key}\n        end sub`), expectedXml, 'xml');
            //works with extra spacing
            await doTest(xmlSample.replace('<ENTRY>', `sub init()\n            m.something = true\n             '        ${key}      \n        end sub`), expectedXml, 'xml');
        });
    });
});

describe('ComponentLibraryProject', () => {
    describe('computeOutFileName', () => {
        it('properly computes the outFile name', () => {
            var project = new ComponentLibraryProject({
                rootDir: cwd,
                outDir: s`${cwd}/out`,
                files: ['a'],
                bsConst: { b: true },
                injectRaleTrackerTask: true,
                sourceDirs: [s`${cwd}/source1`],
                stagingFolderPath: s`${cwd}/staging`,
                trackerTaskFileLocation: 'z',
                libraryIndex: 0,
                outFile: 'PrettyComponent.zip'
            });
            expect(project.outFile).to.equal('PrettyComponent.zip');
            (project as any).computeOutFileName();
            expect(project.outFile).to.equal('PrettyComponent.zip');
        });
    });
});