import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as net from 'net';
import * as path from 'path';
import * as url from 'url';

const extensions = ['.js', '.ts', '.json', '.jsx', '.tsx', '.vue', '.css', '.mcss', '.scss', '.less', '.html'];

class Util {
    public async readDir(dirPath: string) {
        return await new Promise<string[]>((resolve, reject) => {
            fs.readdir(dirPath, (err, result) => {
                if (err) { reject(err); }
                resolve(result);
            });
        });
    }

    public checkForTrailingSlash(dirPath: string) {
        return dirPath.substr(dirPath.length - 1) !== '/' ? dirPath + '/' : dirPath;
    }

    public async stat(filePath: string) {
        return await new Promise((resolve, reject) => {
            fs.stat(filePath, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    public async fixFilePathExtension(filePath: string) {
        const dirPath = path.join(filePath, '../');
        const fileName = filePath.replace(dirPath, '');

        // with extension, return directly
        if (fileName.indexOf('.') > 0) {
            return filePath;
        }

        // Traverse the directory where the file is located, match the file name. Suffix
        let filePathWithExt = await this.traverse(dirPath, fileName);
        if (filePathWithExt === 'dir') {
            filePathWithExt = await this.traverse(filePath, 'index');
        }
        if (filePathWithExt && filePathWithExt !== 'dir') {
            return filePathWithExt;
        }
        return null;
    }

    private async traverse(dirPath: string, fileName: string) {
        let dir = await this.readDir(dirPath);
        for (let ext of extensions) {
            if (dir.indexOf(fileName + ext) > -1) {
                return path.join(dirPath, fileName + ext);
            }
        }
        if (dir.indexOf(fileName) !== -1) {
            let stats = await this.stat(path.join(dirPath, fileName)) as fs.Stats;
            if (stats.isFile()) {
                return path.join(dirPath, fileName);
            } else if (stats.isDirectory()) {
                return 'dir';
            }
        }
        return null;
    }

    /**
     * Determine if a file exists
     * @param filePath
     */
    public fileExists(filePath: string) {
        return new Promise((resolve) => {
            fsExtra.exists(filePath, resolve);
        });
    }

    /**
     * Removes any leading scheme in the file path
     * @param filePath
     */
    public removeFileScheme(filePath: string): string {
        let scheme = this.getFileScheme(filePath);
        if (scheme) {
            return filePath.substring(scheme.length);
        } else {
            return filePath;
        }
    }

    /**
     * Gets any leading scheme in the file path
     * @param filePath
     */
    public getFileScheme(filePath: string): string | null {
        return url.parse(filePath).protocol;
    }

    /**
     * Creates a delay in execution
     * @param ms time to delay in milliseconds
     */
    public delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Remove a single trailing newline from a string (\n or \r\n)
     */
    public removeTrailingNewline(value: string) {
        return value.replace(/(.*?)\r?\n$/, '$1');
    }

    /**
     * Reads the the manifest file and converts to a javascript object skipping empty lines and comments
     * @param path location of the manifest file
     */
    public async convertManifestToObject(path: string): Promise<{ [key: string]: string } | undefined> {
        if (await this.fileExists(path) === false) {
            return undefined;
        } else {
            let fileContents = (await fsExtra.readFile(path)).toString();
            let manifestLines = fileContents.split('\n');

            let manifestValues = {};
            manifestLines.map((line) => {
                let match;
                if (match = /(\w+)=(.+)/.exec(line)) {
                    manifestValues[match[1]] = match[2];
                }
            });

            return manifestValues;
        }
    }

    /**
     * Checks to see if the port is already in use
     * @param port target port to check
     */
    public async isPortInUse(port: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const tester = net.createServer()
                .once('error', (err: any) => (err.code === 'EADDRINUSE' ? resolve(true) : reject(err)))
                .once('listening', () => tester.once('close', () => resolve(false)).close())
                .listen(port);
        });
    }

    /**
     * With return the differences in two objects
     * @param obj1 base target
     * @param obj2 comparison target
     * @param exclude fields to exclude in the comparison
     */
    public objectDiff(obj1: object, obj2: object, exclude?: string[]) {
        let r = {};

        if (!exclude) { exclude = []; }

        for (let prop in obj1) {
            if (obj1.hasOwnProperty(prop) && prop !== '__proto__') {
                if (exclude.indexOf(obj1[prop]) === -1) {

                    // check if obj2 has prop
                    if (!obj2.hasOwnProperty(prop)) { r[prop] = obj1[prop]; } else if (obj1[prop] === Object(obj1[prop])) {
                        let difference = this.objectDiff(obj1[prop], obj2[prop]);
                        if (Object.keys(difference).length > 0) { r[prop] = difference; }
                    } else if (obj1[prop] !== obj2[prop]) {
                        if (obj1[prop] === undefined) {
                            r[prop] = 'undefined';
                        }

                        if (obj1[prop] === null) {
                            r[prop] = null;
                        } else if (typeof obj1[prop] === 'function') {
                            r[prop] = 'function';
                        } else if (typeof obj1[prop] === 'object') {
                            r[prop] = 'object';
                        } else {
                            r[prop] = obj1[prop];
                        }
                    }
                }
            }
        }
        return r;
    }
}

const util = new Util();
export { util };
