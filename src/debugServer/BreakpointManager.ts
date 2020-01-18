import * as eol from 'eol';
import * as fsExtra from 'fs-extra';
import * as mergeSourceMap from 'merge-source-map';
import { orderBy } from 'natural-orderby';
import * as path from 'path';
import { SourceNode } from 'source-map';
import { DebugProtocol } from 'vscode-debugprotocol';

import { fileUtils } from './FileUtils';
import { Project } from './ProjectManager';

export class BreakpointManager {

    public constructor() {

    }

    public launchArgs: {
        sourceDirs: string[],
        rootDir: string;
        enableSourceMaps: boolean
    };

    /**
     * Tell the breakpoint manager that no new breakpoints can be verified
     * (most likely due to the app being launched and roku not supporting dynamic breakpoints)
     */
    public lockBreakpoints() {
        this.areBreakpointsLocked = true;
    }

    /**
     * Indicates whether the app has been launched or not.
     * This will determine whether the breakpoints should be written to the files, or marked as not verified (greyed out in vscode)
     */
    private areBreakpointsLocked = false;

    /**
     * A map of breakpoints by what file they were set in.
     * This does not handle any source-to-dest mapping...these breakpoints are stored in the file they were set in.
     * These breakpoints are all set before launch, and then this list is not changed again after that.
     * (this concept may need to be modified once we get live breakpoint support)
     */
    private breakpointsByFilePath = {} as { [sourceFilePath: string]: AugmentedSourceBreakpoint[] };

    /**
     * Set/replace/delete the list of breakpoints for this file.
     * @param sourceFilePath
     * @param allBreakpointsForFile
     */
    public setBreakpointsForFile(sourceFilePath: string, allBreakpointsForFile: DebugProtocol.SourceBreakpoint[]): DebugProtocol.Breakpoint[] {
        //standardize the file path (lower drive letter, normalize path.sep, etc...)
        sourceFilePath = fileUtils.standardizePath(sourceFilePath);

        //set column=0 for every breakpoint that is missing it
        for (var b of allBreakpointsForFile) {
            b.column = b.column ?? 0;
        }

        //reject breakpoints from non-brightscript files
        if (!fileUtils.hasAnyExtension(sourceFilePath, ['.brs', '.bs', '.xml'])) {
            //mark every non-supported breakpoint as NOT verified, since we don't support debugging non-brightscript files
            for (let bp of allBreakpointsForFile) {
                (bp as DebugProtocol.Breakpoint).verified = false;
            }
            return allBreakpointsForFile as DebugProtocol.Breakpoint[];

            //we have not launched the debug session yet. all of these breakpoints are treated as verified
        } else if (this.areBreakpointsLocked === false) {
            //add all of the breakpoints for this file
            this.breakpointsByFilePath[sourceFilePath] = <any>allBreakpointsForFile;
            for (let breakpoint of this.breakpointsByFilePath[sourceFilePath]) {
                breakpoint.wasAddedBeforeLaunch = true;
                //indicate that this breakpoint is at a valid location. TODO figure out how to determine valid locations...
                breakpoint.verified = true;
            }
            return this.breakpointsByFilePath[sourceFilePath];

            //a debug session is currently running
        } else {
            //TODO use the standard reverse-lookup logic for converting the rootDir or stagingDir paths into sourceDirs

            //if a breakpoint gets set in rootDir, and we have sourceDirs, convert the rootDir path to sourceDirs path
            //so the breakpoint gets moved into the source file instead of the output file
            if (this.launchArgs && this.launchArgs.sourceDirs) {
                let lastWorkingPath = '';
                for (const sourceDir of this.launchArgs.sourceDirs) {
                    sourceFilePath = sourceFilePath.replace(this.launchArgs.rootDir, sourceDir);
                    if (fsExtra.pathExistsSync(sourceFilePath)) {
                        lastWorkingPath = sourceFilePath;
                    }
                }
                sourceFilePath = lastWorkingPath;
            }

            let existingBreakpoints = this.getBreakpointsForFile(sourceFilePath);

            //new breakpoints will be verified=false, but breakpoints that were removed and then added again should be verified=true
            for (let incomingBreakpoint of allBreakpointsForFile as AugmentedSourceBreakpoint[]) {
                if (existingBreakpoints.find(x => x.wasAddedBeforeLaunch && x.line === incomingBreakpoint.line)) {
                    incomingBreakpoint.verified = true;
                    incomingBreakpoint.wasAddedBeforeLaunch = true;
                } else {
                    incomingBreakpoint.verified = false;
                    incomingBreakpoint.wasAddedBeforeLaunch = false;
                }
            }
            return allBreakpointsForFile as DebugProtocol.Breakpoint[];
        }
    }

    /**
     * Get a list of all breakpoint tasks that should be performed.
     * This will also exclude files with breakpoints that are not in scope.
     */
    private async getBreakpointWork(project: Project) {
        let result = {} as {
            [stagingFilePath: string]: Array<BreakpointWorkItem>
        };

        //iterate over every file that contains breakpoints
        for (let sourceFilePath in this.breakpointsByFilePath) {
            let breakpoints = this.breakpointsByFilePath[sourceFilePath];
            for (let breakpoint of breakpoints) {
                //get the list of locations in staging that this breakpoint should be written to.
                //if none are found, then this breakpoint is ignored
                let stagingLocationsResult = await fileUtils.getStagingLocationsFromSourceLocation(
                    sourceFilePath,
                    breakpoint.line,
                    breakpoint.column,
                    [
                        project.rootDir, ...project.sourceDirs
                    ],
                    project.stagingFolderPath
                );
                for (let stagingLocation of stagingLocationsResult.locations) {
                    let obj: BreakpointWorkItem = {
                        sourceFilePath: sourceFilePath,
                        lineNumber: stagingLocation.lineNumber,
                        columnIndex: stagingLocation.columnIndex,
                        stagingFilePath: stagingLocation.filePath,
                        condition: breakpoint.condition,
                        hitCondition: breakpoint.hitCondition,
                        type: stagingLocationsResult.type
                    };
                    if (!result[stagingLocation.filePath]) {
                        result[stagingLocation.filePath] = [];
                    }
                    result[stagingLocation.filePath].push(obj);
                }
            }
        }
        //sort every breakpoint by location
        for (let stagingFilePath in result) {
            let breakpoints = result[stagingFilePath];
            breakpoints = orderBy(result[stagingFilePath], [x => x.lineNumber, x => x.columnIndex]);
            //throw out any duplicate breakpoints (walk backwards so this is easier)
            for (let i = breakpoints.length - 1; i >= 0; i--) {
                let higherBreakpoint = breakpoints[i + 1];
                let breakpoint = breakpoints[i];
                //only support one breakpoint per line
                if (higherBreakpoint && higherBreakpoint.lineNumber === breakpoint.lineNumber) {
                    breakpoints.splice(i, 1);
                }
            }

            result[stagingFilePath] = breakpoints;
        }

        return result;
    }

    /**
     * Write "stop" lines into source code for each breakpoint of each file in the given project
     */
    public async writeBreakpointsForProject(project: Project) {
        var breakpointsByStagingFilePath = await this.getBreakpointWork(project);

        let promises = [] as Promise<any>[];
        for (let stagingFilePath in breakpointsByStagingFilePath) {
            promises.push(this.addBreakpointsToFile(stagingFilePath, breakpointsByStagingFilePath[stagingFilePath]));
        }
        await Promise.all(promises);
    }

    /**
     * Add breakpoints to the specified file
     * @param sourceFilePath - the path to the original source file from its original location
     * @param basePath - the base path to the folder where the client path file resides
     * @param stagingFolderPath - the base path to the staging folder where the file should be modified
     */
    private async addBreakpointsToFile(stagingFilePath: string, breakpoints: BreakpointWorkItem[]) {
        let sourceMapPath = `${stagingFilePath}.map`;

        //load the file as a string
        let fileContents = (await fsExtra.readFile(stagingFilePath)).toString();

        let sourceAndMap = this.getSourceAndMapWithBreakpoints(fileContents, breakpoints);

        let writeSourceMapPromise: Promise<void>;

        //if we got a map file back, write it to the filesystem
        if (sourceAndMap.map) {
            let sourceMap = JSON.stringify(sourceAndMap.map);
            //if a source map already exists for this file, we need to merge that one with our new one
            if (await fsExtra.pathExists(sourceMapPath)) {
                var originalSourceMap = (await fsExtra.readFile(sourceMapPath)).toString();
                var mergedSourceMapObj = mergeSourceMap(originalSourceMap, sourceMap);
                sourceMap = JSON.stringify(mergedSourceMapObj);
            }
            //write the source map file
            writeSourceMapPromise = fsExtra.writeFile(sourceMapPath, sourceMap);
        }

        await Promise.all([
            //overwrite the file that now has breakpoints injected
            fsExtra.writeFile(stagingFilePath, sourceAndMap.code),
            writeSourceMapPromise
        ]);
    }

    private entryBreakpoint: AugmentedSourceBreakpoint;
    private breakpointIdCounter = 0;

    /**
     *
     * @param stagingFolderPath - the path to
     */
    public async registerEntryBreakpoint(stagingFolderPath: string) {
        let entryPoint = await fileUtils.findEntryPoint(stagingFolderPath);

        let entryBreakpoint = {
            verified: true,
            //create a breakpoint on the line BELOW this location, which is the first line of the program
            line: entryPoint.lineNumber + 1,
            id: this.breakpointIdCounter++,
            isEntryBreakpoint: true,
            wasAddedBeforeLaunch: true
        };
        this.entryBreakpoint = <any>entryBreakpoint;

        //put this breakpoint into the list of breakpoints, in order
        let breakpoints = this.getBreakpointsForFile(entryPoint.path);
        breakpoints.push(entryBreakpoint);
        //sort the breakpoints in order of line number
        breakpoints.sort((a, b) => {
            if (a.line > b.line) {
                return 1;
            } else if (a.line < b.line) {
                return -1;
            } else {
                return 0;
            }
        });

        //if the user put a breakpoint at the same location as the entry breakpoint, keep THEIR breakpoint and NOT the entry breakpoint
        let index = breakpoints.indexOf(this.entryBreakpoint);
        let bpBefore = breakpoints[index - 1];
        let bpAfter = breakpoints[index + 1];
        if (
            (bpBefore && bpBefore.line === this.entryBreakpoint.line) ||
            (bpAfter && bpAfter.line === this.entryBreakpoint.line)
        ) {
            breakpoints.splice(index, 1);
            this.entryBreakpoint = undefined;
        }
    }

    private bpIndex = 1;
    public getSourceAndMapWithBreakpoints(fileContents: string, breakpoints: BreakpointWorkItem[]) {
        let chunks = [] as Array<SourceNode | string>;

        let originalFilePath = breakpoints[0].type === 'sourceMap' ?
            //the calling function will merge this sourcemap into the other existing sourcemap, so just use the same name because it doesn't matter
            breakpoints[0].stagingFilePath :
            //the calling function doesn't have a sourcemap for this file, so we need to point it to the sourceDirs found location (probably rootDir...)
            breakpoints[0].sourceFilePath;

        //split the file by newline
        let lines = eol.split(fileContents);
        let newline = '\n';
        for (let originalLineIndex = 0; originalLineIndex < lines.length; originalLineIndex++) {
            let line = lines[originalLineIndex];
            //if is final line
            if (originalLineIndex === lines.length - 1) {
                newline = '';
            }
            //find breakpoints for this line (breakpoint lines are 1-indexed, but our lineIndex is 0-based)
            let lineBreakpoints = breakpoints.filter(bp => bp.lineNumber - 1 === originalLineIndex);
            //if we have a breakpoint, insert that before the line
            for (let bp of lineBreakpoints) {
                let linesForBreakpoint = this.getBreakpointLines(bp, bp.sourceFilePath);

                //separate each line for this breakpoint with a newline
                for (let bpLine of linesForBreakpoint) {
                    chunks.push(bpLine);
                    chunks.push('\n');
                }
            }

            //add the original code now
            chunks.push(
                //sourceNode expects 1-based row indexes
                new SourceNode(originalLineIndex + 1, 0, originalFilePath, `${line}${newline}`)
            );
        }

        let node = new SourceNode(null, null, originalFilePath, chunks);

        //if sourcemaps are disabled, skip sourcemap generation and only generate the code
        if (this.launchArgs?.enableSourceMaps === false) {
            return {
                code: node.toString(),
                map: undefined
            };
        } else {
            return node.toStringWithSourceMap();
        }
    }

    private getBreakpointLines(breakpoint: BreakpointWorkItem, originalFilePath: string) {
        let lines = [];
        if (breakpoint.logMessage) {
            let logMessage = breakpoint.logMessage;
            //wrap the log message in quotes
            logMessage = `"${logMessage}"`;
            let expressionsCheck = /\{(.*?)\}/g;
            let match;

            // Get all the value to evaluate as expressions
            while (match = expressionsCheck.exec(logMessage)) {
                logMessage = logMessage.replace(match[0], `"; ${match[1]};"`);
            }

            // add a PRINT statement right before this line with the formated log message
            lines.push(new SourceNode(breakpoint.lineNumber, 0, originalFilePath, `PRINT ${logMessage}`));
        } else if (breakpoint.condition) {
            // add a conditional STOP statement
            lines.push(new SourceNode(breakpoint.lineNumber, 0, originalFilePath, `if ${breakpoint.condition} then : STOP : end if`));
        } else if (breakpoint.hitCondition) {
            let hitCondition = parseInt(breakpoint.hitCondition);

            if (isNaN(hitCondition) || hitCondition === 0) {
                // add a STOP statement right before this line
                lines.push(`STOP`);
            } else {
                let prefix = `m.vscode_bp`;
                let bpName = `bp${this.bpIndex++}`;
                let checkHits = `if ${prefix}.${bpName} >= ${hitCondition} then STOP`;
                let increment = `${prefix}.${bpName} ++`;

                // Create the BrightScript code required to track the number of executions
                let trackingExpression = `
                    if Invalid = ${prefix} OR Invalid = ${prefix}.${bpName} then
                        if Invalid = ${prefix} then
                            ${prefix} = {${bpName}: 0}
                        else
                            ${prefix}.${bpName} = 0
                    else
                        ${increment} : ${checkHits}
                `;
                //coerce the expression into single-line
                trackingExpression = trackingExpression.replace(/\n/gi, '').replace(/\s+/g, ' ').trim();
                // Add the tracking expression right before this line
                lines.push(new SourceNode(breakpoint.lineNumber, 0, originalFilePath, trackingExpression));
            }
        } else {
            // add a STOP statement right before this line. Map the stop code to the line the breakpoint represents
            //because otherwise source-map will return null for this location
            lines.push(new SourceNode(breakpoint.lineNumber, 0, originalFilePath, 'STOP'));
        }
        return lines;
    }

    /**
     * File paths can be different casing sometimes,
     * so find the data from `breakpointsByClientPath` case insensitive
     */
    public getBreakpointsForFile(filePath: string) {
        filePath = fileUtils.standardizePath(filePath);

        for (let key in this.breakpointsByFilePath) {
            if (filePath.toLowerCase() === key.toLowerCase()) {
                return this.breakpointsByFilePath[key];
            }
        }
        //didn't find any breakpoints. Create a new array for this key and return it
        this.breakpointsByFilePath[filePath] = [];
        return this.breakpointsByFilePath[filePath];
    }
}

interface AugmentedSourceBreakpoint extends DebugProtocol.SourceBreakpoint {
    /**
     * Was this breakpoint added before launch? That means this breakpoint was written into the source code as a `stop` statement,
     * so if users toggle this breakpoint line on and off, it should get verified every time.
     */
    wasAddedBeforeLaunch: boolean;
    /**
     * This breakpoint has been verified (i.e. we were able to set it at the given location)
     */
    verified: boolean;
}

interface BreakpointWorkItem {
    sourceFilePath: string;
    stagingFilePath: string;
    lineNumber: number;
    columnIndex: number;
    condition?: string;
    hitCondition?: string;
    logMessage?: string;
    type: 'sourceMap' | 'sourceDirs';
}
