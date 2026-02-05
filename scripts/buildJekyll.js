import { mkdirp } from 'mkdirp'
import { PureCLMStats } from '../js/CLMStats'
import timeline from '../js/timeline.json'
import * as U from '../js/util'
import { render } from 'preact-render-to-string'
import { h } from 'preact'
import fs from 'node:fs';

const baseHtml = fs.readFileSync('./docs/index.html', 'utf-8');
fs.rmSync('./docs/index.html');

function mkLayout(urlSeason, urlPage) {
    const urlHrefMk = (
        () => `http://localhost:8080/${urlSeason}/${urlPage}.html`
    );
    function urlMk({ season, page, sort } = {}) {
        const base = ((() => {
            if (!season) { return '/'; }
            if (!page) { return `/${season}`; }
            return `/${season}/${page}`;
        })());
        return base + U.mkQs(U.resolveSort(sort));
    }
    function mkPeriodFuture() { return new Promise(); }
    const UVal = () => ({ urlHrefMk, urlMk, mkPeriodFuture });
    const appStr = render(h(PureCLMStats, { U: UVal }));
    const html = baseHtml.replace('__PRERENDER__', appStr);
    return html;
}

mkdirp.sync('./docs/_layouts/');
mkdirp.sync('./docs/p/');

for (const period of timeline.periods) {
    const periodId = period.periodId;
    const season = period.season;

    function mkMd(page) {
        const layout = `l-${periodId}-${page}`;
        const pagePrefix = page === 'stats' ? '' : (
            `${page} - `
        )
        return ([
            '---',
            `layout: ${layout}`,
            `title: ${pagePrefix}${period.title}`,
            `periodId: ${periodId}`,
            '---',
            ''
        ]).join('\n')
    }

    if (periodId === timeline.current) {
        fs.writeFileSync('./docs/index.md', mkMd('stats'));
    }

    for (const page of U.PageTypes) {
        const layout = `l-${periodId}-${page}`;
        const layoutPath = `./docs/_layouts/${layout}.html`;
        fs.writeFileSync(layoutPath, mkLayout(season, page));
        mkdirp.sync(`./docs/${season}`);
        const mdPath = `./docs/${season}/${page}.md`;
        fs.writeFileSync(mdPath, mkMd(page));
        if (page === 'stats') {
            const mdPath = `./docs/${season}.md`;
            fs.writeFileSync(mdPath, mkMd(page));
        }
    }
}
