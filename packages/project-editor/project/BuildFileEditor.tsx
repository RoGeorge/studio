import { observer } from "mobx-react";
import React from "react";
import { bind } from "bind-decorator";

import { CodeEditor } from "eez-studio-ui/code-editor";

import { EditorComponent } from "project-editor/core/object";
import { ProjectStore, UndoManager } from "project-editor/core/store";
import { BuildFile } from "project-editor/project/project";

@observer
export class BuildFileEditor extends EditorComponent {
    codeEditor: CodeEditor;

    @bind
    onChange(value: string) {
        ProjectStore.updateObject(this.props.editor.object, {
            template: value
        });
    }

    @bind
    onFocus() {
        UndoManager.setCombineCommands(true);
    }

    @bind
    onBlur() {
        UndoManager.setCombineCommands(false);
    }

    componentDidMount() {
        this.codeEditor.resize();
    }

    componentDidUpdate() {
        this.codeEditor.resize();
    }

    render() {
        let buildFile = this.props.editor.object as BuildFile;
        return (
            <CodeEditor
                ref={ref => (this.codeEditor = ref!)}
                mode="c_cpp"
                value={buildFile.template}
                onChange={this.onChange}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
            />
        );
    }
}
