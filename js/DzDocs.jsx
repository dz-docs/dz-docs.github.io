import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import Icon from './Icon';
import cn from 'classnames';

class BaseCtxClass {
  constructor(state, setState) {
    this.state = state;
    this.setState = setState;
    this.initialize();
  }

  mergeState(props) {
    this.setState({ ...this.state, ...props })
  }

  onHref(href) {
  }

  initialize() { }
}

class CtxClass extends BaseCtxClass {
  get isSideNavOpen() { return this.state.isSideNavOpen; }
  setIsSideNavOpen(isSideNavOpen) { this.mergeState({ isSideNavOpen }); }
  openSideNav() { this.setIsSideNavOpen(true); }
  closeSideNav() { this.setIsSideNavOpen(false); }
  toggleSideNav() { this.setIsSideNavOpen(!this.isSideNavOpen); }

  initialize() {
    console.log('initializing');
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
  return (
    <a {...props} onClick={onClick} />
  );
}

function useRerenderTrigger() {
  const [triggerVal, setTriggerVal] = useState(false);
  return () => setTriggerVal(!triggerVal);
}

function ThemePicker() {
  const rerenderTrigger = useRerenderTrigger();

  const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isSystem = localStorage.theme === undefined;
  const isDark = localStorage.theme === 'dark';
  const isLight = !isDark && !isSystem;

  function liCn(isActive) {
    const baseCn = 'w-full justify-start flex flex-row btn btn-sm btn-block';
    return cn(baseCn, isActive ? 'btn-active' : 'btn-ghost')
  }

  const mkOnClick = (theme) => () => {
    if (theme) {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
    window.setDataTheme();
    rerenderTrigger();
  };

  return (
    <div className="dropdown dropdown-hover dropdown-end">
      <div tabIndex={0} role="button" className="btn m-1">
        <Icon.sun className='size-6 block dark:hidden' />
        <Icon.moon className='size-6 dark:block hidden' />
        <Icon.chevronDown className="size-4" />
      </div>
      <ul tabIndex="-1" className="dropdown-content bg-base-300 rounded-box z-1 w-40 p-2 shadow-2xl">
        <li className={liCn(isDark)} onClick={mkOnClick('dark')}>
          <Icon.moon /> Dark
        </li>
        <li className={liCn(isLight)} onClick={mkOnClick('light')}>
          <Icon.sun /> Light
        </li>
        <li className={liCn(isSystem)} onClick={mkOnClick()}>
          <Icon.computerDesktop /> System {isSystemDark ? (<Icon.moon.s4 />) : (<Icon.sun.s4 />)}
        </li>
      </ul>
    </div>
  );
}

function Nav() {
  const X = useCtx();
  return (
    <div className='navbar bg-base-100 shadow-sm'>
      <div className='navbar-start gap-4'>
        <div
          tabIndex={0}
          role='button'
          className='btn btn-ghost lg:hidden'
          onClick={() => X.toggleSideNav()}
        >
          <Icon.folderTree />
        </div>
        <a className='btn btn-ghost text-xl'>homepage</a>
      </div>
      <div className='navbar-center hidden lg:flex'>
        <ul className='menu menu-horizontal px-1'>
          <li><a>--- 1</a></li>
          <li>
            <details>
              <summary>---- 2 Parent</summary>
              <ul className='p-2 bg-base-100 w-40 z-1'>
                <li><a>---- 2 ____ a</a></li>
                <li><a>---- 2 ____ b</a></li>
              </ul>
            </details>
          </li>
          <li><a>--- 3</a></li>
        </ul>
      </div>
      <div className='navbar-end'>
        <ThemePicker />
      </div>
    </div>
  );
}

function Drawer({ children }) {
  const X = useCtx();
  return (
    <div className={cn('drawer lg:drawer-open')}>
      <input
        checked={X.isSideNavOpen}
        onChange={(e) => X.setIsSideNavOpen(e.target.checked)}
        id="appDrawer"
        type="checkbox"
        className="drawer-toggle"
      />
      <div className="drawer-content flex flex-col items-center justify-center">
        {children}
      </div>
      <div className="drawer-side">
        <label htmlFor="appDrawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          <li><a>Sidebar Item 1</a></li>
          <li><a>Sidebar Item 2</a></li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  const X = useCtx();
  return (
    <Drawer>
      <div className='flex flex-col self-stretch sticky top-0'>
        <Nav />
      </div>
      <div className='flex flex-col gap-4'>
        <div className='skeleton h-[40vh] w-32' />
        <div className='skeleton h-[40vh] w-24' />
        <div className='skeleton h-[40vh] w-40' />
      </div>
    </Drawer>
  )
}

export default function DzDocs() {
  const [state, setState] = useState({});

  const ctx = new CtxClass(state, setState);
  ctx.state = state;

  return (
    <Ctx.Provider value={ctx}>
      <App />
    </Ctx.Provider>
  )
}
