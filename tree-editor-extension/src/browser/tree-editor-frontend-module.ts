/**
 * Generated using theia-extension-generator
 */

import { ContainerModule } from "inversify";
import { TreeEditorOpenHandler } from './tree-editor-open-handler';
import { OpenHandler } from "@theia/core/lib/browser";
import { CoffeeEditor } from './coffee-editor';

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {

  bind(TreeEditorOpenHandler).to(CoffeeEditor);
  bind(OpenHandler).to(CoffeeEditor);
});
