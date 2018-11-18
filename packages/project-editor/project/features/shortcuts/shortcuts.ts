import { observable } from "mobx";

import {
    registerClass,
    EezObject,
    EezArrayObject,
    PropertyType
} from "project-editor/core/metaData";
import { registerFeatureImplementation } from "project-editor/core/extensions";
import { objectToJS, getProperty } from "project-editor/core/store";

import { ExtensionDefinition } from "project-editor/project/features/extension-definitions/extension-definitions";

import { IActionType } from "shortcuts/interfaces";
import { metrics } from "project-editor/project/features/shortcuts/metrics";
import { ShortcutsNavigation } from "project-editor/project/features/shortcuts/navigation";

////////////////////////////////////////////////////////////////////////////////

export class ShortcutAction extends EezObject {
    @observable type: IActionType;
    @observable data: string;

    static classInfo = {
        getClass: function(jsObject: any) {
            return ShortcutAction;
        },

        label: (shortcutAction: ShortcutAction) => {
            return shortcutAction.data;
        },

        properties: () => [
            {
                name: "type",
                type: PropertyType.String
            },
            {
                name: "data",
                type: PropertyType.String
            }
        ]
    };
}

registerClass(ShortcutAction);

////////////////////////////////////////////////////////////////////////////////

export class Shortcut extends EezObject {
    id: string;
    @observable name: string;
    @observable usedIn: string[] | undefined;
    @observable action: ShortcutAction;
    @observable keybinding: string;
    groupName: string;
    @observable showInToolbar: boolean;
    @observable toolbarButtonPosition: number;
    @observable toolbarButtonColor: string;
    @observable requiresConfirmation: boolean;
    @observable selected: boolean;

    static classInfo = {
        getClass: function(jsObject: any) {
            return Shortcut;
        },
        label: (object: EezObject) => (object as Shortcut).name,
        properties: () => [
            {
                name: "id",
                type: PropertyType.String,
                unique: true
            },
            {
                name: "name",
                type: PropertyType.String,
                unique: true
            },
            {
                name: "usedIn",
                type: PropertyType.ConfigurationReference
            },
            {
                name: "action",
                type: PropertyType.Object,
                typeClassInfo: ShortcutAction.classInfo
            },
            {
                name: "keybinding",
                type: PropertyType.String
            },
            {
                name: "showInToolbar",
                type: PropertyType.Boolean
            },
            {
                name: "toolbarButtonPosition",
                type: PropertyType.Number
            },
            {
                name: "toolbarButtonColor",
                type: PropertyType.String
            },
            {
                name: "requiresConfirmation",
                type: PropertyType.Boolean
            }
        ]
    };
}

registerClass(Shortcut);

////////////////////////////////////////////////////////////////////////////////

export class Shortcuts extends EezObject {
    @observable shortcuts: EezArrayObject<Shortcut>;

    static classInfo = {
        getClass: function(jsObject: any) {
            return Shortcuts;
        },
        label: () => "Shortcuts",
        properties: () => [
            {
                name: "shortcuts",
                type: PropertyType.Array,
                typeClassInfo: Shortcut.classInfo,
                hideInPropertyGrid: true
            }
        ],
        navigationComponent: ShortcutsNavigation,
        hideInProperties: true,
        navigationComponentId: "shortcuts",
        icon: "playlist_play"
    };
}

registerClass(Shortcuts);

////////////////////////////////////////////////////////////////////////////////

registerFeatureImplementation("shortcuts", {
    projectFeature: {
        mandatory: false,
        key: "shortcuts",
        type: PropertyType.Object,
        classInfo: Shortcuts.classInfo,
        create: () => {
            return {
                shortcuts: []
            };
        },
        metrics: metrics,
        collectExtensionDefinitions: (
            project,
            extensionDefinition: ExtensionDefinition,
            properties
        ) => {
            let shortcuts = getProperty(project, "shortcuts") as Shortcuts;
            properties.shortcuts = objectToJS(
                shortcuts.shortcuts._array.filter(
                    shortcut =>
                        !shortcut.usedIn ||
                        shortcut.usedIn.indexOf(extensionDefinition.buildConfiguration) != -1
                )
            ).map((shortcut: any) =>
                Object.assign(shortcut, {
                    selected: undefined
                })
            );

            // we don't need usedIn property in package.json
            properties.shortcuts.forEach((shortcut: any) => delete shortcut.usedIn);
        }
    }
});
