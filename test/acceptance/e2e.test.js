const path = require('path');
const chai = require('chai');
const util = require('../common/util');

chai.use(require('chai-as-promised'));

const handler = require('serve-handler');
const http = require('http');

const files = util.loadFiles(path.join(__dirname, 'e2e'));
const template = util.loadTemplate(path.join(__dirname, 'e2e.html.tpl'));

describe('E2E tests:', () => {
    let server;
    
    before(() => {
        server = http.createServer(handler);
        server.listen(util.PORT);
    });

    files.forEach(test);

    after(() => {
        server.close();
    });
});

function test(file) {
    it(util.getName(file), () => {
        const actual = util.testSST(file, template, true);
        return chai.expect(actual).to.eventually.eq(0);
    }).timeout(20000);
}
