import { createRoot } from "react-dom/client";
import { createElement } from "react";
import DzDocs from './DzDocs';

const mountEl = document.getElementById('app');
const root = createRoot(mountEl);
root.render(createElement(DzDocs, {}));
