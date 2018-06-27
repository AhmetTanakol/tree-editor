import { injectable } from "inversify";
import { FrontendApplication } from '@theia/core/lib/browser';
import { SelectionService, ResourceProvider } from '@theia/core/lib/common';
import { combineReducers, createStore, Store } from 'redux';
import { imageProvider, labelProvider, modelMapping } from './config';
import { coffeeSchema, detailSchemata } from './models/coffee-schema';
import { materialFields, materialRenderers } from '@jsonforms/material-renderers';
import {
  Actions,
  jsonformsReducer,
  RankedTester
} from '@jsonforms/core';
import {
  editorReducer,
  findAllContainerProperties,
  setContainerProperties
} from '@jsonforms/editor';
import { TreeEditorOpenHandler } from './tree-editor-open-handler';
import * as JsonRefs from 'json-refs';

const initStore = async() => {
  const uischema = {
    'type': 'MasterDetailLayout',
    'scope': '#'
  };
  const renderers: { tester: RankedTester, renderer: any}[] = materialRenderers;
  const fields: { tester: RankedTester, field: any}[] = materialFields;
  const jsonforms: any = {
    jsonforms: {
      renderers,
      fields,
      editor: {
        imageMapping: imageProvider,
        labelMapping: labelProvider,
        modelMapping,
        uiSchemata: detailSchemata
      }
    }
  };

  const store: Store<any> = createStore(
    combineReducers({
        jsonforms: jsonformsReducer(
          {
            editor: editorReducer
          }
        )
      }
    ),
    {
      ...jsonforms
    }
  );

  const schema = await JsonRefs.resolveRefs(coffeeSchema)
    .then(
      resolvedSchema => resolvedSchema.resolved,
      err => {
        console.log(err.stack);
        return {};
      });

  store.dispatch(Actions.init({}, schema, uischema));

  store.dispatch(setContainerProperties(
    findAllContainerProperties(schema, schema)));

  return store;
};

@injectable()
export class CoffeeEditor extends TreeEditorOpenHandler {
  constructor(app: FrontendApplication,
              selectionService: SelectionService,
              resourceProvider: ResourceProvider) {
    super(app, selectionService, resourceProvider, initStore());
  }
}
