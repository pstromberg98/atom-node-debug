import { TextEditor, Gutter, DisplayMarker } from 'atom';
import * as _ from 'lodash';
import { Subject } from 'rxjs';

export class GutterView {
  public onLineClicked$: Subject<any>;
  private gutters = {};

  constructor() {
    this.onLineClicked$ = new Subject<any>();
  }

  public setup() {
    atom.workspace.observeTextEditors((e) => this.onObservedTextEditor(e));
  }

  public setBreakpointMarker(editorId: number, lineNumber: number) {
    const editor = atom.workspace.getTextEditors().find((e) => e.id === editorId);
    if (editor) {
      const gutter = this.gutters[editorId];

      if (gutter) {
        const marker = editor.markScreenPosition([lineNumber, 0]);
        return gutter.decorateMarker(marker, {
          type: 'line-number',
          class: 'breakpoint',
        });
      }
    }
  }

  public removeBreakpointMarker(marker: DisplayMarker) {
    marker.destroy();
  }

  private onObservedTextEditor(editor: TextEditor) {
    console.log('Text editor observed!');
    // TODO: This needs to be improved soon
    const possibleGutters = editor.getGutters();
    if (possibleGutters && possibleGutters[0]) {
      const gutter = possibleGutters[0];

      this.gutters[`${editor.id}`] = gutter;

      gutter['onMouseDown'] = (event) => {
        this.onLineClicked$.next({
          editorId: editor.id,
          url: editor.getPath(),
          lineNumber: event.screenRow,
        });
      };
    }
  }
}
