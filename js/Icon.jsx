import cn from 'classnames';

const ICON_DEFAULTS = {
};

const ICONS = {
    magnifyingGlass: {
        outline: (props, className) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>

        ),
    },
    chevronDown: {
        outline: (props, className) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>

        ),
    },
    sun: {
        outline: (props, className) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>

        ),
    },
    moon: {
        outline: (props, className) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
        ),
    },
    computerDesktop: {
        outline: (props, className) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
            </svg>
        ),
    },
    bars3: {
        outline: (props, className) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        ),
    },
    folderTree: {
        solid: (props, className) => (
            <svg {...props} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M80 88C80 74.7 69.3 64 56 64C42.7 64 32 74.7 32 88L32 456C32 486.9 57.1 512 88 512L272 512L272 464L88 464C83.6 464 80 460.4 80 456L80 224L272 224L272 176L80 176L80 88zM368 288L560 288C586.5 288 608 266.5 608 240L608 144C608 117.5 586.5 96 560 96L477.3 96C468.8 96 460.7 92.6 454.7 86.6L446.1 78C437.1 69 424.9 63.9 412.2 63.9L368 64C341.5 64 320 85.5 320 112L320 240C320 266.5 341.5 288 368 288zM368 576L560 576C586.5 576 608 554.5 608 528L608 432C608 405.5 586.5 384 560 384L477.3 384C468.8 384 460.7 380.6 454.7 374.6L446.1 366C437.1 357 424.9 351.9 412.2 351.9L368 352C341.5 352 320 373.5 320 400L320 528C320 554.5 341.5 576 368 576z" /></svg>
        )
    },
    //
    aaaa: {
        outline: (props, className) => (
            1
        ),
    },
};

const SIZES = {
    [4]: 'size-4',
    [6]: 'size-6',
};

function defaultVariant(icon) {
    const iset = ICONS[icon];
    if (!iset) { return null; }
    return ICON_DEFAULTS[icon] || Object.keys(iset)[0];
}

function getIconMk(icon, variant) {
    const iset = ICONS[icon];
    if (!iset) { return null; }
    if (iset[variant]) { return iset[variant]; }
    return iset[defaultVariant(icon)];
}

export default function Icon({ className, icon, variant, ...props }) {
    return getIconMk(icon, variant)(props, className || 'size-6');
}

function addSizes(icon, v) {
    for (const i in SIZES) {
        const ik = `s${i}`;
        const icn = (props) => cn(props.className, SIZES[i]);
        const C = (props) => (
            <Icon {...props} variant={v} icon={icon} className={icn(props)} />
        );
        if (v) {
            Icon[icon][v] ||= {};
            Icon[icon][v][ik] = C;
        } else {
            Icon[icon][ik] = C;
        }
    }

}

for (const k in ICONS) {
    const icon = ICONS[k];
    Icon[k] = (props) => (<Icon {...props} icon={k} />);
    addSizes(k);
    for (const v in icon) {
        addSizes(k, v);
    }
}
