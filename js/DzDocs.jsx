import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import cn from 'classnames';

class CtxClass {
  constructor(state, setState) {
    this.state = state;
    this.setState = setState;
  }

  mergeState(props) {
    this.setState({ ...this.state, ...props })
  }

  onHref(href) {
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


function App() {
  return (
    <div>
      hi
    </div>
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
