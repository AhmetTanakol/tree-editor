import { FrontendApplication, OpenHandler, OpenerOptions } from '@theia/core/lib/browser';
import { MaybePromise, SelectionService, ResourceProvider } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { TreeEditorWidget } from './tree-editor-widget';
import { unmanaged, inject, injectable } from "inversify";
import { Actions, getSchema } from '@jsonforms/core';
import * as AJV from 'ajv';

const ajv = new AJV({allErrors: true, verbose: true});

@injectable()
export class TreeEditorOpenHandler implements OpenHandler {
  readonly id = "editor-opener";
  protected store: any;
  constructor( @inject(FrontendApplication) private app: FrontendApplication,
               @inject(SelectionService) readonly selectionService: SelectionService,
               @inject(ResourceProvider) private readonly resourceProvider: ResourceProvider,
               @unmanaged() store: any) {
    this.store =  store;
  }

  // Defines the editor's name in the open with menu
  get label() {
    return 'Open With Tree Editor';
  }

  canHandle(uri: URI, options?: OpenerOptions): MaybePromise<number> {
    if (uri.path.ext === '.json') {
      return 1000;
    }
    return 0;
  }

  /**
   * Open a widget for the given URI and options.
   * Resolve to an opened widget or undefined, e.g. if a page is opened.
   * Never reject if `canHandle` return a positive number; otherwise should reject.
   */
  open(uri: URI, options?: OpenerOptions): MaybePromise<object | undefined> {
    return this.resourceProvider(uri).then(resource => {
      return resource.readContents().then(content => {
        let parsedContent = {};
        try {
          parsedContent = JSON.parse(content);
        } catch {
          console.warn('Invalid content');
        }
        const self = this;
        Promise.resolve(this.store).then(function(initializedStore) {
          const valid = ajv.validate(getSchema(initializedStore.getState()), parsedContent);
          if (!valid) {
            parsedContent = {};
          }
          initializedStore.dispatch(Actions.update('', () => parsedContent));
          const treeEditor = new TreeEditorWidget(initializedStore);
          treeEditor.title.caption = uri.path.base;
          treeEditor.title.label = uri.path.base;
          treeEditor.title.closable = true;
          self.app.shell.addWidget(treeEditor, {area: 'main'});
          self.app.shell.activateWidget(treeEditor.id);
          return treeEditor;
        });
      });
    });
  }
}
