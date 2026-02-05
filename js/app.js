import { render, h } from 'preact';
import CLMStats, { PureCLMStats } from './CLMStats';
import * as U from './util';

const container = document.getElementById('app');

let el;
if (process.env.NODE_ENV === "production") {
    el = h(CLMStats);
} else {
    container.innerHTML = '';
    document.title = 'clmstats - dev';
    const urlParams = new URLSearchParams(window.location.search);
    window.periodFuture = (
        fetch(`/db/periods/${U.getPeriodId(urlParams.get('season'))}.json`).then(
            function (res) { return res.json(); }
        )
    )

    el = h(PureCLMStats, {
        U: () => {
            function urlHrefMk() {
                const params = new URLSearchParams(window.location.search);
                const filter = params.get('filter');
                const season = params.get('season') || 'chicago_2025-3';
                const page = params.get('page') || 'stats';
                const sort = { dir: params.get('dir'), by: params.get('by') };
                const base = `http://localhost:8000/${season}/${page}.html`;
                return base + U.mkQs(U.resolveSort(sort), { filter });
            }

            function urlMk({ season, page, sort, filter } = {}) {
                const intoQs = ((() => {
                    if (!season) { return ''; }
                    if (!page) { return `?season=${season}`; }
                    return `?season=${season}&page=${page}`;
                })());
                return '/' + U.mkQs(U.resolveSort(sort), U.asSearchParams(filter), intoQs);
            }
            function mkPeriodFuture() {
                return window.periodFuture;
            }
            return { urlHrefMk, urlMk, mkPeriodFuture }
        },
    })
}

render(el, container);
