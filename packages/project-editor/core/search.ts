import { _isEqual } from "eez-studio-shared/algorithm";

import {
    EezObject,
    EezValueObject,
    PropertyType,
    getProperty,
    isArray,
    asArray,
    getObjectPath,
    objectToString,
    getObjectPropertyAsObject
} from "project-editor/core/object";
import { ProjectStore, OutputSectionsStore } from "project-editor/core/store";

import { Section, Type } from "project-editor/core/output";

////////////////////////////////////////////////////////////////////////////////

type VisitResult = EezValueObject | null;

function* visitWithPause(parentObject: EezObject): IterableIterator<VisitResult> {
    if (isArray(parentObject)) {
        let arrayOfObjects = asArray(parentObject);
        for (let i = 0; i < arrayOfObjects.length; i++) {
            yield* visitWithPause(arrayOfObjects[i]);
        }
    } else {
        for (const propertyInfo of parentObject._classInfo.properties) {
            if (!propertyInfo.skipSearch) {
                let value = getProperty(parentObject, propertyInfo.name);
                if (value) {
                    if (
                        propertyInfo.type === PropertyType.Object ||
                        propertyInfo.type === PropertyType.Array
                    ) {
                        yield* visitWithPause(value);
                    } else {
                        yield getObjectPropertyAsObject(parentObject, propertyInfo);
                    }
                }
            }
        }
    }

    // pause
    yield null;
}

function* visitWithoutPause(parentObject: EezObject): IterableIterator<VisitResult> {
    if (isArray(parentObject)) {
        let arrayOfObjects = asArray(parentObject);
        for (let i = 0; i < arrayOfObjects.length; i++) {
            yield* visitWithoutPause(arrayOfObjects[i]);
        }
    } else {
        for (const propertyInfo of parentObject._classInfo.properties) {
            if (!propertyInfo.skipSearch) {
                let value = getProperty(parentObject, propertyInfo.name);
                if (value) {
                    if (
                        propertyInfo.type === PropertyType.Object ||
                        propertyInfo.type === PropertyType.Array
                    ) {
                        yield* visitWithoutPause(value);
                    } else {
                        yield getObjectPropertyAsObject(parentObject, propertyInfo);
                    }
                }
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

type SearchResult = EezValueObject | null;

function* searchForPattern(
    root: EezObject,
    pattern: string,
    withPause: boolean
): IterableIterator<SearchResult> {
    let v = withPause ? visitWithPause(root) : visitWithoutPause(root);

    pattern = pattern.toLowerCase();

    while (true) {
        let visitResult = v.next();
        if (visitResult.done) {
            return;
        }

        if (visitResult.value) {
            let valueObject = visitResult.value;
            if (
                valueObject.value &&
                valueObject.value
                    .toString()
                    .toLowerCase()
                    .indexOf(pattern) != -1
            ) {
                yield valueObject;
            }
        } else if (withPause) {
            // pause
            yield null;
        }
    }
}

function* searchForReference(
    root: EezObject,
    object: EezObject,
    withPause: boolean
): IterableIterator<SearchResult> {
    let v = withPause ? visitWithPause(root) : visitWithoutPause(root);

    let objectParent = object._parent;
    if (!objectParent) {
        return;
    }

    let objectName = getProperty(object, "name");
    if (!objectName || objectName.length == 0) {
        return;
    }

    let objectParentPath = getObjectPath(objectParent);

    while (true) {
        let visitResult = v.next();
        if (visitResult.done) {
            return;
        }

        let valueObject = visitResult.value;
        if (valueObject) {
            if (!valueObject.propertyInfo.skipSearch) {
                if (valueObject.value) {
                    let match = false;

                    if (valueObject.propertyInfo.matchObjectReference) {
                        match = valueObject.propertyInfo.matchObjectReference(
                            valueObject.value,
                            objectParentPath,
                            objectName
                        );
                    } else if (valueObject.propertyInfo.type === PropertyType.ObjectReference) {
                        if (
                            _isEqual(
                                valueObject.propertyInfo.referencedObjectCollectionPath,
                                objectParentPath
                            )
                        ) {
                            if (valueObject.value === objectName) {
                                match = true;
                            }
                        }
                    } else if (
                        valueObject.propertyInfo.type === PropertyType.ConfigurationReference
                    ) {
                        if (_isEqual(["settings", "build", "configurations"], objectParentPath)) {
                            if (valueObject.value) {
                                for (let i = 0; i < valueObject.value.length; i++) {
                                    if (valueObject.value[i] === objectName) {
                                        match = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (match) {
                        yield valueObject;
                    }
                }
            }
        } else if (withPause) {
            // pause
            yield null;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

class CurrentSearch {
    interval: any;

    startNewSearch(root: EezObject, patternOrObject: string | EezObject) {
        OutputSectionsStore.clear(Section.SEARCH);

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }

        if (
            root &&
            patternOrObject &&
            (typeof patternOrObject != "string" || patternOrObject.length > 0)
        ) {
            let searchResultsGenerator =
                typeof patternOrObject == "string"
                    ? searchForPattern(root, patternOrObject, true)
                    : searchForReference(root, patternOrObject, true);

            this.interval = setInterval(() => {
                let startTime = new Date().getTime();

                while (true) {
                    let searchResult = searchResultsGenerator.next();
                    if (searchResult.done) {
                        clearInterval(this.interval);
                        this.interval = undefined;
                        return;
                    }

                    let valueObject = searchResult.value;
                    if (valueObject) {
                        OutputSectionsStore.write(
                            Section.SEARCH,
                            Type.INFO,
                            objectToString(valueObject),
                            valueObject
                        );
                    }

                    if (new Date().getTime() - startTime > 10) {
                        return;
                    }
                }
            }, 20);
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

let theCurrentSearch = new CurrentSearch();

function startNewSearch(root: EezObject, patternOrObject: string | EezObject) {
    theCurrentSearch.startNewSearch(root, patternOrObject);
}

export function startSearch(pattern: string) {
    OutputSectionsStore.setActiveSection(Section.SEARCH);
    startNewSearch(ProjectStore.project, pattern);
}

export function findAllReferences(object: EezObject) {
    OutputSectionsStore.setActiveSection(Section.SEARCH);
    startNewSearch(ProjectStore.project, object);
}

////////////////////////////////////////////////////////////////////////////////

export function isReferenced(object: EezObject) {
    let resultsGenerator = searchForReference(ProjectStore.project, object, false);

    while (true) {
        let searchResult = resultsGenerator.next();
        if (searchResult.done) {
            return false;
        }

        if (searchResult.value) {
            return true;
        }
    }
}

export function replaceObjectReference(object: EezObject, newValue: string) {
    let resultsGenerator = searchForReference(ProjectStore.project, object, false);

    while (true) {
        let searchResult = resultsGenerator.next();
        if (searchResult.done) {
            break;
        }

        let searchValue = searchResult.value;
        if (searchValue) {
            let value: string | string[] = newValue;

            if (searchValue.propertyInfo.replaceObjectReference) {
                value = searchValue.propertyInfo.replaceObjectReference(value);
            } else if (searchValue.propertyInfo.type === PropertyType.ConfigurationReference) {
                value = [];
                for (let i = 0; i < searchValue.value.length; i++) {
                    if (searchValue.value[i] !== getProperty(object, "name")) {
                        value.push(searchValue.value[i]);
                    } else {
                        value.push(newValue);
                    }
                }
            }

            let parent = searchValue._parent;
            if (parent) {
                let key = searchValue._key;
                if (parent && key && typeof key == "string") {
                    ProjectStore.updateObject(parent, {
                        [key]: value
                    });
                }
            }
        }
    }
}
