import { createContext, useContext, useEffect, useState } from "react";
import Icon from "./Icon";
import cn from "classnames";

class BaseCtxClass {
  constructor(state, setState) {
    this.state = state;
    this.setState = setState;
    this.initialize();
  }

  mergeState(props) {
    this.setState({ ...this.state, ...props });
  }

  onHref(href) {}

  initialize() {}
}

class CtxClass extends BaseCtxClass {
  get isSideNavOpen() {
    return this.state.isSideNavOpen;
  }
  setIsSideNavOpen(isSideNavOpen) {
    this.mergeState({ isSideNavOpen });
  }
  openSideNav() {
    this.setIsSideNavOpen(true);
  }
  closeSideNav() {
    this.setIsSideNavOpen(false);
  }
  toggleSideNav() {
    this.setIsSideNavOpen(!this.isSideNavOpen);
  }

  initialize() {
    console.log("initializing");
  }
}

const Ctx = createContext({});

function useCtx() {
  return useContext(Ctx);
}

function Link(props) {
  const X = useCtx();
  function onClick(e) {
    e.preventDefault();
    X.onHref(props.href);
  }
  return <a {...props} onClick={onClick} />;
}

function Nav() {
  const X = useCtx();
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start gap-4">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost lg:hidden"
          onClick={() => X.toggleSideNav()}
        >
          <Icon.folderTree />
        </div>
      </div>
    </div>
  );
}

function Drawer({ children }) {
  const X = useCtx();
  return (
    <div className={cn("drawer lg:drawer-open")}>
      <input
        checked={X.isSideNavOpen}
        onChange={(e) => X.setIsSideNavOpen(e.target.checked)}
        id="appDrawer"
        type="checkbox"
        className="drawer-toggle"
      />
      <div className="drawer-content flex flex-col items-center justify-start">
        {children}
      </div>
      <div className="drawer-side">
        <label
          htmlFor="appDrawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <Link href="/?xD=1">Sidebar Item 1</Link>
          </li>
          <li>
            <a>Sidebar Item 2</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  const X = useCtx();
  return (
    <Drawer>
      <div className="flex flex-col self-stretch sticky top-0">
        page content
      </div>
      <div className="toast toast-start z-1">
        <button
          className="lg:hidden btn btn-soft py-0 px-2 btn-sm text-lg outline-filter"
          onClick={() => X.toggleSideNav()}
        >
          <Icon.bars3 />
        </button>
      </div>
    </Drawer>
  );
}

export default function DzDocs() {
  console.log({ useState });
  const [state, setState] = useState({});

  const ctx = new CtxClass(state, setState);
  ctx.state = state;

  return (
    <Ctx.Provider value={ctx}>
      <App />
    </Ctx.Provider>
  );
}
