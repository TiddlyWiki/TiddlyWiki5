import { Observable } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';

declare module 'rxjs/operator/ignoreElements' {
    export function ignoreElements<T>(this: Observable<T>): Observable<never>;
}

const maxConcurrent = 20;

type Hashmap<T> = { [K: string]: T };
export interface Boot {
    logMessages: string[];
    log(str: string): void;
    tasks: {
        trapErrors: boolean;
    };
}
interface Utils {
    hop<T>(object: T, property: keyof T): T[keyof T] | false;
    isArray(value: any): value is Array<any>;
    isDate(value: any): value is Date;
    each<T>(object: T[], callback: (e: T, i: number, a: T[]) => void): any;
    each<T extends {
        [K: string]: any;
    }>(object: T, callback: (e: T[keyof T], i: keyof T, a: T) => void): any;
    domMaker(tag: string, options: {
        document?: Document;
        text?: string;
        innerHTML?: string;
        children?: Node[];
        attributes?: {
            [K: string]: string;
        };
        eventListeners?: any[];
        class?: string;
    }): any;
    error(err: any): void;
    extend<T, S1>(object: T, source1: S1): T & S1;
    extend<T, S1, S2>(object: T, source1: S1, source2: S2): T & S1 & S2;
    extend<T, S1, S2, S3, R extends T & S1 & S2 & S3>(object: T, source1: S1, source2: S2, source3: S3): R;
    extend<T, S1, S2, S3, S4, R extends T & S1 & S2 & S3 & S4>(object: T, source1: S1, source2: S2, source3: S3, source4: S4): R;
    extend<T, S1, S2, S3, S4, S5, R extends T & S1 & S2 & S3 & S4 & S5>(object: T, source1: S1, source2: S2, source3: S3, source4: S4, source5: S5): R;
    extend<T, S1, S2, S3, S4, S5, S6, R extends T & S1 & S2 & S3 & S4 & S5>(object: T, source1: S1, source2: S2, source3: S3, source4: S4, source5: S5, ...sources: S6[]): R;
    deepDefaults<T, S1, R extends T & S1>(object: T, source1: S1): R;
    deepDefaults<T, S1, S2, R extends T & S1 & S2>(object: T, source1: S1, source2: S2): R;
    deepDefaults<T, S1, S2, S3, R extends T & S1 & S2 & S3>(object: T, source1: S1, source2: S2, source3: S3): R;
    deepDefaults<T, S1, S2, S3, S4, R extends T & S1 & S2 & S3 & S4>(object: T, source1: S1, source2: S2, source3: S3, source4: S4): R;
    deepDefaults<T, S1, S2, S3, S4, S5, R extends T & S1 & S2 & S3 & S4 & S5>(object: T, source1: S1, source2: S2, source3: S3, source4: S4, source5: S5): R;
    deepDefaults<T, S1, S2, S3, S4, S5, S6, R extends T & S1 & S2 & S3 & S4 & S5>(object: T, source1: S1, source2: S2, source3: S3, source4: S4, source5: S5, ...sources: S6[]): R;
    htmlDecode(html: string): string;
    getLocationHash(): string;
    /**
     * Pad a string to a given length with "0"s. Length defaults to 2, max is 27
     */
    pad(value: any, length?: number): string;
    stringifyDate(value: Date): string;
    parseDate(value: string): Date | null;
    /**
     * Stringify an array of tiddler titles into a list string
     */
    stringifyList(value: string[]): string;
    parseStringArray(value: string): string[] | null;
    parseFields<S = {}, T = {}>(text: string, result?: T): typeof result & S;
    resolvePath(sourcePath: string, rootPath: string): string;
    parseVersion(version: string): {
        version: string;
        major: number;
        minor: number;
        patch: number;
        prerelease: string;
        build: string;
    } | null;
    /**
     * Check whether version A is greater than or equal to version B
     */
    checkVersions(versionStringA: string, versionStringB: string): boolean;
    registerFileType(type: any, encoding: any, extension: any, options: {
        flags: ("image")[];
        deserializerType: string;
    }): any;
    getFileExtensionInfo(ext: string): FileExtensionInfo | null;
    getTypeEncoding(ext: string): ContentTypeInfo;
    evalGlobal(code: string, context: any, filename: string): any;
    evalSandboxed(code: string, context: any, filename: string): any;
    PasswordPrompt: new () => PasswordPrompt;
    Crypto: new () => Crypto;
}
interface PasswordPrompt {
    constructor(): any;
    setWrapperDisplay(): any;
    createPrompt(options: any): any;
    removePrompt(promptInfo: any): any;
}
interface Crypto {
    setPassword(newPassword: string): any;
    updateCryptoStateTiddler(): any;
    hasPassword(): any;
    encrypt(text: string, password: string): any;
    decrypt(text: string, password: string): any;
}

interface FileExtensionInfo {
    type: string;
}
interface ContentTypeInfo {
    encoding: string;
    extension: string;
    flags: string[];
    deserializerType: string;
}

export interface Tiddler {
    fields: TiddlerFields
}

export interface TiddlerFields {
    readonly text: string
    readonly type: string
    readonly title: string
}

export interface FileInfo {
    filepath?: string;
    type?: string;
    tiddlers: TiddlerFields[];
    hasMetaFile?: boolean;

}
interface WikiInfo {
    includeWikis: { path: string }[]
    build: string[]
    plugins: string[]
    themes: string[]
    languages: string[]
    config?: {}
}
interface FieldInfo {
    source?: string
    prefix?: string;
    suffix?: string;
}

interface TiddlerInfo {
    fields: {
        [field: string]: FieldInfo
    }
    prefix: string
    suffix: string
    file: string
    isTiddlerFile: boolean

}
interface DirectoryInfo {
    path: string
    filesRegExp: string
    isTiddlerFile: boolean
    fields: any
}
interface packageInfo {
    name: string
    preferGlobal: string
    version: string
    author: string
    description: string
    contributors: string
    bin: string
    main: string
    repository: string
    keywords: string
    dependencies: string
    devDependencies: string
    bundleDependencies: string
    license: string
    engines: string
}

interface $tw {
    boot: {
        excludeRegExp: RegExp,
        files: {
            [title: string]: {
                filepath: string,
                type: string,
                hasMetaFile: boolean
            }
        }
        wikiTiddlersPath: string,
        wikiPath: string
        corePath: string
        bootPath: string
        wikiInfo: WikiInfo
    }
    utils: Utils/*{
        getFileExtensionInfo: (ext) => any,
        parseFields: <T>(string, fields:T) => T
    }*/,
    config: {
        contentTypeInfo: {
            [type: string]: ContentTypeInfo
        },
        fileExtensionInfo: {
            [ext: string]: FileExtensionInfo
        },
        wikiInfo: {},
        pluginsPath: string
        themesPath: string
        languagesPath: string
        pluginsEnvVar: string
        themesEnvVar: string
        languagesEnvVar: string
        wikiTiddlersSubDir: string
        wikiPluginsSubDir: string
        wikiThemesSubDir: string
        wikiLanguagesSubDir: string
    },
    wiki: {
        deserializeTiddlers(ext, data, fields): TiddlerFields[]
        addTiddler(data: TiddlerFields | Tiddler): void;
        addTiddlers(data: (TiddlerFields | Tiddler)[]): void;
    }
    packageInfo: packageInfo
}

function obs_stat<T>(tag?: T): (path: string) => Observable<[NodeJS.ErrnoException, fs.Stats, T]> {
    return Observable.bindCallback(fs.stat, (err, stat) => [err, stat, tag])
}

function obs_readdir<T>(tag?: T): (path: string) => Observable<[NodeJS.ErrnoException, string[], T]> {
    return Observable.bindCallback(fs.readdir, (err, files) => [err, files, tag]);
}

function obs_readFile<T>(tag?: T): (path: string, encoding: string) => Observable<[NodeJS.ErrnoException, string, T]> {
    return Observable.bindCallback(fs.readFile, (err, data) => [err, data, tag]);
}
export function bootNode($tw) {



    /**
    Load the tiddlers contained in a particular file (and optionally extract fields from the 
    accompanying .meta file) returned as { filepath, type, tiddlers[], hasMetaFile }. Returns
    exactly one item.
    */
    function loadTiddlersFromFile(filepath, fields?): Observable<FileInfo> {
        //return Observable.of(filepath).switchMap(() => {
        var ext = path.extname(filepath),
            extensionInfo = $tw.utils.getFileExtensionInfo(ext),
            type = extensionInfo ? extensionInfo.type : null,
            typeInfo = type ? $tw.config.contentTypeInfo[type] : null;
        return obs_readFile({ type, filepath })(
            filepath as string, typeInfo ? typeInfo.encoding : "utf8"
        ).switchMap(([err, data, { type, filepath }])/*: Observable<[any, { tiddlers: TiddlerFields[], type: string, filepath: string }]>*/ => {
            const tag = {
                type, filepath,
                tiddlers: $tw.wiki.deserializeTiddlers(ext, data, fields)
            }
            //const tag1 = extend(tag, { tiddlers })

            if (ext !== ".json" && tag.tiddlers.length === 1) {
                return loadMetadataForFile(filepath).map(metadata => [metadata || {}, tag] as [{}, typeof tag]);
            } else {
                return Observable.of([false, tag] as [false, typeof tag]);
            }
        }).map(([metadata, tag]) => {
            if (metadata) tag.tiddlers = [$tw.utils.extend({}, tag.tiddlers[0], metadata)] as TiddlerFields[];
            return { filepath: tag.filepath, type: tag.type, tiddlers: tag.tiddlers, hasMetaFile: !!metadata };
        })
    };

    /**
    Load the metadata fields in the .meta file corresponding to a particular file. Returns null
    if none is found.
    */
    function loadMetadataForFile(filepath) {
        var metafilename = filepath + ".meta";
        return obs_readFile()(metafilename, "utf8").map(([err, data]) => {
            if (err) {
                return null;
            } else {
                return $tw.utils.parseFields(data || "") as TiddlerFields;
            }
        })
    };

    /**
    A default set of files for TiddlyWiki to ignore during load.
    This matches what NPM ignores, and adds "*.meta" to ignore tiddler
    metadata files.
    */
    $tw.boot.excludeRegExp = /^\.DS_Store$|^.*\.meta$|^\..*\.swp$|^\._.*$|^\.git$|^\.hg$|^\.lock-wscript$|^\.svn$|^\.wafpickle-.*$|^CVS$|^npm-debug\.log$/;



    /**
    Load all the tiddlers recursively from a directory, including honouring `tiddlywiki.files` files for drawing in external files. Returns an array of {filepath:,type:,tiddlers: [{..fields...}],hasMetaFile:}. Note that no file information is returned for externally loaded tiddlers, just the `tiddlers` property.
    */
    function loadTiddlersFromPath(filepath, excludeRegExp?): Observable<FileInfo> {
        excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
        var tiddlers = [];
        return obs_stat()(filepath).switchMap(([err, stat]) => {
            if (err) {
                return Observable.empty<FileInfo>();
            } else {
                if (stat.isDirectory()) {
                    return obs_readdir()(filepath).switchMap(([err, files]) => {
                        if (files.indexOf("tiddlywiki.files") !== -1) {
                            return loadTiddlersFromSpecification(filepath, excludeRegExp);
                        } else {
                            // If not, read all the files in the directory
                            return Observable.from(
                                files.filter(file => {
                                    return (!excludeRegExp.test(file) && file !== "plugin.info");
                                })
                            ).mergeMap(file => {
                                return loadTiddlersFromPath(filepath + path.sep + file, excludeRegExp)
                            }, maxConcurrent);
                        }
                    })
                } else if (stat.isFile()) {
                    return loadTiddlersFromFile(filepath)
                } else {
                    return Observable.empty<FileInfo>();
                }
            }
        })
    };

    /**
    Load all the tiddlers defined by a `tiddlywiki.files` specification file
    filepath: pathname of the directory containing the specification file
    */
    function loadTiddlersFromSpecification(filepath, excludeRegExp) {
        var tiddlers = [];
        // Read the specification
        return obs_readFile()(filepath + path.sep + "tiddlywiki.files", "utf8").switchMap((res) => {
            var err = res[0];
            var filesInfo = JSON.parse(res[1]);
            return Observable.from(filesInfo.tiddlers || []).concatMap((tidInfo: TiddlerInfo) => {
                if (tidInfo.prefix && tidInfo.suffix) {
                    tidInfo.fields.text = { prefix: tidInfo.prefix, suffix: tidInfo.suffix };
                } else if (tidInfo.prefix) {
                    tidInfo.fields.text = { prefix: tidInfo.prefix };
                } else if (tidInfo.suffix) {
                    tidInfo.fields.text = { suffix: tidInfo.suffix };
                }
                return processFile(tidInfo.file, tidInfo.isTiddlerFile, tidInfo.fields);
            }).concat(Observable.from(filesInfo.directories || []).concatMap((dirInfo: DirectoryInfo) => {
                if (typeof dirInfo === "string") {
                    var pathname = path.resolve(filepath, dirInfo);
                    return obs_stat()(pathname).switchMap(([err, stat]) => {
                        if (err || !stat.isDirectory()) return Observable.empty<FileInfo>();
                        else return loadTiddlersFromPath(pathname, excludeRegExp)
                    })
                } else {
                    // Process directory specifier
                    var dirPath = path.resolve(filepath, dirInfo.path);
                    return obs_readdir()(dirPath).switchMap(([err, files]) => {
                        var fileRegExp = new RegExp(dirInfo.filesRegExp || "^.*$"),
                            metaRegExp = /^.*\.meta$/;
                        return Observable.from(
                            files.filter(filename => {
                                return filename !== "tiddlywiki.files" && !metaRegExp.test(filename) && fileRegExp.test(filename);
                            })
                        ).mergeMap(filename => {
                            return processFile(dirPath + path.sep + filename, dirInfo.isTiddlerFile, dirInfo.fields);
                        }, maxConcurrent)
                    })
                }
            }))
        })
        // Helper to process a file
        function processFile(filename, isTiddlerFile, fields): Observable<FileInfo> {
            var extInfo = $tw.config.fileExtensionInfo[path.extname(filename)],
                type = (extInfo || {}).type || fields.type || "text/plain",
                typeInfo = $tw.config.contentTypeInfo[type] || {},
                pathname = path.resolve(filepath, filename);
            return obs_readFile()(pathname, typeInfo.encoding || "utf8").switchMap(([err, text]) => {
                return loadMetadataForFile(pathname).map(metadata => [metadata || {}, text]);
            }).map(([metadata, text]) => {
                var fileTiddlers: TiddlerFields[];
                if (isTiddlerFile) {
                    fileTiddlers = $tw.wiki.deserializeTiddlers(path.extname(pathname), text, metadata) || [];
                } else {
                    fileTiddlers = [$tw.utils.extend({ text: text }, metadata) as TiddlerFields];
                }
                var combinedFields = $tw.utils.extend({}, fields, metadata) as Hashmap<FieldInfo | string | any[]>;
                $tw.utils.each(fileTiddlers, function (tiddler) {
                    $tw.utils.each(combinedFields, function (fieldInfo, name) {
                        if (typeof fieldInfo === "string" || $tw.utils.isArray(fieldInfo)) {
                            tiddler[name] = fieldInfo;
                        } else {
                            var value = tiddler[name];
                            switch (fieldInfo.source) {
                                case "filename":
                                    value = path.basename(filename);
                                    break;
                                case "filename-uri-decoded":
                                    value = decodeURIComponent(path.basename(filename));
                                    break;
                                case "basename":
                                    value = path.basename(filename, path.extname(filename));
                                    break;
                                case "basename-uri-decoded":
                                    value = decodeURIComponent(path.basename(filename, path.extname(filename)));
                                    break;
                                case "extname":
                                    value = path.extname(filename);
                                    break;
                                case "created":
                                    value = new Date(fs.statSync(pathname).birthtime);
                                    break;
                                case "modified":
                                    value = new Date(fs.statSync(pathname).mtime);
                                    break;
                            }
                            if (fieldInfo.prefix) {
                                value = fieldInfo.prefix + value;
                            }
                            if (fieldInfo.suffix) {
                                value = value + fieldInfo.suffix;
                            }
                            tiddler[name] = value;
                        }
                    });
                });
                return { tiddlers: fileTiddlers };
            })
        } //End processFile()
    };

    /**
    Load the tiddlers from a plugin folder, and package them up into a proper JSON plugin tiddler
    */
    function loadPluginFolder(filepath, excludeRegExp?) {
        excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
        //return an observable chain starting with stat'ing the folder
        return obs_stat()(filepath).switchMap(([err, stat]) => {
            //skip down to the catch handler if we can't load this path, but tell the handler
            //to just return null instead of rethrowing the error.
            if (err || !stat.isDirectory()) {
                if (err) err.forward = false;
                else err = { message: "Directory required", forward: false };
                return Observable.throw(err);
            }
            //read the plugin info file
            return obs_readFile()(filepath + path.sep + "plugin.info", "utf8");
        }).switchMap(([err, data]) => {
            if (err) throw err;
            var pluginInfo = JSON.parse(data);
            return loadTiddlersFromPath(filepath, excludeRegExp)
                //loadTiddlersFromPath returns an Observable of individual files, so
                //we need to reduce these into an array. The array will be emitted only
                //only once only after all the files have been emited.
                .reduce((n, e) => { n.push(e); return n; }, [])
                //forward the plugin info
                .map(tiddlers => [tiddlers, pluginInfo]);
        }).map(([pluginFiles, pluginInfo]) => {
            pluginInfo.tiddlers = pluginInfo.tiddlers || Object.create(null);
            for (var f = 0; f < pluginFiles.length; f++) {
                var tiddlers = pluginFiles[f].tiddlers;
                for (var t = 0; t < tiddlers.length; t++) {
                    var tiddler = tiddlers[t];
                    if (tiddler.title) {
                        pluginInfo.tiddlers[tiddler.title] = tiddler;
                    }
                }
            }
            // Give the plugin the same version number as the core if it doesn't have one
            if (!("version" in pluginInfo)) {
                pluginInfo.version = $tw.packageInfo.version;
            }
            // Use "plugin" as the plugin-type if we don't have one
            if (!("plugin-type" in pluginInfo)) {
                pluginInfo["plugin-type"] = "plugin";
            }
            pluginInfo.dependents = pluginInfo.dependents || [];
            pluginInfo.type = "application/json";
            // Set plugin text
            pluginInfo.text = JSON.stringify({ tiddlers: pluginInfo.tiddlers }, null, 4);
            delete pluginInfo.tiddlers;
            // Deserialise array fields (currently required for the dependents field)
            for (var field in pluginInfo) {
                if ($tw.utils.isArray(pluginInfo[field])) {
                    pluginInfo[field] = $tw.utils.stringifyList(pluginInfo[field]);
                }
            }
            return pluginInfo;
        }).catch(err => {
            if (err.forward === false) return Observable.of(null);
            else return Observable.throw(err);

        })
    };


    /**
    name: Name of the plugin to find
    paths: array of file paths to search for it
    Returns the path of the plugin folder or null
    */
    function findLibraryItem(name, paths) {
        //emits the first path that exists and is a directory
        //otherwise emits null
        return Observable.from(paths).concatMap(itemPath => {
            var pluginPath = path.resolve(itemPath, "./" + name);
            return obs_stat(pluginPath)(pluginPath)
        }).first(([err, stat, pluginPath]) => {
            return (!err && stat.isDirectory())
        }, ([err, stat, pluginPath]) => pluginPath, null)
    };


    /**
    name: Name of the plugin to load
    paths: array of file paths to search for it
    */
    function loadPlugin(name, paths): Observable<never> {
        return findLibraryItem(name, paths).switchMap(pluginPath => {
            if (pluginPath) return loadPluginFolder(pluginPath);
            else return Observable.empty();
        }).map(pluginFields => {
            if (pluginFields) return $tw.wiki.addTiddler(pluginFields);
        }).ignoreElements();
    };


    /**
    libraryPath: Path of library folder for these plugins (relative to core path)
    envVar: Environment variable name for these plugins
    Returns an array of search paths
    */
    function getLibraryItemSearchPaths(libraryPath, envVar) {
        var pluginPaths = [path.resolve($tw.boot.corePath, libraryPath)],
            env = process.env[envVar];
        if (env) {
            env.split(path.delimiter).map(function (item) {
                if (item) {
                    pluginPaths.push(item)
                }
            });
        }
        return pluginPaths;
    };

    /**
    plugins: Array of names of plugins (eg, "tiddlywiki/filesystemadaptor")
    libraryPath: Path of library folder for these plugins (relative to core path)
    envVar: Environment variable name for these plugins
    */
    function loadPlugins(plugins, libraryPath, envVar) {
        if (plugins) {
            var pluginPaths = getLibraryItemSearchPaths(libraryPath, envVar);
            return Observable.from(plugins).mergeMap(plugin => {
                return loadPlugin(plugin, pluginPaths);
            }, maxConcurrent);
        } else {
            return Observable.empty();
        }
    };

    /*
     * Loads the tiddlers from a wiki directory
     * @param wikiPath - path of wiki directory
     * @param options
     * @param options.parentPaths - array of parent paths that we mustn't recurse into
     * @param options.readOnly - true if the tiddler file paths should not be retained
     */
    /**
     * 
     * 
     * @param {any} wikiPath path of wiki directory
     * @param {any} [options] 
     * @returns 
     */
    function loadWikiTiddlers(wikiPath, options?) {
        options = options || {};
        var parentPaths = options.parentPaths || [],
            wikiInfoPath = path.resolve(wikiPath, $tw.config.wikiInfo),
            //wikiInfo,
            pluginFields;
        // Bail if we don't have a wiki info file
        return obs_readFile()(wikiInfoPath, "utf8").concatMap(([err, wikiInfoFile]) => {
            if (err) return Observable.empty<WikiInfo>()
            var wikiInfo = JSON.parse(wikiInfoFile) as WikiInfo;
            // Load any parent wikis
            if (wikiInfo.includeWikis) {
                parentPaths = parentPaths.slice(0);
                parentPaths.push(wikiPath);
                return Observable.from(wikiInfo.includeWikis).concatMap((info: { path: string, "read-only"?: boolean }) => {
                    if (typeof info === "string") {
                        info = { path: info };
                    }
                    var resolvedIncludedWikiPath = path.resolve(wikiPath, info.path);
                    if (parentPaths.indexOf(resolvedIncludedWikiPath) === -1) {
                        return loadWikiTiddlers(resolvedIncludedWikiPath, {
                            parentPaths: parentPaths,
                            readOnly: info["read-only"]
                        }).map(subWikiInfo => {
                            wikiInfo.build = $tw.utils.extend([], subWikiInfo.build, wikiInfo.build);
                        });
                    } else {
                        $tw.utils.error("Cannot recursively include wiki " + resolvedIncludedWikiPath);
                    }
                }).count().mapTo(wikiInfo); //drop any output and just forward the wikiInfo.
            }
            return Observable.of(wikiInfo);
        }).concatMap(wikiInfo => {
            return Observable.concat(
                loadPlugins(wikiInfo.plugins, $tw.config.pluginsPath, $tw.config.pluginsEnvVar),
                loadPlugins(wikiInfo.themes, $tw.config.themesPath, $tw.config.themesEnvVar),
                loadPlugins(wikiInfo.languages, $tw.config.languagesPath, $tw.config.languagesEnvVar)
            ).count().mapTo(wikiInfo);
        }).concatMap(wikiInfo => {
            // Load the wiki files, registering them as writable
            var resolvedWikiPath = path.resolve(wikiPath, $tw.config.wikiTiddlersSubDir);
            return loadTiddlersFromPath(resolvedWikiPath).do(tiddlerFile => {
                if (!options.readOnly && tiddlerFile.filepath) {
                    $tw.utils.each(tiddlerFile.tiddlers, function (tiddler) {
                        $tw.boot.files[tiddler.title] = {
                            filepath: tiddlerFile.filepath,
                            type: tiddlerFile.type,
                            hasMetaFile: tiddlerFile.hasMetaFile
                        };
                    });
                }
                $tw.wiki.addTiddlers(tiddlerFile.tiddlers);
            }).count().mapTo([wikiInfo, resolvedWikiPath] as [typeof wikiInfo, typeof resolvedWikiPath]);
        }).concatMap(([wikiInfo, resolvedWikiPath]) => {
            // Save the original tiddler file locations if requested
            var config = wikiInfo.config || {};
            if (config["retain-original-tiddler-path"]) {
                var output = {};
                for (var title in $tw.boot.files) {
                    output[title] = path.relative(resolvedWikiPath, $tw.boot.files[title].filepath);
                }
                $tw.wiki.addTiddler({ title: "$:/config/OriginalTiddlerPaths", type: "application/json", text: JSON.stringify(output) });
            }
            // Save the path to the tiddlers folder for the filesystemadaptor
            $tw.boot.wikiTiddlersPath = path.resolve($tw.boot.wikiPath, config["default-tiddler-location"] || $tw.config.wikiTiddlersSubDir);
            // Load any plugins, themes and languages listed in the wiki info file
            return Observable.from([
                path.resolve(wikiPath, $tw.config.wikiPluginsSubDir),
                path.resolve(wikiPath, $tw.config.wikiThemesSubDir),
                path.resolve(wikiPath, $tw.config.wikiLanguagesSubDir)
            ]).mergeMap(pluginPath => {
                return obs_readdir(pluginPath)(pluginPath)
            }).mergeMap(([err, pluginFolders, pluginPath]) => {
                if (err) return Observable.empty();
                else return Observable.from(pluginFolders.map(a => [a, pluginPath]))
            }).mergeMap(([pluginFolder, pluginPath]) => {
                return loadPluginFolder(path.resolve(pluginPath, "./" + pluginFolder));
            }).map(pluginFields => {
                $tw.wiki.addTiddler(pluginFields);
            }).count().mapTo(wikiInfo);
        }).defaultIfEmpty(null); //emit null if we don't emit anything else
    };


    function loadTiddlersNode() {
        // Load the boot tiddlers
        return Observable.merge(
            //load the boot tiddlers
            loadTiddlersFromPath($tw.boot.bootPath).do(tiddlerFile => {
                $tw.wiki.addTiddlers(tiddlerFile.tiddlers);
            }).ignoreElements(),
            //load the core plugin
            loadPluginFolder($tw.boot.corePath).do(coreTiddlers => {
                $tw.wiki.addTiddler(coreTiddlers);
            }).ignoreElements(),
            //load the data folder, if we have one
            ($tw.boot.wikiPath ? loadWikiTiddlers($tw.boot.wikiPath).do(wikiInfo => {
                $tw.boot.wikiInfo = wikiInfo;
            }) : Observable.empty())
        ).ignoreElements();
    };

    $tw.utils.extend($tw, {
        loadTiddlersFromFile,
        loadMetadataForFile,
        loadTiddlersFromPath,
        loadTiddlersFromSpecification,
        loadPluginFolder,
        findLibraryItem,
        loadPlugin,
        getLibraryItemSearchPaths,
        loadPlugins,
        loadWikiTiddlers,
        loadTiddlersNode
    })

}
