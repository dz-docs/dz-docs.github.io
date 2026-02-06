const { default: Watcher } = require('watcher');
const { execa } = require('execa');

let timeoutId

async function trueRunBuild() {
    timeoutId = undefined;
    console.log('EXECA!');
    await execa('npm', ['run', 'build:prod'], { stdout: ['pipe', 'inherit'], stderr: ['pipe', 'inherit'] });
}

function runBuild() {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(trueRunBuild, 200);
}

const watcher = new Watcher(['./html', './js', './static', './styles']);
watcher.on('all', runBuild);

runBuild();