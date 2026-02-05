import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import * as U from './util';

const pageLoadData = {}

const cnActiveTrue = { 'is-active': true };
const cnActiveFalse = { 'is-active': false };

function cnActive(b) { return b ? cnActiveTrue : cnActiveFalse }

class CtxClass {

  constructor(state, setState, urlMk, urlHrefMk) {
    this.state = state;
    this.setState = setState;
    this.urlMk = urlMk;
    this.urlHrefMk = urlHrefMk;
    this.sorts = {};
  }

  getSortedImpl() {
    const { events, ranks } = this.state.period;
    const res = [...ranks];
    const sortFn = (({
      ord: (r1, r2) => r1.rank - r2.rank,
      name: (r1, r2) => r1.playerIdent > r2.playerIdent ? 1 : -1,
      qual: (r1, r2) => r2.rank - r1.rank,
      acc: (r1, r2) => r1.winrate - r2.winrate,
      att: (r1, r2) => r1.prEvents - r2.prEvents,
      mru: (r1, r2) => events[r1.eventId].date - events[r2.eventId].date,
    })[this.sort.by]);
    res.sort(sortFn);
    if (this.sort.dir !== 'asc') {
      res.reverse();
    }
    return res;
  }
  get sorted() {
    return (this.sorts[this.sortKey] ||= this.getSortedImpl())
  }
  get isInitialSortDir() {
    return this.sort.dir === U.getDefaultDir(this.sort.by);
  }
  get sort() { return this.state.sort || {}; }
  get sortKey() {
    return `${this.sort.by}|${this.sort.dir}`;
  }
  get isLoadingPeriod() { return this.state.isLoadingPeriod; }
  get href() { return this.state.href; }
  get page() { return U.resolvePageStr(this.state.page); }
  get season() { return U.getSeason(this.periodId); }
  get periodId() { return this.state.periodId || U.timeline.current; }
  get periodTitle() { return U.Period(this.periodId).title; }

  get isHamburgerOpen() { return !!this.state.isHamburgerOpen; }

  get isSideNavOpen() { return !!this.state.isSideNavOpen; }

  get cnBurgerActive() { return cnActive(this.isHamburgerOpen); }

  get orgTree() {
    return this.state['org-tree'] || [];
  }

  get tableChanges() {
    return this.state.tableChanges;
  }

  get hasTableChanges() {
    console.log('TABLE CHANGES')
    console.log(this.tableChanges)
    return this.tableChanges.length > 0;
  }

  get skipInadAttendance() { return this.state.filter.inadAttendance; }
  get skipOutOfRegion() { return this.state.filter.outOfRegion; }

  doesMeetActivity(rank) {
    return rank.prEvents >= 8;
  }

  toggleHamburger() { this.mergeState({ isHamburgerOpen: !this.isHamburgerOpen }); }

  mergeState(props) {
    if (props.period && props.period !== this.state.period) {
      this.sorts = {};
    }
    this.setState({ ...this.state, ...props })
  }


  hPeriod(periodId) {
    return this.urlMk({ season: U.getSeason(periodId), page: this.page });
  }

  hPage(page) {
    return this.urlMk({ season: this.season, page });
  }

  hSort(by, dir) {
    const sort = { by, dir };
    return this.urlMk({ season: this.season, page: this.page, sort, filter: this.state.filter });
  }

  hFilter(overwrites = {}) {
    let filter = { ...this.state.filter };
    for (const k in overwrites) {
      filter[k] = overwrites[k]
    }
    return this.urlMk({ season: this.season, page: this.page, sort: this.sort, filter });
  }

  character(playerIdent) {
    const { players } = this.state.period;
    const player = players[playerIdent] || {};
    return U.lkupChar(player.name);
  }

  onHref(href) {
    if (href !== window.location.href) {
      window.history.pushState({}, null, href);
      const urlHref = this.urlHrefMk();
      const url = new URL(urlHref);
      const hrefPath = url.pathname;
      const parts = (/^\/([a-z0-9_\-]+)\/([a-z0-9]+)(\.html)?$/).exec(hrefPath.toLowerCase());
      const periodId = U.resolveSeasonStr((parts || [])[1]);
      const page = U.resolvePageStr((parts || [])[2]);
      const isLoadingPeriod = periodId !== this.state.periodId;
      const period = isLoadingPeriod ? null : this.state.period;
      const sort = {
        dir: U.resolveSortDir(url.searchParams.get('dir')),
        by: U.resolveSortBy(url.searchParams.get('by')),
      };
      const filterParam = url.searchParams.get('filter');
      const filter = U.resolveFilter(filterParam);
      const tableChanges = [];
      if (url.searchParams.get('by')) {
        tableChanges.push(['sort-by']);
      } else if (url.searchParams.get('dir')) {
        tableChanges.push(['sort-dir']);
      }
      if (filterParam) {
        for (const filterKey of U.addedFilters(filterParam)) {
          tableChanges.push(['filter-add', filterKey]);
        }
        for (const filterKey of U.removedFilters(filterParam)) {
          tableChanges.push(['filter-rm', filterKey]);
        }
      }
      async function after() {
        if (!isLoadingPeriod) { return {} }
        try {
          const res = await fetch(`/db/periods/${periodId}.json`);
          const period = await res.json();
          return { period, isLoadingPeriod: false };
        } catch (error) {
          return { error };
        }
      }
      const newState = {
        href: urlHref,
        periodId, page, period, isLoadingPeriod, sort, after, filter,
        tableChanges
      };
      this.mergeState(newState);
    }
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


function NavBarLink({ href, children, iht = false, ia = false }) {
  const className = cn('navbar-item', { 'is-hidden-touch navbar-item': iht, 'is-selected': ia });
  return (
    <Link role='button' className={className} href={href} >
      {children}
    </Link>
  );
}

function NF(s, marginInlineEnd = 0) {
  return (
    <span
      style={{
        marginInlineEnd,
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <span
        style={{ visibility: 'hidden' }}
      >
        {s}
      </span>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <span
          className='mono'
        >
          {s}
        </span>
      </div>
    </span>
  )
}

function Search() {
  return (
    <div className="field">
      <p className="control has-icons-right" >
        <input className="input" type="email" placeholder="Search Players..." />
        <span className="icon is-small is-right">
          {NF('')}
        </span>
      </p>
    </div>
  );
}

function ResetTable() {
  const X = useCtx();
  function chHref([chType, chParam]) {
    if (chType === 'filter-add') {
      return X.hFilter({ [chParam]: false });
    } else if (chType === 'filter-rm') {
      return X.hFilter({ [chParam]: true });
    } else if (chType === 'sort-dir') {
      return X.hSort(U.resolveSortBy(), U.resolveSortDir());
    } else if (chType === 'sort-by') {
      return X.hSort(this.sort.by, this.sort.dir === 'asc' ? 'desc' : 'asc');
    }
  }
  function chColor([chType, chParam]) {
    if (chType === 'filter-add' || chType === 'filter-rm') {
      return chParam === 'inadAttendance' ? 'warning' : 'link'
    } else if (chType === 'sort-by' || chType === 'sort-dir') {
      return 'info';
    }
  }
  function chClass() {
    return `dropdown-item ws-nw is-flex is-align-items-center`;
  }
  function chText([chType]) {
    if (chType === 'filter-add') {
      return `added filter`;
    } else if (chType === 'filter-rm') {
      return `removed filter`;
    } else if (chType === 'sort-dir') {
      return `set sort direction`;
    } else if (chType === 'sort-by') {
      return `set sort`;
    }
  }
  function chTag([chType, chParam]) {
    if (chType === 'filter-add' | chType === 'filter-rm') {
      return chParam === 'inadAttendance' ? 'PR Inelegible' : 'Out of Region';
    } else if (chType === 'sort-dir') {
      return X.sort.dir;
    } else if (chType === 'sort-by') {
      return `${X.sort.by} |> ${X.sort.dir}`;
    }
  }
  return (
    <div style={{ position: 'relative' }} className='dropdown is-right is-hoverable'>
      <div className="dropdown-trigger">
        <Link href={X.hPage('stats')} className="button" aria-haspopup="true" aria-controls="resetDropdown">
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ transform: 'translateX(-30%)' }} >{NF('')}</div>
          </div>
          <span style={{ opacity: '0' }}>{''}</span>
        </Link>
      </div>
      <div className="dropdown-menu" id="resetDropdown" role="menu">
        <div className="dropdown-content">
          <Link
            href={X.hPage('stats')}
            className="dropdown-item ws-nw"
          >
            Reset to Table defaults
          </Link>
          <hr className='dropdown-divider' />
          {X.tableChanges.map((change) => (
            <>
              <Link
                style={{ paddingInlineEnd: '1rem' }}
                key={change.join('.')}
                href={chHref(change)}
                className={chClass(change)}
              >
                <span
                  style={{ paddingLeft: '0.25em', paddingRight: '0.25em' }}
                  className='tag has-background-link-op-1 ws-nw is-rounded'
                >
                  <button style={{ marginInlineEnd: 0, marginInline: 0 }} className='delete is-small' />
                </span>
                &nbsp;&nbsp;
                {chText(change)}
                <span style={{ minWidth: '1rem' }} className='is-flex-grow-1' />
                <span className={`tag is-${chColor(change)}`}>
                  {chTag(change)}
                </span>
              </Link>
              <hr key={'hr' + change.join('.')} className='dropdown-divider' />
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

function Filters() {
  const X = useCtx();
  return (
    <div style={{ position: 'relative' }} className='dropdown is-right is-hoverable'>
      <div className="dropdown-trigger">
        <button className="button" aria-haspopup="true" aria-controls="filterDropdown">
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ transform: 'translateX(-30%)' }} >{NF('')}</div>
          </div>
          <span style={{ opacity: '0' }}>{''}</span>
        </button>
      </div>
      <div className="dropdown-menu" id="filterDropdown" role="menu">
        <div className="dropdown-content">
          <Link
            href={X.hFilter({ outOfRegion: !X.skipOutOfRegion })}
            className="dropdown-item ws-nw"
          >
            <input type="checkbox" checked={X.skipOutOfRegion} />
            &nbsp;&nbsp;&nbsp;
            <span className='has-background-link-op-1 '>
              Hide Out of Region Players
            </span>
          </Link>
          <hr className='dropdown-divider' />
          <Link
            href={X.hFilter({ inadAttendance: !X.skipInadAttendance })}
            className="dropdown-item ws-nw"
          >
            <input type="checkbox" checked={X.skipInadAttendance} />
            &nbsp;&nbsp;&nbsp;
            <span className='has-background-warning-op-1 '>
              Hide PR Ineligible Players
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}


function Periods() {
  const X = useCtx();
  return (
    <div style={{ position: 'relative' }} className='dropdown is-right is-hoverable'>
      <div className="dropdown-trigger">
        <button className="button" aria-haspopup="true" aria-controls="periodDropdown">
          <span className='has-text-info is-hidden-touch'>
            {X.periodTitle}
          </span>
          <span className='has-text-info is-hidden-desktop'>
            {NF('')}
          </span>
          &nbsp;&nbsp;&nbsp;
          <span className='has-text-info'>
            {NF('')}
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="periodDropdown" role="menu">
        <div className="dropdown-content">
          {U.timeline.periods.map(({ periodId, title }) => (
            <Link
              key={periodId}
              href={X.hPeriod(periodId)}
              className={cn('dropdown-item', { 'is-active': periodId === X.periodId })}
            >
              {title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function THCell({ className, by, text, justifyContent }) {
  const X = useCtx();
  const isAsc = X.sort.dir === 'asc';
  const isActive = X.sort.by === by;
  const sym = !isActive ? '' : (
    isAsc ? '' : ''
  )
  const nextDir = !isActive ? U.getDefaultDir(by) : (isAsc ? 'desc' : 'asc');
  return (
    <th className={cn('is-clipped', className || '')}>
      <PreSized width="auto" justifyContent={justifyContent} >
        <Link
          className={cn('has-text-strong', { 'is-underlined': isActive })}
          href={X.hSort(by, nextDir)}
        >
          &nbsp;{text}&nbsp;
          <span className={cn('rel', { isActive })}>
            <span className='curr-sort is-overlay is-flex'>
              {NF(sym)}
            </span>
            <span className='next-sort is-overlay is-flex'>
              {NF(nextDir === 'asc' ? '' : '')}
            </span>
          </span>
        </Link>
      </PreSized>
    </th>
  );
}

function MenuBar() {
  const X = useCtx();

  return (
    <nav className='navbar is-fixed-top container is-max-widescreen'>
      <div className='navbar-brand is-flex-grow-1'>
        <NavBarLink href="https://chicagomelee.com/"> <img src="/favicon.ico" /> CLM </NavBarLink>
        <NavBarLink ia={X.page === 'stats'} iht={true} href={X.hPage('stats')}> {NF('')}Stats</NavBarLink>
        <NavBarLink ia={X.page === 'players'} iht={true} href={X.hPage('players')}> {NF('')}Players</NavBarLink>
        <NavBarLink ia={X.page === 'compare'} iht={true} href={X.hPage('compare')}> {NF('')}Compare</NavBarLink>
        <NavBarLink ia={X.page === 'h2h'} iht={true} href={X.hPage('h2h')}> {NF('󰋁')}H2H</NavBarLink>
        <div
          className='navbar-item navitem-right'
          style={{ marginInlineStart: 'auto' }}
        >
          <Search />
        </div>
        {!X.hasTableChanges ? null : (
          <div className='navbar-item navitem-right' > <ResetTable /> </div>
        )}
        <div className='navbar-item navitem-right' style={{}} > <Filters /> </div>
        <div className='navbar-item navitem-right' style={{ marginInlineEnd: '0.375rem' }} > <Periods /> </div>
        <a
          role='button'
          className={cn('navbar-burger', X.cnBurgerActive)}
          aria-label='menu'
          aria-expanded={X.isHamburgerOpen}
          data-target='docsNavbar'
          onClick={() => X.toggleHamburger()}
          style={{ marginInlineStart: '0.375rem' }}
        >
          <span /> <span /> <span /> <span />
        </a>
      </div>
      <div style={{ flex: 0 }} className={cn('navbar-menu', X.cnBurgerActive)} >
        <div className='navbar-start is-hidden-desktop'>
          <NavBarLink ia={X.page === 'stats'} href={X.hPage('stats')}> {NF('', "0.75rem")}Stats</NavBarLink>
          <NavBarLink ia={X.page === 'players'} href={X.hPage('players')}> {NF('', "0.75rem")}Players</NavBarLink>
          <NavBarLink ia={X.page === 'compare'} href={X.hPage('compare')}> {NF('', "0.75rem")}Compare</NavBarLink>
          <NavBarLink ia={X.page === 'h2h'} href={X.hPage('h2h')}> {NF('󰋁', "0.75rem")}H2H</NavBarLink>
        </div>
      </div>
    </nav>
  )
}

const defaultProfileImage = '/img/CLM_Logo_Avatar_Placeholder.png';

function ProfileImage(props) {
  const [hasError, setHasError] = useState(false);
  const className = cn(props.className || '', { defaultProfile: hasError });
  const src = hasError ? defaultProfileImage : props.src;
  function onError() { if (!hasError) { setHasError(true); } }
  return (
    <img {...props} className={className} src={src} onError={onError} />
  );
}

function PreSized({ width, children, justifyContent = 'center' }) {
  return (
    <div className={`rel is-flex is-justify-content-${justifyContent}`} style={{ width }}>
      {children}
    </div>
  );
}

function PureRow(props) {
  const colorType = ((() => {
    if (props.isOutOfRegion) { return 'link'; }
    if (props.isIneligible) { return 'warning'; }
  })());
  const noPrReason = ((() => {
    if (props.isOutOfRegion) { return 'Player is out of region, ineligible for PR'; }
    if (props.isIneligible) { return 'Player did not meet PR attendance requirements'; }
  })());
  const canClmPr = !colorType;
  const colorClass = canClmPr ? '' : `has-background-${colorType}-op-1`;
  return (
    <tr className={cn('rel', colorClass)} >
      <td
        className='has-text-weight-extrabold is-size-3 has-text-centered'
      >
        <PreSized width="2rem">
          {props.ord}
        </PreSized>
      </td>
      <td>
        <PreSized width="auto" justifyContent="start" >
          <Link
            href={props.href}
            className='is-flex is-flex-direction-row is-align-items-center is-clipped wmax rel'
            style={{ height: '5rem', transform: 'translateX(-0.5rem)' }}
          >
            <div
              className='is-flex is-flex-direction-row is-align-items-center player-info'
              style={{
                position: 'absolute',
                top: '0.5rem',
                left: '0.5rem',
                width: 'calc(100% - 0.5rem)',
                height: 'calc(100% - 1rem)',
              }}
            >
              <div >
                {props.profileImage}
              </div>
              <div className='is-flex is-flex-direction-column'>
                <div className='nowrap has-text-weight-bold is-size-5'>{props.name}</div>
                {!props.pronouns ? null : (
                  <div
                    className='nowrap is-size-7'
                  >
                    {props.pronouns}
                  </div>
                )}
                {props.character}
              </div>
            </div>
          </Link>
        </PreSized>
      </td>
      <td className='py-5 nowrap has-text-centered'>
        <PreSized width="5.625rem">
          {props.qual}
        </PreSized>
      </td>
      <td className='nowrap has-text-centered'>
        <PreSized width="5.625rem">
          {props.acc}
        </PreSized>
      </td>
      <td className='has-text-centered'>
        <PreSized width="5.625rem">
          {canClmPr ? props.att : (
            <div className='dropdown is-hoverable is-right'>
              <div className='dropdown-trigger is-italic'>
                {props.att}*
              </div>
              <div className='dropdown-menu' role="menu">
                <div className='dropdown-content box'>
                  <div className='dropdown-item is-underline'>
                    Inelegible by:
                  </div>
                  {!props.isOutOfRegion ? null : (
                    <div className='has-text-left dropdown-item has-background-link-op-1' >
                      <span className='has-text-weak'>‣</span>
                      &nbsp;&nbsp;from out of region
                    </div>
                  )}
                  {!props.isIneligible ? null : (
                    <div className='has-text-left dropdown-item has-background-warning-op-1' >
                      <span className='has-text-weak'>‣</span>
                      &nbsp;&nbsp;insufficient attendance
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PreSized>
      </td>
      <td className='is-clipped'>
        <PreSized width="max(9.75rem, 15vw)" justifyContent="start" >
          <div
            style={{ width: '100%', overflow: 'hidden' }}
            className='is-flex is-flex-direction-column is-justify-content-center'
          >
            {props.mruLink}
            <div className='nowrap'>
              {props.mruPlacing}
            </div>
            <div className='nowrap has-text-weak'>
              {props.mruDate}
            </div>
          </div>
        </PreSized>
      </td>
    </tr>
  );
}

// <div className={cn('ultra-faint is-overlay pe-none', colorClass)} />

function StatsTable() {
  const X = useCtx();

  const skelEl = (
    <PureRow
      ord={(<button className='button is-skeleton' />)}
      profileImage={(<div className='skeleton-block' />)}
      name={(<div className='skeleton-lines'><div /></div>)}
      pronouns={<span className='tag is-skeleton'>pronouns</span>}
      character={<span className='icon is-skeleton'>c</span>}
      qual={(<div style={{ height: '1.5rem' }} className='skeleton-lines'><div /></div>)}
      acc={(<div className='skeleton-lines'><div /></div>)}
      att={(<div className='skeleton-lines'><div /></div>)}
      mruLink={(<div className='skeleton-lines'><div /></div>)}
      mruPlacing={<span className='tag is-skeleton'>placing</span>}
      mruDate={<span className='tag is-skeleton'>date</span>}
    />
  );

  const skel = (
    <tbody>
      {skelEl}{skelEl}{skelEl}{skelEl}{skelEl}{skelEl}{skelEl}
      {skelEl}{skelEl}{skelEl}{skelEl}{skelEl}{skelEl}{skelEl}
      {skelEl}{skelEl}{skelEl}{skelEl}{skelEl}{skelEl}{skelEl}
    </tbody>
  )

  const el = (X.isLoadingPeriod ? (() => skel) : (() => {
    const { players, events } = X.state.period;
    const filtered = X.sorted.filter(rank => (
      (!X.skipOutOfRegion || U.inRegion(rank.playerIdent)) &&
      (!X.skipInadAttendance || X.doesMeetActivity(rank))
    ));
    const rows = filtered.map((rank, nth) => {
      const player = players[rank.playerIdent];
      const character = X.character(rank.playerIdent);
      const event = events[rank.eventId]
      const eventDate = new Date(event.date * 1000);

      const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
      const dstr = new Intl.DateTimeFormat('en-US', options).format(eventDate);
      const defaultProfile = (
        player.image === defaultProfileImage
      );

      return (
        <PureRow
          key={rank.playerIdent}
          ord={X.isInitialSortDir ? (nth + 1) : (filtered.length - nth)}
          profileImage={(
            <ProfileImage
              src={player.image}
              className={cn({ defaultProfile })}
              loading="lazy"
              alt='start.gg profile image'
            />
          )}
          name={player.name}
          pronouns={player.pronouns}
          character={!character ? null : (
            <img
              style={{ height: '1.25rem', width: '1.25rem' }}
              src={`/chars/${character}.png`}
            />
          )}
          qual={rank.rating}
          acc={`${rank.wins || 0} - ${rank.losses || 0}`}
          att={rank.prEvents || 0}
          mruLink={(
            <a
              className='nowrap'
              href={`https://start.gg/${event.slug}`}
            >
              {event.tournamentName}
            </a>
          )}
          mruPlacing={`${rank.placingString} of ${event.numEntrants}`}
          mruDate={dstr}
          isOutOfRegion={!U.inRegion(rank.playerIdent)}
          isIneligible={!X.doesMeetActivity(rank)}
        />
      );
    });
    return (
      <tbody>
        {rows}
      </tbody>
    );
  }))();
  return (
    <div className='is-flex-grow-1 is-flex is-flex-direction-column is-align-items-stretch rel' >
      <div
        className='table-container'
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
        }}
      >
        <table
          className='table'
        >

          <thead>
            <tr>
              <th className='has-text-centered'> # </th>
              <THCell by="name" text="Player" justifyContent="start" />
              <THCell className='has-text-centered' by="qual" text="Rating" />
              <THCell className='has-text-centered' by="acc" text="W - L" />
              <THCell className='has-text-centered' by="att" text="PR Events" />
              <THCell by="mru" text="Last Event" justifyContent="start" />
            </tr>
          </thead>
          {el}
        </table>
      </div>
    </div>
  );
}

function Body() {
  const X = useCtx();
  return (
    <div className='section p-0 is-flex-grow-1 is-flex is-flex-direction-column'>
      <div className='container is-flex-grow-1 is-flex is-flex-direction-column'>
        <StatsTable />
      </div>
    </div>
  )
}

let __state;
let initialState;
export function PureCLMStats(props) {
  const { urlHrefMk, urlMk, mkPeriodFuture } = props.U();
  if (!pageLoadData.isDone) {
    const urlHref_ = urlHrefMk();
    const url = new URL(urlHref_);
    const hrefPath = url.pathname;
    const parts = (/^\/([a-z0-9_\-]+)\/([a-z0-9]+)(\.html)?$/).exec(hrefPath.toLowerCase());
    const urlPeriod = U.resolveSeasonStr((parts || [])[1]);
    const urlPage = U.resolvePageStr((parts || [])[2]);
    // const urlPeriod, urlPage, 
    pageLoadData.page = urlPage;
    pageLoadData.periodId = urlPeriod;
    pageLoadData.href = urlHref_;
    pageLoadData.isLoadingPeriod = true;
    pageLoadData.sort = {
      dir: U.resolveSortDir(url.searchParams.get('dir')),
      by: U.resolveSortBy(url.searchParams.get('by')),
    };
    const filterParam = url.searchParams.get('filter');
    pageLoadData.filter = U.resolveFilter(filterParam);
    pageLoadData.tableChanges = [];
    if (url.searchParams.get('by')) {
      pageLoadData.tableChanges.push(['sort-by']);
    } else if (url.searchParams.get('dir')) {
      pageLoadData.tableChanges.push(['sort-dir']);
    }
    if (filterParam) {
      for (const filterKey of U.addedFilters(filterParam)) {
        pageLoadData.tableChanges.push(['filter-add', filterKey]);
      }
      for (const filterKey of U.removedFilters(filterParam)) {
        pageLoadData.tableChanges.push(['filter-rm', filterKey]);
      }
    }
    console.log(url.searchParams.get('filter'))
    console.log(url);
    initialState = { ...pageLoadData }
    pageLoadData.isDone = true;
  }

  const [state, _setState] = useState(initialState);
  function setState(newState) {
    __state = newState;
    _setState(newState);
  }

  const ctx = new CtxClass(state, setState, urlMk, urlHrefMk);
  ctx.state = state;

  useEffect(() => {
    if (state.after) {
      state.after().then((ups) => setState({ ...__state, ...ups }))
    }
  }, [state.after])

  useEffect(() => {
    mkPeriodFuture()
      .then((period) => ctx.mergeState({ period, isLoadingPeriod: false }))
      .catch((error) => ctx.mergeState({ error }))
  }, [])

  return (
    <Ctx.Provider value={ctx}>
      <div className='container px-0 box is-max-widescreen is-flex is-flex-direction-column'>
        <MenuBar />
        <Body />
      </div>
    </Ctx.Provider>
  )
}

export default function CLMStats() {
  function Uval() {
    const urlHrefMk = () => window.location.href;
    function mkPeriodFuture() {
      return window.periodFuture;
    }
    function urlMk({ season, page, sort = {}, filter } = {}) {
      const base = ((() => {
        if (!season) { return '/'; }
        if (!page) { return `/${season}`; }
        return `/${season}/${page}`;
      })());
      return base + U.mkQs(U.resolveSort(sort), U.asSearchParams(filter));
    }
    return { urlHrefMk, urlMk, mkPeriodFuture }
  }
  return <PureCLMStats U={Uval} />
}